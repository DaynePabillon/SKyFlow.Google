import { google, sheets_v4, drive_v3 } from 'googleapis';
import { query } from '../config/database';
import logger from '../config/logger';

interface ColumnMapping {
  title: number;
  status: number;
  priority: number;
  assignee: number;
  dueDate: number;
  description?: number;
}

interface SheetTask {
  sheetRowIndex: number;
  title: string;
  status: string;
  priority: string;
  assigneeEmail?: string;
  dueDate?: Date;
  description?: string;
  extraData?: Record<string, any>;
}

interface SyncResult {
  success: boolean;
  tasksCreated: number;
  tasksUpdated: number;
  tasksDeleted: number;
  error?: string;
}

export class WorkspaceSyncService {
  
  /**
   * Get OAuth2 client for a user
   */
  private async getAuthClient(userId: string) {
    const userResult = await query(
      'SELECT access_token, refresh_token FROM users WHERE id = $1',
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }
    
    const { access_token, refresh_token } = userResult.rows[0];
    
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_CALLBACK_URL
    );
    
    oauth2Client.setCredentials({
      access_token,
      refresh_token
    });
    
    return oauth2Client;
  }

  /**
   * List all sheets in a Google Drive folder
   */
  async listSheetsInFolder(userId: string, folderId: string): Promise<drive_v3.Schema$File[]> {
    const auth = await this.getAuthClient(userId);
    const drive = google.drive({ version: 'v3', auth });
    
    const response = await drive.files.list({
      q: `'${folderId}' in parents and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`,
      fields: 'files(id, name, modifiedTime, owners)'
    });
    
    return response.data.files || [];
  }

  /**
   * Auto-detect column mapping from sheet headers
   */
  async detectColumnMapping(userId: string, sheetId: string): Promise<ColumnMapping> {
    const auth = await this.getAuthClient(userId);
    const sheets = google.sheets({ version: 'v4', auth });
    
    // First, get all sheet tabs in the spreadsheet
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: sheetId,
      fields: 'sheets.properties.title'
    });
    
    const sheetTabs = spreadsheet.data.sheets?.map(s => s.properties?.title) || ['Sheet1'];
    logger.info(`Found ${sheetTabs.length} tabs in spreadsheet: ${sheetTabs.join(', ')}`);
    
    // Try each tab until we find one with headers
    for (const tabName of sheetTabs) {
      try {
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: sheetId,
          range: `'${tabName}'!1:1`
        });
        
        const headers = (response.data.values?.[0] || []).map((h: string) => String(h).toLowerCase().trim());
        logger.info(`Tab '${tabName}' headers: ${headers.join(', ')}`);
        
        if (headers.length === 0) continue;
        
        const mapping: ColumnMapping = {
          title: headers.findIndex((h: string) => /^(title|task|name|item)$/i.test(h)),
          status: headers.findIndex((h: string) => /^(status|state)$/i.test(h)),
          priority: headers.findIndex((h: string) => /^(priority|importance)$/i.test(h)),
          assignee: headers.findIndex((h: string) => /^(assignee|assigned|owner|email)$/i.test(h)),
          dueDate: headers.findIndex((h: string) => /^(due|deadline|date|due_date|duedate|due date)$/i.test(h)),
          description: headers.findIndex((h: string) => /^(description|desc|details|notes)$/i.test(h))
        };
        
        // If we found at least title column, use this tab
        if (mapping.title !== -1) {
          logger.info(`Using tab '${tabName}' with mapping: ${JSON.stringify(mapping)}`);
          // Store the tab name in the mapping for later use
          (mapping as any).sheetTab = tabName;
          return mapping;
        }
      } catch (err) {
        logger.warn(`Error reading tab '${tabName}':`, err);
      }
    }
    
    // Default fallback
    logger.warn('No valid headers found, using column 0 as title');
    return {
      title: 0,
      status: -1,
      priority: -1,
      assignee: -1,
      dueDate: -1,
      description: -1
    };
  }

  /**
   * Parse sheet data into tasks
   */
  async parseSheetTasks(
    userId: string, 
    sheetId: string, 
    columnMapping: ColumnMapping
  ): Promise<SheetTask[]> {
    const auth = await this.getAuthClient(userId);
    const sheets = google.sheets({ version: 'v4', auth });
    
    // Use the detected sheet tab, or default to first sheet
    const sheetTab = (columnMapping as any).sheetTab || 'Sheet1';
    const range = `'${sheetTab}'!A:Z`;
    logger.info(`Reading data from range: ${range}`);
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: range
    });
    
    const rows = response.data.values || [];
    logger.info(`Found ${rows.length} rows in sheet`);
    
    if (rows.length <= 1) return []; // Only header or empty
    
    const tasks: SheetTask[] = [];
    
    // Skip header row
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const title = row[columnMapping.title];
      
      if (!title || String(title).trim() === '') continue; // Skip empty rows
      
      const statusRaw = row[columnMapping.status];
      const priorityRaw = row[columnMapping.priority];
      const assigneeRaw = row[columnMapping.assignee];
      
      const task = {
        sheetRowIndex: i,
        title: String(title).trim(),
        status: this.normalizeStatus(statusRaw),
        priority: this.normalizePriority(priorityRaw),
        assigneeEmail: assigneeRaw ? String(assigneeRaw).trim() : undefined,
        dueDate: this.parseDate(row[columnMapping.dueDate]),
        description: columnMapping.description !== undefined && columnMapping.description !== -1 
          ? row[columnMapping.description] 
          : undefined
      };
      
      logger.info(`Parsed task: "${task.title}" | status: "${statusRaw}" -> "${task.status}" | priority: "${priorityRaw}" -> "${task.priority}" | assignee: "${assigneeRaw}"`);
      
      tasks.push(task);
    }
    
    logger.info(`Parsed ${tasks.length} tasks from sheet`);
    return tasks;
  }

  /**
   * Sync a sheet's tasks to database
   */
  async syncSheet(syncedSheetId: string): Promise<SyncResult> {
    try {
      // Get synced sheet info
      const sheetResult = await query(
        `SELECT ss.*, w.user_id, w.organization_id 
         FROM synced_sheets ss 
         JOIN workspaces w ON ss.workspace_id = w.id 
         WHERE ss.id = $1`,
        [syncedSheetId]
      );
      
      if (sheetResult.rows.length === 0) {
        return { success: false, tasksCreated: 0, tasksUpdated: 0, tasksDeleted: 0, error: 'Sheet not found' };
      }
      
      const sheet = sheetResult.rows[0];
      
      // Re-detect column mapping on every sync to ensure accuracy
      const columnMapping = await this.detectColumnMapping(sheet.user_id, sheet.sheet_id);
      logger.info(`Re-detected column mapping: ${JSON.stringify(columnMapping)}`);
      
      // Update stored column mapping
      await query(
        `UPDATE synced_sheets SET column_mapping = $1 WHERE id = $2`,
        [JSON.stringify(columnMapping), syncedSheetId]
      );
      
      // Parse tasks from Google Sheet
      const sheetTasks = await this.parseSheetTasks(sheet.user_id, sheet.sheet_id, columnMapping);
      
      let tasksCreated = 0;
      let tasksUpdated = 0;
      
      // Upsert each task
      for (const task of sheetTasks) {
        const result = await query(
          `INSERT INTO sheet_tasks (synced_sheet_id, project_id, sheet_row_index, title, description, status, priority, assignee_email, due_date, synced_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
           ON CONFLICT (synced_sheet_id, sheet_row_index) 
           DO UPDATE SET 
             title = EXCLUDED.title,
             description = EXCLUDED.description,
             status = EXCLUDED.status,
             priority = EXCLUDED.priority,
             assignee_email = EXCLUDED.assignee_email,
             due_date = EXCLUDED.due_date,
             synced_at = NOW(),
             updated_at = NOW()
           RETURNING (xmax = 0) AS inserted`,
          [syncedSheetId, sheet.project_id, task.sheetRowIndex, task.title, task.description, task.status, task.priority, task.assigneeEmail, task.dueDate]
        );
        
        if (result.rows[0]?.inserted) {
          tasksCreated++;
        } else {
          tasksUpdated++;
        }
      }
      
      // Delete tasks that no longer exist in sheet
      const validRowIndexes = sheetTasks.map(t => t.sheetRowIndex);
      const deleteResult = await query(
        `DELETE FROM sheet_tasks WHERE synced_sheet_id = $1 AND sheet_row_index != ALL($2::int[])`,
        [syncedSheetId, validRowIndexes]
      );
      const tasksDeleted = deleteResult.rowCount || 0;
      
      // Update sync status
      await query(
        `UPDATE synced_sheets SET last_synced_at = NOW(), row_count = $1, sync_status = 'active' WHERE id = $2`,
        [sheetTasks.length, syncedSheetId]
      );
      
      // Log sync
      await this.logSync(sheet.workspace_id, 'sync_completed', {
        sheetId: syncedSheetId,
        tasksCreated,
        tasksUpdated,
        tasksDeleted
      });
      
      logger.info(`Synced sheet ${syncedSheetId}: ${tasksCreated} created, ${tasksUpdated} updated, ${tasksDeleted} deleted`);
      
      return { success: true, tasksCreated, tasksUpdated, tasksDeleted };
      
    } catch (error: any) {
      logger.error('Sheet sync error:', error);
      return { success: false, tasksCreated: 0, tasksUpdated: 0, tasksDeleted: 0, error: error.message };
    }
  }

  /**
   * Sync all sheets in a workspace
   */
  async syncWorkspace(workspaceId: string): Promise<void> {
    await query(`UPDATE workspaces SET sync_status = 'syncing' WHERE id = $1`, [workspaceId]);
    
    try {
      const sheetsResult = await query(
        `SELECT id FROM synced_sheets WHERE workspace_id = $1 AND sync_status = 'active'`,
        [workspaceId]
      );
      
      for (const sheet of sheetsResult.rows) {
        await this.syncSheet(sheet.id);
      }
      
      await query(
        `UPDATE workspaces SET sync_status = 'active', last_synced_at = NOW(), sync_error = NULL WHERE id = $1`,
        [workspaceId]
      );
      
    } catch (error: any) {
      await query(
        `UPDATE workspaces SET sync_status = 'error', sync_error = $1 WHERE id = $2`,
        [error.message, workspaceId]
      );
      throw error;
    }
  }

  /**
   * Connect a Google Sheet to workspace
   */
  async connectSheet(
    workspaceId: string, 
    sheetId: string, 
    sheetName: string,
    projectId?: string
  ): Promise<string> {
    // Get workspace to find user
    const wsResult = await query('SELECT user_id FROM workspaces WHERE id = $1', [workspaceId]);
    if (wsResult.rows.length === 0) throw new Error('Workspace not found');
    
    const userId = wsResult.rows[0].user_id;
    
    // Auto-detect column mapping
    const columnMapping = await this.detectColumnMapping(userId, sheetId);
    
    // Insert synced sheet
    const result = await query(
      `INSERT INTO synced_sheets (workspace_id, sheet_id, sheet_name, column_mapping, project_id)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (workspace_id, sheet_id) DO UPDATE SET 
         sheet_name = EXCLUDED.sheet_name,
         column_mapping = EXCLUDED.column_mapping,
         project_id = EXCLUDED.project_id,
         updated_at = NOW()
       RETURNING id`,
      [workspaceId, sheetId, sheetName, JSON.stringify(columnMapping), projectId]
    );
    
    const syncedSheetId = result.rows[0].id;
    
    // Initial sync
    await this.syncSheet(syncedSheetId);
    
    return syncedSheetId;
  }

  /**
   * Create a new workspace from a Drive folder
   */
  async createWorkspace(
    userId: string,
    organizationId: string,
    folderId: string,
    folderName: string
  ): Promise<string> {
    const result = await query(
      `INSERT INTO workspaces (user_id, organization_id, root_folder_id, root_folder_name, name)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [userId, organizationId, folderId, folderName, folderName]
    );
    
    return result.rows[0].id;
  }

  /**
   * Get synced tasks for display
   */
  async getSyncedTasks(syncedSheetId: string): Promise<any[]> {
    const result = await query(
      `SELECT * FROM sheet_tasks WHERE synced_sheet_id = $1 ORDER BY sheet_row_index`,
      [syncedSheetId]
    );
    return result.rows;
  }

  /**
   * Get all tasks across workspace
   */
  async getWorkspaceTasks(workspaceId: string): Promise<any[]> {
    const result = await query(
      `SELECT st.*, ss.sheet_name, ss.sheet_id as google_sheet_id
       FROM sheet_tasks st
       JOIN synced_sheets ss ON st.synced_sheet_id = ss.id
       WHERE ss.workspace_id = $1
       ORDER BY ss.sheet_name, st.sheet_row_index`,
      [workspaceId]
    );
    return result.rows;
  }

  // === Helper Methods ===
  
  private normalizeStatus(status: string | undefined): string {
    if (!status) return 'todo';
    const s = status.toLowerCase().trim();
    if (/done|complete|finished|closed/i.test(s)) return 'done';
    if (/progress|doing|working|started/i.test(s)) return 'in-progress';
    if (/review|check|pending|waiting/i.test(s)) return 'review';
    return 'todo';
  }
  
  private normalizePriority(priority: string | undefined): string {
    if (!priority) return 'medium';
    const p = priority.toLowerCase().trim();
    if (/critical|urgent|highest/i.test(p)) return 'critical';
    if (/high|important/i.test(p)) return 'high';
    if (/low|minor/i.test(p)) return 'low';
    return 'medium';
  }
  
  private parseDate(dateStr: string | undefined): Date | undefined {
    if (!dateStr) return undefined;
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? undefined : date;
  }
  
  private async logSync(workspaceId: string, eventType: string, details: any): Promise<void> {
    await query(
      `INSERT INTO sync_logs (workspace_id, event_type, details) VALUES ($1, $2, $3)`,
      [workspaceId, eventType, JSON.stringify(details)]
    );
  }

  /**
   * Convert column index to letter (0 = A, 1 = B, 26 = AA, etc.)
   */
  private getColumnLetter(index: number): string {
    let letter = '';
    while (index >= 0) {
      letter = String.fromCharCode((index % 26) + 65) + letter;
      index = Math.floor(index / 26) - 1;
    }
    return letter;
  }

  /**
   * Convert display status to sheet-friendly format
   */
  private denormalizeStatus(status: string): string {
    switch (status) {
      case 'done': return 'Complete';
      case 'in-progress': return 'In Progress';
      case 'review': return 'Review';
      case 'todo': return 'To Do';
      default: return status;
    }
  }

  /**
   * Convert display priority to sheet-friendly format
   */
  private denormalizePriority(priority: string): string {
    switch (priority) {
      case 'critical': return 'Critical';
      case 'high': return 'High';
      case 'medium': return 'Medium';
      case 'low': return 'Low';
      default: return priority;
    }
  }

  /**
   * Update a synced task field and write back to Google Sheet
   */
  async updateSheetTask(
    taskId: string,
    field: 'status' | 'priority' | 'assignee' | 'due_date',
    value: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get task and sheet info
      const taskResult = await query(
        `SELECT st.*, ss.sheet_id, ss.column_mapping, w.user_id
         FROM sheet_tasks st
         JOIN synced_sheets ss ON st.synced_sheet_id = ss.id
         JOIN workspaces w ON ss.workspace_id = w.id
         WHERE st.id = $1`,
        [taskId]
      );

      if (taskResult.rows.length === 0) {
        return { success: false, error: 'Task not found' };
      }

      const task = taskResult.rows[0];
      const columnMapping = task.column_mapping as any;
      
      // Determine which column to update
      let columnIndex: number;
      let sheetValue: string;
      let dbField: string;
      let dbValue: any;

      switch (field) {
        case 'status':
          columnIndex = columnMapping.status;
          sheetValue = this.denormalizeStatus(value);
          dbField = 'status';
          dbValue = value;
          break;
        case 'priority':
          columnIndex = columnMapping.priority;
          sheetValue = this.denormalizePriority(value);
          dbField = 'priority';
          dbValue = value;
          break;
        case 'assignee':
          columnIndex = columnMapping.assignee;
          sheetValue = value;
          dbField = 'assignee_email';
          dbValue = value;
          break;
        case 'due_date':
          columnIndex = columnMapping.dueDate;
          sheetValue = value;
          dbField = 'due_date';
          dbValue = value ? new Date(value) : null;
          break;
        default:
          return { success: false, error: 'Invalid field' };
      }

      if (columnIndex === -1 || columnIndex === undefined) {
        return { success: false, error: `Column for ${field} not mapped in sheet` };
      }

      // Get sheet tab name
      const sheetTab = columnMapping.sheetTab || 'Sheet1';
      const columnLetter = this.getColumnLetter(columnIndex);
      const rowNumber = task.sheet_row_index + 1; // +1 because sheet is 1-indexed
      const range = `'${sheetTab}'!${columnLetter}${rowNumber}`;

      logger.info(`Writing to Google Sheet: ${range} = "${sheetValue}"`);

      // Write to Google Sheet
      const auth = await this.getAuthClient(task.user_id);
      const sheets = google.sheets({ version: 'v4', auth });

      await sheets.spreadsheets.values.update({
        spreadsheetId: task.sheet_id,
        range: range,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[sheetValue]]
        }
      });

      // Update local database
      await query(
        `UPDATE sheet_tasks SET ${dbField} = $1, updated_at = NOW() WHERE id = $2`,
        [dbValue, taskId]
      );

      logger.info(`Successfully updated sheet task ${taskId}: ${field} = ${value}`);
      return { success: true };

    } catch (error: any) {
      logger.error('Error updating sheet task:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Batch update multiple fields on a synced task
   */
  async updateSheetTaskMultiple(
    taskId: string,
    updates: Partial<{ status: string; priority: string; assignee: string; due_date: string }>
  ): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = [];

    for (const [field, value] of Object.entries(updates)) {
      if (value !== undefined) {
        const result = await this.updateSheetTask(
          taskId,
          field as 'status' | 'priority' | 'assignee' | 'due_date',
          value
        );
        if (!result.success && result.error) {
          errors.push(`${field}: ${result.error}`);
        }
      }
    }

    return { success: errors.length === 0, errors };
  }
}

export const workspaceSyncService = new WorkspaceSyncService();

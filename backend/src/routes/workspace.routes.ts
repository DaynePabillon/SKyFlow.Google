import express, { Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';
import { workspaceSyncService } from '../services/workspace.service';
import { query } from '../config/database';
import logger from '../config/logger';
import { google } from 'googleapis';

const router = express.Router();

/**
 * GET /api/workspaces
 * List all workspaces for current organization
 */
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const orgId = req.query.organizationId as string;

    if (!orgId) {
      return res.status(400).json({ error: 'Organization ID required' });
    }

    const result = await query(
      `SELECT w.*, 
        (SELECT COUNT(*) FROM synced_sheets WHERE workspace_id = w.id) as sheet_count,
        (SELECT COUNT(*) FROM sheet_tasks st JOIN synced_sheets ss ON st.synced_sheet_id = ss.id WHERE ss.workspace_id = w.id) as task_count
       FROM workspaces w 
       WHERE w.organization_id = $1
       ORDER BY w.created_at DESC`,
      [orgId]
    );

    res.json({ workspaces: result.rows });
  } catch (error: any) {
    logger.error('Error fetching workspaces:', error);
    res.status(500).json({ error: 'Failed to fetch workspaces' });
  }
});

/**
 * POST /api/workspaces
 * Create a new workspace from a Google Drive folder
 */
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { organizationId, folderId, folderName } = req.body;

    if (!organizationId || !folderId || !folderName) {
      return res.status(400).json({ error: 'Organization ID, folder ID, and folder name required' });
    }

    const workspaceId = await workspaceSyncService.createWorkspace(
      userId, organizationId, folderId, folderName
    );

    res.status(201).json({
      success: true,
      workspaceId,
      message: 'Workspace created successfully'
    });
  } catch (error: any) {
    logger.error('Error creating workspace:', error);
    res.status(500).json({ error: 'Failed to create workspace' });
  }
});

/**
 * GET /api/workspaces/:id
 * Get workspace details with sheets
 */
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const wsResult = await query(
      `SELECT * FROM workspaces WHERE id = $1`,
      [id]
    );

    if (wsResult.rows.length === 0) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    const sheetsResult = await query(
      `SELECT ss.*, 
        (SELECT COUNT(*) FROM sheet_tasks WHERE synced_sheet_id = ss.id) as task_count
       FROM synced_sheets ss 
       WHERE ss.workspace_id = $1`,
      [id]
    );

    res.json({
      workspace: wsResult.rows[0],
      sheets: sheetsResult.rows
    });
  } catch (error: any) {
    logger.error('Error fetching workspace:', error);
    res.status(500).json({ error: 'Failed to fetch workspace' });
  }
});

/**
 * GET /api/workspaces/:id/drive-sheets
 * List Google Sheets in the workspace folder (for selection)
 */
router.get('/:id/drive-sheets', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const wsResult = await query(`SELECT root_folder_id FROM workspaces WHERE id = $1`, [id]);
    if (wsResult.rows.length === 0) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    const folderId = wsResult.rows[0].root_folder_id;
    const sheets = await workspaceSyncService.listSheetsInFolder(userId, folderId);

    res.json({ sheets });
  } catch (error: any) {
    logger.error('Error listing drive sheets:', error);
    res.status(500).json({ error: 'Failed to list sheets' });
  }
});

/**
 * POST /api/workspaces/:id/connect-sheet
 * Connect a Google Sheet to the workspace
 */
router.post('/:id/connect-sheet', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { sheetId, sheetName, projectId } = req.body;

    if (!sheetId || !sheetName) {
      return res.status(400).json({ error: 'Sheet ID and name required' });
    }

    const syncedSheetId = await workspaceSyncService.connectSheet(
      id, sheetId, sheetName, projectId
    );

    res.status(201).json({
      success: true,
      syncedSheetId,
      message: 'Sheet connected and synced'
    });
  } catch (error: any) {
    logger.error('Error connecting sheet:', error);
    res.status(500).json({ error: 'Failed to connect sheet' });
  }
});

/**
 * POST /api/workspaces/:id/sync
 * Manually trigger a full workspace sync
 */
router.post('/:id/sync', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await workspaceSyncService.syncWorkspace(id);

    res.json({ success: true, message: 'Workspace synced successfully' });
  } catch (error: any) {
    logger.error('Error syncing workspace:', error);
    res.status(500).json({ error: 'Failed to sync workspace' });
  }
});

/**
 * GET /api/workspaces/:id/tasks
 * Get all synced tasks from workspace
 */
router.get('/:id/tasks', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const tasks = await workspaceSyncService.getWorkspaceTasks(id);

    res.json({ tasks });
  } catch (error: any) {
    logger.error('Error fetching workspace tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

/**
 * GET /api/workspaces/sheets/:sheetId/tasks
 * Get tasks from a specific synced sheet
 */
router.get('/sheets/:sheetId/tasks', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { sheetId } = req.params;

    const tasks = await workspaceSyncService.getSyncedTasks(sheetId);

    res.json({ tasks });
  } catch (error: any) {
    logger.error('Error fetching sheet tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

/**
 * PATCH /api/workspaces/tasks/:taskId
 * Update a synced task field and write back to Google Sheet
 * Requires admin or manager role
 */
router.patch('/tasks/:taskId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { taskId } = req.params;
    const { field, value } = req.body;
    const userId = req.user!.id;

    if (!field || value === undefined) {
      return res.status(400).json({ error: 'Field and value required' });
    }

    const validFields = ['status', 'priority', 'assignee', 'due_date'];
    if (!validFields.includes(field)) {
      return res.status(400).json({ error: `Invalid field. Must be one of: ${validFields.join(', ')}` });
    }

    // Get task and check user's role in the organization
    const taskResult = await query(
      `SELECT st.id, w.organization_id
       FROM sheet_tasks st
       JOIN synced_sheets ss ON st.synced_sheet_id = ss.id
       JOIN workspaces w ON ss.workspace_id = w.id
       WHERE st.id = $1`,
      [taskId]
    );

    if (taskResult.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const organizationId = taskResult.rows[0].organization_id;

    // Check user's role
    const roleResult = await query(
      `SELECT role FROM organization_members 
       WHERE organization_id = $1 AND user_id = $2 AND status = 'active'`,
      [organizationId, userId]
    );

    if (roleResult.rows.length === 0) {
      return res.status(403).json({ error: 'Not a member of this organization' });
    }

    const userRole = roleResult.rows[0].role;

    // Only admin and manager can edit synced tasks
    if (userRole !== 'admin' && userRole !== 'manager') {
      return res.status(403).json({
        error: 'Permission denied. Only admins and managers can edit synced tasks.'
      });
    }

    // Update the task
    const result = await workspaceSyncService.updateSheetTask(taskId, field, value);

    if (!result.success) {
      return res.status(500).json({ error: result.error || 'Failed to update task' });
    }

    logger.info(`User ${userId} (${userRole}) updated synced task ${taskId}: ${field} = ${value}`);

    res.json({
      success: true,
      message: `Task ${field} updated and synced to Google Sheet`
    });
  } catch (error: any) {
    logger.error('Error updating synced task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

/**
 * DELETE /api/workspaces/sheets/:sheetId
 * Delete a synced sheet from workspace (removes sync, keeps Google Sheet intact)
 */
router.delete('/sheets/:sheetId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { sheetId } = req.params;
    const userId = req.user!.id;

    // Get sheet and workspace info to check permissions
    const sheetResult = await query(
      `SELECT ss.*, w.organization_id 
       FROM synced_sheets ss 
       JOIN workspaces w ON ss.workspace_id = w.id 
       WHERE ss.id = $1`,
      [sheetId]
    );

    if (sheetResult.rows.length === 0) {
      return res.status(404).json({ error: 'Synced sheet not found' });
    }

    const organizationId = sheetResult.rows[0].organization_id;

    // Check user's role in the organization
    const roleResult = await query(
      `SELECT role FROM organization_members 
       WHERE organization_id = $1 AND user_id = $2 AND status = 'active'`,
      [organizationId, userId]
    );

    if (roleResult.rows.length === 0) {
      return res.status(403).json({ error: 'Not a member of this organization' });
    }

    const userRole = roleResult.rows[0].role;

    // Only admin and manager can delete synced sheets
    if (userRole !== 'admin' && userRole !== 'manager') {
      return res.status(403).json({
        error: 'Permission denied. Only admins and managers can delete synced sheets.'
      });
    }

    // Delete associated tasks first (cascade should handle this, but be explicit)
    await query(`DELETE FROM sheet_tasks WHERE synced_sheet_id = $1`, [sheetId]);

    // Delete the synced sheet record
    await query(`DELETE FROM synced_sheets WHERE id = $1`, [sheetId]);

    logger.info(`User ${userId} (${userRole}) deleted synced sheet ${sheetId}`);

    res.json({ success: true, message: 'Synced sheet removed successfully' });
  } catch (error: any) {
    logger.error('Error deleting synced sheet:', error);
    res.status(500).json({ error: 'Failed to delete synced sheet' });
  }
});

/**
 * DELETE /api/workspaces/:id
 * Delete a workspace
 */
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await query(`DELETE FROM workspaces WHERE id = $1`, [id]);

    res.json({ success: true, message: 'Workspace deleted' });
  } catch (error: any) {
    logger.error('Error deleting workspace:', error);
    res.status(500).json({ error: 'Failed to delete workspace' });
  }
});

/**
 * POST /api/workspaces/webhook/drive
 * Webhook endpoint for Google Drive push notifications
 */
router.post('/webhook/drive', async (req, res) => {
  try {
    const channelId = req.headers['x-goog-channel-id'] as string;
    const resourceState = req.headers['x-goog-resource-state'] as string;

    logger.info(`Drive webhook: ${resourceState} on channel ${channelId}`);

    if (resourceState === 'sync') {
      // Initial sync confirmation
      return res.status(200).send('OK');
    }

    if (resourceState === 'change') {
      // Find workspace by channel ID and trigger sync
      const wsResult = await query(
        `SELECT id FROM workspaces WHERE drive_channel_id = $1`,
        [channelId]
      );

      if (wsResult.rows.length > 0) {
        // Queue async sync (don't block webhook response)
        setImmediate(async () => {
          try {
            await workspaceSyncService.syncWorkspace(wsResult.rows[0].id);
          } catch (err) {
            logger.error('Webhook sync error:', err);
          }
        });
      }
    }

    res.status(200).send('OK');
  } catch (error: any) {
    logger.error('Drive webhook error:', error);
    res.status(200).send('OK'); // Always return 200 to prevent retries
  }
});

export default router;

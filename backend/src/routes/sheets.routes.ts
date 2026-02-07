import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { query } from '../config/database';
import { getGoogleClients } from '../config/google';
import logger from '../config/logger';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// GET /api/sheets/list - List user's Google Sheets
router.get('/list', async (req, res) => {
    try {
        const userId = (req as any).user.id;

        // Get user's tokens from database
        const userResult = await query(
            'SELECT access_token, refresh_token FROM users WHERE id = $1',
            [userId]
        );

        if (!userResult.rows[0]) {
            return res.status(404).json({ error: 'User not found' });
        }

        const { access_token, refresh_token } = userResult.rows[0];

        // Fetch only Google Sheets from Drive API
        const { drive } = getGoogleClients(access_token, refresh_token);

        const response = await drive.files.list({
            pageSize: 50,
            q: `mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`,
            fields: 'files(id, name, mimeType, size, modifiedTime, webViewLink, iconLink, thumbnailLink, owners)',
            orderBy: 'modifiedTime desc',
        });

        const files = response.data.files || [];
        logger.info(`Fetched ${files.length} spreadsheets for user ${userId}`);

        return res.json({ files });
    } catch (error) {
        logger.error('Error fetching spreadsheets:', error);
        return res.status(500).json({ error: 'Failed to fetch spreadsheets' });
    }
});

// GET /api/sheets/:sheetId - Get specific spreadsheet metadata
router.get('/:sheetId', async (req, res) => {
    try {
        const userId = (req as any).user.id;
        const { sheetId } = req.params;

        // Get user's tokens
        const userResult = await query(
            'SELECT access_token, refresh_token FROM users WHERE id = $1',
            [userId]
        );

        if (!userResult.rows[0]) {
            return res.status(404).json({ error: 'User not found' });
        }

        const { access_token, refresh_token } = userResult.rows[0];
        const { sheets } = getGoogleClients(access_token, refresh_token);

        const response = await sheets.spreadsheets.get({
            spreadsheetId: sheetId,
            includeGridData: false,
        });

        return res.json({ spreadsheet: response.data });
    } catch (error) {
        logger.error('Error fetching spreadsheet:', error);
        return res.status(500).json({ error: 'Failed to fetch spreadsheet' });
    }
});
// POST /api/sheets/create - Create a new spreadsheet
router.post('/create', async (req, res) => {
    try {
        const userId = (req as any).user.id;
        const { title } = req.body;

        // Get user's tokens
        const userResult = await query(
            'SELECT access_token, refresh_token FROM users WHERE id = $1',
            [userId]
        );

        if (!userResult.rows[0]) {
            return res.status(404).json({ error: 'User not found' });
        }

        const { access_token, refresh_token } = userResult.rows[0];
        const { sheets } = getGoogleClients(access_token, refresh_token);

        // Create new spreadsheet
        const response = await sheets.spreadsheets.create({
            requestBody: {
                properties: {
                    title: title || 'Untitled Spreadsheet'
                }
            }
        });

        const spreadsheet = response.data;
        logger.info(`Created new spreadsheet ${spreadsheet.spreadsheetId} for user ${userId}`);

        return res.status(201).json({
            spreadsheet: {
                id: spreadsheet.spreadsheetId,
                name: spreadsheet.properties?.title,
                webViewLink: spreadsheet.spreadsheetUrl
            }
        });
    } catch (error) {
        logger.error('Error creating spreadsheet:', error);
        return res.status(500).json({ error: 'Failed to create spreadsheet' });
    }
});

// POST /api/sheets/create-template - Create a task template spreadsheet
router.post('/create-template', async (req, res) => {
    try {
        const userId = (req as any).user.id;
        const { title, folderId, projectId, workspaceId } = req.body;

        // Get user's tokens
        const userResult = await query(
            'SELECT access_token, refresh_token FROM users WHERE id = $1',
            [userId]
        );

        if (!userResult.rows[0]) {
            return res.status(404).json({ error: 'User not found' });
        }

        const { access_token, refresh_token } = userResult.rows[0];
        const { sheets, drive } = getGoogleClients(access_token, refresh_token);

        // Create new spreadsheet with template
        const sheetTitle = title || 'Task Board';
        const response = await sheets.spreadsheets.create({
            requestBody: {
                properties: {
                    title: sheetTitle
                },
                sheets: [
                    {
                        properties: {
                            title: 'Tasks',
                            gridProperties: {
                                frozenRowCount: 1
                            }
                        }
                    }
                ]
            }
        });

        const spreadsheet = response.data;
        const spreadsheetId = spreadsheet.spreadsheetId!;

        // Add template headers
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: 'Tasks!A1:F1',
            valueInputOption: 'RAW',
            requestBody: {
                values: [['Title', 'Description', 'Status', 'Priority', 'Due Date', 'Assignee']]
            }
        });

        // Add sample data row
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: 'Tasks!A2:F2',
            valueInputOption: 'RAW',
            requestBody: {
                values: [['Example Task', 'This is a sample task', 'todo', 'medium', '', '']]
            }
        });

        // Format headers (bold, background color)
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: {
                requests: [
                    {
                        repeatCell: {
                            range: {
                                sheetId: spreadsheet.sheets?.[0]?.properties?.sheetId,
                                startRowIndex: 0,
                                endRowIndex: 1
                            },
                            cell: {
                                userEnteredFormat: {
                                    backgroundColor: { red: 0.2, green: 0.5, blue: 0.9 },
                                    textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } }
                                }
                            },
                            fields: 'userEnteredFormat(backgroundColor, textFormat)'
                        }
                    },
                    {
                        autoResizeDimensions: {
                            dimensions: {
                                sheetId: spreadsheet.sheets?.[0]?.properties?.sheetId,
                                dimension: 'COLUMNS',
                                startIndex: 0,
                                endIndex: 6
                            }
                        }
                    }
                ]
            }
        });

        // Move to folder if specified
        if (folderId) {
            try {
                await drive.files.update({
                    fileId: spreadsheetId,
                    addParents: folderId,
                    removeParents: 'root',
                    fields: 'id, parents'
                });
                logger.info(`Moved spreadsheet ${spreadsheetId} to folder ${folderId}`);
            } catch (moveError) {
                logger.warn('Could not move spreadsheet to folder:', moveError);
            }
        }

        // If workspace/project provided, create synced_sheets entry
        if (workspaceId) {
            await query(
                `INSERT INTO synced_sheets (workspace_id, project_id, sheet_id, sheet_name, column_mapping, sync_status, last_synced_at)
                 VALUES ($1, $2, $3, $4, $5, 'active', NOW())
                 ON CONFLICT (workspace_id, sheet_id) DO UPDATE SET
                   sheet_name = EXCLUDED.sheet_name,
                   column_mapping = EXCLUDED.column_mapping,
                   project_id = EXCLUDED.project_id,
                   updated_at = NOW()`,
                [
                    workspaceId,
                    projectId || null,
                    spreadsheetId,
                    sheetTitle,
                    JSON.stringify({
                        title: 0,
                        description: 1,
                        status: 2,
                        priority: 3,
                        dueDate: 4,
                        assignee: 5,
                        sheetTab: 'Tasks'
                    })
                ]
            );
            logger.info(`Created synced_sheets entry for workspace ${workspaceId}`);
        }

        logger.info(`Created template spreadsheet ${spreadsheetId} for user ${userId}`);

        return res.status(201).json({
            spreadsheet: {
                id: spreadsheetId,
                name: sheetTitle,
                webViewLink: spreadsheet.spreadsheetUrl
            },
            message: 'Template spreadsheet created successfully'
        });
    } catch (error) {
        logger.error('Error creating template spreadsheet:', error);
        return res.status(500).json({ error: 'Failed to create template spreadsheet' });
    }
});

export default router;


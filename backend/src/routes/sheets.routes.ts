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

export default router;

import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// GET /api/sheets/grades - Get student grades
// POST /api/sheets/grades/sync - Sync grades from Google Sheets
// GET /api/sheets/class/:classId/stats - Get class grade statistics
// POST /api/sheets/create - Create new gradebook sheet

export default router;

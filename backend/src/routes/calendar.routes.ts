import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// GET /api/calendar/events - Get upcoming events
// POST /api/calendar/events - Create new event
// PUT /api/calendar/events/:eventId - Update event
// DELETE /api/calendar/events/:eventId - Delete event
// POST /api/calendar/sync - Sync events from Google Calendar

export default router;

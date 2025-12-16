import { Router, Request, Response } from 'express';
import { pool } from '../config/database';
import { authenticateToken } from '../middleware/auth.middleware';
import activityService from '../services/activity.service';

const router = Router();

// Get activity feed for organization
router.get('/organizations/:orgId/activity', authenticateToken, async (req: Request, res: Response) => {
    try {
        const { orgId } = req.params;
        const limit = parseInt(req.query.limit as string) || 50;

        const activities = await activityService.getActivityFeed(orgId, limit);

        res.json({ activities });
    } catch (error) {
        console.error('Error fetching activity feed:', error);
        res.status(500).json({ error: 'Failed to fetch activity feed' });
    }
});

export default router;

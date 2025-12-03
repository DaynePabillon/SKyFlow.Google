import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// GET /api/classroom/courses - Get user's courses
// POST /api/classroom/courses/sync - Sync courses from Google Classroom
// GET /api/classroom/courses/:courseId/assignments - Get course assignments
// POST /api/classroom/assignments - Create new assignment
// GET /api/classroom/assignments/:assignmentId/submissions - Get submissions
// POST /api/classroom/submissions/:submissionId/grade - Grade a submission

export default router;

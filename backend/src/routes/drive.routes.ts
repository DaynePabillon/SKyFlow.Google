import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// GET /api/drive/files - List user's files
// POST /api/drive/upload - Upload file to Drive
// GET /api/drive/files/:fileId - Get file metadata
// DELETE /api/drive/files/:fileId - Delete file
// POST /api/drive/files/:fileId/share - Share file with user

export default router;

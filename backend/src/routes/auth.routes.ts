import { Router, Request, Response } from 'express';
import GoogleAuthService from '../services/google/auth.service';
import { AuthRequest, authenticateToken } from '../middleware/auth.middleware';
import logger from '../config/logger';

const router = Router();

/**
 * GET /api/auth/google
 * Generate Google OAuth URL
 */
router.get('/google', (req: Request, res: Response) => {
  try {
    const role = req.query.role as 'student' | 'teacher';
    
    if (!role || !['student', 'teacher'].includes(role)) {
      return res.status(400).json({ error: 'Valid role (student/teacher) is required' });
    }

    const authUrl = GoogleAuthService.getAuthUrl(role);
    return res.json({ authUrl });
  } catch (error) {
    logger.error('Error generating auth URL:', error);
    return res.status(500).json({ error: 'Failed to generate authentication URL' });
  }
});

/**
 * GET /api/auth/google/callback
 * Handle Google OAuth callback
 */
router.get('/google/callback', async (req: Request, res: Response) => {
  try {
    const { code, state } = req.query;

    if (!code) {
      return res.status(400).json({ error: 'Authorization code is required' });
    }

    // Decode state to get role
    const { role } = JSON.parse(Buffer.from(state as string, 'base64').toString());

    // Exchange code for tokens
    const tokens = await GoogleAuthService.exchangeCodeForTokens(code as string);

    // Get user info from Google
    const googleUser = await GoogleAuthService.getUserInfo(tokens.access_token!);

    // Save/update user in database
    const user = await GoogleAuthService.upsertUser(
      googleUser,
      role,
      tokens.access_token!,
      tokens.refresh_token || undefined
    );

    // Generate JWT
    const jwt = GoogleAuthService.generateJWT(user);

    // Redirect to frontend with token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return res.redirect(`${frontendUrl}/auth/callback?token=${jwt}&role=${role}`);
  } catch (error) {
    logger.error('Error in OAuth callback:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
});

/**
 * GET /api/auth/me
 * Get current user info
 */
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const user = await GoogleAuthService.getUserWithTokens(req.user!.id);
    
    // Don't send sensitive tokens to frontend
    const { access_token, refresh_token, ...safeUser } = user;
    
    res.json(safeUser);
  } catch (error) {
    logger.error('Error fetching user info:', error);
    res.status(500).json({ error: 'Failed to fetch user information' });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh access token
 */
router.post('/refresh', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const newAccessToken = await GoogleAuthService.refreshAccessToken(req.user!.id);
    res.json({ accessToken: newAccessToken });
  } catch (error) {
    logger.error('Error refreshing token:', error);
    res.status(500).json({ error: 'Failed to refresh access token' });
  }
});

/**
 * POST /api/auth/logout
 * Logout user (client-side token removal)
 */
router.post('/logout', authenticateToken, (req: AuthRequest, res: Response) => {
  // In a stateless JWT system, logout is handled client-side
  // Optionally, you could blacklist the token here
  logger.info(`User ${req.user!.id} logged out`);
  res.json({ message: 'Logged out successfully' });
});

export default router;

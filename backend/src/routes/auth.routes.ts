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
    const inviteToken = req.query.invite as string;
    const authUrl = GoogleAuthService.getAuthUrl(inviteToken);
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

    // Decode state to get invite token if present
    let inviteToken: string | undefined;
    if (state) {
      try {
        const decoded = JSON.parse(Buffer.from(state as string, 'base64').toString());
        inviteToken = decoded.inviteToken;
      } catch (e) {
        // State parsing failed, continue without invite
      }
    }

    // Exchange code for tokens
    const tokens = await GoogleAuthService.exchangeCodeForTokens(code as string);

    // Get user info from Google
    const googleUser = await GoogleAuthService.getUserInfo(tokens.access_token!);

    // Save/update user in database
    const user = await GoogleAuthService.upsertUser(
      googleUser,
      tokens.access_token!,
      tokens.refresh_token || undefined
    );

    // If invite token provided, process invitation
    if (inviteToken) {
      await GoogleAuthService.processInvitation(user.id, inviteToken);
    }

    // Generate JWT
    const jwt = GoogleAuthService.generateJWT(user);

    // Redirect to frontend with token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const redirectUrl = inviteToken 
      ? `${frontendUrl}/auth/callback?token=${jwt}&invited=true`
      : `${frontendUrl}/auth/callback?token=${jwt}`;
    return res.redirect(redirectUrl);
  } catch (error) {
    logger.error('Error in OAuth callback:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
});

/**
 * GET /api/auth/me
 * Get current user info with organizations
 */
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const user = await GoogleAuthService.getUserWithTokens(req.user!.id);
    
    // Get user's organizations
    const { query: dbQuery } = await import('../config/database');
    const orgsResult = await dbQuery(
      `SELECT o.id, o.name, om.role, om.status
       FROM organizations o
       INNER JOIN organization_members om ON o.id = om.organization_id
       WHERE om.user_id = $1 AND om.status = $2
       ORDER BY om.joined_at DESC`,
      [user.id, 'active']
    );
    
    // Don't send sensitive tokens to frontend
    const { access_token, refresh_token, ...safeUser } = user;
    
    res.json({
      ...safeUser,
      organizations: orgsResult.rows,
    });
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
 * GET /api/auth/invite/:token
 * Get invitation details
 */
router.get('/invite/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const { query: dbQuery } = await import('../config/database');
    
    const result = await dbQuery(
      `SELECT oi.*, o.name as organization_name
       FROM organization_invitations oi
       INNER JOIN organizations o ON oi.organization_id = o.id
       WHERE oi.token = $1 AND oi.expires_at > NOW() AND oi.accepted_at IS NULL`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Invalid or expired invitation' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Error fetching invitation:', error);
    res.status(500).json({ error: 'Failed to fetch invitation' });
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

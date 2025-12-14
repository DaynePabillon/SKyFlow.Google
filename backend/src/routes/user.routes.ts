import { Router } from 'express';
import { AuthRequest, authenticateToken } from '../middleware/auth.middleware';
import { query } from '../config/database';
import logger from '../config/logger';
import { sendInvitationEmail, isEmailConfigured } from '../services/email.service';

const router = Router();

/**
 * POST /api/users/onboarding
 * Save user onboarding preferences
 */
router.post('/onboarding', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      purpose,
      role,
      teamSize,
      focusAreas,
      hearAbout,
      teamMembers,
      workspaceName
    } = req.body;

    // Update user's onboarding status and preferences
    await query(
      `UPDATE users 
       SET onboarding_completed = true,
           onboarding_data = $1,
           updated_at = NOW()
       WHERE id = $2`,
      [
        JSON.stringify({
          purpose,
          role,
          teamSize,
          focusAreas,
          hearAbout,
          completedAt: new Date().toISOString()
        }),
        userId
      ]
    );

    // Create workspace/organization if name provided
    if (workspaceName && workspaceName.trim()) {
      const orgResult = await query(
        `INSERT INTO organizations (name, created_by, created_at, updated_at)
         VALUES ($1, $2, NOW(), NOW())
         RETURNING id`,
        [workspaceName.trim(), userId]
      );

      const organizationId = orgResult.rows[0].id;

      // Add user as admin of the organization
      await query(
        `INSERT INTO organization_members (organization_id, user_id, role, status, joined_at)
         VALUES ($1, $2, 'admin', 'active', NOW())`,
        [organizationId, userId]
      );

      // Send invitations to team members if provided
      if (teamMembers && Array.isArray(teamMembers)) {
        // Get inviter details for the email
        const inviterResult = await query('SELECT name, email FROM users WHERE id = $1', [userId]);
        const inviter = inviterResult.rows[0];

        for (const member of teamMembers) {
          if (member.email && member.email.trim()) {
            const token = require('crypto').randomBytes(32).toString('hex');
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

            await query(
              `INSERT INTO organization_invitations 
               (organization_id, email, role, invited_by, token, expires_at, created_at)
               VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
              [
                organizationId,
                member.email.trim(),
                member.role || 'member',
                userId,
                token,
                expiresAt
              ]
            );

            // Send invitation email
            const emailResult = await sendInvitationEmail({
              to: member.email.trim(),
              inviterName: inviter?.name || 'A team member',
              inviterEmail: inviter?.email || '',
              organizationName: workspaceName.trim(),
              role: member.role || 'member',
              token: token
            });

            if (emailResult.success) {
              logger.info(`✅ Invitation sent to ${member.email} for organization ${organizationId}`);
            } else {
              logger.warn(`⚠️ Invitation email failed for ${member.email}: ${emailResult.error}`);
            }
          }
        }
      }

      return res.json({
        success: true,
        message: 'Onboarding completed successfully',
        organizationId
      });
    }

    return res.json({
      success: true,
      message: 'Onboarding completed successfully'
    });

  } catch (error) {
    logger.error('Error saving onboarding data:', error);
    return res.status(500).json({ error: 'Failed to save onboarding data' });
  }
});

export default router;

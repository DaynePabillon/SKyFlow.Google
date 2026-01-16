import { Router, Response } from 'express';
import { AuthRequest, authenticateToken } from '../middleware/auth.middleware';
import { query } from '../config/database';
import logger from '../config/logger';
import crypto from 'crypto';

const router = Router();

/**
 * POST /api/organizations
 * Create a new organization
 */
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, domain } = req.body;
    const userId = req.user!.id;

    if (!name) {
      return res.status(400).json({ error: 'Organization name is required' });
    }

    // Create organization
    const orgResult = await query(
      `INSERT INTO organizations (name, description, domain) 
       VALUES ($1, $2, $3) RETURNING *`,
      [name, description, domain]
    );

    const organization = orgResult.rows[0];

    // Add creator as admin
    await query(
      `INSERT INTO organization_members (organization_id, user_id, role, status, joined_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [organization.id, userId, 'admin', 'active']
    );

    logger.info(`Organization created: ${organization.id} by user ${userId}`);
    res.status(201).json(organization);
  } catch (error) {
    logger.error('Error creating organization:', error);
    res.status(500).json({ error: 'Failed to create organization' });
  }
});

/**
 * GET /api/organizations
 * Get user's organizations
 */
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const result = await query(
      `SELECT o.*, om.role, om.status, om.joined_at
       FROM organizations o
       INNER JOIN organization_members om ON o.id = om.organization_id
       WHERE om.user_id = $1 AND om.status = $2
       ORDER BY o.created_at DESC`,
      [userId, 'active']
    );

    res.json(result.rows);
  } catch (error) {
    logger.error('Error fetching organizations:', error);
    res.status(500).json({ error: 'Failed to fetch organizations' });
  }
});

/**
 * GET /api/organizations/:id
 * Get organization details
 */
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Check if user is member
    const memberCheck = await query(
      'SELECT role FROM organization_members WHERE organization_id = $1 AND user_id = $2 AND status = $3',
      [id, userId, 'active']
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const orgResult = await query('SELECT * FROM organizations WHERE id = $1', [id]);

    if (orgResult.rows.length === 0) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    // Get member count
    const memberCount = await query(
      'SELECT COUNT(*) FROM organization_members WHERE organization_id = $1 AND status = $2',
      [id, 'active']
    );

    // Get project count
    const projectCount = await query(
      'SELECT COUNT(*) FROM projects WHERE organization_id = $1',
      [id]
    );

    const organization = {
      ...orgResult.rows[0],
      memberCount: parseInt(memberCount.rows[0].count),
      projectCount: parseInt(projectCount.rows[0].count),
      userRole: memberCheck.rows[0].role,
    };

    res.json(organization);
  } catch (error) {
    logger.error('Error fetching organization:', error);
    res.status(500).json({ error: 'Failed to fetch organization' });
  }
});

/**
 * PUT /api/organizations/:id
 * Update organization (admin only)
 */
router.put('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, domain, logo_url } = req.body;
    const userId = req.user!.id;

    // Check if user is admin
    const roleCheck = await query(
      'SELECT role FROM organization_members WHERE organization_id = $1 AND user_id = $2',
      [id, userId]
    );

    if (roleCheck.rows.length === 0 || roleCheck.rows[0].role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const result = await query(
      `UPDATE organizations 
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           domain = COALESCE($3, domain),
           logo_url = COALESCE($4, logo_url)
       WHERE id = $5
       RETURNING *`,
      [name, description, domain, logo_url, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Error updating organization:', error);
    res.status(500).json({ error: 'Failed to update organization' });
  }
});

/**
 * POST /api/organizations/:id/invite
 * Invite user to organization (admin/manager only)
 */
router.post('/:id/invite', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { email, role } = req.body;
    const userId = req.user!.id;

    if (!email || !role) {
      return res.status(400).json({ error: 'Email and role are required' });
    }

    if (!['admin', 'manager', 'member'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Check if user has permission to invite
    const roleCheck = await query(
      'SELECT role FROM organization_members WHERE organization_id = $1 AND user_id = $2',
      [id, userId]
    );

    if (roleCheck.rows.length === 0 || !['admin', 'manager'].includes(roleCheck.rows[0].role)) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    // Generate invitation token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    // Create invitation
    const inviteResult = await query(
      `INSERT INTO organization_invitations (organization_id, email, role, token, invited_by, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (organization_id, email) 
       DO UPDATE SET token = $4, expires_at = $6, invited_by = $5
       RETURNING *`,
      [id, email, role, token, userId, expiresAt]
    );

    // TODO: Send invitation email
    logger.info(`Invitation created for ${email} to organization ${id}`);

    res.status(201).json({
      message: 'Invitation sent successfully',
      inviteUrl: `${process.env.FRONTEND_URL}/invite/${token}`,
    });
  } catch (error) {
    logger.error('Error creating invitation:', error);
    res.status(500).json({ error: 'Failed to create invitation' });
  }
});

/**
 * GET /api/organizations/:id/members
 * Get organization members
 */
router.get('/:id/members', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Check if user is member
    const memberCheck = await query(
      'SELECT 1 FROM organization_members WHERE organization_id = $1 AND user_id = $2 AND status = $3',
      [id, userId, 'active']
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await query(
      `SELECT u.id, u.name, u.email, u.profile_picture, 
              om.role, om.status, om.joined_at
       FROM organization_members om
       INNER JOIN users u ON om.user_id = u.id
       WHERE om.organization_id = $1
       ORDER BY om.joined_at DESC`,
      [id]
    );

    res.json({ members: result.rows });
  } catch (error) {
    logger.error('Error fetching members:', error);
    res.status(500).json({ error: 'Failed to fetch members' });
  }
});

/**
 * DELETE /api/organizations/:id/members/:userId
 * Remove member from organization (admin only)
 */
router.delete('/:id/members/:memberId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id, memberId } = req.params;
    const userId = req.user!.id;

    // Check if user is admin
    const roleCheck = await query(
      'SELECT role FROM organization_members WHERE organization_id = $1 AND user_id = $2',
      [id, userId]
    );

    if (roleCheck.rows.length === 0 || roleCheck.rows[0].role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    await query(
      'DELETE FROM organization_members WHERE organization_id = $1 AND user_id = $2',
      [id, memberId]
    );

    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    logger.error('Error removing member:', error);
    res.status(500).json({ error: 'Failed to remove member' });
  }
});

/**
 * GET /api/organizations/:id/projects
 * Get all projects in organization
 */
router.get('/:id/projects', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Check if user is member
    const memberCheck = await query(
      'SELECT 1 FROM organization_members WHERE organization_id = $1 AND user_id = $2 AND status = $3',
      [id, userId, 'active']
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await query(
      `SELECT p.*, u.name as created_by_name,
              COUNT(DISTINCT t.id) as task_count
       FROM projects p
       LEFT JOIN users u ON p.created_by = u.id
       LEFT JOIN tasks t ON p.id = t.project_id
       WHERE p.organization_id = $1
       GROUP BY p.id, u.name
       ORDER BY p.created_at DESC`,
      [id]
    );

    res.json({ projects: result.rows });
  } catch (error) {
    logger.error('Error fetching organization projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

/**
 * GET /api/organizations/:id/tasks
 * Get all tasks in organization (including synced sheet tasks)
 */
router.get('/:id/tasks', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Check if user is member
    const memberCheck = await query(
      'SELECT 1 FROM organization_members WHERE organization_id = $1 AND user_id = $2 AND status = $3',
      [id, userId, 'active']
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Query includes both regular tasks AND synced sheet_tasks
    const result = await query(
      `SELECT t.id, t.project_id, t.title, t.description, t.status, t.priority,
              t.due_date, t.estimated_hours, t.actual_hours, t.assigned_to, t.created_by,
              t.created_at, t.updated_at,
              p.name as project_name,
              u1.name as assigned_to_name,
              u1.email as assigned_to_email,
              u2.name as created_by_name,
              'app' as source_type,
              NULL as sheet_name,
              NULL as google_sheet_id,
              (SELECT COUNT(*) FROM task_comments WHERE task_id = t.id)::integer as comment_count
       FROM tasks t
       INNER JOIN projects p ON t.project_id = p.id
       LEFT JOIN users u1 ON t.assigned_to = u1.id
       LEFT JOIN users u2 ON t.created_by = u2.id
       WHERE p.organization_id = $1
       
       UNION ALL
       
       SELECT 
         st.id,
         st.project_id,
         st.title,
         st.description,
         st.status,
         st.priority,
         st.due_date,
         NULL::integer as estimated_hours,
         NULL::integer as actual_hours,
         NULL::uuid as assigned_to,
         NULL::uuid as created_by,
         st.created_at,
         st.updated_at,
         COALESCE(p.name, NULL) as project_name,
         st.assignee_email as assigned_to_name,
         st.assignee_email as assigned_to_email,
         'Google Sheets' as created_by_name,
         'sheet' as source_type,
         ss.sheet_name,
         ss.sheet_id as google_sheet_id,
         (SELECT COUNT(*) FROM task_comments WHERE task_id = st.id)::integer as comment_count
       FROM sheet_tasks st
       JOIN synced_sheets ss ON st.synced_sheet_id = ss.id
       JOIN workspaces w ON ss.workspace_id = w.id
       LEFT JOIN projects p ON st.project_id = p.id
       WHERE w.organization_id = $1
       
       ORDER BY created_at DESC`,
      [id]
    );

    res.json({ tasks: result.rows });
  } catch (error) {
    logger.error('Error fetching organization tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

/**
 * GET /api/organizations/:id/synced-sheets
 * Get all synced sheets in organization
 */
router.get('/:id/synced-sheets', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Check if user is member
    const memberCheck = await query(
      'SELECT 1 FROM organization_members WHERE organization_id = $1 AND user_id = $2 AND status = $3',
      [id, userId, 'active']
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get synced sheets from workspaces in this organization
    const result = await query(
      `SELECT ss.*, w.name as workspace_name,
              (SELECT COUNT(*) FROM sheet_tasks WHERE synced_sheet_id = ss.id) as task_count
       FROM synced_sheets ss
       JOIN workspaces w ON ss.workspace_id = w.id
       WHERE w.organization_id = $1
       ORDER BY ss.created_at DESC`,
      [id]
    );

    res.json({ syncedSheets: result.rows });
  } catch (error) {
    logger.error('Error fetching synced sheets:', error);
    res.status(500).json({ error: 'Failed to fetch synced sheets' });
  }
});

/**
 * POST /api/organizations/:id/tasks
 * Create a task in organization (creates a default project if needed)
 */
router.post('/:id/tasks', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, status, priority, due_date, assigned_to } = req.body;
    const userId = req.user!.id;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    // Check if user is member
    const memberCheck = await query(
      'SELECT role FROM organization_members WHERE organization_id = $1 AND user_id = $2 AND status = $3',
      [id, userId, 'active']
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get or create default project for organization
    let projectResult = await query(
      'SELECT id FROM projects WHERE organization_id = $1 AND name = $2',
      [id, 'General Tasks']
    );

    let projectId;
    if (projectResult.rows.length === 0) {
      // Create default project
      const newProject = await query(
        `INSERT INTO projects (organization_id, name, description, status, created_by)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [id, 'General Tasks', 'Default project for organization tasks', 'active', userId]
      );
      projectId = newProject.rows[0].id;
    } else {
      projectId = projectResult.rows[0].id;
    }

    // Create task
    const taskResult = await query(
      `INSERT INTO tasks (
        project_id, title, description, status, priority,
        due_date, assigned_to, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [projectId, title, description, status || 'todo', priority || 'medium',
        due_date, assigned_to, userId]
    );

    logger.info(`Task created in organization ${id}: ${taskResult.rows[0].id}`);
    res.status(201).json(taskResult.rows[0]);
  } catch (error) {
    logger.error('Error creating organization task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

/**
 * PATCH /api/organizations/:orgId/members/:memberId/role
 * Update a member's role (Admin only)
 */
router.patch('/:orgId/members/:memberId/role', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { orgId, memberId } = req.params;
    const { role } = req.body;
    const userId = req.user!.id;

    if (!['admin', 'manager', 'member'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be admin, manager, or member' });
    }

    // Check if current user is admin
    const adminCheck = await query(
      `SELECT role FROM organization_members WHERE organization_id = $1 AND user_id = $2 AND status = 'active'`,
      [orgId, userId]
    );

    if (adminCheck.rows.length === 0 || adminCheck.rows[0].role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can change member roles' });
    }

    // Prevent demoting yourself if you're the only admin
    if (memberId === userId && role !== 'admin') {
      const adminCount = await query(
        `SELECT COUNT(*) FROM organization_members WHERE organization_id = $1 AND role = 'admin' AND status = 'active'`,
        [orgId]
      );
      if (parseInt(adminCount.rows[0].count) <= 1) {
        return res.status(400).json({ error: 'Cannot demote the only admin' });
      }
    }

    // Update role
    const result = await query(
      `UPDATE organization_members SET role = $1 WHERE organization_id = $2 AND user_id = $3 RETURNING *`,
      [role, orgId, memberId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }

    logger.info(`Role updated: user ${memberId} is now ${role} in org ${orgId}`);
    res.json({ success: true, role });
  } catch (error) {
    logger.error('Error updating member role:', error);
    res.status(500).json({ error: 'Failed to update role' });
  }
});

/**
 * DELETE /api/organizations/:orgId/members/:memberId
 * Remove a member from organization (Admin only)
 */
router.delete('/:orgId/members/:memberId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { orgId, memberId } = req.params;
    const userId = req.user!.id;

    // Check if current user is admin
    const adminCheck = await query(
      `SELECT role FROM organization_members WHERE organization_id = $1 AND user_id = $2 AND status = 'active'`,
      [orgId, userId]
    );

    if (adminCheck.rows.length === 0 || adminCheck.rows[0].role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can remove members' });
    }

    // Prevent removing yourself if you're the only admin
    if (memberId === userId) {
      const adminCount = await query(
        `SELECT COUNT(*) FROM organization_members WHERE organization_id = $1 AND role = 'admin' AND status = 'active'`,
        [orgId]
      );
      if (parseInt(adminCount.rows[0].count) <= 1) {
        return res.status(400).json({ error: 'Cannot remove the only admin' });
      }
    }

    // Remove member
    await query(
      `DELETE FROM organization_members WHERE organization_id = $1 AND user_id = $2`,
      [orgId, memberId]
    );

    logger.info(`Member ${memberId} removed from organization ${orgId}`);
    res.json({ success: true });
  } catch (error) {
    logger.error('Error removing member:', error);
    res.status(500).json({ error: 'Failed to remove member' });
  }
});

/**
 * POST /api/organizations/:id/leave
 * Leave an organization (any member can leave)
 */
router.post('/:id/leave', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Check if user is a member
    const memberCheck = await query(
      'SELECT role FROM organization_members WHERE organization_id = $1 AND user_id = $2 AND status = $3',
      [id, userId, 'active']
    );

    if (memberCheck.rows.length === 0) {
      return res.status(404).json({ error: 'You are not a member of this organization' });
    }

    const userRole = memberCheck.rows[0].role;

    // If user is admin, check if they're the only admin
    if (userRole === 'admin') {
      const adminCount = await query(
        `SELECT COUNT(*) FROM organization_members WHERE organization_id = $1 AND role = 'admin' AND status = 'active'`,
        [id]
      );
      if (parseInt(adminCount.rows[0].count) <= 1) {
        // Check if there are other members who could become admin
        const memberCount = await query(
          `SELECT COUNT(*) FROM organization_members WHERE organization_id = $1 AND status = 'active'`,
          [id]
        );
        if (parseInt(memberCount.rows[0].count) > 1) {
          return res.status(400).json({
            error: 'You are the only admin. Please promote another member to admin before leaving, or delete the workspace.'
          });
        }
        // If only member, just delete the org
        await query('DELETE FROM organizations WHERE id = $1', [id]);
        logger.info(`Organization ${id} deleted as last admin left`);
        return res.json({ success: true, message: 'Workspace deleted as you were the only member' });
      }
    }

    // Remove user from organization
    await query(
      'DELETE FROM organization_members WHERE organization_id = $1 AND user_id = $2',
      [id, userId]
    );

    logger.info(`User ${userId} left organization ${id}`);
    res.json({ success: true, message: 'Successfully left the workspace' });
  } catch (error) {
    logger.error('Error leaving organization:', error);
    res.status(500).json({ error: 'Failed to leave organization' });
  }
});

/**
 * DELETE /api/organizations/:id
 * Delete an organization (admin only)
 */
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Check if user is admin
    const roleCheck = await query(
      'SELECT role FROM organization_members WHERE organization_id = $1 AND user_id = $2 AND status = $3',
      [id, userId, 'active']
    );

    if (roleCheck.rows.length === 0 || roleCheck.rows[0].role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can delete workspaces' });
    }

    // Delete organization (cascade will handle members, projects, tasks)
    await query('DELETE FROM organizations WHERE id = $1', [id]);

    logger.info(`Organization ${id} deleted by user ${userId}`);
    res.json({ success: true, message: 'Workspace deleted successfully' });
  } catch (error) {
    logger.error('Error deleting organization:', error);
    res.status(500).json({ error: 'Failed to delete organization' });
  }
});

export default router;

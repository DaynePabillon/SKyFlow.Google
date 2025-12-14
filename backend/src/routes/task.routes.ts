import { Router, Response } from 'express';
import { AuthRequest, authenticateToken } from '../middleware/auth.middleware';
import { query } from '../config/database';
import logger from '../config/logger';

const router = Router();

/**
 * POST /api/tasks
 * Create a new task
 */
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const {
      project_id,
      title,
      description,
      status,
      priority,
      due_date,
      estimated_hours,
      assigned_to,
      parent_task_id,
    } = req.body;
    const userId = req.user!.id;

    if (!project_id || !title) {
      return res.status(400).json({ error: 'Project ID and title are required' });
    }

    // Check if user has access to project
    const accessCheck = await query(
      `SELECT pm.role as project_role, om.role as org_role
       FROM projects p
       INNER JOIN organization_members om ON p.organization_id = om.organization_id
       LEFT JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = $2
       WHERE p.id = $1 AND om.user_id = $2 AND om.status = $3`,
      [project_id, userId, 'active']
    );

    if (accessCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Create task
    const result = await query(
      `INSERT INTO tasks (
        project_id, title, description, status, priority,
        due_date, estimated_hours, assigned_to, created_by, parent_task_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [project_id, title, description, status || 'todo', priority || 'medium',
        due_date, estimated_hours, assigned_to, userId, parent_task_id]
    );

    logger.info(`Task created: ${result.rows[0].id} by user ${userId}`);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

/**
 * GET /api/tasks
 * Get tasks (filtered by project, assigned user, status, etc.)
 */
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { project_id, assigned_to, status, priority } = req.query;

    let queryText = `
      SELECT t.*, 
             p.name as project_name,
             u1.name as assigned_to_name,
             u2.name as created_by_name
      FROM tasks t
      INNER JOIN projects p ON t.project_id = p.id
      INNER JOIN organization_members om ON p.organization_id = om.organization_id
      LEFT JOIN users u1 ON t.assigned_to = u1.id
      LEFT JOIN users u2 ON t.created_by = u2.id
      WHERE om.user_id = $1 AND om.status = 'active'
    `;

    const params: any[] = [userId];

    if (project_id) {
      queryText += ` AND t.project_id = $${params.length + 1}`;
      params.push(project_id);
    }

    if (assigned_to) {
      queryText += ` AND t.assigned_to = $${params.length + 1}`;
      params.push(assigned_to);
    }

    if (status) {
      queryText += ` AND t.status = $${params.length + 1}`;
      params.push(status);
    }

    if (priority) {
      queryText += ` AND t.priority = $${params.length + 1}`;
      params.push(priority);
    }

    queryText += ' ORDER BY t.due_date ASC NULLS LAST, t.created_at DESC';

    const result = await query(queryText, params);
    res.json(result.rows);
  } catch (error) {
    logger.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

/**
 * GET /api/tasks/:id
 * Get task details
 */
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Check access
    const result = await query(
      `SELECT t.*,
              p.name as project_name,
              u1.name as assigned_to_name,
              u2.name as created_by_name,
              parent.title as parent_task_title
       FROM tasks t
       INNER JOIN projects p ON t.project_id = p.id
       INNER JOIN organization_members om ON p.organization_id = om.organization_id
       LEFT JOIN users u1 ON t.assigned_to = u1.id
       LEFT JOIN users u2 ON t.created_by = u2.id
       LEFT JOIN tasks parent ON t.parent_task_id = parent.id
       WHERE t.id = $1 AND om.user_id = $2 AND om.status = $3`,
      [id, userId, 'active']
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found or access denied' });
    }

    // Get subtasks
    const subtasks = await query(
      'SELECT id, title, status, priority FROM tasks WHERE parent_task_id = $1',
      [id]
    );

    // Get comments
    const comments = await query(
      `SELECT tc.*, u.name as user_name, u.profile_picture
       FROM task_comments tc
       LEFT JOIN users u ON tc.user_id = u.id
       WHERE tc.task_id = $1
       ORDER BY tc.created_at DESC`,
      [id]
    );

    const task = {
      ...result.rows[0],
      subtasks: subtasks.rows,
      comments: comments.rows,
    };

    res.json(task);
  } catch (error) {
    logger.error('Error fetching task:', error);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

/**
 * PUT /api/tasks/:id
 * Update task
 */
router.put('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const {
      title,
      description,
      status,
      priority,
      due_date,
      estimated_hours,
      actual_hours,
      assigned_to,
    } = req.body;

    // Check access
    const accessCheck = await query(
      `SELECT 1 FROM tasks t
       INNER JOIN projects p ON t.project_id = p.id
       INNER JOIN organization_members om ON p.organization_id = om.organization_id
       WHERE t.id = $1 AND om.user_id = $2 AND om.status = $3`,
      [id, userId, 'active']
    );

    if (accessCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Update completed_at if status changed to completed
    const completedAt = status === 'completed' ? 'NOW()' : 'completed_at';

    const result = await query(
      `UPDATE tasks
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           status = COALESCE($3, status),
           priority = COALESCE($4, priority),
           due_date = COALESCE($5, due_date),
           estimated_hours = COALESCE($6, estimated_hours),
           actual_hours = COALESCE($7, actual_hours),
           assigned_to = COALESCE($8, assigned_to),
           completed_at = CASE WHEN $3 = 'completed' THEN NOW() ELSE completed_at END
       WHERE id = $9
       RETURNING *`,
      [title, description, status, priority, due_date, estimated_hours, actual_hours, assigned_to, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

/**
 * PATCH /api/tasks/:id/status
 * Update task status (for kanban drag-and-drop)
 */
router.patch('/:id/status', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user!.id;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    // Map frontend status values to database values
    const statusMap: Record<string, string> = {
      'todo': 'todo',
      'in-progress': 'in_progress',
      'in_progress': 'in_progress',
      'review': 'review',
      'done': 'completed',
      'completed': 'completed',
      'archived': 'archived'
    };

    const dbStatus = statusMap[status] || status;

    // Check access
    const accessCheck = await query(
      `SELECT 1 FROM tasks t
       INNER JOIN projects p ON t.project_id = p.id
       INNER JOIN organization_members om ON p.organization_id = om.organization_id
       WHERE t.id = $1 AND om.user_id = $2 AND om.status = $3`,
      [id, userId, 'active']
    );

    if (accessCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await query(
      `UPDATE tasks
       SET status = $1::text,
           completed_at = CASE WHEN $1::text IN ('done', 'completed') THEN NOW() ELSE completed_at END
       WHERE id = $2::uuid
       RETURNING *`,
      [dbStatus, id]
    );

    logger.info(`Task ${id} status updated to ${dbStatus} by user ${userId}`);
    res.json(result.rows[0]);
  } catch (error: any) {
    logger.error('Error updating task status:', error);
    // Include more detail for constraint violations
    if (error.code === '23514') {
      return res.status(400).json({
        error: 'Invalid status value',
        detail: 'Allowed values: todo, in_progress, review, done, completed',
        received: req.body.status
      });
    }
    res.status(500).json({ error: 'Failed to update task status' });
  }
});

/**
 * PATCH /api/tasks/:id
 * Update task fields (assignment, title, description, etc.)
 */
router.patch('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { assigned_to, title, description, priority, due_date } = req.body;
    const userId = req.user!.id;

    // Check access
    const accessCheck = await query(
      `SELECT 1 FROM tasks t
       INNER JOIN projects p ON t.project_id = p.id
       INNER JOIN organization_members om ON p.organization_id = om.organization_id
       WHERE t.id = $1 AND om.user_id = $2 AND om.status = $3`,
      [id, userId, 'active']
    );

    if (accessCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await query(
      `UPDATE tasks
       SET assigned_to = COALESCE($1, assigned_to),
           title = COALESCE($2, title),
           description = COALESCE($3, description),
           priority = COALESCE($4, priority),
           due_date = COALESCE($5, due_date)
       WHERE id = $6
       RETURNING *`,
      [assigned_to, title, description, priority, due_date, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    logger.info(`Task ${id} updated by user ${userId}`);
    res.json(result.rows[0]);
  } catch (error: any) {
    logger.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

/**
 * DELETE /api/tasks/:id
 * Delete task
 */
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Check if user is project lead or org admin/manager
    const roleCheck = await query(
      `SELECT pm.role as project_role, om.role as org_role
       FROM tasks t
       INNER JOIN projects p ON t.project_id = p.id
       INNER JOIN organization_members om ON p.organization_id = om.organization_id
       LEFT JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = $2
       WHERE t.id = $1 AND om.user_id = $2 AND om.status = $3`,
      [id, userId, 'active']
    );

    if (roleCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { project_role, org_role } = roleCheck.rows[0];
    if (project_role !== 'lead' && !['admin', 'manager'].includes(org_role)) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    await query('DELETE FROM tasks WHERE id = $1', [id]);
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    logger.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

/**
 * POST /api/tasks/:id/comments
 * Add comment to task
 */
router.post('/:id/comments', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;
    const userId = req.user!.id;

    if (!comment) {
      return res.status(400).json({ error: 'Comment is required' });
    }

    // Check access
    const accessCheck = await query(
      `SELECT 1 FROM tasks t
       INNER JOIN projects p ON t.project_id = p.id
       INNER JOIN organization_members om ON p.organization_id = om.organization_id
       WHERE t.id = $1 AND om.user_id = $2 AND om.status = $3`,
      [id, userId, 'active']
    );

    if (accessCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await query(
      'INSERT INTO task_comments (task_id, user_id, comment) VALUES ($1, $2, $3) RETURNING *',
      [id, userId, comment]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Error adding comment:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

/**
 * POST /api/tasks/:id/time
 * Log time entry for task
 */
router.post('/:id/time', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { start_time, end_time, duration_minutes, description } = req.body;
    const userId = req.user!.id;

    // Check access
    const accessCheck = await query(
      `SELECT 1 FROM tasks t
       INNER JOIN projects p ON t.project_id = p.id
       INNER JOIN organization_members om ON p.organization_id = om.organization_id
       WHERE t.id = $1 AND om.user_id = $2 AND om.status = $3`,
      [id, userId, 'active']
    );

    if (accessCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await query(
      `INSERT INTO time_entries (task_id, user_id, start_time, end_time, duration_minutes, description)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [id, userId, start_time, end_time, duration_minutes, description]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Error logging time:', error);
    res.status(500).json({ error: 'Failed to log time' });
  }
});

export default router;

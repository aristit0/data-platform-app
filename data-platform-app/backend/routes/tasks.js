const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

// Get all tasks (with filters and pagination)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { 
      employee_id, 
      status, 
      archived = 'false',
      page = 1, 
      limit = 10,
      search 
    } = req.query;
    
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT 
        t.*,
        e.full_name as employee_name
      FROM tasks t
      LEFT JOIN employees e ON t.employee_id = e.employee_id
      WHERE t.is_archived = ?
    `;
    const params = [archived === 'true' ? 1 : 0];

    // Filter by employee
    if (employee_id) {
      query += ' AND t.employee_id = ?';
      params.push(employee_id);
    }

    // Filter by status
    if (status) {
      query += ' AND t.status = ?';
      params.push(status);
    }

    // Search
    if (search) {
      query += ' AND (t.client_name LIKE ? OR t.project_name LIKE ? OR t.task_detail LIKE ? OR e.full_name LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    // Count query
    const countParams = [archived === 'true' ? 1 : 0];
    let countQuery = 'SELECT COUNT(*) as total FROM tasks t LEFT JOIN employees e ON t.employee_id = e.employee_id WHERE t.is_archived = ?';
    
    if (employee_id) {
      countQuery += ' AND t.employee_id = ?';
      countParams.push(employee_id);
    }
    if (status) {
      countQuery += ' AND t.status = ?';
      countParams.push(status);
    }
    if (search) {
      countQuery += ' AND (t.client_name LIKE ? OR t.project_name LIKE ? OR t.task_detail LIKE ? OR e.full_name LIKE ?)';
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    const [countResult] = await db.query(countQuery, countParams);
    const total = (countResult && countResult[0] && countResult[0].total) ? countResult[0].total : 0;

    // Add pagination and sorting
    query += ' ORDER BY t.due_date ASC, t.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [tasks] = await db.query(query, params);

    res.json({
      data: tasks || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks', message: error.message });
  }
});

// Get task statistics
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const { employee_id } = req.query;
    
    let query = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'Plan' THEN 1 ELSE 0 END) as plan,
        SUM(CASE WHEN status = 'On Progress' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN due_date < CURDATE() AND status != 'Completed' THEN 1 ELSE 0 END) as overdue
      FROM tasks
      WHERE is_archived = 0
    `;
    const params = [];
    
    if (employee_id) {
      query += ' AND employee_id = ?';
      params.push(employee_id);
    }

    const [stats] = await db.query(query, params);
    res.json(stats[0] || { total: 0, plan: 0, in_progress: 0, completed: 0, overdue: 0 });
  } catch (error) {
    console.error('Error fetching task stats:', error);
    res.status(500).json({ error: 'Failed to fetch task statistics' });
  }
});

// Create new task - FIXED validation
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { 
      employee_id, 
      client_name, 
      project_name, 
      task_detail, 
      due_date,
      status = 'Plan'
    } = req.body;

    console.log('Create task request:', req.body);

    // Validation - show which fields are missing
    const missingFields = [];
    if (!employee_id) missingFields.push('employee_id');
    if (!client_name) missingFields.push('client_name');
    if (!project_name) missingFields.push('project_name');
    if (!task_detail) missingFields.push('task_detail');
    if (!due_date) missingFields.push('due_date');

    if (missingFields.length > 0) {
      console.error('Missing required fields:', missingFields);
      return res.status(400).json({ 
        error: 'Missing required fields', 
        missing: missingFields,
        received: req.body
      });
    }

    const [result] = await db.query(
      `INSERT INTO tasks 
       (employee_id, client_name, project_name, task_detail, due_date, status) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [employee_id, client_name, project_name, task_detail, due_date, status]
    );

    console.log('Task created successfully:', result.insertId);

    res.status(201).json({ 
      message: 'Task created successfully',
      task_id: result.insertId 
    });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task', message: error.message });
  }
});

// Update task
router.put('/:taskId', authMiddleware, async (req, res) => {
  try {
    const updateData = req.body;
    
    const updates = [];
    const values = [];
    
    const allowedFields = [
      'employee_id', 'client_name', 'project_name', 'task_detail', 
      'due_date', 'status'
    ];
    
    allowedFields.forEach(field => {
      if (updateData.hasOwnProperty(field) && updateData[field] !== null && updateData[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(updateData[field]);
      }
    });
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    if (updateData.status === 'Completed') {
      updates.push('completed_at = NOW()');
    }
    
    values.push(req.params.taskId);
    
    const query = `UPDATE tasks SET ${updates.join(', ')} WHERE task_id = ?`;
    await db.query(query, values);

    res.json({ message: 'Task updated successfully' });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Archive task
router.patch('/:taskId/archive', authMiddleware, async (req, res) => {
  try {
    await db.query('UPDATE tasks SET is_archived = 1 WHERE task_id = ?', [req.params.taskId]);
    res.json({ message: 'Task archived successfully' });
  } catch (error) {
    console.error('Error archiving task:', error);
    res.status(500).json({ error: 'Failed to archive task' });
  }
});

// Unarchive task
router.patch('/:taskId/unarchive', authMiddleware, async (req, res) => {
  try {
    await db.query('UPDATE tasks SET is_archived = 0 WHERE task_id = ?', [req.params.taskId]);
    res.json({ message: 'Task unarchived successfully' });
  } catch (error) {
    console.error('Error unarchiving task:', error);
    res.status(500).json({ error: 'Failed to unarchive task' });
  }
});

// Delete task
router.delete('/:taskId', authMiddleware, async (req, res) => {
  try {
    await db.query('DELETE FROM tasks WHERE task_id = ?', [req.params.taskId]);
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

module.exports = router;

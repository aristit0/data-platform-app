const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// Get all leave requests
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { year, status, employee_id } = req.query;
    let query = `
      SELECT 
        lr.*,
        e1.full_name as employee_name,
        e2.full_name as replacement_name
      FROM leave_requests lr
      LEFT JOIN employees e1 ON lr.employee_id = e1.employee_id
      LEFT JOIN employees e2 ON lr.replacement_employee_id = e2.employee_id
      WHERE 1=1
    `;
    const params = [];

    if (year) {
      query += ' AND YEAR(lr.start_date) = ?';
      params.push(year);
    }
    if (status) {
      query += ' AND lr.status = ?';
      params.push(status);
    }
    if (employee_id) {
      query += ' AND lr.employee_id = ?';
      params.push(employee_id);
    }

    query += ' ORDER BY lr.start_date DESC';

    const [leaves] = await db.query(query, params);
    res.json(leaves);
  } catch (error) {
    console.error('Error fetching leave requests:', error);
    res.status(500).json({ error: 'Failed to fetch leave requests' });
  }
});

// Get leave statistics
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const { year } = req.query;
    
    const [stats] = await db.query(`
      SELECT 
        leave_type,
        COUNT(*) as count,
        SUM(total_days) as total_days
      FROM leave_requests
      WHERE YEAR(start_date) = ? AND status = 'approved'
      GROUP BY leave_type
    `, [year]);

    const [monthly] = await db.query(`
      SELECT 
        MONTH(start_date) as month,
        COUNT(*) as count,
        SUM(total_days) as total_days
      FROM leave_requests
      WHERE YEAR(start_date) = ? AND status = 'approved'
      GROUP BY MONTH(start_date)
      ORDER BY month
    `, [year]);

    res.json({ stats, monthly });
  } catch (error) {
    console.error('Error fetching leave stats:', error);
    res.status(500).json({ error: 'Failed to fetch leave statistics' });
  }
});

// Create new leave request (admin only)
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { 
      employee_id, leave_type, start_date, end_date, 
      total_days, replacement_employee_id, reason, status 
    } = req.body;

    const [result] = await db.query(
      `INSERT INTO leave_requests 
       (employee_id, leave_type, start_date, end_date, total_days, 
        replacement_employee_id, reason, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [employee_id, leave_type, start_date, end_date, total_days, 
       replacement_employee_id, reason, status || 'approved']
    );

    res.status(201).json({ 
      message: 'Leave request created successfully',
      leave_id: result.insertId 
    });
  } catch (error) {
    console.error('Error creating leave request:', error);
    res.status(500).json({ error: 'Failed to create leave request' });
  }
});

// Update leave request (admin only)
router.put('/:leaveId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { 
      employee_id, leave_type, start_date, end_date, 
      total_days, replacement_employee_id, reason, status 
    } = req.body;

    await db.query(
      `UPDATE leave_requests 
       SET employee_id = ?, leave_type = ?, start_date = ?, end_date = ?, 
           total_days = ?, replacement_employee_id = ?, reason = ?, status = ?
       WHERE leave_id = ?`,
      [employee_id, leave_type, start_date, end_date, total_days, 
       replacement_employee_id, reason, status, req.params.leaveId]
    );

    res.json({ message: 'Leave request updated successfully' });
  } catch (error) {
    console.error('Error updating leave request:', error);
    res.status(500).json({ error: 'Failed to update leave request' });
  }
});

// Delete leave request (admin only)
router.delete('/:leaveId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await db.query('DELETE FROM leave_requests WHERE leave_id = ?', [req.params.leaveId]);
    res.json({ message: 'Leave request deleted successfully' });
  } catch (error) {
    console.error('Error deleting leave request:', error);
    res.status(500).json({ error: 'Failed to delete leave request' });
  }
});

module.exports = router;

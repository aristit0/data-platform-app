const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// Get all certifications
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { planning_year, planning_quarter, status_final } = req.query;
    let query = 'SELECT * FROM certification_plan WHERE 1=1';
    const params = [];

    if (planning_year) {
      query += ' AND planning_year = ?';
      params.push(planning_year);
    }
    if (planning_quarter) {
      query += ' AND planning_quarter = ?';
      params.push(planning_quarter);
    }
    if (status_final) {
      query += ' AND status_final = ?';
      params.push(status_final);
    }

    query += ' ORDER BY planning_year DESC, planning_quarter DESC, name ASC';

    const [certifications] = await db.query(query, params);
    res.json(certifications);
  } catch (error) {
    console.error('Error fetching certifications:', error);
    res.status(500).json({ error: 'Failed to fetch certifications' });
  }
});

// Get certification statistics
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const { year } = req.query;
    
    const [stats] = await db.query(`
      SELECT 
        status_final,
        COUNT(*) as count,
        planning_quarter
      FROM certification_plan
      WHERE planning_year = ?
      GROUP BY status_final, planning_quarter
    `, [year]);

    // Get expiring certifications (assuming certifications expire after passing)
    const [expiring] = await db.query(`
      SELECT 
        plan_id,
        name,
        certification,
        result_1,
        result_2,
        result_3,
        schedule_1,
        schedule_2,
        schedule_3
      FROM certification_plan
      WHERE planning_year = ?
        AND (result_1 = 'PASS' OR result_2 = 'PASS' OR result_3 = 'PASS')
    `, [year]);

    res.json({ stats, expiring });
  } catch (error) {
    console.error('Error fetching certification stats:', error);
    res.status(500).json({ error: 'Failed to fetch certification statistics' });
  }
});

// Create new certification (admin only)
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { 
      planning_year, planning_quarter, name, certification, 
      schedule_1, result_1, schedule_2, result_2, schedule_3, result_3, status_final 
    } = req.body;

    // Convert empty strings to NULL for date fields
    const schedule1 = schedule_1 && schedule_1.trim() !== '' ? schedule_1 : null;
    const schedule2 = schedule_2 && schedule_2.trim() !== '' ? schedule_2 : null;
    const schedule3 = schedule_3 && schedule_3.trim() !== '' ? schedule_3 : null;

    const [result] = await db.query(
      `INSERT INTO certification_plan 
       (planning_year, planning_quarter, name, certification, schedule_1, result_1, 
        schedule_2, result_2, schedule_3, result_3, status_final) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [planning_year, planning_quarter, name, certification, 
       schedule1, result_1, schedule2, result_2, schedule3, result_3, status_final]
    );

    res.status(201).json({ 
      message: 'Certification plan created successfully',
      plan_id: result.insertId 
    });
  } catch (error) {
    console.error('Error creating certification:', error);
    res.status(500).json({ error: 'Failed to create certification plan' });
  }
});

// Update certification (admin only)
router.put('/:planId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { 
      planning_year, planning_quarter, name, certification, 
      schedule_1, result_1, schedule_2, result_2, schedule_3, result_3, status_final 
    } = req.body;

    // Convert empty strings to NULL for date fields
    const schedule1 = schedule_1 && schedule_1.trim() !== '' ? schedule_1 : null;
    const schedule2 = schedule_2 && schedule_2.trim() !== '' ? schedule_2 : null;
    const schedule3 = schedule_3 && schedule_3.trim() !== '' ? schedule_3 : null;

    await db.query(
      `UPDATE certification_plan 
       SET planning_year = ?, planning_quarter = ?, name = ?, certification = ?, 
           schedule_1 = ?, result_1 = ?, schedule_2 = ?, result_2 = ?, 
           schedule_3 = ?, result_3 = ?, status_final = ?
       WHERE plan_id = ?`,
      [planning_year, planning_quarter, name, certification, 
       schedule1, result_1, schedule2, result_2, schedule3, result_3, status_final,
       req.params.planId]
    );

    res.json({ message: 'Certification plan updated successfully' });
  } catch (error) {
    console.error('Error updating certification:', error);
    res.status(500).json({ error: 'Failed to update certification plan' });
  }
});

// Delete certification (admin only)
router.delete('/:planId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await db.query('DELETE FROM certification_plan WHERE plan_id = ?', [req.params.planId]);
    res.json({ message: 'Certification plan deleted successfully' });
  } catch (error) {
    console.error('Error deleting certification:', error);
    res.status(500).json({ error: 'Failed to delete certification plan' });
  }
});

module.exports = router;

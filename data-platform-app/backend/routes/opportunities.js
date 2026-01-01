const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// Get all opportunity projects
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { quarter, year, actual_status } = req.query;
    let query = 'SELECT * FROM oppty_project WHERE 1=1';
    const params = [];

    if (quarter) {
      query += ' AND quarter = ?';
      params.push(quarter);
    }
    if (year) {
      query += ' AND year = ?';
      params.push(year);
    }
    if (actual_status) {
      query += ' AND actual_status = ?';
      params.push(actual_status);
    }

    query += ' ORDER BY created_at DESC';

    const [opptyProjects] = await db.query(query, params);
    res.json(opptyProjects);
  } catch (error) {
    console.error('Error fetching opportunity projects:', error);
    res.status(500).json({ error: 'Failed to fetch opportunity projects' });
  }
});

// Get opportunity statistics
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const { year, quarter } = req.query;
    
    const [stats] = await db.query(`
      SELECT 
        actual_status,
        COUNT(*) as count
      FROM oppty_project
      WHERE year = ? ${quarter ? 'AND quarter = ?' : ''}
      GROUP BY actual_status
    `, quarter ? [year, quarter] : [year]);

    res.json(stats);
  } catch (error) {
    console.error('Error fetching oppty stats:', error);
    res.status(500).json({ error: 'Failed to fetch opportunity statistics' });
  }
});

// Create new opportunity (admin only)
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { type, client, project_name, progress, actual_status, quarter, year } = req.body;

    const [result] = await db.query(
      'INSERT INTO oppty_project (type, client, project_name, progress, actual_status, quarter, year) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [type, client, project_name, progress, actual_status, quarter, year]
    );

    res.status(201).json({ 
      message: 'Opportunity created successfully',
      oppty_id: result.insertId 
    });
  } catch (error) {
    console.error('Error creating opportunity:', error);
    res.status(500).json({ error: 'Failed to create opportunity' });
  }
});

// Update opportunity (admin only)
router.put('/:opptyId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { type, client, project_name, progress, actual_status, quarter, year } = req.body;

    await db.query(
      'UPDATE oppty_project SET type = ?, client = ?, project_name = ?, progress = ?, actual_status = ?, quarter = ?, year = ? WHERE oppty_id = ?',
      [type, client, project_name, progress, actual_status, quarter, year, req.params.opptyId]
    );

    res.json({ message: 'Opportunity updated successfully' });
  } catch (error) {
    console.error('Error updating opportunity:', error);
    res.status(500).json({ error: 'Failed to update opportunity' });
  }
});

// Delete opportunity (admin only)
router.delete('/:opptyId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await db.query('DELETE FROM oppty_project WHERE oppty_id = ?', [req.params.opptyId]);
    res.json({ message: 'Opportunity deleted successfully' });
  } catch (error) {
    console.error('Error deleting opportunity:', error);
    res.status(500).json({ error: 'Failed to delete opportunity' });
  }
});

module.exports = router;

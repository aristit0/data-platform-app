const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// Get all projects
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { quarter, year, type } = req.query;
    let query = 'SELECT * FROM project WHERE 1=1';
    const params = [];

    if (quarter) {
      query += ' AND quarter = ?';
      params.push(quarter);
    }
    if (year) {
      query += ' AND year = ?';
      params.push(year);
    }
    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }

    query += ' ORDER BY created_at DESC';

    const [projects] = await db.query(query, params);
    res.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Get project statistics
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const { year, quarter } = req.query;
    
    const [stats] = await db.query(`
      SELECT 
        type,
        status,
        COUNT(*) as count
      FROM project
      WHERE year = ? ${quarter ? 'AND quarter = ?' : ''}
      GROUP BY type, status
    `, quarter ? [year, quarter] : [year]);

    res.json(stats);
  } catch (error) {
    console.error('Error fetching project stats:', error);
    res.status(500).json({ error: 'Failed to fetch project statistics' });
  }
});

// Create new project (admin only)
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { type, client, project_name, duration, end_date, status, quarter, year } = req.body;

    const [result] = await db.query(
      'INSERT INTO project (type, client, project_name, duration, end_date, status, quarter, year) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [type, client, project_name, duration, end_date, status, quarter, year]
    );

    res.status(201).json({ 
      message: 'Project created successfully',
      project_id: result.insertId 
    });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// Update project (admin only)
router.put('/:projectId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { type, client, project_name, duration, end_date, status, quarter, year } = req.body;

    await db.query(
      'UPDATE project SET type = ?, client = ?, project_name = ?, duration = ?, end_date = ?, status = ?, quarter = ?, year = ? WHERE project_id = ?',
      [type, client, project_name, duration, end_date, status, quarter, year, req.params.projectId]
    );

    res.json({ message: 'Project updated successfully' });
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// Delete project (admin only)
router.delete('/:projectId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await db.query('DELETE FROM project WHERE project_id = ?', [req.params.projectId]);
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

module.exports = router;

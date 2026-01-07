const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// Get all projects with assignment count
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { quarter, year, type } = req.query;
    let query = `
      SELECT 
        p.*,
        COUNT(pa.assignment_id) as assignment_count
      FROM project p
      LEFT JOIN project_assignments pa ON p.project_id = pa.project_id
      WHERE 1=1
    `;
    const params = [];

    if (quarter) {
      query += ' AND p.quarter = ?';
      params.push(quarter);
    }
    if (year) {
      query += ' AND p.year = ?';
      params.push(year);
    }
    if (type) {
      query += ' AND p.type = ?';
      params.push(type);
    }

    query += ' GROUP BY p.project_id ORDER BY p.created_at DESC';

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
    const { project_name, type, client, year, quarter, status } = req.body;

    const [result] = await db.query(
      'INSERT INTO project (project_name, type, client, year, quarter, status) VALUES (?, ?, ?, ?, ?, ?)',
      [project_name, type, client, year, quarter, status]
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
    const { project_name, type, client, year, quarter, status } = req.body;

    await db.query(
      'UPDATE project SET project_name = ?, type = ?, client = ?, year = ?, quarter = ?, status = ? WHERE project_id = ?',
      [project_name, type, client, year, quarter, status, req.params.projectId]
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

// Get assignments for a project
router.get('/:projectId/assignments', authMiddleware, async (req, res) => {
  try {
    const [assignments] = await db.query(`
      SELECT 
        pa.*,
        e.full_name,
        e.position
      FROM project_assignments pa
      LEFT JOIN employees e ON pa.employee_id = e.employee_id
      WHERE pa.project_id = ?
      ORDER BY pa.created_at DESC
    `, [req.params.projectId]);
    
    res.json(assignments);
  } catch (error) {
    console.error('Error fetching project assignments:', error);
    res.status(500).json({ error: 'Failed to fetch project assignments' });
  }
});

// Add assignment to project (admin only)
router.post('/:projectId/assignments', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { employee_id, custom_name, role, allocation_percentage } = req.body;
    const { projectId } = req.params;

    // Validate: must have either employee_id or custom_name
    if (!employee_id && !custom_name) {
      return res.status(400).json({ error: 'Either employee_id or custom_name is required' });
    }

    // Check if assignment already exists (for employee_id only)
    if (employee_id) {
      const [existing] = await db.query(
        'SELECT * FROM project_assignments WHERE project_id = ? AND employee_id = ?',
        [projectId, employee_id]
      );

      if (existing.length > 0) {
        return res.status(400).json({ error: 'Employee already assigned to this project' });
      }
    }

    const [result] = await db.query(
      'INSERT INTO project_assignments (project_id, employee_id, custom_name, role, allocation_percentage) VALUES (?, ?, ?, ?, ?)',
      [projectId, employee_id || null, custom_name || null, role, allocation_percentage || 100]
    );

    res.status(201).json({ 
      message: 'Assignment created successfully',
      assignment_id: result.insertId 
    });
  } catch (error) {
    console.error('Error creating assignment:', error);
    res.status(500).json({ error: 'Failed to create assignment' });
  }
});

// Update assignment (admin only)
router.put('/assignments/:assignmentId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { role, allocation_percentage } = req.body;

    await db.query(
      'UPDATE project_assignments SET role = ?, allocation_percentage = ? WHERE assignment_id = ?',
      [role, allocation_percentage, req.params.assignmentId]
    );

    res.json({ message: 'Assignment updated successfully' });
  } catch (error) {
    console.error('Error updating assignment:', error);
    res.status(500).json({ error: 'Failed to update assignment' });
  }
});

// Remove assignment (admin only)
router.delete('/assignments/:assignmentId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await db.query('DELETE FROM project_assignments WHERE assignment_id = ?', [req.params.assignmentId]);
    res.json({ message: 'Assignment removed successfully' });
  } catch (error) {
    console.error('Error removing assignment:', error);
    res.status(500).json({ error: 'Failed to remove assignment' });
  }
});

module.exports = router;

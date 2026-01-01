const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// Get all mini POCs
router.get('/', authMiddleware, async (req, res) => {
  try {
    const [pocs] = await db.query(`
      SELECT * FROM mini_poc_master ORDER BY created_at DESC
    `);
    res.json(pocs);
  } catch (error) {
    console.error('Error fetching mini POCs:', error);
    res.status(500).json({ error: 'Failed to fetch mini POCs' });
  }
});

// Get mini POC with teams
router.get('/:pocCode', authMiddleware, async (req, res) => {
  try {
    const [poc] = await db.query(
      'SELECT * FROM mini_poc_master WHERE poc_code = ?',
      [req.params.pocCode]
    );

    if (poc.length === 0) {
      return res.status(404).json({ error: 'Mini POC not found' });
    }

    const [teams] = await db.query(`
      SELECT 
        mpt.*,
        e.full_name,
        e.position
      FROM mini_poc_team mpt
      LEFT JOIN employees e ON mpt.employee_id = e.employee_id
      WHERE mpt.poc_code = ?
      ORDER BY mpt.team_name, mpt.role_name
    `, [req.params.pocCode]);

    res.json({ poc: poc[0], teams });
  } catch (error) {
    console.error('Error fetching mini POC details:', error);
    res.status(500).json({ error: 'Failed to fetch mini POC details' });
  }
});

// Create new mini POC (admin only)
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { 
      poc_code, use_case, start_date, end_date, status,
      winner_team, second_team, third_team 
    } = req.body;

    const [result] = await db.query(
      `INSERT INTO mini_poc_master 
       (poc_code, use_case, start_date, end_date, status, winner_team, second_team, third_team) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [poc_code, use_case, start_date, end_date, status, winner_team, second_team, third_team]
    );

    res.status(201).json({ 
      message: 'Mini POC created successfully',
      poc_id: result.insertId 
    });
  } catch (error) {
    console.error('Error creating mini POC:', error);
    res.status(500).json({ error: 'Failed to create mini POC' });
  }
});

// Update mini POC (admin only)
router.put('/:pocCode', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { 
      use_case, start_date, end_date, status,
      winner_team, second_team, third_team 
    } = req.body;

    await db.query(
      `UPDATE mini_poc_master 
       SET use_case = ?, start_date = ?, end_date = ?, status = ?, 
           winner_team = ?, second_team = ?, third_team = ?
       WHERE poc_code = ?`,
      [use_case, start_date, end_date, status, winner_team, second_team, third_team, req.params.pocCode]
    );

    res.json({ message: 'Mini POC updated successfully' });
  } catch (error) {
    console.error('Error updating mini POC:', error);
    res.status(500).json({ error: 'Failed to update mini POC' });
  }
});

// Delete mini POC (admin only)
router.delete('/:pocCode', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    // Delete teams first
    await db.query('DELETE FROM mini_poc_team WHERE poc_code = ?', [req.params.pocCode]);
    // Delete POC
    await db.query('DELETE FROM mini_poc_master WHERE poc_code = ?', [req.params.pocCode]);
    res.json({ message: 'Mini POC deleted successfully' });
  } catch (error) {
    console.error('Error deleting mini POC:', error);
    res.status(500).json({ error: 'Failed to delete mini POC' });
  }
});

// Add team member to mini POC (admin only)
router.post('/:pocCode/teams', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { employee_id, name, team_name, role_name } = req.body;

    const [result] = await db.query(
      'INSERT INTO mini_poc_team (poc_code, employee_id, name, team_name, role_name) VALUES (?, ?, ?, ?, ?)',
      [req.params.pocCode, employee_id, name, team_name, role_name]
    );

    res.status(201).json({ 
      message: 'Team member added successfully',
      id: result.insertId 
    });
  } catch (error) {
    console.error('Error adding team member:', error);
    res.status(500).json({ error: 'Failed to add team member' });
  }
});

// Update team member (admin only)
router.put('/teams/:teamId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { employee_id, name, team_name, role_name } = req.body;

    await db.query(
      'UPDATE mini_poc_team SET employee_id = ?, name = ?, team_name = ?, role_name = ? WHERE id = ?',
      [employee_id, name, team_name, role_name, req.params.teamId]
    );

    res.json({ message: 'Team member updated successfully' });
  } catch (error) {
    console.error('Error updating team member:', error);
    res.status(500).json({ error: 'Failed to update team member' });
  }
});

// Delete team member (admin only)
router.delete('/teams/:teamId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await db.query('DELETE FROM mini_poc_team WHERE id = ?', [req.params.teamId]);
    res.json({ message: 'Team member deleted successfully' });
  } catch (error) {
    console.error('Error deleting team member:', error);
    res.status(500).json({ error: 'Failed to delete team member' });
  }
});

module.exports = router;

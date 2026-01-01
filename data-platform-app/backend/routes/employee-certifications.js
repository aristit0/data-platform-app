const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// Get all employee certifications
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { employee_id, year } = req.query;
    let query = `
      SELECT 
        ec.*,
        e.full_name as employee_name
      FROM employee_certification ec
      LEFT JOIN employees e ON ec.employee_id = e.employee_id
      WHERE 1=1
    `;
    const params = [];

    if (employee_id) {
      query += ' AND ec.employee_id = ?';
      params.push(employee_id);
    }

    if (year) {
      query += ' AND YEAR(ec.end_date) = ?';
      params.push(year);
    }

    query += ' ORDER BY ec.end_date DESC';

    const [certifications] = await db.query(query, params);
    res.json(certifications);
  } catch (error) {
    console.error('Error fetching employee certifications:', error);
    res.status(500).json({ error: 'Failed to fetch employee certifications' });
  }
});

// Get expiring certifications for current year
router.get('/expiring', authMiddleware, async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    
    const [expiring] = await db.query(`
      SELECT 
        ec.*,
        e.full_name as employee_name
      FROM employee_certification ec
      LEFT JOIN employees e ON ec.employee_id = e.employee_id
      WHERE YEAR(ec.end_date) = ?
      ORDER BY ec.end_date ASC
    `, [currentYear]);

    res.json(expiring);
  } catch (error) {
    console.error('Error fetching expiring certifications:', error);
    res.status(500).json({ error: 'Failed to fetch expiring certifications' });
  }
});

// Create employee certification (triggered when result = Pass)
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { 
      employee_id,
      name,
      product,
      certification, 
      start_date, 
      end_date,
      status
    } = req.body;

    const [result] = await db.query(
      `INSERT INTO employee_certification 
       (employee_id, name, product, certification, start_date, end_date, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [employee_id, name, product, certification, start_date, end_date, status || 'Active']
    );

    res.status(201).json({ 
      message: 'Employee certification created successfully',
      cert_id: result.insertId 
    });
  } catch (error) {
    console.error('Error creating employee certification:', error);
    res.status(500).json({ error: 'Failed to create employee certification' });
  }
});

// Update employee certification
router.put('/:certId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { 
      name,
      product,
      certification,
      start_date, 
      end_date,
      status 
    } = req.body;

    await db.query(
      `UPDATE employee_certification 
       SET name = ?, product = ?, certification = ?, start_date = ?, end_date = ?, status = ?
       WHERE cert_id = ?`,
      [name, product, certification, start_date, end_date, status, req.params.certId]
    );

    res.json({ message: 'Employee certification updated successfully' });
  } catch (error) {
    console.error('Error updating employee certification:', error);
    res.status(500).json({ error: 'Failed to update employee certification' });
  }
});

// Delete employee certification
router.delete('/:certId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await db.query('DELETE FROM employee_certification WHERE cert_id = ?', [req.params.certId]);
    res.json({ message: 'Employee certification deleted successfully' });
  } catch (error) {
    console.error('Error deleting employee certification:', error);
    res.status(500).json({ error: 'Failed to delete employee certification' });
  }
});

module.exports = router;
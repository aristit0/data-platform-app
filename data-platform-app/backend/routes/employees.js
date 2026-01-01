const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// Get all employees
router.get('/', authMiddleware, async (req, res) => {
  try {
    const [employees] = await db.query(
      'SELECT * FROM employees ORDER BY full_name ASC'
    );
    res.json(employees);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

// Get employee by ID
router.get('/:employeeId', authMiddleware, async (req, res) => {
  try {
    const [employee] = await db.query(
      'SELECT * FROM employees WHERE employee_id = ?',
      [req.params.employeeId]
    );
    
    if (employee.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    res.json(employee[0]);
  } catch (error) {
    console.error('Error fetching employee:', error);
    res.status(500).json({ error: 'Failed to fetch employee' });
  }
});

// Create new employee (admin only)
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { employee_id, full_name, email, position, department, join_date, status } = req.body;

    const [result] = await db.query(
      'INSERT INTO employees (employee_id, full_name, email, position, department, join_date, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [employee_id, full_name, email, position, department, join_date, status || 'active']
    );

    res.status(201).json({ 
      message: 'Employee created successfully',
      employee_id 
    });
  } catch (error) {
    console.error('Error creating employee:', error);
    res.status(500).json({ error: 'Failed to create employee' });
  }
});

// Update employee (admin only)
router.put('/:employeeId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { full_name, email, position, department, join_date, status } = req.body;

    await db.query(
      'UPDATE employees SET full_name = ?, email = ?, position = ?, department = ?, join_date = ?, status = ? WHERE employee_id = ?',
      [full_name, email, position, department, join_date, status, req.params.employeeId]
    );

    res.json({ message: 'Employee updated successfully' });
  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(500).json({ error: 'Failed to update employee' });
  }
});

// Delete employee (admin only)
router.delete('/:employeeId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await db.query('DELETE FROM employees WHERE employee_id = ?', [req.params.employeeId]);
    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({ error: 'Failed to delete employee' });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// Get all product assignments
router.get('/', authMiddleware, async (req, res) => {
  try {
    const [assignments] = await db.query(`
      SELECT 
        epa.*,
        e.full_name,
        p.product_name
      FROM employee_product_assignment epa
      LEFT JOIN employees e ON epa.employee_id = e.employee_id
      LEFT JOIN product_master p ON epa.product_id = p.product_id
      ORDER BY e.full_name, p.product_name
    `);
    res.json(assignments);
  } catch (error) {
    console.error('Error fetching product assignments:', error);
    res.status(500).json({ error: 'Failed to fetch product assignments' });
  }
});

// Get products by employee
router.get('/employee/:employeeId', authMiddleware, async (req, res) => {
  try {
    const [products] = await db.query(`
      SELECT 
        p.product_id,
        p.product_name,
        epa.assignment_type,
        epa.level
      FROM employee_product_assignment epa
      JOIN product_master p ON epa.product_id = p.product_id
      WHERE epa.employee_id = ?
    `, [req.params.employeeId]);
    res.json(products);
  } catch (error) {
    console.error('Error fetching employee products:', error);
    res.status(500).json({ error: 'Failed to fetch employee products' });
  }
});

// Create product assignment (admin only)
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { employee_id, product_id, assignment_type, level } = req.body;

    const [result] = await db.query(
      'INSERT INTO employee_product_assignment (employee_id, product_id, assignment_type, level) VALUES (?, ?, ?, ?)',
      [employee_id, product_id, assignment_type, level]
    );

    res.status(201).json({ 
      message: 'Product assignment created successfully',
      id: result.insertId 
    });
  } catch (error) {
    console.error('Error creating product assignment:', error);
    res.status(500).json({ error: 'Failed to create product assignment' });
  }
});

// Update product assignment (admin only)
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { assignment_type, level } = req.body;

    await db.query(
      'UPDATE employee_product_assignment SET assignment_type = ?, level = ? WHERE id = ?',
      [assignment_type, level, req.params.id]
    );

    res.json({ message: 'Product assignment updated successfully' });
  } catch (error) {
    console.error('Error updating product assignment:', error);
    res.status(500).json({ error: 'Failed to update product assignment' });
  }
});

// Delete product assignment (admin only)
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await db.query('DELETE FROM employee_product_assignment WHERE id = ?', [req.params.id]);
    res.json({ message: 'Product assignment deleted successfully' });
  } catch (error) {
    console.error('Error deleting product assignment:', error);
    res.status(500).json({ error: 'Failed to delete product assignment' });
  }
});

// Get all products
router.get('/products', authMiddleware, async (req, res) => {
  try {
    const [products] = await db.query('SELECT * FROM product_master ORDER BY product_name');
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

module.exports = router;

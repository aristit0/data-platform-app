const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// Get all product specialists
router.get('/', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT * FROM product_specialists 
      ORDER BY company, product, pic
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching product specialists:', error);
    res.status(500).json({ message: 'Error fetching product specialists' });
  }
});

// Get dashboard statistics
router.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    // Count by PIC
    const [picStats] = await db.query(`
      SELECT 
        pic,
        COUNT(*) as total_assignments,
        COUNT(DISTINCT product) as unique_products,
        COUNT(DISTINCT company) as unique_companies
      FROM product_specialists
      GROUP BY pic
      ORDER BY total_assignments DESC
    `);

    // Count by Product
    const [productStats] = await db.query(`
      SELECT 
        product,
        company,
        COUNT(*) as pic_count
      FROM product_specialists
      GROUP BY product, company
      ORDER BY company, product
    `);

    // Count by Company
    const [companyStats] = await db.query(`
      SELECT 
        company,
        COUNT(DISTINCT product) as product_count,
        COUNT(*) as total_assignments
      FROM product_specialists
      GROUP BY company
      ORDER BY company
    `);

    res.json({
      picStats,
      productStats,
      companyStats
    });
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    res.status(500).json({ message: 'Error fetching dashboard statistics' });
  }
});

// Get unique companies
router.get('/companies', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT DISTINCT company FROM product_specialists ORDER BY company
    `);
    res.json(rows.map(r => r.company));
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({ message: 'Error fetching companies' });
  }
});

// Get unique products
router.get('/products', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT DISTINCT product FROM product_specialists ORDER BY product
    `);
    res.json(rows.map(r => r.product));
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Error fetching products' });
  }
});

// Get unique PICs
router.get('/pics', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT DISTINCT pic FROM product_specialists ORDER BY pic
    `);
    res.json(rows.map(r => r.pic));
  } catch (error) {
    console.error('Error fetching PICs:', error);
    res.status(500).json({ message: 'Error fetching PICs' });
  }
});

// Create new product specialist assignment (admin only)
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { company, product, pic } = req.body;

    if (!company || !product || !pic) {
      return res.status(400).json({ message: 'Company, product, and PIC are required' });
    }

    // Check for duplicate
    const [existing] = await db.query(
      'SELECT id FROM product_specialists WHERE company = ? AND product = ? AND pic = ?',
      [company, product, pic]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: 'This assignment already exists' });
    }

    const [result] = await db.query(
      'INSERT INTO product_specialists (company, product, pic) VALUES (?, ?, ?)',
      [company, product, pic]
    );

    const [newRecord] = await db.query(
      'SELECT * FROM product_specialists WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json(newRecord[0]);
  } catch (error) {
    console.error('Error creating product specialist:', error);
    res.status(500).json({ message: 'Error creating product specialist' });
  }
});

// Update product specialist (admin only)
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { company, product, pic } = req.body;

    if (!company || !product || !pic) {
      return res.status(400).json({ message: 'Company, product, and PIC are required' });
    }

    // Check for duplicate (excluding current record)
    const [existing] = await db.query(
      'SELECT id FROM product_specialists WHERE company = ? AND product = ? AND pic = ? AND id != ?',
      [company, product, pic, id]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: 'This assignment already exists' });
    }

    await db.query(
      'UPDATE product_specialists SET company = ?, product = ?, pic = ? WHERE id = ?',
      [company, product, pic, id]
    );

    const [updated] = await db.query(
      'SELECT * FROM product_specialists WHERE id = ?',
      [id]
    );

    res.json(updated[0]);
  } catch (error) {
    console.error('Error updating product specialist:', error);
    res.status(500).json({ message: 'Error updating product specialist' });
  }
});

// Delete product specialist (admin only)
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    await db.query('DELETE FROM product_specialists WHERE id = ?', [id]);

    res.json({ message: 'Product specialist deleted successfully' });
  } catch (error) {
    console.error('Error deleting product specialist:', error);
    res.status(500).json({ message: 'Error deleting product specialist' });
  }
});

module.exports = router;

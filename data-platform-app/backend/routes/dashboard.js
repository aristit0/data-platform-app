const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

// Get dashboard summary
router.get('/summary', authMiddleware, async (req, res) => {
  try {
    const { year, quarter } = req.query;
    const currentYear = year || new Date().getFullYear();

    // Employee count
    const [employeeCount] = await db.query(
      "SELECT COUNT(*) as count FROM employees WHERE status = 'active'"
    );

    // Project statistics
    const [projectStats] = await db.query(`
      SELECT 
        type,
        status,
        COUNT(*) as count
      FROM project
      WHERE year = ? ${quarter ? 'AND quarter = ?' : ''}
      GROUP BY type, status
    `, quarter ? [currentYear, quarter] : [currentYear]);

    // Opportunity statistics
    const [opptyStats] = await db.query(`
      SELECT 
        actual_status,
        COUNT(*) as count
      FROM oppty_project
      WHERE year = ? ${quarter ? 'AND quarter = ?' : ''}
      GROUP BY actual_status
    `, quarter ? [currentYear, quarter] : [currentYear]);

    // Certification statistics
    const [certStats] = await db.query(`
      SELECT 
        status_final,
        COUNT(*) as count
      FROM certification_plan
      WHERE planning_year = ?
      GROUP BY status_final
    `, [currentYear]);

    // Mini POC statistics
    const [pocStats] = await db.query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM mini_poc_master
      GROUP BY status
    `);

    // Leave statistics
    const [leaveStats] = await db.query(`
      SELECT 
        leave_type,
        COUNT(*) as count,
        SUM(total_days) as total_days
      FROM leave_requests
      WHERE YEAR(start_date) = ? AND status = 'approved'
      GROUP BY leave_type
    `, [currentYear]);

    // Customer project count
    const [customerProjects] = await db.query(`
      SELECT 
        customer,
        SUM(number_of_project) as total_projects
      FROM customer_project_count
      WHERE year = ? ${quarter ? 'AND quarter = ?' : ''}
      GROUP BY customer
    `, quarter ? [currentYear, quarter] : [currentYear]);

    res.json({
      employees: employeeCount[0].count,
      projects: projectStats,
      opportunities: opptyStats,
      certifications: certStats,
      miniPocs: pocStats,
      leaves: leaveStats,
      customerProjects
    });
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard summary' });
  }
});

// Get quarterly comparison
router.get('/quarterly-trends', authMiddleware, async (req, res) => {
  try {
    const { year } = req.query;
    const currentYear = year || new Date().getFullYear();

    const [trends] = await db.query(`
      SELECT 
        quarter,
        type,
        COUNT(*) as count
      FROM project
      WHERE year = ?
      GROUP BY quarter, type
      ORDER BY quarter
    `, [currentYear]);

    res.json(trends);
  } catch (error) {
    console.error('Error fetching quarterly trends:', error);
    res.status(500).json({ error: 'Failed to fetch quarterly trends' });
  }
});

// Get product expertise distribution
router.get('/product-expertise', authMiddleware, async (req, res) => {
  try {
    const [expertise] = await db.query(`
      SELECT 
        p.product_name,
        COUNT(DISTINCT epa.employee_id) as employee_count
      FROM product_master p
      LEFT JOIN employee_product_assignment epa ON p.product_id = epa.product_id
      GROUP BY p.product_id, p.product_name
      ORDER BY employee_count DESC
    `);

    res.json(expertise);
  } catch (error) {
    console.error('Error fetching product expertise:', error);
    res.status(500).json({ error: 'Failed to fetch product expertise' });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

// ============================================================================
// ENHANCED DASHBOARD WITH 4 NEW CHART ENDPOINTS (FIXED VERSION)
// ============================================================================

// Get dashboard summary (original)
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

    // Leave statistics (with safe check if table exists)
    let leaveStats = [];
    try {
      const [leaves] = await db.query(`
        SELECT 
          leave_type,
          COUNT(*) as count,
          SUM(total_days) as total_days
        FROM leave_requests
        WHERE YEAR(start_date) = ? AND status = 'approved'
        GROUP BY leave_type
      `, [currentYear]);
      leaveStats = leaves;
    } catch (err) {
      console.log('Leave table not available, skipping...');
      leaveStats = [];
    }

    res.json({
      employees: employeeCount[0].count,
      projects: projectStats,
      opportunities: opptyStats,
      certifications: certStats,
      miniPocs: pocStats,
      leaves: leaveStats
    });
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard summary' });
  }
});

// ============================================================================
// NEW CHART 1: Opportunities by Status (Open/Lose/Drop/Win)
// ============================================================================
router.get('/opportunities-chart', authMiddleware, async (req, res) => {
  try {
    const { year, quarter } = req.query;
    const currentYear = year || new Date().getFullYear();

    let query = `
      SELECT 
        actual_status,
        COUNT(*) as count
      FROM oppty_project
      WHERE year = ?
    `;
    const params = [currentYear];

    if (quarter) {
      query += ' AND quarter = ?';
      params.push(quarter);
    }

    query += ' GROUP BY actual_status ORDER BY actual_status';

    const [data] = await db.query(query, params);

    // Format for chart
    const chartData = {
      labels: data.map(d => d.actual_status),
      datasets: [{
        label: 'Opportunities',
        data: data.map(d => d.count),
        backgroundColor: [
          '#10b981', // Open - green
          '#ef4444', // Lose - red
          '#f59e0b', // Drop - orange
          '#3b82f6'  // Win - blue
        ]
      }]
    };

    res.json(chartData);
  } catch (error) {
    console.error('Error fetching opportunities chart:', error);
    res.status(500).json({ error: 'Failed to fetch opportunities chart' });
  }
});

// ============================================================================
// NEW CHART 2: Employees by Position
// ============================================================================
router.get('/employees-by-position', authMiddleware, async (req, res) => {
  try {
    const [data] = await db.query(`
      SELECT 
        position,
        COUNT(*) as count
      FROM employees
      WHERE status = 'active'
      GROUP BY position
      ORDER BY count DESC
    `);

    // Format for chart
    const chartData = {
      labels: data.map(d => d.position),
      datasets: [{
        label: 'Employees',
        data: data.map(d => d.count),
        backgroundColor: [
          '#8b5cf6', // Senior - purple
          '#3b82f6', // Middle - blue
          '#10b981', // Assistant - green
          '#f59e0b'  // Junior - orange
        ]
      }]
    };

    res.json(chartData);
  } catch (error) {
    console.error('Error fetching employees by position chart:', error);
    res.status(500).json({ error: 'Failed to fetch employees chart' });
  }
});

// ============================================================================
// NEW CHART 3: Product Assignment per Product (FIXED)
// ============================================================================
router.get('/product-assignments-chart', authMiddleware, async (req, res) => {
  try {
    const [data] = await db.query(`
      SELECT 
        p.product_name,
        COUNT(DISTINCT epa.employee_id) as employee_count
      FROM product_master p
      LEFT JOIN employee_product_assignment epa ON p.product_id = epa.product_id
      GROUP BY p.product_id, p.product_name
      ORDER BY employee_count DESC
    `);

    // Format for chart
    const chartData = {
      labels: data.map(d => d.product_name),
      datasets: [{
        label: 'Assigned Employees',
        data: data.map(d => d.employee_count),
        backgroundColor: '#3b82f6',
        borderColor: '#1e40af',
        borderWidth: 1
      }]
    };

    res.json(chartData);
  } catch (error) {
    console.error('Error fetching product assignments chart:', error);
    res.status(500).json({ error: 'Failed to fetch product assignments chart' });
  }
});

// ============================================================================
// NEW CHART 4: Mini POC Winners Summary (FIXED)
// ============================================================================
router.get('/mini-poc-winners', authMiddleware, async (req, res) => {
  try {
    const [data] = await db.query(`
      SELECT 
        poc_code,
        use_case,
        winner_team,
        second_team,
        third_team,
        start_date,
        end_date,
        status
      FROM mini_poc_master
      WHERE status = 'Done' AND winner_team IS NOT NULL
      ORDER BY end_date DESC
      LIMIT 10
    `);

    // Format as cards/list data
    const winners = data.map(poc => ({
      pocCode: poc.poc_code,
      useCase: poc.use_case,
      winner: poc.winner_team,
      secondPlace: poc.second_team,
      thirdPlace: poc.third_team,
      date: poc.end_date,
      status: poc.status
    }));

    res.json(winners);
  } catch (error) {
    console.error('Error fetching mini POC winners:', error);
    res.status(500).json({ error: 'Failed to fetch mini POC winners' });
  }
});

// ============================================================================
// ORIGINAL: Get quarterly comparison (kept for compatibility)
// ============================================================================
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

// ============================================================================
// ORIGINAL: Get product expertise distribution (kept for compatibility)
// ============================================================================
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
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, full_name } = req.body;

    // Check if user already exists
    const [existing] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Insert new user (pending approval)
    const [result] = await db.query(
      'INSERT INTO users (email, password_hash, full_name, role, status) VALUES (?, ?, ?, ?, ?)',
      [email, password_hash, full_name, 'user', 'pending']
    );

    res.status(201).json({ 
      message: 'Registration successful. Waiting for admin approval.',
      user_id: result.insertId 
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Special case for default admin
    if (email === 'admin' && password === 'T1ku$H1t4m') {
      const token = jwt.sign(
        { user_id: 1, email: 'admin@dataplatform.com', role: 'admin' },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      return res.json({
        token,
        user: {
          user_id: 1,
          email: 'admin@dataplatform.com',
          full_name: 'System Administrator',
          role: 'admin'
        }
      });
    }

    // Regular user login
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    
    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];

    if (user.status !== 'approved') {
      return res.status(403).json({ error: 'Account pending approval' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { user_id: user.user_id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      token,
      user: {
        user_id: user.user_id,
        email: user.email,
        full_name: user.full_name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get pending users (admin only)
router.get('/pending-users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const [users] = await db.query(
      'SELECT user_id, email, full_name, created_at FROM users WHERE status = "pending" ORDER BY created_at DESC'
    );
    res.json(users);
  } catch (error) {
    console.error('Error fetching pending users:', error);
    res.status(500).json({ error: 'Failed to fetch pending users' });
  }
});

// Approve/reject user (admin only)
router.put('/users/:userId/approve', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body; // 'approved' or 'rejected'

    await db.query(
      'UPDATE users SET status = ?, approved_by = ?, approved_at = NOW() WHERE user_id = ?',
      [status, req.user.user_id, userId]
    );

    res.json({ message: `User ${status} successfully` });
  } catch (error) {
    console.error('Error approving user:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

// Get all users (admin only)
router.get('/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const [users] = await db.query(
      'SELECT user_id, email, full_name, role, status, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Update user role (admin only)
router.put('/users/:userId/role', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    await db.query('UPDATE users SET role = ? WHERE user_id = ?', [role, userId]);
    res.json({ message: 'User role updated successfully' });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

module.exports = router;
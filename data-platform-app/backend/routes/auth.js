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

    // Validation
    if (!email || !password || !full_name) {
      return res.status(400).json({ 
        error: 'Data tidak lengkap',
        message: 'Email, password, dan nama lengkap harus diisi' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: 'Format email salah',
        message: 'Silakan masukkan alamat email yang valid' 
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ 
        error: 'Password terlalu pendek',
        message: 'Password harus minimal 6 karakter' 
      });
    }

    // Check if user already exists
    const [existing] = await db.query(
      'SELECT email FROM users WHERE email = ?', 
      [email.toLowerCase()]
    );
    
    if (existing.length > 0) {
      return res.status(400).json({ 
        error: 'Email sudah terdaftar',
        message: 'Email ini sudah digunakan. Silakan gunakan email lain atau login.' 
      });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Insert new user (pending approval)
    const [result] = await db.query(
      'INSERT INTO users (email, password_hash, full_name, role, status) VALUES (?, ?, ?, ?, ?)',
      [email.toLowerCase(), password_hash, full_name, 'user', 'pending']
    );

    res.status(201).json({ 
      success: true,
      message: 'Registrasi berhasil! Silakan tunggu persetujuan admin sebelum login.',
      user_id: result.insertId 
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle duplicate entry error (jika ada unique constraint)
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ 
        error: 'Email sudah terdaftar',
        message: 'Email ini sudah digunakan. Silakan gunakan email lain.' 
      });
    }
    
    res.status(500).json({ 
      error: 'Registrasi gagal',
      message: 'Terjadi kesalahan saat registrasi. Silakan coba lagi.' 
    });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Data tidak lengkap',
        message: 'Email dan password harus diisi' 
      });
    }

    // Special case for default admin
    if (email === 'admin' && password === 'T1ku$H1t4m') {
      const token = jwt.sign(
        { user_id: 1, email: 'admin@dataplatform.com', role: 'admin' },
        process.env.JWT_SECRET || 'default-secret-key-change-in-production',
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
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
    const [users] = await db.query(
      'SELECT user_id, email, password_hash, full_name, role, status FROM users WHERE email = ?', 
      [email.toLowerCase()]
    );
    
    if (users.length === 0) {
      return res.status(401).json({ 
        error: 'Login gagal',
        message: 'Email atau password salah' 
      });
    }

    const user = users[0];

    // Check account status
    if (user.status === 'pending') {
      return res.status(403).json({ 
        error: 'Akun menunggu persetujuan',
        message: 'Akun Anda sedang menunggu persetujuan administrator' 
      });
    }

    if (user.status === 'rejected') {
      return res.status(403).json({ 
        error: 'Akun ditolak',
        message: 'Registrasi Anda ditolak. Silakan hubungi administrator' 
      });
    }

    if (user.status !== 'approved') {
      return res.status(403).json({ 
        error: 'Akun tidak aktif',
        message: 'Akun Anda tidak aktif. Silakan hubungi administrator' 
      });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ 
        error: 'Login gagal',
        message: 'Email atau password salah' 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { user_id: user.user_id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'default-secret-key-change-in-production',
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
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
    res.status(500).json({ 
      error: 'Login gagal',
      message: 'Terjadi kesalahan saat login. Silakan coba lagi.' 
    });
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

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ 
        error: 'Status tidak valid',
        message: 'Status harus "approved" atau "rejected"' 
      });
    }

    const [result] = await db.query(
      'UPDATE users SET status = ?, approved_by = ?, approved_at = NOW() WHERE user_id = ?',
      [status, req.user.user_id, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        error: 'User tidak ditemukan',
        message: 'User yang dimaksud tidak ada' 
      });
    }

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

    if (!['admin', 'user'].includes(role)) {
      return res.status(400).json({ 
        error: 'Role tidak valid',
        message: 'Role harus "admin" atau "user"' 
      });
    }

    const [result] = await db.query(
      'UPDATE users SET role = ? WHERE user_id = ?', 
      [role, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        error: 'User tidak ditemukan',
        message: 'User yang dimaksud tidak ada' 
      });
    }

    res.json({ message: 'User role updated successfully' });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../config/database');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { 
  sendVerificationEmail, 
  sendPasswordResetEmail, 
  sendWelcomeEmail 
} = require('../config/emailConfig');

// Helper function to generate token
const generateToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Helper function to calculate expiry time
const getExpiryTime = (hours) => {
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + hours);
  return expiry;
};

// Helper function to log email
const logEmail = async (userId, emailType, recipientEmail, status, errorMessage = null) => {
  try {
    await db.query(
      'INSERT INTO email_logs (user_id, email_type, recipient_email, status, error_message) VALUES (?, ?, ?, ?, ?)',
      [userId, emailType, recipientEmail, status, errorMessage]
    );
  } catch (error) {
    console.error('Error logging email:', error);
  }
};

// Register new user with email verification
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

    // Generate verification token
    const verificationToken = generateToken();
    const verificationExpiry = getExpiryTime(24); // 24 hours

    // Insert new user (pending approval + email verification)
    const [result] = await db.query(
      `INSERT INTO users 
       (email, password_hash, full_name, role, status, email_verified, verification_token, verification_token_expires) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        email.toLowerCase(), 
        password_hash, 
        full_name, 
        'user', 
        'pending', 
        false, 
        verificationToken, 
        verificationExpiry
      ]
    );

    const userId = result.insertId;

    // Send verification email
    try {
      await sendVerificationEmail(email, verificationToken, full_name);
      await logEmail(userId, 'verification', email, 'sent');
      
      res.status(201).json({ 
        success: true,
        message: 'Registrasi berhasil! Silakan cek email Anda untuk verifikasi akun.',
        user_id: userId,
        requiresVerification: true
      });
    } catch (emailError) {
      console.error('Error sending verification email:', emailError);
      await logEmail(userId, 'verification', email, 'failed', emailError.message);
      
      // Still return success but notify about email issue
      res.status(201).json({ 
        success: true,
        message: 'Registrasi berhasil! Namun gagal mengirim email verifikasi. Silakan hubungi administrator.',
        user_id: userId,
        requiresVerification: true,
        emailError: true
      });
    }
  } catch (error) {
    console.error('Registration error:', error);
    
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

// Verify email
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ 
        error: 'Token tidak valid',
        message: 'Token verifikasi tidak ditemukan' 
      });
    }

    // Find user with this token
    const [users] = await db.query(
      `SELECT user_id, email, full_name, verification_token_expires 
       FROM users 
       WHERE verification_token = ? AND email_verified = FALSE`,
      [token]
    );

    if (users.length === 0) {
      return res.status(400).json({ 
        error: 'Token tidak valid',
        message: 'Token verifikasi tidak valid atau email sudah diverifikasi' 
      });
    }

    const user = users[0];

    // Check if token expired
    if (new Date() > new Date(user.verification_token_expires)) {
      return res.status(400).json({ 
        error: 'Token kedaluwarsa',
        message: 'Token verifikasi sudah kedaluwarsa. Silakan minta token baru.' 
      });
    }

    // Update user as verified
    await db.query(
      `UPDATE users 
       SET email_verified = TRUE, 
           verification_token = NULL, 
           verification_token_expires = NULL 
       WHERE user_id = ?`,
      [user.user_id]
    );

    res.json({ 
      success: true,
      message: 'Email berhasil diverifikasi! Silakan tunggu persetujuan administrator untuk dapat login.' 
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ 
      error: 'Verifikasi gagal',
      message: 'Terjadi kesalahan saat verifikasi email' 
    });
  }
});

// Resend verification email
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        error: 'Email tidak valid',
        message: 'Email harus diisi' 
      });
    }

    // Find user
    const [users] = await db.query(
      'SELECT user_id, email, full_name, email_verified FROM users WHERE email = ?',
      [email.toLowerCase()]
    );

    if (users.length === 0) {
      return res.status(404).json({ 
        error: 'User tidak ditemukan',
        message: 'Email tidak terdaftar' 
      });
    }

    const user = users[0];

    if (user.email_verified) {
      return res.status(400).json({ 
        error: 'Email sudah diverifikasi',
        message: 'Email Anda sudah diverifikasi' 
      });
    }

    // Generate new verification token
    const verificationToken = generateToken();
    const verificationExpiry = getExpiryTime(24);

    await db.query(
      'UPDATE users SET verification_token = ?, verification_token_expires = ? WHERE user_id = ?',
      [verificationToken, verificationExpiry, user.user_id]
    );

    // Send new verification email
    try {
      await sendVerificationEmail(user.email, verificationToken, user.full_name);
      await logEmail(user.user_id, 'verification', user.email, 'sent');
      
      res.json({ 
        success: true,
        message: 'Email verifikasi berhasil dikirim ulang. Silakan cek inbox Anda.' 
      });
    } catch (emailError) {
      console.error('Error sending verification email:', emailError);
      await logEmail(user.user_id, 'verification', user.email, 'failed', emailError.message);
      
      res.status(500).json({ 
        error: 'Gagal mengirim email',
        message: 'Gagal mengirim email verifikasi. Silakan coba lagi nanti.' 
      });
    }
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ 
      error: 'Gagal mengirim ulang',
      message: 'Terjadi kesalahan saat mengirim ulang email verifikasi' 
    });
  }
});

// Forgot password - request reset
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        error: 'Email tidak valid',
        message: 'Email harus diisi' 
      });
    }

    // Find user
    const [users] = await db.query(
      'SELECT user_id, email, full_name, status FROM users WHERE email = ?',
      [email.toLowerCase()]
    );

    // Always return success even if email not found (security best practice)
    if (users.length === 0) {
      return res.json({ 
        success: true,
        message: 'Jika email terdaftar, link reset password telah dikirim ke email Anda.' 
      });
    }

    const user = users[0];

    // Only allow approved users to reset password
    if (user.status !== 'approved') {
      return res.json({ 
        success: true,
        message: 'Jika email terdaftar, link reset password telah dikirim ke email Anda.' 
      });
    }

    // Generate reset token
    const resetToken = generateToken();
    const resetExpiry = getExpiryTime(1); // 1 hour

    await db.query(
      'UPDATE users SET reset_password_token = ?, reset_password_expires = ? WHERE user_id = ?',
      [resetToken, resetExpiry, user.user_id]
    );

    // Send reset email
    try {
      await sendPasswordResetEmail(user.email, resetToken, user.full_name);
      await logEmail(user.user_id, 'password_reset', user.email, 'sent');
      
      res.json({ 
        success: true,
        message: 'Link reset password telah dikirim ke email Anda. Link berlaku selama 1 jam.' 
      });
    } catch (emailError) {
      console.error('Error sending password reset email:', emailError);
      await logEmail(user.user_id, 'password_reset', user.email, 'failed', emailError.message);
      
      res.status(500).json({ 
        error: 'Gagal mengirim email',
        message: 'Gagal mengirim email reset password. Silakan coba lagi nanti.' 
      });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ 
      error: 'Gagal memproses',
      message: 'Terjadi kesalahan saat memproses permintaan reset password' 
    });
  }
});

// Reset password - verify token and update password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ 
        error: 'Data tidak lengkap',
        message: 'Token dan password baru harus diisi' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        error: 'Password terlalu pendek',
        message: 'Password harus minimal 6 karakter' 
      });
    }

    // Find user with this reset token
    const [users] = await db.query(
      `SELECT user_id, email, reset_password_expires 
       FROM users 
       WHERE reset_password_token = ?`,
      [token]
    );

    if (users.length === 0) {
      return res.status(400).json({ 
        error: 'Token tidak valid',
        message: 'Token reset password tidak valid' 
      });
    }

    const user = users[0];

    // Check if token expired
    if (new Date() > new Date(user.reset_password_expires)) {
      return res.status(400).json({ 
        error: 'Token kedaluwarsa',
        message: 'Token reset password sudah kedaluwarsa. Silakan minta token baru.' 
      });
    }

    // Hash new password
    const password_hash = await bcrypt.hash(newPassword, 10);

    // Update password and clear reset token
    await db.query(
      `UPDATE users 
       SET password_hash = ?, 
           reset_password_token = NULL, 
           reset_password_expires = NULL 
       WHERE user_id = ?`,
      [password_hash, user.user_id]
    );

    res.json({ 
      success: true,
      message: 'Password berhasil direset! Silakan login dengan password baru Anda.' 
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ 
      error: 'Gagal reset password',
      message: 'Terjadi kesalahan saat reset password' 
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
      `SELECT user_id, email, password_hash, full_name, role, status, email_verified 
       FROM users WHERE email = ?`, 
      [email.toLowerCase()]
    );
    
    if (users.length === 0) {
      return res.status(401).json({ 
        error: 'Login gagal',
        message: 'Email atau password salah' 
      });
    }

    const user = users[0];

    // Check if email is verified
    if (!user.email_verified) {
      return res.status(403).json({ 
        error: 'Email belum diverifikasi',
        message: 'Silakan verifikasi email Anda terlebih dahulu. Cek inbox atau spam folder Anda.',
        requiresVerification: true
      });
    }

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
      `SELECT user_id, email, full_name, email_verified, created_at 
       FROM users 
       WHERE status = "pending" 
       ORDER BY created_at DESC`
    );
    res.json(users);
  } catch (error) {
    console.error('Error fetching pending users:', error);
    res.status(500).json({ error: 'Failed to fetch pending users' });
  }
});

// Approve/reject user (admin only) - with welcome email
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

    // Get user info
    const [users] = await db.query(
      'SELECT email, full_name FROM users WHERE user_id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ 
        error: 'User tidak ditemukan',
        message: 'User yang dimaksud tidak ada' 
      });
    }

    const user = users[0];

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

    // Send welcome email if approved
    if (status === 'approved') {
      try {
        await sendWelcomeEmail(user.email, user.full_name);
        await logEmail(userId, 'welcome', user.email, 'sent');
      } catch (emailError) {
        console.error('Error sending welcome email:', emailError);
        await logEmail(userId, 'welcome', user.email, 'failed', emailError.message);
      }
    }

    res.json({ 
      success: true,
      message: `User ${status === 'approved' ? 'disetujui' : 'ditolak'} successfully` 
    });
  } catch (error) {
    console.error('Error approving user:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

// Get all users (admin only)
router.get('/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const [users] = await db.query(
      `SELECT user_id, email, full_name, role, status, email_verified, created_at 
       FROM users 
       ORDER BY created_at DESC`
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

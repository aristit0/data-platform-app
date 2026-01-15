const nodemailer = require('nodemailer');

// Create transporter using Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Your Gmail address
    pass: process.env.EMAIL_PASSWORD // Your Gmail App Password
  }
});

// Verify transporter configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email transporter error:', error);
  } else {
    console.log('✅ Email server is ready to send messages');
  }
});

/**
 * Send verification email to new user
 */
const sendVerificationEmail = async (email, token, fullName) => {
  const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
  
  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || 'TOMODACHI Data Platform'}" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Verifikasi Email Anda - TOMODACHI Data Platform',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              background-color: #0f172a;
              color: #e2e8f0;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 40px auto;
              background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
            }
            .header {
              background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
              padding: 40px 30px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              color: white;
              font-size: 32px;
              font-weight: bold;
            }
            .header p {
              margin: 10px 0 0 0;
              color: rgba(255, 255, 255, 0.9);
              font-size: 16px;
            }
            .content {
              padding: 40px 30px;
            }
            .content h2 {
              color: #f1f5f9;
              margin-top: 0;
              font-size: 24px;
            }
            .content p {
              color: #cbd5e1;
              line-height: 1.6;
              font-size: 15px;
            }
            .button {
              display: inline-block;
              padding: 16px 40px;
              background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
              color: white !important;
              text-decoration: none;
              border-radius: 10px;
              font-weight: 600;
              font-size: 16px;
              margin: 20px 0;
              box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4);
              transition: transform 0.2s;
            }
            .button:hover {
              transform: translateY(-2px);
              box-shadow: 0 6px 20px rgba(99, 102, 241, 0.5);
            }
            .info-box {
              background: rgba(99, 102, 241, 0.1);
              border-left: 4px solid #6366f1;
              padding: 15px;
              margin: 20px 0;
              border-radius: 6px;
            }
            .info-box p {
              margin: 0;
              color: #94a3b8;
              font-size: 14px;
            }
            .footer {
              background: #1e293b;
              padding: 30px;
              text-align: center;
              border-top: 1px solid rgba(255, 255, 255, 0.1);
            }
            .footer p {
              margin: 5px 0;
              color: #64748b;
              font-size: 13px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>TOMODACHI</h1>
              <p>Data Platform</p>
            </div>
            
            <div class="content">
              <h2>Halo, ${fullName}!</h2>
              <p>Terima kasih telah mendaftar di TOMODACHI Data Platform. Untuk mengaktifkan akun Anda, silakan verifikasi alamat email Anda dengan mengklik tombol di bawah ini:</p>
              
              <div style="text-align: center;">
                <a href="${verificationLink}" class="button">Verifikasi Email Saya</a>
              </div>
              
              <div class="info-box">
                <p><strong>Link verifikasi ini akan kedaluwarsa dalam 24 jam.</strong></p>
              </div>
              
              <p>Jika tombol di atas tidak berfungsi, salin dan tempel link berikut ke browser Anda:</p>
              <p style="word-break: break-all; color: #6366f1;">${verificationLink}</p>
              
              <p>Jika Anda tidak membuat akun ini, abaikan email ini.</p>
            </div>
            
            <div class="footer">
              <p><strong>TOMODACHI Data Platform</strong></p>
              <p>Email ini dikirim secara otomatis, mohon tidak membalas.</p>
              <p>&copy; ${new Date().getFullYear()} TOMODACHI. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Verification email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending verification email:', error);
    throw error;
  }
};

/**
 * Send password reset email
 */
const sendPasswordResetEmail = async (email, token, fullName) => {
  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
  
  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || 'TOMODACHI Data Platform'}" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Reset Password - TOMODACHI Data Platform',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              background-color: #0f172a;
              color: #e2e8f0;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 40px auto;
              background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
            }
            .header {
              background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
              padding: 40px 30px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              color: white;
              font-size: 32px;
              font-weight: bold;
            }
            .header p {
              margin: 10px 0 0 0;
              color: rgba(255, 255, 255, 0.9);
              font-size: 16px;
            }
            .content {
              padding: 40px 30px;
            }
            .content h2 {
              color: #f1f5f9;
              margin-top: 0;
              font-size: 24px;
            }
            .content p {
              color: #cbd5e1;
              line-height: 1.6;
              font-size: 15px;
            }
            .button {
              display: inline-block;
              padding: 16px 40px;
              background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
              color: white !important;
              text-decoration: none;
              border-radius: 10px;
              font-weight: 600;
              font-size: 16px;
              margin: 20px 0;
              box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4);
            }
            .warning-box {
              background: rgba(239, 68, 68, 0.1);
              border-left: 4px solid #ef4444;
              padding: 15px;
              margin: 20px 0;
              border-radius: 6px;
            }
            .warning-box p {
              margin: 0;
              color: #fca5a5;
              font-size: 14px;
            }
            .info-box {
              background: rgba(99, 102, 241, 0.1);
              border-left: 4px solid #6366f1;
              padding: 15px;
              margin: 20px 0;
              border-radius: 6px;
            }
            .info-box p {
              margin: 0;
              color: #94a3b8;
              font-size: 14px;
            }
            .footer {
              background: #1e293b;
              padding: 30px;
              text-align: center;
              border-top: 1px solid rgba(255, 255, 255, 0.1);
            }
            .footer p {
              margin: 5px 0;
              color: #64748b;
              font-size: 13px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>TOMODACHI</h1>
              <p>Data Platform</p>
            </div>
            
            <div class="content">
              <h2>Halo, ${fullName}!</h2>
              <p>Kami menerima permintaan untuk mereset password akun Anda. Klik tombol di bawah ini untuk membuat password baru:</p>
              
              <div style="text-align: center;">
                <a href="${resetLink}" class="button">Reset Password</a>
              </div>
              
              <div class="info-box">
                <p><strong>Link reset password ini akan kedaluwarsa dalam 1 jam.</strong></p>
              </div>
              
              <p>Jika tombol di atas tidak berfungsi, salin dan tempel link berikut ke browser Anda:</p>
              <p style="word-break: break-all; color: #6366f1;">${resetLink}</p>
              
              <div class="warning-box">
                <p><strong>⚠️ Jika Anda tidak meminta reset password, abaikan email ini dan password Anda tetap aman.</strong></p>
              </div>
            </div>
            
            <div class="footer">
              <p><strong>TOMODACHI Data Platform</strong></p>
              <p>Email ini dikirim secara otomatis, mohon tidak membalas.</p>
              <p>&copy; ${new Date().getFullYear()} TOMODACHI. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Password reset email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
    throw error;
  }
};

/**
 * Send welcome email after account approval
 */
const sendWelcomeEmail = async (email, fullName) => {
  const loginLink = `${process.env.FRONTEND_URL}/login`;
  
  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || 'TOMODACHI Data Platform'}" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Akun Anda Telah Disetujui! - TOMODACHI Data Platform',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              background-color: #0f172a;
              color: #e2e8f0;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 40px auto;
              background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
            }
            .header {
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              padding: 40px 30px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              color: white;
              font-size: 32px;
              font-weight: bold;
            }
            .content {
              padding: 40px 30px;
            }
            .content h2 {
              color: #f1f5f9;
              margin-top: 0;
              font-size: 24px;
            }
            .content p {
              color: #cbd5e1;
              line-height: 1.6;
              font-size: 15px;
            }
            .button {
              display: inline-block;
              padding: 16px 40px;
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              color: white !important;
              text-decoration: none;
              border-radius: 10px;
              font-weight: 600;
              font-size: 16px;
              margin: 20px 0;
              box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);
            }
            .footer {
              background: #1e293b;
              padding: 30px;
              text-align: center;
              border-top: 1px solid rgba(255, 255, 255, 0.1);
            }
            .footer p {
              margin: 5px 0;
              color: #64748b;
              font-size: 13px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Selamat!</h1>
            </div>
            
            <div class="content">
              <h2>Halo, ${fullName}!</h2>
              <p>Kabar gembira! Akun Anda di TOMODACHI Data Platform telah disetujui oleh administrator.</p>
              <p>Sekarang Anda dapat login dan mulai menggunakan platform kami.</p>
              
              <div style="text-align: center;">
                <a href="${loginLink}" class="button">Login Sekarang</a>
              </div>
              
              <p>Jika Anda memiliki pertanyaan, jangan ragu untuk menghubungi tim support kami.</p>
            </div>
            
            <div class="footer">
              <p><strong>TOMODACHI Data Platform</strong></p>
              <p>Email ini dikirim secara otomatis, mohon tidak membalas.</p>
              <p>&copy; ${new Date().getFullYear()} TOMODACHI. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Welcome email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending welcome email:', error);
    throw error;
  }
};

module.exports = {
  transporter,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail
};

const https = require('https');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// Security middleware
app.use(helmet());
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 1440 * 60 * 1000, // 15 minutes
  max: 1000 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// CORS configuration
// app.use(cors({
//   origin: process.env.CORS_ORIGIN || 'http://localhost:3000,http://172.28.1.233:3000',
//   credentials: true
// }));

//app.use(cors({
//  origin: (origin, callback) => {
//    callback(null, origin); // allow whatever origin comes
//  },
//  credentials: true
//}));

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    // Allow all origins
    return callback(null, true);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  exposedHeaders: ["Authorization"],
  maxAge: 86400, // 24 hours
}));

// Handle preflight
app.options("*", cors());

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tasks', require('./routes/tasks')); 
app.use('/api/employees', require('./routes/employees'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/opportunities', require('./routes/opportunities'));
app.use('/api/certifications', require('./routes/certifications'));
app.use('/api/employee-certifications', require('./routes/employee-certifications'));
app.use('/api/product-assignments', require('./routes/product-assignments'));
app.use('/api/product-specialists', require('./routes/productSpecialists'));
app.use('/api/assets', require('./routes/assets'));
app.use('/api/leaves', require('./routes/leaves'));
app.use('/api/mini-pocs', require('./routes/mini-pocs'));
app.use('/api/dashboard', require('./routes/dashboard'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

const PORT = process.env.PORT || 2221;

const httpsOptions = {
  key: fs.readFileSync("/root/data-platform-app/data-platform-app/ssl/server-key.pem"),
  cert: fs.readFileSync("/root/data-platform-app/data-platform-app/ssl/server-cert.pem"),
};



https.createServer(httpsOptions, app).listen(PORT, () => {
  console.log(`🚀 HTTPS Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 CORS enabled for: ${process.env.CORS_ORIGIN}`);
});

module.exports = app;

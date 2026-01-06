// NO-AUTH MIDDLEWARE - FIXED VERSION
module.exports = {
  authMiddleware: (req, res, next) => {
    // NO-AUTH: Always allow through with mock admin user
    req.user = {
      user_id: 1,
      email: 'admin@dataplatform.com',
      role: 'admin'
    };
    next();
  },

  adminMiddleware: (req, res, next) => {
    // NO-AUTH: Always allow admin operations
    next();
  }
};

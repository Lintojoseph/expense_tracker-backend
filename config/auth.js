const jwt = require('jsonwebtoken');

const authConfig = {
  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET ,
    expiresIn: process.env.JWT_EXPIRES_IN ,
    issuer: process.env.JWT_ISSUER || 'budget-tracker-api',
    audience: process.env.JWT_AUDIENCE || 'budget-tracker-app',
  },

  // Password validation
  password: {
    minLength: 6,
    maxLength: 128,
    requireSpecialChar: false,
    requireNumbers: true,
    requireUppercase: false,
  },

  // Token generation function
  generateToken: (payload) => {
    return jwt.sign(payload, authConfig.jwt.secret, {
      expiresIn: authConfig.jwt.expiresIn,
      issuer: authConfig.jwt.issuer,
      audience: authConfig.jwt.audience,
    });
  },

  // Token verification function
  verifyToken: (token) => {
    return jwt.verify(token, authConfig.jwt.secret, {
      issuer: authConfig.jwt.issuer,
      audience: authConfig.jwt.audience,
    });
  },
};

module.exports = authConfig;
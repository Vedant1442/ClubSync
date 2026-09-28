const jwt = require('jsonwebtoken');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-clubsync-key';

const OFFICER_ROLES = [
  'President',
  'Vice President',
  'Secretary',
  'Treasurer',
  'officer',
  'Officer',
  'Admin',
  'admin'
];

/**
 * Middleware to require valid JWT Bearer token
 */
const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization token required' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ error: 'Invalid or malformed token', code: 'INVALID_TOKEN' });
  }
};

/**
 * Middleware generator to check if authenticated user has officer privileges in a club.
 * Checks req.params[clubIdParam] or req.body[clubIdParam].
 */
const requireOfficer = (clubIdParam = 'id') => {
  return async (req, res, next) => {
    try {
      const clubId = req.params[clubIdParam] || req.body[clubIdParam] || req.body.club_id;
      if (!clubId) {
        return res.status(400).json({ error: 'Club ID is required for role verification' });
      }

      const roleCheck = await db.query(
        'SELECT role FROM club_members WHERE club_id = $1 AND user_id = $2',
        [clubId, req.user.id]
      );

      if (roleCheck.rows.length === 0 || !OFFICER_ROLES.includes(roleCheck.rows[0].role)) {
        return res.status(403).json({ error: 'Only club officers can perform this action' });
      }

      req.clubRole = roleCheck.rows[0].role;
      next();
    } catch (err) {
      console.error('[Role Check Error]:', err);
      res.status(500).json({ error: 'Failed to verify officer permissions' });
    }
  };
};

module.exports = {
  JWT_SECRET,
  OFFICER_ROLES,
  requireAuth,
  requireOfficer
};

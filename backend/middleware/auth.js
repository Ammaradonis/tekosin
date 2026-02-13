const jwt = require('jsonwebtoken');
const db = require('../models');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await db.User.findByPk(decoded.id);

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid or inactive user' });
    }

    if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
      return res.status(423).json({ error: 'Account is locked' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    return res.status(403).json({ error: 'Invalid token' });
  }
};

const ROLE_HIERARCHY = {
  super_admin: 100,
  admin: 90,
  member_manager: 70,
  payment_manager: 70,
  content_manager: 70,
  event_manager: 70,
  volunteer_manager: 70,
  report_manager: 70,
  member: 10
};

const ROLE_PERMISSIONS = {
  super_admin: ['*'],
  admin: ['users:read', 'users:write', 'members:*', 'payments:*', 'content:*', 'events:*', 'volunteers:*', 'reports:*', 'notifications:*', 'settings:read', 'audit:read', 'backups:*', 'newsletters:*', 'exports:*'],
  member_manager: ['members:read', 'members:write', 'members:delete', 'documents:*', 'notes:*', 'referrals:*', 'services:*', 'exports:members'],
  payment_manager: ['payments:read', 'payments:write', 'payments:refund', 'exports:payments', 'members:read'],
  content_manager: ['content:read', 'content:write', 'content:delete', 'content:publish', 'newsletters:*'],
  event_manager: ['events:read', 'events:write', 'events:delete', 'volunteers:read'],
  volunteer_manager: ['volunteers:read', 'volunteers:write', 'volunteers:delete', 'events:read'],
  report_manager: ['reports:*', 'members:read', 'payments:read', 'events:read', 'exports:*'],
  member: ['self:read', 'self:write', 'events:read', 'content:read']
};

const authorize = (...requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userPermissions = ROLE_PERMISSIONS[req.user.role] || [];

    if (userPermissions.includes('*')) {
      return next();
    }

    const hasPermission = requiredPermissions.some(perm => {
      return userPermissions.some(userPerm => {
        if (userPerm === perm) return true;
        const [resource, action] = userPerm.split(':');
        const [reqResource, reqAction] = perm.split(':');
        if (resource === reqResource && action === '*') return true;
        return false;
      });
    });

    if (!hasPermission) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient role' });
    }
    next();
  };
};

module.exports = { authenticateToken, authorize, requireRole, ROLE_PERMISSIONS, ROLE_HIERARCHY };

const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const mfaController = require('../controllers/mfa.controller');
const auditController = require('../controllers/audit.controller');
const authMiddleware = require('@ecommerce/shared/middleware/auth.middleware');
const requireRole = require('@ecommerce/shared/middleware/rbac.middleware');
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 login requests per windowMs
    message: { success: false, message: 'Too many login attempts, please try again after 15 minutes' },
    validate: { trustProxy: false }
});

// Auth Core
router.post('/register', authController.register);
router.post('/login', loginLimiter, authController.login);
router.post('/google', authController.googleAuth);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.post('/verify-email', authController.verifyEmail);
router.post('/verify-otp', authController.verifyOTP);

// Profile
router.get('/profile', authMiddleware, authController.getProfile);
router.put('/profile', authMiddleware, authController.updateProfile);

// MFA (2FA)
router.post('/2fa/generate', authMiddleware, mfaController.generate2FA);
router.post('/2fa/enable', authMiddleware, mfaController.enable2FA);
router.post('/2fa/verify', authMiddleware, mfaController.verify2FA); // Used during login

// Devices & Audit (Protected)
router.get('/devices', authMiddleware, auditController.getDevices);
router.delete('/devices/:tokenId', authMiddleware, auditController.revokeDevice);
router.get('/audit-logs', authMiddleware, auditController.getAuditLogs);

// Admin Only Example (RBAC Test)
router.get('/admin/logs', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), auditController.getAuditLogs);

// MED-08: Role update now protected — only SUPER_ADMIN can assign ADMIN/SUPER_ADMIN
router.put('/user/:id/role', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), authController.updateUserRole);

// CRIT-07: Real user count for admin stats dashboard (replaces hardcoded 12450 in gateway)
router.get('/admin/users/count', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), authController.getUserCount);

module.exports = router;

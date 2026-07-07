const express = require('express');
const router = express.Router();
const couponController = require('../controllers/coupon.controller');

// Middleware to ensure user is Admin
const authMiddleware = (req, res, next) => {
    const role = req.headers['x-user-role'];
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
        return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    next();
};

router.post('/validate', couponController.validateCoupon); // Public / Customer facing

router.post('/', authMiddleware, couponController.createCoupon); // Admin only
router.get('/', authMiddleware, couponController.getAllCoupons); // Admin only

module.exports = router;

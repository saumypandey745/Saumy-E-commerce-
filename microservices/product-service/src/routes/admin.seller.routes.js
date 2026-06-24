const express = require('express');
const router = express.Router();
const adminSellerController = require('../controllers/admin.seller.controller');

// Middleware to ensure user is Admin
const authMiddleware = (req, res, next) => {
    const role = req.headers['x-user-role'];
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
        return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    next();
};

router.use(authMiddleware);

router.get('/', adminSellerController.getAllSellers);
router.get('/pending', adminSellerController.getPendingSellers);
router.put('/:id/status', adminSellerController.updateSellerStatus);

module.exports = router;

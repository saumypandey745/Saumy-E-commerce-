const express = require('express');
const multer = require('multer');
const { getStoreProfile, onboardStore, getSellerAnalytics, bulkImportProducts, uploadKycDocument, getSellerProducts, uploadProductImage, updateStoreProfile, createProduct, updateProduct, deleteProduct } = require('../controllers/sellerController');

const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Middleware to extract user info from gateway headers
const extractUser = (req, res, next) => {
    req.user = {
        id: req.headers['x-user-id'],
        role: req.headers['x-user-role']
    };
    next();
};

router.use(extractUser);

// Store Management
router.get('/store', getStoreProfile);
router.put('/store', updateStoreProfile);
router.post('/onboard', onboardStore);
router.post('/kyc/upload', upload.single('document'), uploadKycDocument);

// Analytics
router.get('/analytics', getSellerAnalytics);

// Product Management
router.get('/products', getSellerProducts);
router.post('/products', createProduct);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);
router.post('/products/:id/upload-image', (req, res, next) => {
    console.log("---- UPLOAD REQUEST HEADERS ----");
    console.log(req.headers);
    next();
}, upload.single('image'), uploadProductImage);
router.post('/products/bulk-import', bulkImportProducts);

module.exports = router;

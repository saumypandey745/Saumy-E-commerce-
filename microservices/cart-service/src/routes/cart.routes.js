const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart.controller');
const { resolveIdentity, requireUser } = require('../middleware/guestOrUser.middleware');

router.get('/', resolveIdentity, cartController.getCart);
router.post('/items', resolveIdentity, cartController.addItem);
router.put('/items/:productId', resolveIdentity, cartController.updateQuantity);
router.delete('/items/:productId', resolveIdentity, cartController.removeItem);
router.post('/merge', requireUser, cartController.mergeCart);

module.exports = router;

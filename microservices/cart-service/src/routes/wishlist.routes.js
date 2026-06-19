const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlist.controller');
const { requireUser } = require('../middleware/guestOrUser.middleware');

router.get('/', requireUser, wishlistController.getWishlist);
router.post('/items', requireUser, wishlistController.addItem);
router.delete('/items/:productId', requireUser, wishlistController.removeItem);

module.exports = router;

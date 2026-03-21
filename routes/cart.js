const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} = require('../controllers/cartController');

router.get('/', auth, getCart);
router.post('/add', auth, addToCart);
router.patch('/items/:itemId', auth, updateCartItem);
router.delete('/items/:itemId', auth, removeCartItem);
router.delete('/', auth, clearCart);

module.exports = router;

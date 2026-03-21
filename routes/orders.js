const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
	placeOrder,
	getMyOrders,
	getMyActiveOrders,
	cancelMyOrder,
} = require('../controllers/orderController');

router.post('/', auth, placeOrder);
router.get('/my', auth, getMyOrders);
router.get('/my/active', auth, getMyActiveOrders);
router.patch('/:orderId/cancel', auth, cancelMyOrder);

module.exports = router;

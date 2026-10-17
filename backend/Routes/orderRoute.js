const router = require('express').Router();
const { createOrder, getMyOrders, getOrderById } = require('../Controllers/orderController');
const { protect } = require('../Middleware/authMiddleware');

router.post('/', protect, createOrder); // make an order
router.get('/mine', protect, getMyOrders); // my orders
router.get('/:id', protect, getOrderById); // one order

module.exports = router;
const router = require('express').Router();
const { payOrder } = require('../Controllers/paymentController');
const { protect } = require('../Middleware/authMiddleware');

router.post('/:id/pay', protect, payOrder);

module.exports = router;
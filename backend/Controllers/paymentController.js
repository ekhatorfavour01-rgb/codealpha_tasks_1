const Order = require('../Models/Order');
const asyncHandler = require('../Utils/asyncHandler');
const { reduceStock } = require('../Services/orderService');

// FAKE payment for demo purpose - no real money moves.
// Any 16-digit number works, except one ending with 0000 (declined).
exports.payOrder = asyncHandler(async (req, res) => {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id });

    if (!order) {
        res.status(404);
        throw new Error('Order not found');
    }

    if (order.paymentStatus === 'Paid') {
        res.status(400);
        throw new Error('Order is already paid');
    }

    const card = String(req.body.cardNumber || '').replace(/\s/g, '');
    if (!/^\d{16}$/.test(card)) {
        res.status(400);
        throw new Error('Enter a 16-dgit card number');
    }

    if (card.endsWith('0000')) {
        res.status(402);
        throw new Error('Card declined (demo). Try a different number');
    }

    order.paymentStatus = 'Paid';
    order.status = 'Paid';
    order.paidAt = Date.now();
    await order.save();
    await reduceStock(order);

    res.json({ message: 'Payment successful (demo)', order });
});
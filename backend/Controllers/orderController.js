const Order = require('../Models/Order');
const asyncHandler = require('../Utils/asyncHandler');
const { buildOrderItem } = require('../Services/orderService');

// body: { items: [{ productId, qty }], shippingAddress }
exports.createOrder = asyncHandler(async (req, res) => {
    const { items, shippingAddress } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
        res.status(400);
        throw new Error('Your cart is empty');
    }

    if (!shippingAddress) {
        res.status(400);
        throw new Error('Shipping address is required');
    }

    const built = await buildOrderItem(items);
    const order = await Order.create({
        user: req.user._id,
        shippingAddress,
        ...built });
    res.status(201).json(order);
});

exports.getMyOrders = asyncHandler(async (req, res) => {
    res.json(await Order.find({ user: req.user._id }).sort({ createdAt: -1 }));
});

exports.getOrderById = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);
    const isOwner = order && order.user.toString() === req.user._id.toString();

    if (!order || !isOwner && req.user.role !== 'admin') {
        res.status(404);
        throw new Error('Order not found');
    }
    res.json(order);
});
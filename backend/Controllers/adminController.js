const User = require('../Models/User');
const Product = require('../Models/Product');
const Order = require('../Models/Order');
const asyncHandler = require('../Utils/asyncHandler');

exports.getStats = asyncHandler(async (req, res) => {
    const [users, products, orders, revenueAgg, recentOrders] = await Promise.all([
        User.countDocuments(),
        Product.countDocuments(),
        Order.countDocuments(),
        Order.aggregate([
            { $match: { paymentStatus: 'Paid' } },
            { $group: { _id: null, total: { $sum: '$total' } } },
        ]),
        Order.find().sort({ createdAt: -1 }).limit(5).populate('user', 'name email'),
    ]);

    res.json({ users, products, orders, revenue: revenueAgg[0]?.total || 0, recentOrders });
});


exports.getOrders = asyncHandler(async (req, res) => {
    res.json(await Order.find().sort({ createdAt: -1 }).populate('user', 'name email'));
});


exports.updateOrderStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;
    if (!['Pending', 'Paid', 'Shipped', 'Delivered', 'Cancelled'].includes(status)) {
        res.status(400);
        throw new Error('Invalid status');

    }
    
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    
    if (!order) {
        res.status(404);
        throw new Error('Order not found');
    }
    res.json(order);
});


exports.getUsers = asyncHandler(async (req, res) => {
    res.json(await User.find().sort({ createdAt: -1 }));
});


exports.updateUserRole = asyncHandler(async (req, res) => {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
        res.status(400);
        throw new Error('Invalid role');
    }
    
    if (req.params.id === req.user._id.toString()) {
        res.status(400);
        throw new Error('You cannot change your own role');
    }
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }
    res.json(user);
});


exports.deleteUser = asyncHandler(async (req, res) => {
    if (req.params.id === req.user._id.toString()) {
        res.status(400);
        throw new Error('You cannot delete your own account');
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }
    res.json({ message: 'User deleted' });
});
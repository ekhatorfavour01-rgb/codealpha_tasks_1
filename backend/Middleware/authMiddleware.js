const jwt = require('jsonwebtoken');
const User = require('../Models/User');
const asyncHandler = require('../Utils/asyncHandler');

// Middleware to protect routes
exports.protect = asyncHandler(async (req, res, next) => {
    const header = req.headers.authorization || '';

    if (!header.startsWith('Bearer ')) {
        res.status(401);
        throw new Error('Not logged in');
    }

    try {
        const decoded = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id);
    
    } catch {
        res.status(401);
        throw new Error('Session expired. Please log in again.');
    }

    if (!req.user) {
        res.status(401);
        throw new Error('User no longer exists');
    }
    next();
});

exports.adminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        return next();
    }
        res.status(403);
        next(new Error('Admin access only'));

};
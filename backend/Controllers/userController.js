const User = require('../Models/User');
const asyncHandler = require('../Utils/asyncHandler');

exports.getProfile = asyncHandler(async (req, res) => {
    const { _id, name, email, phone, address, role } = req.user;
    res.json({ _id, name, email, phone, address, role });
});

exports.updateProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select('+password');
    const { name, email, phone, address, password } = req.body;
    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;
    if (password) {
        if (password.length < 6) {
            res.status(400);
            throw new Error('Password must be at least 6 characters');
        }
        user.password = password;
    }
    await user.save();
    res.json({ _id: user._id, name: user.name, email: user.email, phone: user.phone, address: user.address, role: user.role });
});

const User = require('../Models/User');
const generateToken = require('../Utils/generateToken');
const asyncHandler = require('../Utils/asyncHandler');

const userResponse = (user) => ({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    token: generateToken(user._id),
});

exports.register = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;
    const user = await User.create({ name, email, password, role: 'user' });
    res.status(201).json(userResponse(user));
});

exports.login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
        res.status(401);
        throw new Error('Invalid email or password');
    }
    res.status(200).json(userResponse(user));
});
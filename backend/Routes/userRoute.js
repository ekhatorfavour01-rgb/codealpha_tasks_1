const router = require('express').Router();
const { getProfile, updateProfile } = require('../Controllers/userController');
const { protect } = require('../Middleware/authMiddleware');


router.route('/profile').get(protect, getProfile).put(protect, updateProfile);

module.exports = router;
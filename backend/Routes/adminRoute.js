const router = require('express').Router();
const adminController = require('../Controllers/adminController');
const { protect, adminOnly } = require('../Middleware/authMiddleware');

router.use(protect, adminOnly);

router.get('/stats', adminController.getStats); // Dashboard numbers
router.get('/orders', adminController.getOrders); // all orders
router.put('/orders/:id/status', adminController.updateOrderStatus);
router.get('/users', adminController.getUsers); // all users
router.put('/users/:id/role', adminController.updateUserRole); // change a user role
router.delete('/users/:id', adminController.deleteUser);

module.exports = router;
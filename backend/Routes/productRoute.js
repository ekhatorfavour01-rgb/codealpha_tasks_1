const router = require('express').Router();
const productController = require('../Controllers/productController'); // "c" is just a short name
const { protect, adminOnly } = require('../Middleware/authMiddleware');
const upload = require('../Middleware/uploadMiddleware');

// ANYONE can look at products (no guard)
router.get('/', productController.getProducts);               // all products
router.get('/categories', productController.getCategories);   // category names
router.get('/:id', productController.getProductById);             // one product (":id" = any id)

// ONLY the admin can add / edit / delete. Two guards: logged in + admin.
router.post('/', protect, adminOnly, upload.single('image'), productController.createProduct);
router.put('/:id', protect, adminOnly, upload.single('image'), productController.updateProduct);
router.delete('/:id', protect, adminOnly, productController.deleteProduct);

module.exports = router;
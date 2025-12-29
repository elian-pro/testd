const express = require('express');
const router = express.Router();
const { requireAuth, requireAdmin } = require('../middleware/auth');
const productController = require('../controllers/productController');

// Public/User Catalog
router.get('/products', requireAuth, productController.getProducts);
router.get('/products/:id', requireAuth, productController.getProductById);
router.get('/categories', requireAuth, productController.getCategories);

// Admin Management
router.post('/products', requireAuth, requireAdmin, productController.createProduct);
router.put('/products/:id', requireAuth, requireAdmin, productController.updateProduct);
router.patch('/products/:id/toggle', requireAuth, requireAdmin, productController.toggleProductActive);

module.exports = router;

const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const orderController = require('../controllers/orderController');

router.post('/orders', requireAuth, orderController.createOrderDraft);
router.post('/orders/:id/confirm', requireAuth, orderController.confirmOrder);
router.patch('/orders/:id/status', requireAuth, orderController.updateOrderStatus);
router.post('/orders/:id/reschedule', requireAuth, orderController.rescheduleOrder);
router.get('/orders', requireAuth, orderController.getOrders);
router.get('/orders/:id', requireAuth, orderController.getOrderById);
router.put('/orders/:id/items', requireAuth, orderController.updateOrderItems);

module.exports = router;

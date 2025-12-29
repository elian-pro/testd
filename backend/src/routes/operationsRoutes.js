const express = require('express');
const router = express.Router();
const { requireAuth, requireAdmin } = require('../middleware/auth');
const operationsController = require('../controllers/operationsController');

// Generate PDFs for confirmed orders (admin only)
router.post('/operations/generate-pdfs', requireAuth, requireAdmin, operationsController.generateOrderPDFs);

// Process new day - close confirmed orders and deduct inventory (admin only)
router.post('/operations/new-day', requireAuth, requireAdmin, operationsController.processNewDay);

module.exports = router;

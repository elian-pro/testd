const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');

// Public webhook endpoint (no auth required for N8N)
router.post('/webhook/n8n', webhookController.processWebhook);

module.exports = router;

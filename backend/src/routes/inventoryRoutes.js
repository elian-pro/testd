const express = require('express');
const router = express.Router();
const { requireAuth, requireAdmin } = require('../middleware/auth');
const inventoryController = require('../controllers/inventoryController');

// Hunucma
router.get('/inventory/hunucma', requireAuth, inventoryController.getInventoryHunucma);
router.post('/inventory/hunucma/adjust', requireAuth, requireAdmin, inventoryController.adjustInventoryHunucma);

// Zelma
router.get('/inventory/zelma', requireAuth, inventoryController.getInventoryZelma);
router.post('/inventory/zelma/adjust', requireAuth, requireAdmin, inventoryController.adjustInventoryZelma);

module.exports = router;

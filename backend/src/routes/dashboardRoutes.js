const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const dashboardController = require('../controllers/dashboardController');

router.get('/dashboard/stats', requireAuth, dashboardController.getDashboardStats);

module.exports = router;

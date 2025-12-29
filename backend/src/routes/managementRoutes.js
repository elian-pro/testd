const express = require('express');
const router = express.Router();
const { requireAuth, requireAdmin } = require('../middleware/auth');
const managementController = require('../controllers/managementController');

// Users (Admin only)
router.get('/users', requireAuth, requireAdmin, managementController.getUsers);
router.post('/users', requireAuth, requireAdmin, managementController.createUser);
router.patch('/users/:id/toggle', requireAuth, requireAdmin, managementController.toggleUserActive);

// Clients
router.get('/clients', managementController.getClients);
router.post('/clients', managementController.createClient);
router.put('/clients/:id', managementController.updateClient);

// Branches
router.post('/clients/:clientId/branches', requireAuth, requireAdmin, managementController.createBranch);

module.exports = router;

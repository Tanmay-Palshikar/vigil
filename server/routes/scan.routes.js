const express = require('express');
const router = express.Router();

// Import the instance of the controller
const scanController = require('../controllers/scan.controller.js');

// Import necessary middleware for protection
const authMiddleware = require('../middleware/auth.middleware.js');
const rateLimiter = require('../middleware/rateLimiter.middleware.js');

// --- Define Scan Routes ---

// @route   POST api/scan/start
// @desc    Trigger a new manual scan for the authenticated user
// @access  Private
router.post('/start', authMiddleware, rateLimiter, scanController.startScan);

// @route   GET api/scan/history
// @desc    Get the scan history (risk incidents) for the authenticated user
// @access  Private
router.get('/history', authMiddleware, scanController.getScanHistory);

module.exports = router;


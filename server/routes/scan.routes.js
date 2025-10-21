const express = require('express');
const router = express.Router();

// Assuming scanController is the instance of your ScanController class
const scanController = require('../controllers/scan.controller.js'); 
const authMiddleware = require('../middleware/auth.middleware.js');
const { validateScanRequest } = require('../utils/ai.validator.js');

// --- Define Scan Routes ---

// @route   POST api/scan/start
// @desc    Trigger a new Client-Guided Intelligent Scan
router.post(
    '/start', 
    authMiddleware, 
    validateScanRequest,
    scanController.initiateScan 
);

// @route   GET api/scan/history
// @desc    Get the scan history for the authenticated user
router.get('/history', authMiddleware, scanController.getScanHistory);

// --- NEW ROUTE ---
// @route   POST api/scan/check-ssl
// @desc    Check the SSL status for a given URL
router.post('/check-ssl', authMiddleware, scanController.checkSslStatus);


module.exports = router;


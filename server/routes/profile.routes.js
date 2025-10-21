const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profile.controller');
const authMiddleware = require('../middleware/auth.middleware');

// --- Define Profile Routes ---

// @route   GET /api/profile
// @desc    Get the current user's client profile
// @access  Private
router.get(
    '/',
    authMiddleware,
    profileController.getProfile
);

// @route   POST /api/profile
// @desc    Create or Update the user's client profile
// @access  Private
// NOTE: The non-existent validator has been REMOVED to fix the crash.
router.post(
    '/',
    authMiddleware,
    profileController.updateProfile
);

module.exports = router;


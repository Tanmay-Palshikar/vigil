const express = require('express');
const auth = require('../middleware/auth.middleware.js');
const ClientProfile = require('../models/clientProfile.model.js');

const router = express.Router();

// Create or update ClientProfile for the logged-in user
router.post('/client-profile', auth, async (req, res) => {
  try {
    const payload = {
      companyName: req.body.companyName,
      monitoredUrls: req.body.monitoredUrls || [],
      clientIndustry: req.body.clientIndustry || '',
      monitoredComplianceRegs: req.body.monitoredComplianceRegs || []
    };
    const doc = await ClientProfile.findOneAndUpdate(
      { user: req.user.id },
      { ...payload, user: req.user.id },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: 'Failed to save profile' });
  }
});

module.exports = router;

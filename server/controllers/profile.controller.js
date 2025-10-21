const ClientProfile = require('../models/clientProfile.model.js');

class ProfileController {
    /**
     * @route   GET api/profile
     * @desc    Get the profile for the currently authenticated user.
     * @access  Private
     */
    getProfile = async (req, res) => {
        try {
            // req.user.id is available from the authMiddleware
            const profile = await ClientProfile.findOne({ user: req.user.id });

            if (!profile) {
                return res.status(404).json({ success: false, message: 'Client profile not found for this user.' });
            }

            res.status(200).json({ success: true, data: profile });
        } catch (error) {
            console.error('Error in getProfile:', error.message);
            res.status(500).json({ success: false, message: 'Server error while fetching profile.' });
        }
    }

    /**
     * @route   POST api/profile
     * @desc    Create or update the client profile for the authenticated user.
     * @access  Private
     */
    updateProfile = async (req, res) => {
        // Destructure all expected fields from the request body
        const {
            companyName,
            clientIndustry,
            monitoredUrls,
            monitoredComplianceRegs
        } = req.body;

        const profileFields = {};
        if (companyName) profileFields.companyName = companyName;
        if (clientIndustry) profileFields.clientIndustry = clientIndustry;
        
        // Ensure monitoredUrls is always an array, even if empty
        if (monitoredUrls !== undefined) {
             profileFields.monitoredUrls = Array.isArray(monitoredUrls) ? monitoredUrls : [monitoredUrls];
        }
       
        if (monitoredComplianceRegs !== undefined) {
            profileFields.monitoredComplianceRegs = Array.isArray(monitoredComplianceRegs) ? monitoredComplianceRegs : [monitoredComplianceRegs];
        }


        try {
            // Using findOneAndUpdate with upsert:true
            // This will update the profile if it exists, or create it if it doesn't.
            // This is robust for handling both the initial profile setup and later edits.
            let profile = await ClientProfile.findOneAndUpdate(
                { user: req.user.id },
                { $set: profileFields },
                { new: true, upsert: true, setDefaultsOnInsert: true }
            );

            res.status(200).json({ success: true, data: profile });
        } catch (error) {
            console.error('Error in updateProfile:', error.message);
            res.status(500).json({ success: false, message: 'Server error while updating profile.' });
        }
    }
}

module.exports = new ProfileController();

const User = require('../models/user.model.js');
const ClientProfile = require('../models/clientProfile.model.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * @route   POST api/auth/register
 * @desc    Register a new user and create their initial client profile in one step.
 * @access  Public
 */
exports.register = async (req, res) => {
    // Input is validated by the validateRegistration middleware
    const { email, password, companyName, primaryWebsiteUrl, trustedUrls, clientIndustry, monitoredComplianceRegs } = req.body;

    try {
        // 1. Check if user already exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User with this email already exists.' });
        }

        // 2. Create and hash password for the new user
        user = new User({ email });
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        await user.save();

        // 3. Immediately create the associated ClientProfile
        const monitoredUrls = [primaryWebsiteUrl, ...(trustedUrls || [])].filter(url => url); // Combine URLs, ensuring primary is first

        const clientProfile = new ClientProfile({
            user: user._id,
            companyName,
            // You can add these fields to the registration form later if needed
            clientIndustry: clientIndustry || 'Not Specified', 
            monitoredUrls,
            monitoredComplianceRegs: monitoredComplianceRegs || [],
        });
        await clientProfile.save();
        
        // Update user with reference to their new profile
        user.clientProfile = clientProfile._id;
        await user.save();

        // 4. Generate and return JWT token
        const payload = {
            user: {
                id: user.id,
            },
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '7d' }, // Token expires in 7 days
            (err, token) => {
                if (err) throw err;
                res.status(201).json({ token });
            }
        );

    } catch (error) {
        console.error('Registration Error:', error.message);
        res.status(500).send('Server error during registration.');
    }
};

/**
 * @route   POST api/auth/login
 * @desc    Authenticate an existing user and return a JWT token.
 * @access  Public
 */
exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        // 1. Check if user exists
        let user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials.' });
        }

        // 2. Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials.' });
        }

        // 3. Generate and return JWT token
        const payload = {
            user: {
                id: user.id,
            },
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '7d' },
            (err, token) => {
                if (err) throw err;
                res.status(200).json({ token });
            }
        );

    } catch (error) {
        console.error('Login Error:', error.message);
        res.status(500).send('Server error during login.');
    }
};

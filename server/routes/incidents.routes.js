const express = require('express');
const router = express.Router();
const RiskIncident = require('../models/riskIncident.model');
const ClientProfile = require('../models/clientProfile.model');
const authMiddleware = require('../middleware/auth.middleware');

// GET /api/incidents - Get all risk incidents for the authenticated user
router.get('/incidents', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, riskCategory, riskLevel, isRisk } = req.query;

    // Get user's client profile
    const clientProfile = await ClientProfile.findOne({ user: userId });
    if (!clientProfile) {
      return res.status(404).json({
        success: false,
        message: 'Client profile not found'
      });
    }

    // Build filter object
    const filter = { clientProfile: clientProfile._id };
    
    if (riskCategory && riskCategory !== 'All') {
      filter['aiAnalysis.riskCategory'] = riskCategory;
    }
    
    if (riskLevel && riskLevel !== 'All') {
      filter['aiAnalysis.riskLevel'] = riskLevel;
    }
    
    if (isRisk !== undefined) {
      filter['aiAnalysis.isRisk'] = isRisk === 'true';
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    // Get incidents with pagination
    const incidents = await RiskIncident.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('clientProfile', 'companyName clientIndustry');

    // Get total count for pagination
    const totalIncidents = await RiskIncident.countDocuments(filter);

    res.json({
      success: true,
      data: {
        incidents,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalIncidents / limitNum),
          totalIncidents,
          hasNextPage: skip + limitNum < totalIncidents,
          hasPrevPage: parseInt(page) > 1
        }
      }
    });

  } catch (error) {
    console.error('Error getting incidents:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving incidents',
      error: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred'
    });
  }
});

// GET /api/incidents/:id - Get a specific incident by ID
router.get('/incidents/:id', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const incidentId = req.params.id;

    // Get user's client profile
    const clientProfile = await ClientProfile.findOne({ user: userId });
    if (!clientProfile) {
      return res.status(404).json({
        success: false,
        message: 'Client profile not found'
      });
    }

    // Get the specific incident
    const incident = await RiskIncident.findOne({
      _id: incidentId,
      clientProfile: clientProfile._id
    }).populate('clientProfile', 'companyName clientIndustry');

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: 'Incident not found'
      });
    }

    res.json({
      success: true,
      data: incident
    });

  } catch (error) {
    console.error('Error getting incident:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving incident',
      error: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred'
    });
  }
});

// GET /api/incidents/stats/summary - Get risk statistics summary
router.get('/incidents/stats/summary', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's client profile
    const clientProfile = await ClientProfile.findOne({ user: userId });
    if (!clientProfile) {
      return res.status(404).json({
        success: false,
        message: 'Client profile not found'
      });
    }

    // Get statistics
    const totalIncidents = await RiskIncident.countDocuments({ clientProfile: clientProfile._id });
    const riskIncidents = await RiskIncident.countDocuments({ 
      clientProfile: clientProfile._id, 
      'aiAnalysis.isRisk': true 
    });

    // Get risk category breakdown
    const categoryStats = await RiskIncident.aggregate([
      { $match: { clientProfile: clientProfile._id, 'aiAnalysis.isRisk': true } },
      { $group: { _id: '$aiAnalysis.riskCategory', count: { $sum: 1 } } }
    ]);

    // Get risk level breakdown
    const levelStats = await RiskIncident.aggregate([
      { $match: { clientProfile: clientProfile._id, 'aiAnalysis.isRisk': true } },
      { $group: { _id: '$aiAnalysis.riskLevel', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      data: {
        totalIncidents,
        riskIncidents,
        noRiskIncidents: totalIncidents - riskIncidents,
        riskPercentage: totalIncidents > 0 ? Math.round((riskIncidents / totalIncidents) * 100) : 0,
        categoryBreakdown: categoryStats,
        levelBreakdown: levelStats
      }
    });

  } catch (error) {
    console.error('Error getting incident stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving incident statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred'
    });
  }
});

module.exports = router;

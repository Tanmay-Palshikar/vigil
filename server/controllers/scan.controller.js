// Import all necessary components: Models, Services, and Utilities
const ClientProfile = require('../models/clientProfile.model.js');
const RiskIncident = require('../models/riskIncident.model.js');
const { analyzeWithFailover } = require('../services/aiRouter.service.js');
const { scrapeUrl } = require('../services/scraping.service.js');
const { checkSslExpiration } = require('../services/ssl.service.js');
const { validateAndNormalizeAiResponse } = require('../utils/ai.validator.js');

class ScanController {
  /**
   * Orchestrates the entire scanning process for a user's monitored URLs.
   * It now uses the AI Router for resilient analysis.
   */
  async startScan(req, res) {
    try {
      const userId = req.user.id;
      console.log(`[ScanController] Scan initiated for user: ${userId}`);

      // 1. Get the user's profile
      const clientProfile = await ClientProfile.findOne({ user: userId });
      if (!clientProfile || !clientProfile.monitoredUrls || clientProfile.monitoredUrls.length === 0) {
        return res.status(400).json({ status: 'error', message: 'Client profile not found or no URLs to monitor.' });
      }

      const createdIncidents = [];
      const errors = [];
      const clientContext = {
        clientIndustry: clientProfile.clientIndustry,
        monitoredComplianceRegs: clientProfile.monitoredComplianceRegs || [],
      };

      // Process each URL for both text and SSL risks in parallel for efficiency
      const scanPromises = clientProfile.monitoredUrls.map(async (url) => {
        // --- Scan 1: Text-Based Risk Analysis ---
        try {
          console.log(`[ScanController] Starting text scan for ${url}`);
          const textContent = await scrapeUrl(url);
          if (textContent) {
            const analysisResult = await analyzeWithFailover(textContent, clientContext);
            const validatedResult = validateAndNormalizeAiResponse(analysisResult);
            if (validatedResult.isRisk) {
              const incident = new RiskIncident({
                clientProfile: clientProfile._id,
                sourceUrl: url,
                scrapedContentSnippet: textContent.substring(0, 1000),
                aiAnalysis: validatedResult,
              });
              const savedIncident = await incident.save();
              createdIncidents.push(savedIncident._id);
            }
          }
        } catch (error) {
          console.error(`Error processing text scan for URL ${url}:`, error.message);
          errors.push({ url, type: 'Text Scan', error: error.message });
        }

        // --- Scan 2: SSL Expiration Risk Analysis ---
        try {
          console.log(`[ScanController] Starting SSL scan for ${url}`);
          const sslResult = await checkSslExpiration(url);
          if (sslResult.isExpiringSoon) {
            const sslRiskPrompt = `Analyze the following critical security risk: The SSL certificate for our website (${url}) is expiring in only ${sslResult.daysRemaining} days. This poses a high-priority security risk.`;
            const analysisResult = await analyzeWithFailover(sslRiskPrompt, clientContext);
            const validatedResult = validateAndNormalizeAiResponse(analysisResult);
            if (validatedResult.isRisk) {
              const incident = new RiskIncident({
                clientProfile: clientProfile._id,
                sourceUrl: url,
                aiAnalysis: validatedResult,
              });
              const savedIncident = await incident.save();
              createdIncidents.push(savedIncident._id);
            }
          }
        } catch (error) {
          console.error(`Error processing SSL scan for URL ${url}:`, error.message);
          errors.push({ url, type: 'SSL Scan', error: error.message });
        }
      });

      await Promise.all(scanPromises);

      console.log(`[ScanController] Scan complete. Found ${createdIncidents.length} new incidents.`);
      res.status(200).json({
        status: 'ok',
        createdCount: createdIncidents.length,
        incidentIds: createdIncidents,
        errors,
      });

    } catch (error) {
      console.error('Fatal error in startScan controller:', error);
      res.status(500).json({ status: 'error', message: 'An unexpected error occurred during the scan.' });
    }
  }

  /**
   * Retrieves the scan history (risk incidents) for the authenticated user.
   */
  async getScanHistory(req, res) {
    try {
      const userId = req.user.id;
      const clientProfile = await ClientProfile.findOne({ user: userId });

      if (!clientProfile) {
        return res.status(404).json({ success: false, message: 'Client profile not found' });
      }

      const incidents = await RiskIncident.find({ clientProfile: clientProfile._id })
        .sort({ createdAt: -1 })
        .limit(parseInt(req.query.limit, 10) || 50);

      res.status(200).json({ success: true, data: incidents });
    } catch (error) {
      console.error('Error in getScanHistory:', error);
      res.status(500).json({ success: false, message: 'Error retrieving scan history' });
    }
  }
}

module.exports = new ScanController();


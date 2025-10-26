const ClientProfile = require('../models/clientProfile.model.js');
const RiskIncident = require('../models/riskIncident.model.js');
// The only AI service function we need now is discoverRisks
const { discoverRisks } = require('../services/ai.service.js');
const { validateAndNormalizeAiResponse } = require('../utils/ai.validator.js');
const { checkSslExpiration } = require('../services/ssl.service.js');

class ScanController {
    /**
     * @route POST api/scan/start
     * @desc Orchestrates the Client-Guided Intelligent Scan.
     */
    initiateScan = async (req, res) => {
        const { companyName, primaryWebsiteUrl, trustedUrls } = req.body;
        const userId = req.user.id;

        console.log(`[ScanController] Intelligent Scan initiated for user: ${userId} on ${companyName}`);

        try {
            const clientProfile = await ClientProfile.findOne({ user: userId });
            if (!clientProfile) {
                return res.status(404).json({ status: 'error', message: 'Client profile not found.' });
            }

            const createdIncidents = [];
            const errors = [];
            const clientContext = {
                clientName: companyName,
                clientIndustry: clientProfile.clientIndustry,
                monitoredComplianceRegs: clientProfile.monitoredComplianceRegs || [],
            };

            // Process sequentially to avoid API rate limits
            console.log(`[ScanController] Starting SSL check on primary site: ${primaryWebsiteUrl}`);
            const sslIds = await this._processSslChecks([primaryWebsiteUrl], clientProfile._id, errors);
            createdIncidents.push(...sslIds);

            // 2. Loop through each trusted site and perform a targeted search (sequential)
            if (trustedUrls && trustedUrls.length > 0) {
                console.log(`[ScanController] Starting targeted search on ${trustedUrls.length} trusted sites...`);
                for (const siteUrl of trustedUrls) {
                    try {
                        const domain = new URL(siteUrl).hostname.replace('www.', '');
                        const ids = await this._processAiAnalysis(companyName, clientContext, clientProfile._id, domain, errors);
                        createdIncidents.push(...ids);
                    } catch (urlError) {
                        console.error(`Invalid URL in trustedUrls: ${siteUrl}`);
                        errors.push({ url: siteUrl, type: 'URL Parsing', error: 'Invalid URL format.' });
                    }
                }
            }

            // 3. General Risk Discovery Search (searches the entire web)
            console.log(`[ScanController] Starting general Risk Discovery Search for ${companyName}...`);
            const generalIds = await this._processAiAnalysis(companyName, clientContext, clientProfile._id, null, errors);
            createdIncidents.push(...generalIds);

            console.log(`[ScanController] Scan complete. Found ${createdIncidents.length} new incidents.`);
            return res.status(200).json({
                status: 'ok',
                createdCount: createdIncidents.length,
                incidentIds: createdIncidents,
                errors,
            });

        } catch (error) {
            console.error('Fatal error in initiateScan controller:', error);
            res.status(500).json({ status: 'error', message: 'An unexpected error occurred during the intelligent scan.' });
        }
    }

    /**
     * Helper function to execute AI analysis and save incidents.
     */
    _processAiAnalysis = async (companyName, clientContext, clientProfileId, searchSite, errors) => {
        const incidentIds = [];
        try {
            const analysisResults = await discoverRisks(companyName, clientContext, searchSite);

            for (const result of analysisResults) {
                const validatedResult = validateAndNormalizeAiResponse(result);
                if (validatedResult && validatedResult.riskLevel !== 'None') {
                    const incident = new RiskIncident({
                        clientProfile: clientProfileId,
                        sourceUrl: validatedResult.sourceUrl,
                        aiAnalysis: validatedResult,
                    });
                    const savedIncident = await incident.save();
                    incidentIds.push(savedIncident._id);
                }
            }
        } catch (error) {
            console.error(`Error in AI processing for site "${searchSite || 'any'}":`, error.message);
            errors.push({ site: searchSite || 'General Web Search', type: 'AI Analysis', error: error.message });
        }
        return incidentIds;
    }

    /**
     * Helper function to execute SSL checks.
     */
    _processSslChecks = async (urls, clientProfileId, errors) => {
        const incidentIds = [];
        const sslPromises = urls.map(async (url) => {
             try {
                const sslResult = await checkSslExpiration(url);
                if (sslResult.isExpiringSoon) {
                    const sslRiskPrompt = `The SSL certificate for the primary website (${url}) is expiring in only ${sslResult.daysRemaining} days.`;
                    const incident = new RiskIncident({
                        clientProfile: clientProfileId,
                        sourceUrl: url,
                        aiAnalysis: {
                            isRisk: true,
                            riskCategory: "Security",
                            riskLevel: "High",
                            justification: sslRiskPrompt,
                            mitigationStrategy: "Renew SSL certificate immediately."
                        },
                    });
                    const savedIncident = await incident.save();
                    incidentIds.push(savedIncident._id);
                }
            } catch (error) {
                console.error(`Error processing SSL scan for URL ${url}:`, error.message);
                errors.push({ url, type: 'SSL Scan', error: error.message });
            }
        });
        await Promise.all(sslPromises);
        return incidentIds;
    }

    /**
     * Retrieves the scan history.
     */
    getScanHistory = async (req, res) => {
        try {
            const clientProfile = await ClientProfile.findOne({ user: req.user.id });
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

    /**
     * Checks SSL status for a single URL.
     */
    checkSslStatus = async (req, res) => {
        const { url } = req.body;
        if (!url) {
            return res.status(400).json({ error: 'URL is required.' });
        }
        try {
            const sslResult = await checkSslExpiration(url);
            res.status(200).json(sslResult);
        } catch (error) {
            console.error(`Error checking SSL status for ${url}:`, error);
            res.status(500).json({ error: 'Failed to check SSL status.' });
        }
    }
}

module.exports = new ScanController();


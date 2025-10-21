// --- VALIDATION FOR THE /api/scan/start ROUTE ---
exports.validateScanRequest = (req, res, next) => {
    const { companyName, primaryWebsiteUrl, trustedUrls } = req.body; 
    const urlRegex = /^(http|https):\/\/[^ "]+$/;

    if (!companyName || !primaryWebsiteUrl || trustedUrls === undefined || trustedUrls === null) {
        return res.status(400).json({
            message: "Scan request failed. 'companyName', 'primaryWebsiteUrl', and 'trustedUrls' are all required."
        });
    }

    if (typeof companyName !== 'string' || !Array.isArray(trustedUrls) || typeof primaryWebsiteUrl !== 'string') {
        return res.status(400).json({
            message: "Invalid data types. 'companyName' must be a string, 'trustedUrls' an array, and 'primaryWebsiteUrl' a string."
        });
    }
    
    if (!urlRegex.test(primaryWebsiteUrl)) {
        return res.status(400).json({
            message: "Invalid format for 'primaryWebsiteUrl'. Must be a valid URL starting with http/https."
        });
    }

    for (const url of trustedUrls) {
        if (typeof url !== 'string' || !urlRegex.test(url)) {
            return res.status(400).json({
                message: `Invalid URL found in 'trustedUrls': ${url}`
            });
        }
    }
    next();
};


// --- VALIDATION FOR AI JSON OUTPUT ---
const validRiskCategories = ["Reputational", "Security", "Compliance", "None"];
const validRiskLevels = ["High", "Medium", "Low", "None"];

exports.validateAndNormalizeAiResponse = (aiResponse) => {
    if (!aiResponse || typeof aiResponse.isRisk !== 'boolean') {
        console.warn('[Validator] Invalid AI response: Missing or invalid isRisk property.', aiResponse);
        return null;
    }

    if (!aiResponse.isRisk) {
        return {
            isRisk: false,
            riskCategory: "None",
            riskLevel: "None",
            justification: aiResponse.justification || "No risk identified by AI.",
            mitigationStrategy: aiResponse.mitigationStrategy || "No action required.",
        };
    }

    const normalized = {
        isRisk: true,
        riskCategory: validRiskCategories.includes(aiResponse.riskCategory) ? aiResponse.riskCategory : "None",
        riskLevel: validRiskLevels.includes(aiResponse.riskLevel) ? aiResponse.riskLevel : "None",
        justification: aiResponse.justification || "Justification not provided by AI.",
        mitigationStrategy: aiResponse.mitigationStrategy || "Mitigation strategy not provided by AI.",
        sourceUrl: aiResponse.sourceUrl || 'Unknown Source via AI'
    };
    
    return normalized;
};


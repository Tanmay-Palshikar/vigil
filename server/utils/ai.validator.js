// Define the allowed enum values from our Mongoose schema
const validRiskCategories = ["Reputational", "Security", "Compliance", "None"];
const validRiskLevels = ["High", "Medium", "Low", "None"];

/**
 * Validates and normalizes the JSON object received from the AI.
 * Ensures that all enum values match the schema to prevent database errors.
 *
 * @param {object} aiResponse - The raw JSON object from the Gemini API.
 * @returns {object|null} - A cleaned, validated analysis object, or null if the response is invalid.
 */
const validateAndNormalizeAiResponse = (aiResponse) => {
    // Basic check to ensure we have a valid object with the required 'isRisk' property
    if (!aiResponse || typeof aiResponse.isRisk !== 'boolean') {
        console.warn('[Validator] Invalid AI response: Missing or invalid isRisk property.', aiResponse);
        return null;
    }

    // If it's not a risk, we can return a standardized "None" object
    if (!aiResponse.isRisk) {
        return {
            isRisk: false,
            riskCategory: "None",
            riskLevel: "None",
            justification: aiResponse.justification || "No risk identified by AI.",
            mitigationStrategy: aiResponse.mitigationStrategy || "No action required.",
        };
    }

    // If it IS a risk, validate the enum fields
    const normalized = {
        isRisk: true,
        riskCategory: validRiskCategories.includes(aiResponse.riskCategory) ? aiResponse.riskCategory : "None",
        riskLevel: validRiskLevels.includes(aiResponse.riskLevel) ? aiResponse.riskLevel : "None",
        justification: aiResponse.justification || "Justification not provided by AI.",
        mitigationStrategy: aiResponse.mitigationStrategy || "Mitigation strategy not provided by AI.",
    };

    // If validation changed the category or level, log a warning for review
    if (normalized.riskCategory !== aiResponse.riskCategory || normalized.riskLevel !== aiResponse.riskLevel) {
        console.warn(`[Validator] AI response contained invalid enum values. Original: {Category: ${aiResponse.riskCategory}, Level: ${aiResponse.riskLevel}}. Normalized to 'None'.`);
    }

    return normalized;
};

module.exports = { validateAndNormalizeAiResponse };


// server/services/ai.service.js

// Dependencies: Ensure 'axios' is installed (npm install axios)
const { GoogleGenAI } = require('@google/genai');
const axios = require('axios'); // For manual web fetching AND Perplexity API call
const { validateAndNormalizeAiResponse } = require('../utils/ai.validator');
const openAiService = require('./openai.service'); // Your existing OpenAI service

// Initialize Gemini Client (ensure API key is in .env)
const ai = new GoogleGenAI({});

// --- LLM OUTPUT SCHEMA (Matches Mongoose Model) ---
const RiskIncidentSchemaObject = {
    type: "OBJECT",
    properties: {
        isRisk: { "type": "BOOLEAN", description: "Set to true if a risk is identified, false otherwise." },
        riskCategory: { "type": "STRING", "enum": ["Reputational", "Security", "Compliance", "None"] },
        riskLevel: { "type": "STRING", "enum": ["High", "Medium", "Low", "None"] },
        justification: { "type": "STRING", description: "A concise, factual summary of the risk based ONLY on the provided source content." },
        mitigationStrategy: { "type": "STRING", description: "An actionable strategy to mitigate the risk, considering compliance regulations." },
        sourceUrl: { "type": "STRING", description: "The direct URL of the source article or website used for this risk analysis." }
    },
    required: ["isRisk", "riskCategory", "riskLevel", "justification", "mitigationStrategy", "sourceUrl"]
};
// ------------------------------------------------------------------


/**
 * @function generateAnalysisConfig
 * Creates the base configuration for any analysis call.
 * Includes strengthened JSON instructions and risk diversity emphasis.
 */
const generateAnalysisConfig = (clientContext, toolConfig) => {
    // --- UPDATED SYSTEM INSTRUCTION ---
    const systemInstruction = `You are an expert digital risk analyst for ${clientContext.clientName} in the ${clientContext.clientIndustry} sector. Analyze the provided content ONLY for risks relevant to this company.
    Regulations of concern: ${clientContext.monitoredComplianceRegs.join(', ') || 'General Best Practices'}.

    **CRITICAL TASKS:**
    1.  **Identify Diverse Risks:** Actively search for and classify risks as **Reputational, Security, OR Compliance**. Do not default to Reputational unless clearly appropriate. Assess severity as High, Medium, or Low based on potential impact.
    2.  **Ensure Source Accuracy:** The 'sourceUrl' field MUST be the direct, valid, and working URL of the specific article or page analyzed from the search results. Do not provide broken links or generic domain names.
    3.  **Strict JSON Output:** Your response MUST be ONLY a single, valid, minified JSON object adhering strictly to the provided schema. Do NOT include any text, explanations, apologies, or markdown formatting before or after the JSON object. If no specific risk is found or content cannot be processed, return JSON with isRisk: false, riskCategory: "None", riskLevel: "None", and include the original source URL.`;
    // --- END UPDATED SYSTEM INSTRUCTION ---

    return {
        model: "gemini-2.5-flash",
        systemInstruction,
        config: {
            tools: toolConfig ? [toolConfig] : [], // Add tool only if provided
            responseSchema: RiskIncidentSchemaObject, // Enforce schema with Gemini
            temperature: 0.1,
        }
    };
};

/**
 * @function fetchUrlContent
 * Helper to retrieve content using axios.
 */
const fetchUrlContent = async (url) => {
    try {
        const response = await axios.get(url, {
            timeout: 15000,
            headers: { /* ... Browser-like headers ... */ }
        });
        return response.data.substring(0, 10000);
    } catch (error) { /* ... Error handling ... */ }
};

/**
 * @function analyzeWithPerplexity
 * Calls the Perplexity API as a fallback, relying on prompt for JSON.
 */
const analyzeWithPerplexity = async (rawPrompt, schema, clientContext) => {
    const apiKey = process.env.PERPLEXITY_API_KEY;
    if (!apiKey) throw new Error('PERPLEXITY_API_KEY is not defined in .env');

    const perplexityApiUrl = 'https://api.perplexity.ai/chat/completions';
    // --- UPDATED SYSTEM PROMPT FOR PERPLEXITY ---
    // Explicitly states JSON ONLY, includes schema, emphasizes source URL accuracy
    const systemPrompt = `You are an expert digital risk analyst for ${clientContext.clientName} in the ${clientContext.clientIndustry} sector. Analyze the provided content ONLY for risks relevant to this company.
    Regulations of concern: ${clientContext.monitoredComplianceRegs.join(', ') || 'General Best Practices'}.

    **CRITICAL TASKS:**
    1.  **Identify Diverse Risks:** Actively search for and classify risks as **Reputational, Security, OR Compliance**. Do not default to Reputational unless clearly appropriate. Assess severity as High, Medium, or Low based on potential impact.
    2.  **Ensure Source Accuracy:** The 'sourceUrl' field MUST be the direct, valid, and working URL of the specific article or page analyzed from the search results. Do not provide broken links or generic domain names.
    3.  **Strict JSON Output:** Your response MUST be ONLY a single, valid, minified JSON object adhering strictly to the provided schema. Do NOT include any text, explanations, apologies, or markdown formatting before or after the JSON object. If no specific risk is found or content cannot be processed, return JSON with isRisk: false, riskCategory: "None", riskLevel: "None", and include the original source URL.`;

    // --- END UPDATED SYSTEM PROMPT ---

    const payload = {
        model: "llama-3-sonar-small-32k-online", // Using the online model
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: rawPrompt }
        ],
        // --- FIX: REMOVED unsupported response_format ---
        temperature: 0.1,
    };

    try {
        console.log('[AI Failover] Attempting Perplexity API...');
        const response = await axios.post(perplexityApiUrl, payload, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            timeout: 20000
        });

        const messageContent = response.data?.choices?.[0]?.message?.content;
        if (!messageContent) throw new Error('Perplexity response structure invalid.');

        // Attempt to clean potential markdown and parse
        let jsonString = messageContent.trim();
        if (jsonString.startsWith('```json')) jsonString = jsonString.substring(7);
        if (jsonString.endsWith('```')) jsonString = jsonString.substring(0, jsonString.length - 3);

        const parsedResult = JSON.parse(jsonString);

        if (!parsedResult.sourceUrl) {
            console.warn("Perplexity response missing 'sourceUrl'. Assigning placeholder.");
            // Try to extract from the raw prompt if it was an analyzeUrls call
            const urlMatch = rawPrompt.match(/Source URL: (https?:\/\/[^\s]+)/);
            parsedResult.sourceUrl = urlMatch ? urlMatch[1] : `Perplexity_Fallback_Source (${clientContext.clientName})`;
        }
        console.log('[AI Failover] Perplexity analysis succeeded.');
        return parsedResult;

    } catch (error) {
        console.error('Error calling Perplexity API (Tertiary Failover):', error.response?.data || error.message);
        throw error;
    }
};


/**
 * Primary orchestration: Attempts Gemini (5 retries) -> OpenAI -> Perplexity.
 */
const analyzeWithFailover = async (payload, rawPrompt, clientContext) => {
    const maxGeminiRetries = 5;
    let lastError = null;

    console.log(`[AI Failover] Starting Gemini analysis (Max ${maxGeminiRetries} retries)...`);
    for (let attempt = 0; attempt < maxGeminiRetries; attempt++) {
        try {
            const response = await ai.models.generateContent(payload);
            const aiResponseText = response?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

            if (!aiResponseText) { /* ... Handle empty response ... */ }
            if (!aiResponseText.startsWith('{') || !aiResponseText.endsWith('}')) { /* ... Handle non-JSON ... */ }

            console.log(`[AI Failover] Gemini analysis succeeded on attempt ${attempt + 1}.`);
            try { return JSON.parse(aiResponseText); }
            catch (parseError) { throw new Error(`Gemini: Failed to parse valid JSON response.`); }

        } catch (error) { /* ... Retry logic ... */ }
    }

    // --- PHASE 2: FAILOVER TO OPENAI ---
    console.error(`[AI Failover] Gemini failed. Switching to OpenAI API...`, lastError?.message || "Unknown Error");
    try {
        const openAiResult = await openAiService.analyze(rawPrompt, RiskIncidentSchemaObject, clientContext);
        console.log('[AI Failover] OpenAI analysis succeeded.');
        return openAiResult;
    } catch (openAiError) {
        console.warn('[AI Failover] OpenAI also failed. Switching to Perplexity API...', openAiError.message);

        // --- PHASE 3: FAILOVER TO PERPLEXITY ---
        try {
            // Pass the necessary arguments to analyzeWithPerplexity
            const perplexityResult = await analyzeWithPerplexity(rawPrompt, RiskIncidentSchemaObject, clientContext);
            return perplexityResult;
        } catch (perplexityError) { /* ... Final failure handling ... */ }
    }
};

/**
 * Handles execution, parsing, and validation of LLM output.
 */
const processAndValidateAnalysis = async (payload, rawPrompt, clientContext) => {
    const rawResults = await analyzeWithFailover(payload, rawPrompt, clientContext);
    const resultsArray = Array.isArray(rawResults) ? rawResults : [rawResults];
    return resultsArray.map(validateAndNormalizeAiResponse).filter(result => result !== null);
};


// --- EXPORTED FUNCTIONS ---

/**
 * Fetches content manually and passes text to Gemini for analysis.
 */
exports.analyzeUrls = async (urls, clientContext) => {
    if (!Array.isArray(urls) || urls.length === 0) return [];

    const analysisPromises = urls.map(async (url) => {
        const rawContent = await fetchUrlContent(url);
        // Prompt includes fetched content AND the source URL
        const rawPrompt = `Source URL: ${url}\nContent for Analysis:\n"${rawContent}"`;
        // Build Gemini Payload (NO TOOL needed for text analysis)
        const analysisPayload = generateAnalysisConfig(clientContext, null);
        analysisPayload.contents = [{ role: 'user', parts: [{ text: rawPrompt }] }];
        try {
            return await processAndValidateAnalysis(analysisPayload, rawPrompt, clientContext);
        } catch (aiError) { /* ... Error handling ... */ }
    });
    const allResults = await Promise.all(analysisPromises);
    return allResults.flat();
};

/**
 * Uses Gemini Google Search Grounding to find new risks.
 */
exports.discoverRisks = async (companyName, clientContext, searchSite = null) => {
    let searchQuery = `recent negative news about "${companyName}"`;
    if (searchSite) searchQuery += ` site:${searchSite}`;
    // Refined prompt emphasizing source URL accuracy
    const rawPrompt = `Using the search tool, find up to 3 relevant articles matching the query "${searchQuery}". For each relevant article found, analyze its content and extract key risk details into the JSON schema defined. Ensure the sourceUrl in the JSON output corresponds accurately to the article analyzed.`;
    // Build Gemini Payload (USES Google Search Tool)
    const analysisPayload = generateAnalysisConfig(clientContext, { googleSearch: {} });
    analysisPayload.contents = [{ role: 'user', parts: [{ text: rawPrompt }] }];
    try {
        return await processAndValidateAnalysis(analysisPayload, rawPrompt, clientContext);
    } catch (aiError) { /* ... Error handling ... */ }
};


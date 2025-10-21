// server/services/ai.service.js

const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
const { validateAndNormalizeAiResponse } = require('../utils/ai.validator');
const openAiService = require('./openai.service');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// LLM Output Schema (Matches Mongoose Model)
const RiskIncidentSchemaObject = {
    type: "object",
    properties: {
        isRisk: { type: "boolean" },
        riskCategory: { type: "string", enum: ["Reputational", "Security", "Compliance", "None"] },
        riskLevel: { type: "string", enum: ["High", "Medium", "Low", "None"] },
        justification: { type: "string" },
        mitigationStrategy: { type: "string" },
        sourceUrl: { type: "string" }
    },
    required: ["isRisk", "riskCategory", "riskLevel", "justification", "mitigationStrategy", "sourceUrl"]
};

/**
 * Creates the base configuration for any analysis call.
 */
const generateAnalysisConfig = (clientContext) => {
    const systemInstruction = `You are an expert digital risk analyst for ${clientContext.clientName}. Your response MUST be ONLY a single, valid, minified JSON object adhering strictly to the provided schema. Do NOT include any text before or after the JSON.`;

    return {
        systemInstruction,
        generationConfig: {
            temperature: 0.1,
            responseMimeType: "application/json",
            responseSchema: RiskIncidentSchemaObject,
        },
        tools: [{ googleSearch: {} }] // Google Search is always enabled for this service now
    };
};

/**
 * Primary orchestration: Attempts Gemini (5 retries), then switches to OpenAI.
 */
const analyzeWithFailover = async (prompt, clientContext) => {
    const maxGeminiRetries = 5;
    let lastError = null;

    console.log(`[AI Failover] Starting Gemini analysis (Max ${maxGeminiRetries} retries)...`);
    
    for (let attempt = 0; attempt < maxGeminiRetries; attempt++) {
        try {
            const config = generateAnalysisConfig(clientContext);
            const model = genAI.getGenerativeModel({
                model: "gemini-2.0-flash-exp",
                ...config
            });

            const result = await model.generateContent(prompt);
            const response = result.response;
            const aiResponseText = response.text().trim();

            if (!aiResponseText || !aiResponseText.startsWith('{') || !aiResponseText.endsWith('}')) {
                throw new Error(`Gemini: Response is not valid JSON. Content: "${aiResponseText?.substring(0, 80)}..."`);
            }

            console.log(`[AI Failover] Gemini analysis succeeded on attempt ${attempt + 1}.`);
            return JSON.parse(aiResponseText);

        } catch (error) {
            lastError = error;
            const delay = Math.pow(2, attempt) * 1000 + Math.random() * 500;
            console.warn(`[Gemini Error] Attempt ${attempt + 1}/${maxGeminiRetries} failed. Retrying in ${(delay / 1000).toFixed(1)}s...`, error.message);
            
            if (attempt < maxGeminiRetries - 1) {
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    console.error(`[AI Failover] Gemini failed after ${maxGeminiRetries} retries. Switching to OpenAI API...`, lastError?.message);

    try {
        const openAiResult = await openAiService.analyze(prompt, RiskIncidentSchemaObject, clientContext);
        console.log('[AI Failover] OpenAI analysis succeeded.');
        return openAiResult;
    } catch (openAiError) {
        console.error('CRITICAL FAILURE: OpenAI also failed.', openAiError.message);
        throw new Error(`AI System Unavailable. Both Gemini and OpenAI failed: ${openAiError.message}`);
    }
};

/**
 * Handles execution, parsing, and validation of LLM output.
 */
const processAndValidateAnalysis = async (prompt, clientContext) => {
    const rawResults = await analyzeWithFailover(prompt, clientContext);
    const resultsArray = Array.isArray(rawResults) ? rawResults : [rawResults];
    return resultsArray.map(validateAndNormalizeAiResponse).filter(result => result !== null);
};

// --- EXPORTED FUNCTION FOR SCAN CONTROLLER ---

/**
 * @function discoverRisks
 * Uses Gemini Google Search to find new risks, with an optional site constraint.
 * @param {string} companyName - The company to search for.
 * @param {object} clientContext - Context for the AI prompt.
 * @param {string|null} searchSite - An optional domain to limit the search to (e.g., 'indiatoday.in').
 */
exports.discoverRisks = async (companyName, clientContext, searchSite = null) => {
    // Construct the search query with the site constraint if it exists
    let searchQuery = `recent negative news about "${companyName}"`;
    if (searchSite) {
        searchQuery += ` site:${searchSite}`;
    }

    const prompt = `Using the search tool, find up to 3 relevant articles matching the query "${searchQuery}". For each relevant article found, analyze its content and extract any key risk details into the JSON schema defined.`;

    try {
        // The 'useGoogleSearch' flag is no longer needed as the tool is always on for this service
        return await processAndValidateAnalysis(prompt, clientContext);
    } catch (aiError) {
         console.error(`[discoverRisks] AI pipeline failed for ${companyName} at site ${searchSite || 'any'}:`, aiError.message);
         return [];
    }
};


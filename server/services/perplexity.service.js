// server/services/perplexity.service.js

const axios = require('axios');

// This is the URL you were missing
const PPLX_API_URL = 'https://api.perplexity.ai/chat/completions';

// Ensure this is in your .env file
const PERPLEXITY_API_KEY = process.env.PPLX_API_KEY;

/**
 * @function analyze
 * Receives a prompt and sends it to the Perplexity API using axios.
 */
exports.analyze = async (rawPrompt, schema, clientContext) => {
    if (!PERPLEXITY_API_KEY) {
        throw new Error("Perplexity API key (PERPLEXITY_API_KEY) is not set in .env");
    }

    // The rawPrompt coming from ai.service.js already contains:
    // 1. The full system instruction
    // 2. The JSON schema (as text)
    // 3. The original user request (the URL content or discovery query)

    const payload = {
        model: "sonar", // Using an online model for web-connected analysis
        messages: [
            { role: "user", content: rawPrompt }
        ],
        temperature: 0.1, // Keep it factual
    };

    try {
        const response = await axios.post(PPLX_API_URL, payload, {
            headers: {
                'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            timeout: 30000 // 30-second timeout
        });

        const content = response.data?.choices?.[0]?.message?.content;

        if (!content) {
            throw new Error("Perplexity: Invalid response structure or empty content.");
        }

        // Return the raw text. The extractor in ai.service.js will parse it.
        return content;

    } catch (error) {
        let errorMsg = "Perplexity API Error";
        if (error.response) {
            errorMsg = `Perplexity Error: ${error.response.status}. Details: ${JSON.stringify(error.response.data)}`;
        } else if (error.request) {
            errorMsg = `Perplexity Error: No response received. ${error.message}`;
        } else {
            errorMsg = `Perplexity Error: ${error.message}`;
        }
        console.error(`[Perplexity Service] ${errorMsg}`);
        throw new Error(errorMsg);
    }
};
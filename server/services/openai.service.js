// server/services/openai.service.js

const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * @function analyzeWithOpenAI
 * Analyzes text using the OpenAI GPT model as a fallback.
 */
const analyzeWithOpenAI = async (rawPrompt, schema, clientContext) => {
    if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY is not defined.');
    }

    const systemPrompt = `You are an expert digital risk analyst specializing in the ${clientContext.clientIndustry} sector for company ${clientContext.clientName}. Analyze the following content. Your response MUST be a single, minified JSON object that strictly conforms to this schema: ${JSON.stringify(schema)}. The user is concerned with these regulations: ${clientContext.monitoredComplianceRegs.join(', ')}. Ensure all fields, including 'sourceUrl', are populated with real data.`;

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini", // Efficient fallback model
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: rawPrompt } // Raw prompt contains the search instruction
            ],
            response_format: { type: "json_object" },
            timeout: 10000, 
        });

        const result = response.choices[0].message.content;
        const parsedResult = JSON.parse(result);

        if (!parsedResult.sourceUrl) {
            console.warn("OpenAI response is missing the critical 'sourceUrl' field. Using fallback source.");
            parsedResult.sourceUrl = "OpenAI_Fallback_Search_Source_Required";
        }
        
        return parsedResult;
    } catch (error) {
        console.error('Error calling OpenAI API (Secondary Failover):', error);
        throw error; 
    }
};

// EXPORT FIX: Correctly export the analyze function
module.exports = { analyze: analyzeWithOpenAI };
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Analyzes text using the OpenAI GPT model as a fallback.
 * It is specifically prompted to return data in the same schema as the primary Gemini service.
 * @param {string} textContent - The text to analyze.
 * @param {object} clientContext - The client's industry and compliance context.
 * @returns {Promise<object>} The structured AI analysis object.
 */
const analyzeWithOpenAI = async (textContent, clientContext) => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not defined.');
  }

  const systemPrompt = `You are an expert digital risk analyst. Analyze the following text. Your response MUST be a single, minified JSON object that strictly conforms to this schema: {"type":"OBJECT","properties":{"isRisk":{"type":"BOOLEAN"},"riskCategory":{"type":"STRING","enum":["Reputational","Security","Compliance","None"]},"riskLevel":{"type":"STRING","enum":["High","Medium","Low","None"]},"justification":{"type":"STRING"},"mitigationStrategy":{"type":"STRING"}}}. The user is in the ${clientContext.clientIndustry} sector and is concerned with these regulations: ${clientContext.monitoredComplianceRegs}.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: textContent }
      ],
      response_format: { type: "json_object" },
    });

    const result = response.choices[0].message.content;
    return JSON.parse(result);
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    throw error; // Re-throw the error to be caught by the AI Router
  }
};

module.exports = { analyzeWithOpenAI };

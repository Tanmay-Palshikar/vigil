const analyze = async (textContent, clientContext) => {
  // This is the hardcoded response that will be used as a fallback if the live API fails.
  const fallbackResponse = {
    isRisk: true,
    riskCategory: "Reputational",
    riskLevel: "High",
    justification: "[FALLBACK] A simulated analysis indicates a potential reputational risk based on a negative news article concerning the company's recent activities.",
    mitigationStrategy: "[FALLBACK] It is recommended to prepare a public relations statement and monitor social media for related sentiment."
  };

  // --- Live API Call with Automatic Fallback Logic ---
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('FATAL ERROR: GEMINI_API_KEY is not defined in the .env file.');
      throw new Error('GEMINI_API_KEY is not defined.');
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

    const systemInstruction = `You are an expert digital risk analyst specializing in the ${clientContext.clientIndustry} sector. Analyze the following text for risks. Your response MUST strictly adhere to the provided JSON schema. When generating the mitigationStrategy, it must be actionable, concise, and specifically consider the regulations listed here: ${clientContext.monitoredComplianceRegs}.`;

    const payload = {
      contents: [{ parts: [{ text: textContent }] }],
      systemInstruction: {
        parts: [{ text: systemInstruction }]
      },
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            isRisk: { "type": "BOOLEAN" },
            riskCategory: { "type": "STRING", "enum": ["Reputational", "Security", "Compliance", "None"] },
            riskLevel: { "type": "STRING", "enum": ["High", "Medium", "Low", "None"] },
            justification: { "type": "STRING" },
            mitigationStrategy: { "type": "STRING" }
          }
        }
      }
    };

    const maxRetries = 7;
    let lastError = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (response.status === 503) {
          const delay = Math.pow(2, attempt) * 1000;
          console.warn(`Gemini API is overloaded. Retrying in ${delay / 1000} seconds... (Attempt ${attempt + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          lastError = new Error(`Gemini API request failed with status 503 (Service Unavailable)`);
          continue;
        }

        if (!response.ok) {
          const errorBody = await response.text();
          console.error("Gemini API Error Response:", errorBody);
          throw new Error(`Gemini API request failed with status ${response.status}`);
        }

        const result = await response.json();
        const aiResponseText = result.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!aiResponseText) {
          throw new Error('Invalid or empty response structure from Gemini API.');
        }

        // If the live API call is successful, return the result.
        return JSON.parse(aiResponseText);

      } catch (error) {
        lastError = error;
        if (attempt < maxRetries - 1) {
            const delay = Math.pow(2, attempt) * 1000;
            console.warn(`An error occurred. Retrying in ${delay / 1000} seconds...`, error.message);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    // If all retries fail, throw the last recorded error to be caught by the outer block.
    throw lastError;

  } catch (finalError) {
    // --- AUTOMATIC FALLBACK ACTIVATED ---
    console.error('Gemini API call failed after all retries. Activating fallback response.', finalError.message);
    // Instead of failing, we return the high-quality mock response.
    return fallbackResponse;
  }
};

module.exports = { analyze };


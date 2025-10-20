const { analyze: analyzeWithGemini } = require('./ai.service.js');
const { analyzeWithOpenAI } = require('./openai.service.js');

/**
 * Analyzes text with a hot-failover mechanism.
 * It first attempts to use the primary provider (Gemini). If it fails after all retries,
 * it automatically switches to the secondary provider (OpenAI).
 * @param {string} textContent - The text to analyze.
 * @param {object} clientContext - The client's context.
 * @returns {Promise<object>} The structured AI analysis from the successful provider.
 */
const analyzeWithFailover = async (textContent, clientContext) => {
  try {
    console.log('[AIRouter] Attempting analysis with primary provider (Gemini)...');
    const geminiResult = await analyzeWithGemini(textContent, clientContext);
    console.log('[AIRouter] Primary provider (Gemini) succeeded.');
    return geminiResult;
  } catch (geminiError) {
    console.error('[AIRouter] Primary provider (Gemini) failed after all retries:', geminiError.message);
    console.warn('[AIRouter] Switching to secondary provider (OpenAI)...');
    
    try {
      const openAIResult = await analyzeWithOpenAI(textContent, clientContext);
      console.log('[AIRouter] Secondary provider (OpenAI) succeeded.');
      return openAIResult;
    } catch (openAIError) {
      console.error('[AIRouter] Secondary provider (OpenAI) also failed:', openAIError.message);
      // If both services fail, we throw the final error to be caught by the controller.
      throw new Error('Both primary and secondary AI providers failed to return an analysis.');
    }
  }
};

module.exports = { analyzeWithFailover };

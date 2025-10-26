// server/services/ai.service.js

const { GoogleGenAI } = require('@google/genai');
const axios = require('axios');
const { validateAndNormalizeAiResponse } = require('../utils/ai.validator.js');
const perplexityService = require('./perplexity.service.js');

const ai = new GoogleGenAI({});

// --- STRICT SCHEMA FOR STRUCTURED OUTPUT ---
const RiskIncidentSchemaObject = {
    type: "OBJECT",
    properties: {
        isRisk: { 
            type: "BOOLEAN",
            description: "true if risk identified, false otherwise"
        },
        riskCategory: { 
            type: "STRING",
            enum: ["Reputational", "Security", "Compliance", "None"],
            description: "Type of risk found"
        },
        riskLevel: { 
            type: "STRING",
            enum: ["High", "Medium", "Low", "None"],
            description: "Severity level"
        },
        justification: { 
            type: "STRING",
            description: "Specific description of the risk with date/details if available"
        },
        mitigationStrategy: { 
            type: "STRING",
            description: "Actionable recommendation to address this risk"
        },
        sourceUrl: { 
            type: "STRING",
            description: "Exact URL where this risk was found"
        }
    },
    required: ["isRisk", "riskCategory", "riskLevel", "justification", "mitigationStrategy", "sourceUrl"]
};

const RiskIncidentArraySchema = {
    type: "ARRAY",
    items: RiskIncidentSchemaObject,
    description: "Array of risk incidents. Empty array [] if no risks found."
};

/**
 * Generate Gemini configuration with strict instructions
 */
const generateGeminiConfig = (clientContext, useGoogleSearch = false) => {
    const systemInstruction = `You are a digital risk analyst for ${clientContext.clientName}.

RISK CLASSIFICATION GUIDE:
- **Reputational**: PR scandals, controversies, public backlash, privacy concerns, ethical issues, brand damage
- **Security**: Data breaches, hacking incidents, vulnerabilities, malware, cyberattacks, unauthorized access
- **Compliance**: Legal violations, lawsuits, regulatory fines, policy breaches, non-compliance penalties

STRICT RULES:
1. Classify EACH risk carefully based on its PRIMARY impact
2. Privacy controversies = Reputational (unless actual breach occurred)
3. Vulnerabilities/breaches = Security
4. Lawsuits/fines = Compliance
5. Base analysis ONLY on provided content
6. Include specific dates, amounts, or details when available
7. Return valid JSON array matching the exact schema
8. If no risks found, return empty array: []

OUTPUT FORMAT: JSON array only, no extra text.`;

    return {
        model: "gemini-2.0-flash-exp",
        systemInstruction,
        generationConfig: {
            temperature: 0.1,
            responseMimeType: "application/json",
            responseSchema: RiskIncidentArraySchema
        },
        tools: useGoogleSearch ? [{ googleSearch: {} }] : undefined
    };
};

/**
 * Fetch URL content with error handling
 */
const fetchUrlContent = async (url) => {
    try {
        const response = await axios.get(url, {
            timeout: 15000,
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            }
        });
        
        if (typeof response.data !== 'string') {
            throw new Error('Non-text content');
        }
        
        // Extract meaningful content, limit to 8000 chars
        return response.data.substring(0, 8000);
        
    } catch (error) {
        console.error(`[Fetch] Failed ${url}: ${error.message}`);
        return null;
    }
};

/**
 * Extract JSON from text response
 */
const extractJson = (text, apiName = "AI") => {
    if (!text || typeof text !== 'string') {
        throw new Error(`${apiName}: Empty response`);
    }

    // Check for "no results" indicators
    const lower = text.toLowerCase();
    if (lower.includes("no relevant negative") || 
        lower.includes("no recent negative") ||
        lower.includes("no risks found") ||
        lower.includes("unable to find")) {
        return [];
    }

    // Find JSON array or object
    let start = text.indexOf('[');
    let end = text.lastIndexOf(']');
    
    if (start === -1 || end === -1) {
        start = text.indexOf('{');
        end = text.lastIndexOf('}');
    }
    
    if (start === -1 || end === -1 || end < start) {
        console.warn(`[${apiName}] No JSON found in response:`, text.substring(0, 200));
        return [];
    }
    
    const jsonStr = text.substring(start, end + 1);
    
    try {
        const parsed = JSON.parse(jsonStr);
        return Array.isArray(parsed) ? parsed : [parsed];
    } catch (err) {
        console.error(`[${apiName}] JSON parse error:`, err.message);
        return [];
    }
};

/**
 * Transform Gemini's nested output structure if needed
 */
const normalizeGeminiOutput = (data) => {
    if (!Array.isArray(data) || data.length === 0) {
        return data;
    }

    const first = data[0];
    
    // Check for nested structure: { risksFound: [...], sourceUrl: "..." }
    if (first.risksFound && Array.isArray(first.risksFound)) {
        console.log('[Transform] Detected nested Gemini structure, flattening...');
        
        const flattened = [];
        data.forEach(item => {
            item.risksFound.forEach(risk => {
                flattened.push({
                    isRisk: true,
                    riskCategory: risk.riskType || risk.riskCategory || 'Compliance',
                    riskLevel: risk.riskLevel || 'Medium',
                    justification: risk.riskDescription || risk.justification || risk.description || 'Risk identified',
                    mitigationStrategy: risk.mitigationOrImplication || risk.mitigationStrategy || risk.mitigation || 'Review and address',
                    sourceUrl: item.sourceUrl || risk.sourceUrl || 'Unknown source'
                });
            });
        });
        
        console.log(`[Transform] Flattened ${flattened.length} risks`);
        return flattened;
    }
    
    return data;
};

/**
 * Validate output has correct schema
 */
const validateRiskSchema = (risk) => {
    const required = ['isRisk', 'riskCategory', 'riskLevel', 'justification', 'mitigationStrategy', 'sourceUrl'];
    const missing = required.filter(field => !(field in risk));
    
    if (missing.length > 0) {
        console.warn('[Validate] Missing fields:', missing, 'in risk:', risk);
        return false;
    }
    
    const validCategories = ['Reputational', 'Security', 'Compliance', 'None'];
    const validLevels = ['High', 'Medium', 'Low', 'None'];
    
    if (!validCategories.includes(risk.riskCategory)) {
        console.warn('[Validate] Invalid category:', risk.riskCategory);
        return false;
    }
    
    if (!validLevels.includes(risk.riskLevel)) {
        console.warn('[Validate] Invalid level:', risk.riskLevel);
        return false;
    }
    
    return true;
};

/**
 * Build optimized Perplexity prompt with classification guidance
 */
const buildPerplexityPrompt = (geminiPayload, context, companyName) => {
    const userContent = geminiPayload.contents?.[0]?.parts?.[0]?.text || '';
    
    // Check if this is a discovery search or URL analysis
    const isDiscovery = userContent.includes('Google Search');
    const urlMatch = userContent.match(/Source URL: (https?:\/\/[^\s\n]+)/);
    const contentMatch = userContent.match(/Content for Analysis:\s*["'](.+?)["']/s);
    
    if (isDiscovery && companyName) {
        // Discovery mode - search the web
        return `You have real-time internet access. Search the web NOW for recent negative news, security breaches, compliance issues, or controversies about "${companyName}".

CRITICAL INSTRUCTIONS:
1. Perform a web search for: "${companyName}" + "security breach" OR "compliance" OR "controversy" OR "scandal" OR "lawsuit"
2. Find 3-5 actual recent news articles
3. For EACH article found, classify the risk correctly:

**CLASSIFICATION RULES:**
- **Reputational Risk**: Privacy controversies, public backlash, PR disasters, ethical concerns, trust issues, brand damage
  Example: "Apple criticized for scanning user photos" → Reputational
  
- **Security Risk**: Data breaches, hacking, vulnerabilities, malware, cyberattacks, system exploits
  Example: "Apple ImageIO vulnerability allows code execution" → Security
  
- **Compliance Risk**: Lawsuits, regulatory fines, legal violations, policy breaches, government penalties
  Example: "Apple fined $500M for App Store antitrust violations" → Compliance

4. Return ONLY a JSON array with this exact structure:
[
  {
    "isRisk": true,
    "riskCategory": "Reputational" (or "Security" or "Compliance"),
    "riskLevel": "High" (or "Medium" or "Low"),
    "justification": "Specific description with dates and details from the article",
    "mitigationStrategy": "Concrete action to address this risk",
    "sourceUrl": "https://exact-article-url.com"
  }
]

5. IMPORTANT: Diversify risk categories based on actual incident type
6. If no risks found, return: []

Base response ONLY on articles you actually find. No generic examples. Include exact article URLs.`;

    } else if (urlMatch && contentMatch) {
        // URL analysis mode
        return `Analyze this specific web page content for risks:

URL: ${urlMatch[1]}

Content: ${contentMatch[1].substring(0, 4000)}

CLASSIFICATION RULES:
- Reputational: Privacy controversies, PR disasters, public backlash, brand damage
- Security: Breaches, vulnerabilities, cyberattacks, unauthorized access
- Compliance: Lawsuits, fines, regulatory violations

TASK: Identify any Reputational, Security, or Compliance risks in this content.

Return ONLY a JSON array with this exact structure:
[
  {
    "isRisk": true/false,
    "riskCategory": "Reputational|Security|Compliance|None",
    "riskLevel": "High|Medium|Low|None",
    "justification": "Specific risk description from content",
    "mitigationStrategy": "How to address it",
    "sourceUrl": "${urlMatch[1]}"
  }
]

If no risks, return: []`;
    }
    
    // Fallback
    return `${userContent}

Return ONLY valid JSON array matching: ${JSON.stringify(RiskIncidentArraySchema)}`;
};

/**
 * MAIN ANALYSIS ORCHESTRATOR
 * Tries Gemini first, falls back to Perplexity on failure
 */
const analyzeWithFailover = async (geminiPayload, context, companyName = null) => {
    let geminiError = null;

    // --- TRY GEMINI FIRST ---
    try {
        console.log('[Gemini] Starting analysis...');
        
        const response = await ai.models.generateContent(geminiPayload);
        const text = response?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
            throw new Error('Empty response from Gemini');
        }

        console.log('[Gemini] Response received, length:', text.length);
        
        let parsed = extractJson(text, 'Gemini');
        parsed = normalizeGeminiOutput(parsed);
        
        // Validate each risk
        const validated = parsed.filter(validateRiskSchema);
        
        console.log(`[Gemini] Success: ${validated.length} valid risks found`);
        return validated;

    } catch (error) {
        geminiError = error;
        console.warn('[Gemini] Failed:', error.message);
        
        // Don't retry on quota/parsing errors
        if (error.message.includes('429') || error.message.includes('quota')) {
            console.log('[Gemini] Quota exceeded, switching to Perplexity');
        }
    }

    // --- FALLBACK TO PERPLEXITY ---
    console.log('[Failover] Attempting Perplexity...');
    
    try {
        const perplexityPrompt = buildPerplexityPrompt(geminiPayload, context, companyName);
        
        const result = await perplexityService.analyze(
            perplexityPrompt,
            RiskIncidentArraySchema,
            context
        );
        
        console.log('[Perplexity] Raw response type:', typeof result);
        
        let parsed;
        if (typeof result === 'string') {
            parsed = extractJson(result, 'Perplexity');
        } else if (Array.isArray(result)) {
            parsed = result;
        } else if (typeof result === 'object') {
            parsed = [result];
        } else {
            throw new Error('Invalid Perplexity response type');
        }
        
        const validated = parsed.filter(validateRiskSchema);
        
        console.log(`[Perplexity] Success: ${validated.length} valid risks found`);
        return validated;

    } catch (perplexityError) {
        console.error('[CRITICAL] Both Gemini and Perplexity failed');
        console.error('[Gemini Error]:', geminiError?.message);
        console.error('[Perplexity Error]:', perplexityError?.message);
        
        throw new Error(`AI analysis unavailable: ${perplexityError.message}`);
    }
};

/**
 * Process and validate results
 */
const processResults = (risks, defaultSource = 'Unknown') => {
    if (!risks || risks.length === 0) {
        return [{
            isRisk: false,
            riskCategory: 'None',
            riskLevel: 'None',
            justification: 'No relevant risks identified in analysis',
            mitigationStrategy: 'Continue monitoring',
            sourceUrl: defaultSource
        }];
    }
    
    // Pass through validator and filter nulls
    return risks
        .map(validateAndNormalizeAiResponse)
        .filter(r => r !== null);
};

// ==================== EXPORTED FUNCTIONS ====================

/**
 * Analyze specific URLs for risks
 */
exports.analyzeUrls = async (urls, clientContext) => {
    if (!Array.isArray(urls) || urls.length === 0) {
        console.warn('[analyzeUrls] No URLs provided');
        return [];
    }

    console.log(`[analyzeUrls] Analyzing ${urls.length} URLs`);
    
    const results = await Promise.all(
        urls.map(async (url) => {
            try {
                const content = await fetchUrlContent(url);
                
                if (!content) {
                    console.warn(`[analyzeUrls] Skipping ${url} - fetch failed`);
                    return [];
                }

                const prompt = `Source URL: ${url}\nContent for Analysis:\n"${content}"`;
                
                const config = generateGeminiConfig(clientContext, false);
                const payload = {
                    ...config,
                    contents: [{ 
                        role: 'user', 
                        parts: [{ text: prompt }] 
                    }]
                };
                
                const risks = await analyzeWithFailover(payload, clientContext);
                return processResults(risks, url);

            } catch (error) {
                console.error(`[analyzeUrls] Error analyzing ${url}:`, error.message);
                return [];
            }
        })
    );

    const flattened = results.flat();
    console.log(`[analyzeUrls] Complete: ${flattened.length} total risks`);
    return flattened;
};

/**
 * Discover risks via web search
 */
exports.discoverRisks = async (companyName, clientContext, searchSite = null) => {
    console.log(`[discoverRisks] Searching for: ${companyName}${searchSite ? ' at ' + searchSite : ''}`);
    
    try {
        let searchQuery = `recent negative news about "${companyName}"`;
        if (searchSite) {
            searchQuery += ` site:${searchSite}`;
        }

        const prompt = `Use Google Search tool to find articles matching: "${searchQuery}". Analyze each article found for Reputational, Security, or Compliance risks. Classify each risk appropriately.`;
        
        const config = generateGeminiConfig(clientContext, true);
        const payload = {
            ...config,
            contents: [{ 
                role: 'user', 
                parts: [{ text: prompt }] 
            }]
        };
        
        const risks = await analyzeWithFailover(payload, clientContext, companyName);
        const processed = processResults(risks, `Search: ${companyName}`);
        
        console.log(`[discoverRisks] Complete: ${processed.length} risks found`);
        return processed;

    } catch (error) {
        console.error(`[discoverRisks] Error:`, error.message);
        return [];
    }
};
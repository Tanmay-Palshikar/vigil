const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Scrapes the visible text content from a given URL.
 * @param {string} url - The URL to scrape.
 * @returns {Promise<string>} - The cleaned text content of the page.
 */
const scrapeUrl = async (url) => {
    console.log(`[ScrapingService] Fetching content from: ${url}`);
    try {
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        const $ = cheerio.load(data);

        // Remove script and style elements to clean up the text
        $('script, style').remove();

        // Get text from the body, which tends to be more relevant
        const textContent = $('body').text();

        // Clean up whitespace: replace multiple spaces/newlines with a single space
        const cleanedText = textContent.replace(/\s\s+/g, ' ').trim();
        
        console.log(`[ScrapingService] Successfully scraped and cleaned content from: ${url}.`);
        return cleanedText;

    } catch (error) {
        console.error(`[ScrapingService] Error scraping URL ${url}:`, error.message);
        // Throw a specific error that the controller can catch
        throw new Error(`Failed to fetch or parse content from ${url}.`);
    }
};

module.exports = { scrapeUrl };


const sslChecker = require('ssl-checker');

/**
 * Extracts the hostname from a full URL.
 * e.g., 'https://www.example.com/page?query=1' -> 'www.example.com'
 * @param {string} urlString - The full URL.
 * @returns {string} The hostname.
 */
const getHostname = (urlString) => {
  try {
    const url = new URL(urlString);
    return url.hostname;
  } catch (error) {
    console.error(`[SSL Service] Invalid URL string provided: ${urlString}`, error);
    // Return a value that will cause sslChecker to fail predictably
    return 'invalid-hostname';
  }
};

/**
 * Checks the SSL certificate of a given hostname for imminent expiration.
 * @param {string} urlString - The full URL to check.
 * @returns {Promise<{isExpiringSoon: boolean, daysRemaining: number}>} An object indicating if the certificate is expiring soon.
 */
const checkSslExpiration = async (urlString) => {
  const hostname = getHostname(urlString);
  
  // Define 'expiring soon' as 30 days or less.
  const EXPIRATION_THRESHOLD_DAYS = 30;

  console.log(`[SSL Service] Checking SSL certificate for: ${hostname}`);

  try {
    const result = await sslChecker(hostname);

    if (!result.valid) {
      console.warn(`[SSL Service] Certificate for ${hostname} is invalid.`);
      // Treat an invalid certificate as a high-priority risk.
      return { isExpiringSoon: true, daysRemaining: 0 };
    }

    const isExpiringSoon = result.daysRemaining <= EXPIRATION_THRESHOLD_DAYS;

    if (isExpiringSoon) {
      console.log(`[SSL Service] SUCCESS: SSL certificate for ${hostname} is expiring in ${result.daysRemaining} days.`);
    } else {
      console.log(`[SSL Service] SUCCESS: SSL certificate for ${hostname} is valid for ${result.daysRemaining} days.`);
    }

    return {
      isExpiringSoon: isExpiringSoon,
      daysRemaining: result.daysRemaining,
    };
  } catch (error) {
    // This will catch errors if the hostname is invalid or the check fails for network reasons.
    console.error(`[SSL Service] Error checking SSL for ${hostname}:`, error.message);
    // On any error, we default to a safe, non-risk state.
    return { isExpiringSoon: false, daysRemaining: 999 };
  }
};

module.exports = { checkSslExpiration };

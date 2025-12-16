
/**
 * Validates URLs to prevent SSRF/scanning of internal networks
 * and ensures only HTTP/HTTPS protocols are used.
 */

const PRIVATE_IP_RANGES = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
  /^192\.168\./,
  /^0\.0\.0\.0/,
  /^fc00:/,
  /^fe80:/
];

const LOCAL_HOSTNAMES = [
  'localhost',
  'local',
  'intranet',
  'router',
  'gateway'
];

export const isValidTargetUrl = (inputUrl: string): { valid: boolean; error?: string } => {
  try {
    const url = new URL(inputUrl);

    // 1. Protocol Check
    if (!['http:', 'https:'].includes(url.protocol)) {
      return { valid: false, error: "Protocole invalide. Utilisez http:// ou https://" };
    }

    // 2. Hostname Blocklist (Localhost & generic local names)
    if (LOCAL_HOSTNAMES.includes(url.hostname.toLowerCase())) {
      return { valid: false, error: "Accès interdit aux adresses locales (localhost)." };
    }

    // 3. IP Check (Private Ranges)
    // Note: This is a client-side check. DNS resolution happens in the browser.
    // We can only check if the user literally typed an IP.
    if (PRIVATE_IP_RANGES.some(regex => regex.test(url.hostname))) {
      return { valid: false, error: "Accès interdit aux réseaux privés (IP locale)." };
    }

    return { valid: true };
  } catch (e) {
    return { valid: false, error: "URL malformée." };
  }
};

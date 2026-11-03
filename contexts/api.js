/**
 * =============================================================================
 * CENTRAL API CONFIGURATION & HTTP CLIENT
 * =============================================================================
 * LIVE PRODUCTION BASE_URL:
 * https://trilexadvisory.com/chatbot/index.php?/api
 *
 * Automatically handles standard clean URLs as well as Nginx CodeIgniter
 * query-string routing (/index.php?/api) so all endpoints work universally!
 * =============================================================================
 */
export const BASE_URL = 'https://trilexadvisory.com/chatbot/index.php?/api';

/**
 * Clean URL variant (for servers with Apache mod_rewrite / Nginx rewrites configured)
 */
const CLEAN_BASE_URL = 'https://trilexadvisory.com/chatbot/api';

/**
 * Tracks the actively verified base URL for the current session
 */
let activeBaseUrl = BASE_URL;

/**
 * Returns current active API URL
 */
export const getActiveBaseUrl = () => activeBaseUrl;

/**
 * Universal URL builder that safely formats routes for both clean Apache rewrites
 * and CodeIgniter query-string routing (/index.php?/api&param=val)
 */
export const formatUrl = (baseUrl, endpoint) => {
  const clean = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${baseUrl}/${clean}`;
};

/**
 * Root URL for static asset URLs (e.g. uploaded images or media)
 */
export const SERVER_ROOT = 'https://trilexadvisory.com/chatbot';

/**
 * Normalizes media URLs returned from API so they work on any device/emulator.
 * Replaces localhost or local development paths with the live server root.
 */
export const resolveMediaUrl = (url) => {
  if (!url) return null;
  // If the backend returns a localhost or 127.0.0.1 URL (e.g. from local tests),
  // dynamically replace the host with current server origin
  if (url.startsWith('http://localhost') || url.startsWith('http://127.0.0.1')) {
    try {
      const baseMatch = BASE_URL.match(/^(https?:\/\/[^\/]+)/i);
      const hostOrigin = baseMatch ? baseMatch[1] : 'https://trilexadvisory.com';
      return url.replace(/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/kaushik/, hostOrigin);
    } catch (e) {
      return url;
    }
  }
  return url;
};

/**
 * Universal JSON / Form API Request Helper
 *
 * @param {string} endpoint - Route relative to BASE_URL (e.g. '/login', '/messages')
 * @param {string} method - 'GET', 'POST', 'PUT', etc.
 * @param {object|null} body - Data payload (object will be sent as JSON)
 * @param {string|null} token - Optional Bearer JWT token
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
export const apiCall = async (endpoint, method = 'GET', body = null, token = null) => {
  const url = formatUrl(activeBaseUrl, endpoint);

  const headers = {
    'Accept': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const options = {
    method,
    headers,
  };

  if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    const text = await response.text();

    let json;
    try {
      json = JSON.parse(text);
      return json;
    } catch (parseError) {
      // If direct URL returned HTML, try clean URL fallback
      if (activeBaseUrl === BASE_URL && CLEAN_BASE_URL !== BASE_URL) {
        const fallbackUrl = formatUrl(CLEAN_BASE_URL, endpoint);
        try {
          const fallbackResp = await fetch(fallbackUrl, options);
          const fallbackText = await fallbackResp.text();
          const fallbackJson = JSON.parse(fallbackText);
          activeBaseUrl = CLEAN_BASE_URL;
          return fallbackJson;
        } catch (fallbackErr) {
          console.warn('[API] Fallback also failed:', fallbackErr.message);
        }
      }

      console.warn('API non-JSON response from ' + url + ':', text.slice(0, 200));
      return {
        status: false,
        message: `Server returned unexpected format (${response.status})`,
        data: null,
      };
    }
  } catch (networkError) {
    // If network error on direct URL, try clean fallback URL before reporting error
    if (activeBaseUrl === BASE_URL && CLEAN_BASE_URL !== BASE_URL) {
      const fallbackUrl = formatUrl(CLEAN_BASE_URL, endpoint);
      try {
        const fallbackResp = await fetch(fallbackUrl, options);
        const fallbackText = await fallbackResp.text();
        const fallbackJson = JSON.parse(fallbackText);
        activeBaseUrl = CLEAN_BASE_URL;
        return fallbackJson;
      } catch (fallbackErr) {
        // Continue to network error
      }
    }

    console.error(`Network request failed for ${url}:`, networkError.message);
    return {
      status: false,
      message: 'Network error: Please verify your internet connection and server.',
      data: null,
    };
  }
};

/**
 * Universal Multipart / Form-Data Upload Helper
 *
 * @param {string} endpoint - Route relative to BASE_URL (e.g. '/update_profile_image')
 * @param {FormData} formData - Multipart form data
 * @param {string|null} token - Optional Bearer JWT token
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
export const uploadMedia = async (endpoint, formData, token = null) => {
  const url = formatUrl(activeBaseUrl, endpoint);

  const headers = {
    'Accept': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const options = {
    method: 'POST',
    headers,
    body: formData,
  };

  try {
    const response = await fetch(url, options);
    const text = await response.text();
    let json;
    try {
      json = JSON.parse(text);
      return json;
    } catch (e) {
      if (activeBaseUrl === BASE_URL && CLEAN_BASE_URL !== BASE_URL) {
        const fallbackUrl = formatUrl(CLEAN_BASE_URL, endpoint);
        try {
          const fallbackResp = await fetch(fallbackUrl, options);
          const fallbackText = await fallbackResp.text();
          const fallbackJson = JSON.parse(fallbackText);
          activeBaseUrl = CLEAN_BASE_URL;
          return fallbackJson;
        } catch (err) {}
      }

      return {
        status: false,
        message: `Upload failed with status ${response.status}`,
        data: null,
      };
    }
  } catch (error) {
    console.error('Upload network error:', error.message);
    return {
      status: false,
      message: 'Network error while uploading file.',
      data: null,
    };
  }
};

export default {
  BASE_URL,
  SERVER_ROOT,
  resolveMediaUrl,
  apiCall,
  uploadMedia,
};

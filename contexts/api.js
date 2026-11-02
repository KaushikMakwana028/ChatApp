/**
 * =============================================================================
 * CENTRAL API CONFIGURATION & HTTP CLIENT
 * =============================================================================
 * TO GO LIVE:
 * Simply change the single `BASE_URL` link below!
 * Everything in the entire app connects through this single link.
 *
 * Examples:
 * - Android Emulator (Localhost XAMPP): 'http://10.0.2.2/kaushik/chatbot/api'
 * - Real Physical Device (on same WiFi): 'http://192.168.1.XX/kaushik/chatbot/api'
 * - iOS Simulator (Localhost XAMPP):    'http://localhost/kaushik/chatbot/api'
 * - Live Production Server:             'https://your-domain.com/api'
 * =============================================================================
 */
export const BASE_URL = 'http://10.0.2.2/kaushik/chatbot/api';

/**
 * Root URL for static asset URLs (e.g. uploaded images or media)
 */
export const SERVER_ROOT = BASE_URL.replace(/\/api\/?$/, '');

/**
 * Normalizes media URLs returned from API so they work on any device/emulator.
 * Replaces localhost with the current BASE_URL host.
 */
export const resolveMediaUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http://localhost/') || url.startsWith('http://127.0.0.1/')) {
    const apiHost = BASE_URL.split('/chatbot/api')[0];
    return url.replace(/^http:\/\/(localhost|127\.0\.0\.1)/, apiHost);
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
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  const url = `${BASE_URL}/${cleanEndpoint}`;

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
    } catch (parseError) {
      console.warn('API non-JSON response from ' + url + ':', text.slice(0, 200));
      return {
        status: false,
        message: `Server returned unexpected format (${response.status})`,
        data: null,
      };
    }

    return json;
  } catch (networkError) {
    console.error(`Network request failed for ${url}:`, networkError.message);
    return {
      status: false,
      message: 'Network error: Please verify your server connection and BASE_URL.',
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
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  const url = `${BASE_URL}/${cleanEndpoint}`;

  const headers = {
    'Accept': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    const text = await response.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch (e) {
      return {
        status: false,
        message: `Upload failed with status ${response.status}`,
        data: null,
      };
    }

    return json;
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

// client/src/utils/apiUserApiClient.js
import axios from 'axios';
import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = process.env.REACT_APP_ENCRYPTION_KEY || 'your-secret-key-2024-battle-destroyer';

// Helper functions
function encryptData(data) {
  const jsonString = JSON.stringify(data);
  return CryptoJS.AES.encrypt(jsonString, ENCRYPTION_KEY).toString();
}

function decryptData(encryptedData) {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    if (!decrypted) throw new Error('Decryption failed');
    return JSON.parse(decrypted);
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Invalid encrypted data');
  }
}

function createHash(data) {
  const jsonString = JSON.stringify(data);
  return CryptoJS.SHA256(jsonString + ENCRYPTION_KEY).toString();
}

// Create axios instance
const apiUserApiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// CSRF token management
let csrfToken = null;
let csrfTokenPromise = null;

async function fetchCSRFToken() {
  try {
    const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/csrf-token`, {
      withCredentials: true
    });
    csrfToken = response.data.csrfToken;
    return csrfToken;
  } catch (error) {
    console.error('Failed to fetch CSRF token:', error);
    throw error;
  }
}

async function getCSRFToken() {
  if (csrfToken) return csrfToken;
  
  if (!csrfTokenPromise) {
    csrfTokenPromise = fetchCSRFToken();
  }
  
  try {
    const token = await csrfTokenPromise;
    return token;
  } finally {
    csrfTokenPromise = null;
  }
}

// Request interceptor - add CSRF token and encrypt request body
apiUserApiClient.interceptors.request.use(
  async (config) => {
    // Add CSRF token for non-GET requests
    if (config.method !== 'get' && config.method !== 'delete') {
      try {
        const token = await getCSRFToken();
        config.headers['X-CSRF-Token'] = token;
      } catch (error) {
        console.error('Failed to add CSRF token to request:', error);
      }
    }

    // Don't encrypt GET requests or DELETE requests
    if (config.method === 'get' || config.method === 'delete') {
      return config;
    }

    // Check if body already has encrypted flag
    if (config.data && config.data._encrypted) {
      return config;
    }

    if (config.data) {
      const timestamp = Date.now();
      const payload = {
        ...config.data,
        timestamp,
        clientVersion: '1.0.0',
      };

      const encrypted = encryptData(payload);
      const hash = createHash(payload);

      config.data = {
        encrypted,
        hash,
        _encrypted: true,
      };
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - decrypt response
apiUserApiClient.interceptors.response.use(
  async (response) => {
    // Check if response has encrypted data
    if (response.data && response.data.encrypted && response.data.hash) {
      try {
        const decryptedData = decryptData(response.data.encrypted);
        
        // Verify hash
        const calculatedHash = createHash(decryptedData);
        if (calculatedHash !== response.data.hash) {
          throw new Error('Response integrity check failed');
        }
        
        response.data = decryptedData;
      } catch (error) {
        console.error('Response decryption error:', error);
        throw new Error('Failed to decrypt response');
      }
    }
    return response;
  },
  async (error) => {
    // Handle encrypted error responses
    if (error.response?.data?.encrypted && error.response?.data?.hash) {
      try {
        const decryptedError = decryptData(error.response.data.encrypted);
        error.response.data = decryptedError;
      } catch (e) {
        console.error('Error decryption failed:', e);
      }
    }
    
    // If CSRF token error, refresh token and retry
    if (error.response?.status === 403 && 
        error.response?.data?.message?.includes('CSRF')) {
      console.log('CSRF token error, refreshing token...');
      csrfToken = null;
      csrfTokenPromise = null;
      
      try {
        const newToken = await fetchCSRFToken();
        const originalConfig = error.config;
        originalConfig.headers['X-CSRF-Token'] = newToken;
        return apiUserApiClient(originalConfig);
      } catch (retryError) {
        console.error('Failed to retry with new CSRF token:', retryError);
        return Promise.reject(error);
      }
    }
    
    return Promise.reject(error);
  }
);

// Helper to manually refresh CSRF token
apiUserApiClient.refreshCSRFToken = async () => {
  csrfToken = null;
  csrfTokenPromise = null;
  return await getCSRFToken();
};

export default apiUserApiClient;
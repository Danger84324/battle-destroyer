import axios from 'axios';
import {
    decryptResponse,
    buildEncryptedPayload,
    buildEncryptedParams,
} from './cryptoUtils';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const apiClient = axios.create({ baseURL: API_URL });

/* ─── REQUEST interceptor ───────────────────────────────────── */
apiClient.interceptors.request.use((config) => {
    // Attach auth token
    const token = localStorage.getItem('token');
    if (token) {
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${token}`;
    }

    if (config.method === 'get' || config.method === 'delete') {
        config.params = buildEncryptedParams(config.params ?? {});
    } else {
        const extra = config._extra ?? {};
        config.data = buildEncryptedPayload(config.data ?? {}, extra);
    }

    return config;
});

/* ─── RESPONSE interceptor ──────────────────────────────────── */
apiClient.interceptors.response.use(
    (response) => {
        const { encrypted, hash } = response.data ?? {};
        if (encrypted && hash) {
            try {
                response.data = decryptResponse(encrypted, hash);
            } catch (error) {
                console.error('Failed to decrypt response:', error);
                throw new Error('Failed to process server response');
            }
        }
        return response;
    },
    async (error) => {
        // Handle network errors
        if (!error.response) {
            error.message = 'Network error. Please check your connection.';
            return Promise.reject(error);
        }

        const errorData = error.response?.data;
        
        // Try to decrypt error response if encrypted
        if (errorData?.encrypted && errorData?.hash) {
            try {
                const decrypted = decryptResponse(errorData.encrypted, errorData.hash);
                // Create a new error with the decrypted message
                const customError = new Error(decrypted.message || 'An error occurred');
                customError.decrypted = decrypted;
                customError.response = error.response;
                customError.status = error.response.status;
                return Promise.reject(customError);
            } catch (decryptError) {
                console.error('Failed to decrypt error response:', decryptError);
                // Fall back to status message
                error.message = getErrorMessage(error.response.status);
                return Promise.reject(error);
            }
        }
        
        // Handle non-encrypted errors (should not happen with proper backend)
        error.message = getErrorMessage(error.response.status) || error.message || 'An error occurred';
        return Promise.reject(error);
    }
);

// Helper function to get user-friendly error messages
function getErrorMessage(status) {
    switch (status) {
        case 400:
            return 'Invalid request. Please check your input.';
        case 401:
            return 'Please login to continue.';
        case 403:
            return 'You don\'t have permission to access this resource.';
        case 404:
            return 'Resource not found.';
        case 409:
            return 'Conflict with existing data.';
        case 429:
            return 'Too many requests. Please try again later.';
        case 500:
            return 'Server error. Please try again later.';
        default:
            return `Request failed with status ${status}`;
    }
}

export default apiClient;

export { buildEncryptedPayload, buildEncryptedParams };
import axios from 'axios';

// Configure your API base URL here
// Option 1: Direct connection (requires CORS configuration on backend)

// MAke this setting according to 
// const API_BASE_URL = 'http://127.0.0.1:8000/api/auth';
const API_BASE_URL = 'https://stock-backend-tl9t.onrender.com/api/auth';

// Option 2: Use Vite proxy (recommended for development - helps avoid CORS issues)
// Uncomment the line below and comment out the line above to use the proxy
// const API_BASE_URL = '/api/auth';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management
export const tokenService = {
  getToken: () => {
    return localStorage.getItem('authToken');
  },
  
  setToken: (token) => {
    localStorage.setItem('authToken', token);
  },
  
  removeToken: () => {
    localStorage.removeItem('authToken');
  },
  
  hasToken: () => {
    return !!localStorage.getItem('authToken');
  }
};

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = tokenService.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth API calls
export const authService = {
  login: async (email, password) => {
    try {
      const requestData = {
        email,
        password,
      };
      
      console.log('Login Request Data:', requestData);
      
      const response = await api.post('/login/', requestData);
      
      console.log('Login Response:', response.data);
      
      // Handle different token field names
      if (response.data.token) {
        tokenService.setToken(response.data.token);
      } else if (response.data.access_token) {
        tokenService.setToken(response.data.access_token);
      } else if (response.data.access) {
        tokenService.setToken(response.data.access);
      }
      
      return response.data;
    } catch (error) {
      // Handle network errors (CORS, connection refused, etc.)
      if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
        console.error('Network Error:', error);
        throw new Error('Network Error: Unable to connect to the server. Please check if the backend is running on http://127.0.0.1:8000 and CORS is configured.');
      }
      
      // Handle request errors (no response from server)
      if (!error.response) {
        console.error('Request Error:', error);
        throw new Error('Unable to reach the server. Please ensure the backend is running.');
      }
      
      // Handle Django REST framework error format
      if (error.response?.data) {
        const errorData = error.response.data;
        console.error('Login Error Response:', errorData);
        
        // Check for common error formats
        if (errorData.detail) {
          throw new Error(errorData.detail);
        } else if (errorData.message) {
          throw new Error(errorData.message);
        } else if (errorData.non_field_errors) {
          throw new Error(Array.isArray(errorData.non_field_errors) 
            ? errorData.non_field_errors.join(', ') 
            : errorData.non_field_errors);
        } else if (typeof errorData === 'string') {
          throw new Error(errorData);
        } else {
          // Extract all field-specific errors
          const fieldErrors = [];
          Object.keys(errorData).forEach(key => {
            const errorValue = errorData[key];
            if (Array.isArray(errorValue)) {
              fieldErrors.push(`${key}: ${errorValue.join(', ')}`);
            } else if (typeof errorValue === 'string') {
              fieldErrors.push(`${key}: ${errorValue}`);
            }
          });
          
          if (fieldErrors.length > 0) {
            throw new Error(fieldErrors.join(' | '));
          }
          
          throw new Error('Validation failed: ' + JSON.stringify(errorData));
        }
      }
      throw new Error(error.message || 'Login failed. Please try again.');
    }
  },
  
  signup: async (first_name, last_name, email, password, password_confirm) => {
    try {
      const requestData = {
        email,
        password,
        password_confirm,
        first_name,
        last_name,
      };
      
      console.log('Signup Request Data:', requestData);
      
      const response = await api.post('/signup/', requestData);
      
      console.log('Signup Response:', response.data);
      
      // Handle different token field names
      if (response.data.token) {
        tokenService.setToken(response.data.token);
      } else if (response.data.access_token) {
        tokenService.setToken(response.data.access_token);
      } else if (response.data.access) {
        tokenService.setToken(response.data.access);
      }
      
      return response.data;
    } catch (error) {
      // Handle network errors (CORS, connection refused, etc.)
      if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
        console.error('Network Error:', error);
        throw new Error('Network Error: Unable to connect to the server. Please check if the backend is running on http://127.0.0.1:8000 and CORS is configured.');
      }
      
      // Handle request errors (no response from server)
      if (!error.response) {
        console.error('Request Error:', error);
        throw new Error('Unable to reach the server. Please ensure the backend is running.');
      }
      
      // Handle Django REST framework error format
      if (error.response?.data) {
        const errorData = error.response.data;
        console.error('Signup Error Response:', errorData);
        
        // Check for common error formats
        if (errorData.detail) {
          throw new Error(errorData.detail);
        } else if (errorData.message) {
          throw new Error(errorData.message);
        } else if (errorData.non_field_errors) {
          throw new Error(Array.isArray(errorData.non_field_errors) 
            ? errorData.non_field_errors.join(', ') 
            : errorData.non_field_errors);
        } else if (typeof errorData === 'string') {
          throw new Error(errorData);
        } else {
          // Extract all field-specific errors
          const fieldErrors = [];
          Object.keys(errorData).forEach(key => {
            const errorValue = errorData[key];
            if (Array.isArray(errorValue)) {
              fieldErrors.push(`${key}: ${errorValue.join(', ')}`);
            } else if (typeof errorValue === 'string') {
              fieldErrors.push(`${key}: ${errorValue}`);
            }
          });
          
          if (fieldErrors.length > 0) {
            throw new Error(fieldErrors.join(' | '));
          }
          
          throw new Error('Validation failed: ' + JSON.stringify(errorData));
        }
      }
      throw new Error(error.message || 'Signup failed. Please try again.');
    }
  },
  
  logout: () => {
    tokenService.removeToken();
  }
};

export default api;


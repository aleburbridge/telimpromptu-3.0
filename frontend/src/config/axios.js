import axios from 'axios';

// Configure axios defaults
axios.defaults.withCredentials = false;
axios.defaults.headers.common['Content-Type'] = 'application/json';

// Add request interceptor for debugging
axios.interceptors.request.use(
  (config) => {
    console.log('Making request to:', config.url);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Response error:', error.response || error);
    if (error.message === 'Network Error') {
      console.error('Network Error - Check CORS and credentials');
    }
    return Promise.reject(error);
  }
);

export default axios;
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL, // Changed to port 8080 and added /api
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

export default api;

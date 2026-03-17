import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/api', // Changed to port 8080 and added /api
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

export default api;

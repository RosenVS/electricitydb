import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8080",
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('API Request with token:', config.url, token.substring(0, 20) + '...');
  } else {
    console.log('API Request without token:', config.url);
  }
  return config;
});

api.interceptors.response.use(
  response => {
    console.log('API Response success:', response.config.url, response.status);
    return response;
  },
  error => {
    console.error('API Response error:', error.config?.url, error.response?.status, error.message);
    return Promise.reject(error);
  }
);

export default api;

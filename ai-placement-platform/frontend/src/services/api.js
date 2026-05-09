import axios from "axios";

// Task 4: Remove trailing slash issues in API URLs
const getBaseURL = () => {
  let url = import.meta.env.VITE_API_URL || "http://localhost:5000";
  if (url.endsWith("/")) {
    url = url.slice(0, -1);
  }
  return `${url}/api`;
};

const API = axios.create({
  baseURL: getBaseURL(),
  timeout: 30000, // 30 seconds
  headers: {
    "Content-Type": "application/json",
  },
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

// Response interceptor for global error handling
API.interceptors.response.use(
  (response) => response,
  (error) => {
    // Task 11: Add proper error logging for API failures
    console.error("🌐 API Error:", {
      message: error.message,
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data
    });
    
    // Return a structured error so frontend doesn't crash
    const message = error.response?.data?.message || 
                   error.response?.data?.error || 
                   (error.code === 'ERR_NETWORK' ? "Server connection failed. Check if backend is running." : error.message);

    return Promise.reject({
      message: message,
      status: error.response?.status,
      originalError: error
    });
  }
);

export const getApiErrorMessage = (error) => {
  if (typeof error === "string") return error;
  if (error.message) return error.message;
  return "An unexpected error occurred. Please try again.";
};

export default API;


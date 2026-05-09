import axios from "axios";

const API = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
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
    console.error("API Error Details:", {
      message: error.message,
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status
    });
    
    // Return a structured error so frontend doesn't crash
    return Promise.reject({
      message: error.response?.data?.message || "Server connection failed. Check if backend is running.",
      fallback: true,
      originalError: error
    });
  }
);

export const getApiErrorMessage = (error) => {
  if (error.message) return error.message;
  return "An unexpected error occurred. Please try again.";
};

export default API;

import axios from "axios";

<<<<<<< HEAD
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
=======
const API = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
>>>>>>> 412487494f6ea411007e0aa6e5c1367233ee236a
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
<<<<<<< HEAD
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
=======
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
>>>>>>> 412487494f6ea411007e0aa6e5c1367233ee236a
      originalError: error
    });
  }
);

export const getApiErrorMessage = (error) => {
<<<<<<< HEAD
  if (typeof error === "string") return error;
=======
>>>>>>> 412487494f6ea411007e0aa6e5c1367233ee236a
  if (error.message) return error.message;
  return "An unexpected error occurred. Please try again.";
};

export default API;
<<<<<<< HEAD

=======
>>>>>>> 412487494f6ea411007e0aa6e5c1367233ee236a

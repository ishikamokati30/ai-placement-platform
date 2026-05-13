import axios from "axios";

const TOKEN_KEY = "token";
const USER_KEY = "user";
const LEGACY_TOKEN_KEYS = ["authToken", "jwt", "accessToken"];
const AUTH_SESSION_CHANGED_EVENT = "auth-session-changed";

const emitAuthSessionChanged = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_SESSION_CHANGED_EVENT));
  }
};

const persistToken = (token) => {
  localStorage.setItem(TOKEN_KEY, token);
  LEGACY_TOKEN_KEYS.forEach((key) => localStorage.removeItem(key));
};

const readStoredToken = () => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) return token;

  const legacyToken = LEGACY_TOKEN_KEYS
    .map((key) => localStorage.getItem(key))
    .find(Boolean);

  if (legacyToken) {
    persistToken(legacyToken);
    return legacyToken;
  }

  return null;
};

export const clearAuthSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  LEGACY_TOKEN_KEYS.forEach((key) => localStorage.removeItem(key));
  emitAuthSessionChanged();
};

export const decodeJwtPayload = (token) => {
  if (!token || typeof token !== "string") return null;

  const [, payload] = token.split(".");
  if (!payload) return null;

  try {
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const json = atob(padded);

    try {
      const decodedJson = decodeURIComponent(
        json
          .split("")
          .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`)
          .join("")
      );
      return JSON.parse(decodedJson);
    } catch {
      return JSON.parse(json);
    }
  } catch {
    return null;
  }
};

export const isTokenExpired = (decodedToken) => {
  if (!decodedToken?.exp) return false;
  return decodedToken.exp * 1000 <= Date.now();
};

export const getStoredAuthToken = () => {
  const token = readStoredToken();
  if (!token) return null;

  const decoded = decodeJwtPayload(token);

  if (!decoded || isTokenExpired(decoded)) {
    clearAuthSession();
    return null;
  }

  return token;
};

export const getStoredUser = () => {
  const token = getStoredAuthToken();
  if (!token) return null;

  try {
    const storedUser = JSON.parse(localStorage.getItem(USER_KEY) || "null");
    if (storedUser?.id) return storedUser;
  } catch {
    localStorage.removeItem(USER_KEY);
  }

  const decoded = decodeJwtPayload(token);
  return decoded ? { id: decoded.id || decoded.userId, email: decoded.email } : null;
};

export const setAuthSession = (token, user = null) => {
  const decoded = decodeJwtPayload(token);
  const userId = user?.id || decoded?.id || decoded?.userId;

  if (!decoded || !userId || isTokenExpired(decoded)) {
    clearAuthSession();
    throw new Error("Invalid authentication token received from server");
  }

  persistToken(token);
  localStorage.setItem(
    USER_KEY,
    JSON.stringify({
      ...decoded,
      ...(user || {}),
      id: userId,
      email: user?.email || decoded.email,
    })
  );
  emitAuthSessionChanged();

  return decoded;
};

// Get base API URL from environment variable or fallback to localhost
const getBaseURL = () => {
  let url = import.meta.env.VITE_API_URL || "http://localhost:5000";
  url = url.replace(/\/+$/, "").replace(/\/api$/i, "");
  return `${url}/api`;
};

// Export API base URL as a constant for direct use if needed
export const API_BASE_URL = getBaseURL();

// Create axios instance with base URL and timeout
const API = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

API.interceptors.request.use((req) => {
  const token = getStoredAuthToken();
  if (token) {
    req.headers = req.headers || {};
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearAuthSession();
    }

    console.error("🌐 API Error:", {
      message: error.message,
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data
    });
    
    const message = error.response?.data?.message || 
                   error.response?.data?.error || 
                   (error.code === 'ERR_NETWORK' ? "Server connection failed. Check if backend is running." : error.message);

    return Promise.reject({
      message: message,
      status: error.response?.status,
      response: error.response,
      config: error.config,
      code: error.code,
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

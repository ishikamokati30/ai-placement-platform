# API URL Configuration Guide

## Overview

The frontend application uses environment-based API URLs for flexibility across different deployment environments (local development, staging, production). This eliminates the need for hardcoded URLs.

## Environment Files

### `.env` (Production/Default)
Contains the production backend URL. This file is committed to version control.

```
VITE_API_URL=https://elevateai-backend-dv1m.onrender.com
```

### `.env.local` (Development/Local)
Contains the local development backend URL. This file is **NOT committed** to version control (see `.gitignore`).

```
VITE_API_URL=http://localhost:5000
```

### `.env.example` (Reference)
Serves as a template for developers setting up the project locally.

## How It Works

1. **Vite Environment Variables**: Vite automatically loads environment variables prefixed with `VITE_` and makes them accessible via `import.meta.env.VITE_API_URL` in the browser runtime.

2. **API Service Setup** (`src/services/api.js`):
   - `getBaseURL()` function retrieves the API URL from the environment variable
   - Falls back to `http://localhost:5000` if not configured
   - Normalizes the URL (removes trailing slashes and `/api` suffix)
   - Returns the complete base URL: `${url}/api`

3. **Axios Configuration**:
   - All API requests use the centralized `API` axios instance
   - The instance automatically prepends `${API_BASE_URL}` to all endpoint paths
   - Example: `API.get('/auth/login')` → `${API_BASE_URL}/auth/login`

## Usage Examples

### Making API Requests

```javascript
import API from '@/services/api';

// These automatically use the correct API URL based on environment
const response = await API.post('/auth/login', { email, password });
const data = await API.get('/dashboard');
const posts = await API.get('/community/posts');
```

### Direct API Base URL Access (if needed)

```javascript
import { API_BASE_URL } from '@/services/api';

// Use the base URL directly if building custom requests
console.log(API_BASE_URL); // Output: http://localhost:5000/api (dev) or https://...../api (prod)
```

## Environment-Specific Setup

### Local Development Setup
1. Ensure backend is running on `http://localhost:5000`
2. Create/update `.env.local` with:
   ```
   VITE_API_URL=http://localhost:5000
   ```
3. Run `npm run dev` from the frontend directory
4. Frontend will use the local backend URL

### Production/Deployment Setup
The `.env` file contains the production URL:
```
VITE_API_URL=https://your-production-backend-url.com
```

When deploying:
- Build: `npm run build` (uses `.env` by default)
- The frontend will connect to the production backend URL
- No hardcoded URLs needed in code

### Alternative Backend URL
To use a different local backend URL:
```
VITE_API_URL=http://127.0.0.1:3000
```

## Key Benefits

✅ **No Hardcoded URLs**: All API endpoints use environment variables  
✅ **Easy Environment Switching**: Simply change `.env.local` for local development  
✅ **Production Ready**: `.env` contains the production URL  
✅ **Development Friendly**: Changes to `.env.local` are reflected immediately  
✅ **Consistent API Handling**: All requests use the centralized API service  
✅ **Fallback Support**: Has a default fallback if environment variable is not set  

## Troubleshooting

### Issue: "Server connection failed"
- Ensure your backend is running on the configured URL
- Check the `VITE_API_URL` in `.env.local`
- Open browser DevTools → Network tab to verify actual API request URLs

### Issue: API calls going to wrong URL
- Verify the correct `.env` file is being used:
  - Development: `.env.local` takes precedence
  - Production: `.env` is used during build
- Restart the dev server after changing `.env.local`

### Issue: Environment variable not loading
- Make sure the variable name starts with `VITE_`
- Vite only exposes variables with this prefix for security
- Restart the dev server if the `.env` files are modified

## File Structure

```
frontend/
├── .env              # Production URL (committed)
├── .env.local        # Development URL (not committed, local only)
├── .env.example      # Template for new developers
├── vite.config.js    # Vite configuration with env support
└── src/
    └── services/
        └── api.js    # API service with environment-based URL
```

## Summary

The application uses Vite's environment variable system to:
- Load `VITE_API_URL` from `.env` or `.env.local`
- Create a centralized axios instance with the configured base URL
- Automatically use the correct backend URL based on the current environment
- Support both development (local) and production deployments without code changes

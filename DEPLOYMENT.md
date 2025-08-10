# Deployment Guide - Fix CORS Issues

## Quick Fix for "Failed to Fetch"

### 1. Backend Environment (.env)
```
MONGO_URI=your_mongodb_connection_string
CORS_ORIGIN=https://your-frontend-domain.com
PUBLIC_BASE_URL=https://your-backend-domain.com
```

### 2. Frontend Environment (.env)
```
VITE_API_BASE=https://your-backend-domain.com
```

### 3. Test CORS
```bash
curl https://your-backend-domain.com/health
```

## Common Issues:
- Wrong API URL in frontend
- Missing CORS origin in backend
- HTTPS/HTTP mismatch
- Backend not deployed/accessible

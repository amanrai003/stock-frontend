# CORS Configuration Guide

If you're getting network errors, it's likely a CORS (Cross-Origin Resource Sharing) issue. Here's how to fix it:

## Option 1: Configure CORS in Django (Recommended)

Add CORS headers to your Django backend. If you're using Django REST Framework:

1. **Install django-cors-headers:**
   ```bash
   pip install django-cors-headers
   ```

2. **Add to INSTALLED_APPS in settings.py:**
   ```python
   INSTALLED_APPS = [
       ...
       'corsheaders',
       ...
   ]
   ```

3. **Add to MIDDLEWARE in settings.py (before CommonMiddleware):**
   ```python
   MIDDLEWARE = [
       ...
       'corsheaders.middleware.CorsMiddleware',
       'django.middleware.common.CommonMiddleware',
       ...
   ]
   ```

4. **Configure CORS settings in settings.py:**
   ```python
   # Allow all origins (for development only)
   CORS_ALLOW_ALL_ORIGINS = True
   
   # OR specify allowed origins (recommended for production)
   CORS_ALLOWED_ORIGINS = [
       "http://localhost:3000",
       "http://127.0.0.1:3000",
   ]
   
   # Allow credentials
   CORS_ALLOW_CREDENTIALS = True
   ```

## Option 2: Use Vite Proxy (Alternative)

The vite.config.js already includes a proxy configuration that can help bypass CORS issues during development.

## Option 3: Manual CORS Headers (Quick Fix)

If you can't install django-cors-headers, add this middleware to your Django project:

```python
# In your Django middleware
class CorsMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        response["Access-Control-Allow-Origin"] = "*"
        response["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
        response["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        return response
```

## Troubleshooting

1. **Check if backend is running:**
   - Open http://127.0.0.1:8000/api/auth/login/ in your browser
   - You should see a response (even if it's an error)

2. **Check browser console:**
   - Open Developer Tools (F12)
   - Look for CORS errors in the Console tab

3. **Try using localhost instead of 127.0.0.1:**
   - Update API_BASE_URL in authService.js to use `http://localhost:8000/api/auth`




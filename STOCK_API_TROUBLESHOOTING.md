# Stock API Troubleshooting Guide

## Error: "Failed to load stocks. Please try again."

### Step 1: Check Browser Console
1. Open Developer Tools (Press F12)
2. Go to the **Console** tab
3. Look for error messages that show:
   - `Stock API Error:` - This will show the exact error
   - `Get All Stocks Error:` - This shows what went wrong

### Step 2: Common Issues and Solutions

#### Issue 1: API Endpoint Not Found (404)
**Error in console:** `404 Not Found` or `API endpoint not found`

**Solution:** Check your Django URL routing. The endpoint should be:
- `/api/stock-trades/` (with hyphen)
- Or `/api/stocktrades/` (without hyphen)

**Fix:** Update the endpoint in `src/services/stockService.js`:
```javascript
// Change from:
const response = await api.get('/api/stock-trades/');

// To (if your URL is different):
const response = await api.get('/api/stocktrades/');
```

#### Issue 2: Authentication Error (401)
**Error in console:** `401 Unauthorized` or `Authentication failed`

**Solution:** 
- Make sure you're logged in
- Check if the token is being sent in the request
- Verify the token format in the Authorization header

#### Issue 3: CORS Error
**Error in console:** `Network Error` or `CORS policy`

**Solution:** 
1. Use Vite proxy (recommended):
   - In `src/services/stockService.js`, change:
   ```javascript
   // From:
   const STOCK_API_BASE = 'http://127.0.0.1:8000';
   
   // To:
   const STOCK_API_BASE = '';
   ```
   
2. Or configure CORS in Django (see CORS_SETUP.md)

#### Issue 4: Server Error (500)
**Error in console:** `500 Internal Server Error`

**Solution:** 
- Check your Django backend logs
- Verify the StockTradeViewSet is properly configured
- Check if the database is accessible

#### Issue 5: Permission Denied (403)
**Error in console:** `403 Forbidden`

**Solution:**
- Verify `IsAuthenticated` permission is working
- Check if the user has the required permissions

### Step 3: Verify API Endpoint

Test the API endpoint directly:
1. Open browser and go to: `http://127.0.0.1:8000/api/stock-trades/`
2. You should see a response (even if it's an error)
3. If you get 404, the URL is wrong
4. If you get 401, authentication is required

### Step 4: Check Django URL Configuration

Make sure your Django `urls.py` includes:
```python
from rest_framework.routers import DefaultRouter
from .views import StockTradeViewSet

router = DefaultRouter()
router.register(r'stock-trades', StockTradeViewSet, basename='stocktrade')

urlpatterns = [
    path('api/', include(router.urls)),
    # ... other URLs
]
```

### Step 5: Verify Response Format

The API should return one of these formats:
```json
{
  "message": "Stock trades retrieved successfully",
  "count": 2,
  "data": [...]
}
```

Or:
```json
[...]  // Direct array
```

The code handles both formats automatically.

### Step 6: Enable Detailed Logging

The code now logs:
- Request URL and method
- Response data
- Error details

Check the browser console for these logs to debug the issue.




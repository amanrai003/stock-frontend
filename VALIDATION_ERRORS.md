# Troubleshooting Validation Errors

If you're getting "Validation failed" errors, follow these steps:

## Step 1: Check Browser Console

1. Open your browser's Developer Tools (Press F12)
2. Go to the **Console** tab
3. Look for error messages that start with:
   - `Login Error Response:` or `Signup Error Response:`
   - These will show the exact error from your Django API

## Step 2: Common Field Name Issues

Your Django API might expect different field names. Here are common variations:

### Login Endpoint
- **Current:** `{ email, password }`
- **Alternative:** `{ username, password }` (if your API uses username instead of email)

### Signup Endpoint
- **Current:** `{ name, email, password }`
- **Alternatives:**
  - `{ username, email, password }` (if name field is called username)
  - `{ first_name, last_name, email, password }` (if name is split)
  - `{ full_name, email, password }` (if field is called full_name)

## Step 3: Check Your Django API

Check your Django views/serializers to see what fields they expect:

```python
# Example Django serializer
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username', 'email', 'password']  # Check these field names
```

## Step 4: Update Field Names

If your API expects different field names, update `src/services/authService.js`:

### Example: If login expects `username` instead of `email`:

```javascript
login: async (email, password) => {
  const requestData = {
    username: email,  // Change email to username
    password,
  };
  // ... rest of the code
}
```

### Example: If signup expects `username` instead of `name`:

```javascript
signup: async (name, email, password) => {
  const requestData = {
    username: name,  // Change name to username
    email,
    password,
  };
  // ... rest of the code
}
```

## Step 5: Check Required Fields

Your API might require additional fields. Check the console error to see which fields are missing or invalid.

## Common Django Error Formats

The error handling now supports these Django error formats:
- `{ "detail": "error message" }`
- `{ "message": "error message" }`
- `{ "field_name": ["error1", "error2"] }`
- `{ "non_field_errors": ["error message"] }`

All field-specific errors will now be displayed in the UI.




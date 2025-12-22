# React Authentication App

A modern React.js application with login and signup functionality, featuring token-based authentication.

## Features

- 🏠 **Home Page** - Welcome page with link to login
- 🔐 **Login Page** - User authentication with link to signup
- ✍️ **Signup Page** - New user registration with link to login
- 🎯 **Dashboard** - Protected page accessible after authentication
- 💾 **Token Storage** - Automatic token storage in localStorage
- 🎨 **Modern UI** - Beautiful, responsive design

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure API Endpoint**
   - Open `src/services/authService.js`
   - Update the `API_BASE_URL` constant with your actual API endpoint
   - Example: `const API_BASE_URL = 'https://api.example.com/api';`

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Build for Production**
   ```bash
   npm run build
   ```

## API Endpoints Expected

The app expects the following API endpoints:

- **POST /login** - Login endpoint
  - Request body: `{ email: string, password: string }`
  - Response: `{ token: string, ... }`

- **POST /signup** - Signup endpoint
  - Request body: `{ name: string, email: string, password: string }`
  - Response: `{ token: string, ... }`

## Project Structure

```
reactjs/
├── src/
│   ├── pages/
│   │   ├── Home.jsx          # Landing page
│   │   ├── Login.jsx         # Login page
│   │   ├── Signup.jsx        # Signup page
│   │   └── Dashboard.jsx     # Protected dashboard
│   ├── services/
│   │   └── authService.js    # API service & token management
│   ├── styles/
│   │   ├── App.css
│   │   ├── Home.css
│   │   ├── Auth.css
│   │   └── Dashboard.css
│   ├── App.jsx               # Main app component with routing
│   └── main.jsx              # Entry point
├── index.html
├── package.json
└── vite.config.js
```

## Token Management

- Tokens are automatically stored in `localStorage` upon successful login/signup
- Tokens are automatically included in API requests via axios interceptors
- Use `tokenService.getToken()` to retrieve the stored token
- Use `authService.logout()` to clear the token

## Technologies Used

- React 18
- React Router DOM
- Axios
- Vite
- CSS3


# Secure Auth Implementation Detail

## Backend
1. **User Model**: Add `role` and `refreshToken` fields.
2. **Auth Middleware**: Implement `protect` (JWT verify) and `authorize` (RBAC).
3. **Auth Controller**:
    - `registerUser`: Hash password, create user.
    - `loginUser`: Verify password, issue Access Token (body) and Refresh Token (cookie).
    - `refresh`: Use Refresh Token cookie to issue new Access Token.
    - `logout`: Clear Refresh Token cookie.

## Frontend
1. **Auth Context**: Store user state and access token.
2. **Axios Interceptor**: Handle `401` errors by calling `/refresh`.
3. **Login/Signup Pages**: UI for authentication.

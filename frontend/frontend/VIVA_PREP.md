# Viva Preparation Guide: TaskPilot

This guide prepares you for technical questions regarding the architecture, security, and implementation of TaskPilot.

---

### 🟢 General Architecture
**1. Why did you choose a "Unified" deployment over separate frontend/backend hosting?**
*Answer*: It simplifies deployment, eliminates CORS issues entirely, and allows for a single SSL certificate and URL management. It's highly efficient for medium-scale applications.

**2. How does Express distinguish between a React route and an API route?**
*Answer*: API routes are prefixed with `/api`. We register these first. Then, we use `express.static` for assets, and finally a "catch-all" route (`*`) that sends `index.html` for everything else, letting React Router handle the URL.

### 🔐 Security & Auth
**3. What is the benefit of using HttpOnly cookies for Refresh Tokens?**
*Answer*: HttpOnly cookies cannot be accessed via JavaScript (`document.cookie`), which makes the token immune to XSS (Cross-Site Scripting) attacks that might steal session data.

**4. Explain your dual-token strategy (Access vs. Refresh).**
*Answer*: The Access Token is short-lived (security) and sent in the Authorization header. The Refresh Token is long-lived (UX) and used to get a new Access Token without asking the user to log in again.

**5. How does your frontend handle "Silent Refresh"?**
*Answer*: We use an **Axios Interceptor**. When an API call returns a 401, the interceptor automatically calls the `/refresh` endpoint, gets a new token, updates the header, and retries the original request seamlessly.

**6. What is RBAC and how do you enforce it?**
*Answer*: Role-Based Access Control. It's enforced via a custom `authorize('admin')` middleware that checks the `req.user.role` before allowing access to a controller.

**7. Why is `helmet` used in your server?**
*Answer*: Helmet sets various HTTP headers (like CSP, HSTS, XSS protection) to secure the app and hides the `X-Powered-By: Express` header so attackers don't know the server technology.

### 🛠️ Implementation & Database
**8. Why did you use React Query instead of standard `useEffect` for data fetching?**
*Answer*: React Query provides automatic caching, background fetching, loading/error states out of the box, and easy "query invalidation" to refresh data after a mutation.

**9. How does MongoDB handle task relationships?**
*Answer*: We use `Mongoose Schema.Types.ObjectId` with a `ref` to the 'Project' or 'User' collection, providing a relational-like structure in a NoSQL environment.

**10. What is "Rate Limiting" and why is it at the API level?**
*Answer*: It limits the number of requests a user can make in a timeframe (e.g., 100 requests in 15m). It prevents brute-force attacks on login and protects server resources from abuse.

### 🚀 Deployment & Scaling
**11. What is the purpose of `app.set('trust proxy', 1)`?**
*Answer*: When deployed on platforms like Railway/Render, the app is behind a proxy. This setting tells Express to trust the proxy's IP address, which is necessary for rate-limiting and secure cookies to work.

**12. How would you scale this application for 100,000 users?**
*Answer*: I would move to a decoupled architecture with a Load Balancer, use Redis for session/token caching, and implement MongoDB sharding for the database.

**13. What is a "Memory Leak" in Node.js and how do you avoid it?**
*Answer*: It occurs when objects aren't garbage collected (e.g., infinite observers). We avoid it by cleaning up `useEffect` hooks, closing DB connections, and not using global variables for request data.

**14. Mention the importance of `.env` files.**
*Answer*: They separate configuration from code, ensuring sensitive secrets (DB strings, API Keys) are never committed to version control like GitHub.

**15. If the user refreshes on the `/tasks` page, why doesn't it show "404 Not Found" in your unified setup?**
*Answer*: Because of the catch-all route `app.get('*', ...)` in `server.js`. It tells the server to always send `index.html`, which then allows the client-side React Router to take over and render the correct page based on the URL.

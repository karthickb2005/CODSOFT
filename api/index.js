/**
 * Vercel Serverless API Entry Point
 * 
 * This file acts as the bridge between Vercel's serverless environment
 * and the Express backend located in frontend/frontend/server/.
 * 
 * We resolve module paths explicitly to ensure Vercel can find and
 * install backend dependencies from the nested package.json.
 */
const path = require('path');

// Point Node.js module resolution to the backend's own node_modules
const serverDir = path.join(__dirname, '..', 'frontend', 'frontend', 'server');
const originalPaths = module.paths;
module.paths = [path.join(serverDir, 'node_modules'), ...originalPaths];

// Load environment variables from the server's .env (only for local dev - Vercel uses its own env vars)
try {
    require('dotenv').config({ path: path.join(serverDir, '.env') });
} catch (e) { }

// Change working directory so relative paths inside server.js resolve correctly
process.chdir(serverDir);

// Load and export the Express app from the backend
const app = require(path.join(serverDir, 'server.js'));

module.exports = app;

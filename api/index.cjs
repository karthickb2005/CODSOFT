/**
 * Vercel Serverless API Entry Point
 */
const path = require('path');

console.log("--- VERCEL API BOOT ---");
console.log("Current Directory:", process.cwd());
console.log("Filename:", __filename);
console.log("Dirname:", __dirname);

// Vercel Environment Variables Check
console.log("SUPABASE_URL defined:", !!process.env.SUPABASE_URL);
console.log("SUPABASE_ANON_KEY defined:", !!process.env.SUPABASE_ANON_KEY);
console.log("JWT_SECRET defined:", !!process.env.JWT_SECRET);

// Path to the server directory
const serverDir = path.resolve(__dirname, '../frontend/frontend/server');
console.log("Resolved Server Dir:", serverDir);

// Check if directory exists
const fs = require('fs');
if (fs.existsSync(serverDir)) {
    console.log("Server directory exists ✅");
    const serverFile = path.join(serverDir, 'server.js');
    if (fs.existsSync(serverFile)) {
        console.log("server.js found ✅");
    } else {
        console.error("server.js NOT FOUND ❌");
    }
} else {
    console.error("Server directory NOT FOUND ❌");
}

// Ensure working directory is set to server directory for relative paths
try {
    process.chdir(serverDir);
    console.log("New Working Directory:", process.cwd());
} catch (err) {
    console.error("Failed to change directory:", err.message);
}

// Load the app
// Note: We use the absolute path to make it easier for the bundler to follow
let app;
try {
    app = require('../frontend/frontend/server/server.js');
    console.log("Express App loaded successfully ✅");
} catch (err) {
    console.error("FAILED to load Express App ❌");
    console.error("Error Message:", err.message);
    console.error("Stack:", err.stack);

    // Provide a fallback app that returns the error
    const express = require('express');
    app = express();
    app.all('*', (req, res) => {
        res.status(500).json({
            success: false,
            message: "Failed to load backend server",
            error: err.message,
            stack: err.stack,
            cwd: process.cwd(),
            dirname: __dirname,
            serverDir: serverDir
        });
    });
}

module.exports = app;

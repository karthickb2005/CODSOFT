const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        // 1. Log JWT_SECRET existence
        console.log("JWT_SECRET in middleware:", !!process.env.JWT_SECRET);

        // 2. Log full Authorization header
        console.log("Authorization header:", req.headers.authorization);

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            console.log("[AUTH_PROTECT] No token provided or invalid format");
            return res.status(401).json({
                success: false,
                message: "Not authorized"
            });
        }

        const token = authHeader.split(" ")[1];

        // 3. Log extracted token
        console.log("Extracted Token:", token);

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 4. Log decoded payload on success
        console.log("Decoded Token:", decoded);

        // IMPORTANT — ensure req.user is always populated
        req.user = decoded;
        console.log("[DEBUG] req.user set to:", req.user);

        console.log("[AUTH_PROTECT_PASS]", req.user);

        next();

    } catch (error) {
        // 5. Log verification error message
        console.error("JWT verification error:", error.message);

        console.log("[AUTH_PROTECT_ERROR]", error.message);
        return res.status(401).json({
            success: false,
            message: "Invalid token"
        });
    }
};

module.exports = { protect };


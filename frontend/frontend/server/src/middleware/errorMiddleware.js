const errorHandler = (err, req, res, next) => {
    console.error("--- BACKEND ERROR ---");
    console.error("Message:", err.message);
    console.error("Stack:", err.stack);
    console.error("---------------------");

    const statusCode = err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);

    res.status(statusCode).json({
        success: false,
        message: err.message || "Server Error",
        // Only including stack in the response temporarily for Vercel debugging
        stack: process.env.NODE_ENV === 'production' ? (process.env.VERCEL ? err.stack : null) : err.stack
    });
};

module.exports = {
    errorHandler,
};

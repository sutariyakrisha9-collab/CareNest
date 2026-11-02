
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ========================================
// 1. VERIFY JWT TOKEN
// ========================================

const protect = async (req, res, next) => {
    try {
        // Check JWT secret
        if (!process.env.JWT_SECRET) {
            return res.status(500).json({
                success: false,
                message: "Server authentication configuration error"
            });
        }

        // Get token from Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Access denied. Please login first."
            });
        }

        // Extract token
        const token = authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Authentication token is missing"
            });
        }

        // Verify token
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // Find latest user data from database
        const user = await User.findById(decoded.id)
            .select("-password");

        // Check user exists
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User account not found"
            });
        }

        // Block inactive users, even if they already have a token
        if (user.isActive !== true) {
            return res.status(403).json({
                success: false,
                message: "Your account is inactive. Please contact admin."
            });
        }

        // Attach authenticated user to request
        req.user = user;

        // Continue
        next();

    } catch (error) {
        console.error("Authentication Error:", error.message);

        return res.status(401).json({
            success: false,
            message: "Invalid or expired token"
        });
    }
};


// ========================================
// 2. ROLE AUTHORIZATION
// ========================================

const authorize = (...roles) => {
    return (req, res, next) => {

        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to access this resource"
            });
        }

        next();
    };
};


// ========================================
// EXPORT MIDDLEWARE
// ========================================

module.exports = {
    protect,
    authorize
};

const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ========================================
// 1. REGISTER USER (PATIENT / DOCTOR)
// ========================================

const registerUser = async (req, res) => {
    try {
        const { name, email, phone, password, role } = req.body;

        // Check required fields
        if (!name || !email || !phone || !password) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        // Check input types
        if (
            typeof name !== "string" ||
            typeof email !== "string" ||
            typeof phone !== "string" ||
            typeof password !== "string"
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid input data"
            });
        }

        // Validate name
        if (name.trim().length < 3 || name.trim().length > 50) {
            return res.status(400).json({
                success: false,
                message: "Name must be between 3 and 50 characters"
            });
        }

        // Validate email
        const normalizedEmail = email.trim().toLowerCase();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(normalizedEmail)) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid email"
            });
        }

        // Validate phone
        if (!/^[0-9]{10}$/.test(phone.trim())) {
            return res.status(400).json({
                success: false,
                message: "Phone number must contain 10 digits"
            });
        }

        // Validate password
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must contain at least 6 characters"
            });
        }

        // Validate role
        const userRole = role || "patient";

        if (!["patient", "doctor"].includes(userRole)) {
            return res.status(400).json({
                success: false,
                message: "Only Patient and Doctor registration is allowed"
            });
        }

        // Check JWT secret before creating account
        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET is missing in .env file");
        }

        // Check existing email
        const existingUser = await User.findOne({
            email: normalizedEmail
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "Email already registered"
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create new user
        const newUser = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            phone: phone.trim(),
            password: hashedPassword,
            role: userRole
        });

        // Generate JWT token after registration
        const token = jwt.sign(
            {
                id: newUser._id.toString(),
                role: newUser.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d"
            }
        );

        // Registration response with token
        return res.status(201).json({
            success: true,
            message: "Registration successful!",
            token,
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                phone: newUser.phone,
                role: newUser.role
            }
        });

    } catch (error) {
        console.error("Registration Error:", error);

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Email already registered"
            });
        }

        return res.status(500).json({
            success: false,
            message: "Registration failed"
        });
    }
};


// ========================================
// 2. LOGIN USER
// ========================================

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check required fields
        if (
            typeof email !== "string" ||
            typeof password !== "string" ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        // Find user
        const normalizedEmail = email.trim().toLowerCase();

        const user = await User.findOne({
            email: normalizedEmail
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // Block inactive account
        if (user.isActive !== true) {
            return res.status(403).json({
                success: false,
                message: "Your account is inactive. Please contact admin."
            });
        }

        // Compare password
        const isMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // Check JWT secret
        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET is missing in .env file");
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                id: user._id.toString(),
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d"
            }
        );

        // Login response
        return res.status(200).json({
            success: true,
            message: "Login successful!",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role
            }
        });

    } catch (error) {
        console.error("Login Error:", error);

        return res.status(500).json({
            success: false,
            message: "Login failed"
        });
    }
};


// ========================================
// EXPORT FUNCTIONS
// ========================================

module.exports = {
    registerUser,
    loginUser
};
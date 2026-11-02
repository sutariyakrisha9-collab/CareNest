const { body } = require("express-validator");

// Registration Validation
const registerValidation = [

    body("name")
        .trim()
        .notEmpty()
        .withMessage("Name is required")
        .isLength({ min: 3, max: 50 })
        .withMessage("Name must be between 3 and 50 characters"),

    body("email")
        .trim()
        .notEmpty()
        .withMessage("Email is required")
        .isEmail()
        .withMessage("Enter a valid email"),

    body("phone")
        .notEmpty()
        .withMessage("Phone number is required")
        .matches(/^[0-9]{10}$/)
        .withMessage("Phone number must contain exactly 10 digits"),

    body("password")
        .isLength({ min: 6 })
        .withMessage("Password must be at least 6 characters"),

    body("role")
        .optional()
        .isIn(["patient", "doctor"])
        .withMessage("Role must be patient or doctor")

];

// Login Validation
const loginValidation = [

    body("email")
        .trim()
        .notEmpty()
        .withMessage("Email is required")
        .isEmail()
        .withMessage("Enter a valid email"),

    body("password")
        .notEmpty()
        .withMessage("Password is required")

];

module.exports = {
    registerValidation,
    loginValidation
};
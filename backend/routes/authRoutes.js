const express = require("express");
const router = express.Router();

const {
    registerUser,
    loginUser
} = require("../controllers/authController");

const {
    registerValidation,
    loginValidation
} = require("../validators/authValidator");

const validateRequest = require("../middleware/validationMiddleware");

// Register API
router.post(
    "/register",
    registerValidation,
    validateRequest,
    registerUser
);

// Login API
router.post(
    "/login",
    loginValidation,
    validateRequest,
    loginUser
);

module.exports = router;
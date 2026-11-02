
const express = require("express");

const router = express.Router();

const {
    protect,
    authorize
} = require("../middleware/authMiddleware");

// Get logged-in user's profile
router.get("/profile", protect, (req, res) => {

    res.status(200).json({
        success: true,
        message: "Protected profile accessed successfully!",
        user: {
            id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            phone: req.user.phone,
            role: req.user.role
        }
    });

});

// Patient-only test route
router.get(
    "/patient-only",
    protect,
    authorize("patient"),
    (req, res) => {
        res.json({
            success: true,
            message: "Welcome Patient! Access granted."
        });
    }
);

module.exports = router;

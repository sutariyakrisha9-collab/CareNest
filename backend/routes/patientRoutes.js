
const express = require("express");

const router = express.Router();

const {
    protect,
    authorize
} = require("../middleware/authMiddleware");

const {
    getPatientDashboard
} = require("../controllers/patientController");

// Patient Dashboard API
router.get(
    "/dashboard",
    protect,
    authorize("patient"),
    getPatientDashboard
);

module.exports = router;

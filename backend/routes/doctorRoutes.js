
const express = require("express");
const router = express.Router();

const {
    protect,
    authorize
} = require("../middleware/authMiddleware");

const {
    getDoctorAppointments,
    updateAppointmentStatus,
    createDoctorProfile,
    getMyDoctorProfile,
    getAllDoctors,
    searchDoctors,
    updateDoctorProfile
} = require("../controllers/doctorController");


// ===================================
// 1. GET ALL AVAILABLE DOCTORS
// ===================================

router.get(
    "/all",
    getAllDoctors
);


// ===================================
// 2. SEARCH AND FILTER DOCTORS
// ===================================

router.get(
    "/search",
    searchDoctors
);


// ===================================
// 3. DOCTOR APPOINTMENT ROUTES
// ===================================

router.get(
    "/appointments",
    protect,
    authorize("doctor"),
    getDoctorAppointments
);

router.patch(
    "/appointments/:id/status",
    protect,
    authorize("doctor"),
    updateAppointmentStatus
);


// ===================================
// 4. DOCTOR PROFILE ROUTES
// ===================================

router.post(
    "/profile",
    protect,
    authorize("doctor"),
    createDoctorProfile
);

router.get(
    "/profile",
    protect,
    authorize("doctor"),
    getMyDoctorProfile
);

router.patch(
    "/profile",
    protect,
    authorize("doctor"),
    updateDoctorProfile
);


module.exports = router;

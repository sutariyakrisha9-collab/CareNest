
const express = require("express");

const router = express.Router();

const {
    protect,
    authorize
} = require("../middleware/authMiddleware");

const {
    bookAppointment,
    getMyAppointments,
    updateAppointment,
    cancelAppointment,
    searchAppointments,
    updateAppointmentStatus
} = require("../controllers/appointmentController");


// ===================================
// SEARCH APPOINTMENTS
// ADMIN AND DOCTOR
// ===================================

router.get(
    "/search",
    protect,
    authorize("admin", "doctor"),
    searchAppointments
);


// ===================================
// BOOK APPOINTMENT - PATIENT ONLY
// ===================================

router.post(
    "/",
    protect,
    authorize("patient"),
    bookAppointment
);


// ===================================
// VIEW OWN APPOINTMENTS - PATIENT ONLY
// ===================================

router.get(
    "/my",
    protect,
    authorize("patient"),
    getMyAppointments
);


// ===================================
// UPDATE OWN APPOINTMENT - PATIENT ONLY
// ===================================

router.patch(
    "/:id",
    protect,
    authorize("patient"),
    updateAppointment
);


// ===================================
// CANCEL OWN APPOINTMENT - PATIENT ONLY
// ===================================

router.patch(
    "/:id/cancel",
    protect,
    authorize("patient"),
    cancelAppointment
);


// ===================================
// UPDATE APPOINTMENT STATUS - ADMIN ONLY
// ===================================

router.patch(
    "/:id/status",
    protect,
    authorize("admin"),
    updateAppointmentStatus
);


module.exports = router;

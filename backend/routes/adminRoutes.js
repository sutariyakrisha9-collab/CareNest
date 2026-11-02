
const express = require("express");
const router = express.Router();

const {
    protect,
    authorize
} = require("../middleware/authMiddleware");

const {
    searchUsers,
    addDoctor,
    updateDoctor,
    deleteDoctor,
    updatePatientStatus
} = require("../controllers/adminController");


// ===================================
// 1. SEARCH PATIENTS AND DOCTORS
// ===================================

router.get(
    "/users",
    protect,
    authorize("admin"),
    searchUsers
);


// ===================================
// 2. ADD DOCTOR
// ===================================

router.post(
    "/doctors",
    protect,
    authorize("admin"),
    addDoctor
);


// ===================================
// 3. UPDATE DOCTOR
// ===================================

router.patch(
    "/doctors/:id",
    protect,
    authorize("admin"),
    updateDoctor
);


// ===================================
// 4. DELETE / DEACTIVATE DOCTOR
// ===================================

router.delete(
    "/doctors/:id",
    protect,
    authorize("admin"),
    deleteDoctor
);


// ===================================
// 5. ACTIVATE / DEACTIVATE PATIENT
// ===================================

router.patch(
    "/patients/:id/status",
    protect,
    authorize("admin"),
    updatePatientStatus
);


// ===================================
// EXPORT ROUTER
// ===================================

module.exports = router;

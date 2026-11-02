
const express = require("express");
const router = express.Router();

const {
    protect,
    authorize
} = require("../middleware/authMiddleware");

const upload = require("../middleware/uploadMiddleware");

const {
    uploadMedicalRecord,
    getMedicalRecords,
    downloadMedicalRecord,
    deleteMedicalRecord
} = require("../controllers/medicalRecordController");

// Upload medical record - Patient only
router.post(
    "/upload",
    protect,
    authorize("patient"),
    upload.single("medicalFile"),
    uploadMedicalRecord
);

// Get medical records
router.get(
    "/",
    protect,
    authorize("patient", "doctor"),
    getMedicalRecords
);

// Download medical record
router.get(
    "/download/:id",
    protect,
    authorize("patient", "doctor"),
    downloadMedicalRecord
);

// Delete medical record - Patient only
router.delete(
    "/:id",
    protect,
    authorize("patient"),
    deleteMedicalRecord
);

module.exports = router;

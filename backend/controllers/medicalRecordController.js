
const MedicalRecord = require("../models/MedicalRecord");
const Appointment = require("../models/Appointment");
const fs = require("fs");
const path = require("path");

// Helper: Check whether user can access a patient's record
const canAccessRecord = async (user, patientId) => {

    // Patient can access only their own records
    if (
        user.role === "patient" &&
        user._id.toString() === patientId.toString()
    ) {
        return true;
    }

    // Doctor can access records only of their assigned patients
    if (user.role === "doctor") {

        const appointment = await Appointment.findOne({
            patient: patientId,
            doctor: user._id
        });

        return !!appointment;
    }

    return false;
};


// 1. Upload Medical Record
const uploadMedicalRecord = async (req, res) => {
    try {

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Please select a medical report"
            });
        }

        const { title, description } = req.body;

        if (!title || !title.trim()) {
            fs.unlinkSync(req.file.path);

            return res.status(400).json({
                success: false,
                message: "Record title is required"
            });
        }

        const record = await MedicalRecord.create({

            patient: req.user._id,

            title: title.trim(),

            description: description || "",

            fileName: req.file.originalname,

            filePath: req.file.path,

            fileType: req.file.mimetype,

            fileSize: req.file.size

        });

        res.status(201).json({
            success: true,
            message: "Medical record uploaded successfully",
            record
        });

    } catch (error) {

        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        console.error("Upload Error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to upload medical record"
        });
    }
};


// 2. Get Medical Records
const getMedicalRecords = async (req, res) => {
    try {

        let query = {};

        if (req.user.role === "patient") {

            query.patient = req.user._id;

        } else if (req.user.role === "doctor") {

            const appointments = await Appointment.find({
                doctor: req.user._id
            }).distinct("patient");

            query.patient = { $in: appointments };

        } else {

            return res.status(403).json({
                success: false,
                message: "Access denied"
            });
        }

        const records = await MedicalRecord.find(query)
            .populate("patient", "name email phone")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            totalRecords: records.length,
            records
        });

    } catch (error) {

        console.error("Fetch Error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to fetch medical records"
        });
    }
};


// 3. Download Medical Record
const downloadMedicalRecord = async (req, res) => {
    try {

        const record = await MedicalRecord.findById(req.params.id);

        if (!record) {
            return res.status(404).json({
                success: false,
                message: "Medical record not found"
            });
        }

        const allowed = await canAccessRecord(
            req.user,
            record.patient
        );

        if (!allowed) {
            return res.status(403).json({
                success: false,
                message: "You cannot access this medical record"
            });
        }

        const fullPath = path.resolve(record.filePath);

        if (!fs.existsSync(fullPath)) {
            return res.status(404).json({
                success: false,
                message: "Medical file not found on server"
            });
        }

        res.download(fullPath, record.fileName);

    } catch (error) {

        console.error("Download Error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to download medical record"
        });
    }
};


// 4. Delete Medical Record
const deleteMedicalRecord = async (req, res) => {
    try {

        const record = await MedicalRecord.findById(req.params.id);

        if (!record) {
            return res.status(404).json({
                success: false,
                message: "Medical record not found"
            });
        }

        // Only the patient who owns the record can delete it
        if (
            req.user.role !== "patient" ||
            req.user._id.toString() !== record.patient.toString()
        ) {
            return res.status(403).json({
                success: false,
                message: "Only the record owner can delete it"
            });
        }

        const fullPath = path.resolve(record.filePath);

        await MedicalRecord.findByIdAndDelete(record._id);

        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
        }

        res.status(200).json({
            success: true,
            message: "Medical record deleted successfully"
        });

    } catch (error) {

        console.error("Delete Error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to delete medical record"
        });
    }
};


module.exports = {
    uploadMedicalRecord,
    getMedicalRecords,
    downloadMedicalRecord,
    deleteMedicalRecord
};

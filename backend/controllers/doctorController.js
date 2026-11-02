
const Appointment = require("../models/Appointment");
const Doctor = require("../models/Doctor");
const User = require("../models/User");
const mongoose = require("mongoose");


// ===================================
// 1. GET DOCTOR'S APPOINTMENTS
// ===================================

const getDoctorAppointments = async (req, res) => {
    try {
        const appointments = await Appointment.find({
            doctor: req.user._id
        })
            .populate("patient", "name email phone")
            .sort({ appointmentDate: 1 });

        res.status(200).json({
            success: true,
            totalAppointments: appointments.length,
            appointments
        });

    } catch (error) {
        console.error("Get Doctor Appointments Error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to fetch appointments"
        });
    }
};


// ===================================
// 2. UPDATE APPOINTMENT STATUS
// ===================================

const updateAppointmentStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const appointmentId = req.params.id;

        // Check valid MongoDB ID
        if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid appointment ID"
            });
        }

        // Allowed statuses
        const allowedStatuses = [
            "confirmed",
            "completed",
            "cancelled"
        ];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid appointment status"
            });
        }

        // Find appointment belonging to logged-in doctor
        const appointment = await Appointment.findOne({
            _id: appointmentId,
            doctor: req.user._id
        });

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: "Appointment not found"
            });
        }

        // Completed and cancelled appointments cannot be changed
        if (
            appointment.status === "completed" ||
            appointment.status === "cancelled"
        ) {
            return res.status(400).json({
                success: false,
                message: "This appointment cannot be changed"
            });
        }

        // Pending appointment must be confirmed first
        if (
            appointment.status === "pending" &&
            status === "completed"
        ) {
            return res.status(400).json({
                success: false,
                message: "Please confirm the appointment before completing it"
            });
        }

        appointment.status = status;

        await appointment.save();

        res.status(200).json({
            success: true,
            message: "Appointment status updated successfully!",
            appointment
        });

    } catch (error) {
        console.error("Update Appointment Status Error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to update appointment status"
        });
    }
};


// ===================================
// 3. CREATE DOCTOR PROFILE
// ===================================

const createDoctorProfile = async (req, res) => {
    try {
        const {
            specialization,
            qualification,
            experience,
            consultationFee,
            about,
            availableDays
        } = req.body;

        if (
            !specialization ||
            !qualification ||
            experience === undefined ||
            consultationFee === undefined
        ) {
            return res.status(400).json({
                success: false,
                message: "Specialization, qualification, experience and fee are required"
            });
        }

        const user = await User.findById(req.user._id);

        if (!user || user.role !== "doctor") {
            return res.status(403).json({
                success: false,
                message: "Only doctors can create doctor profiles"
            });
        }

        const existingProfile = await Doctor.findOne({
            user: req.user._id
        });

        if (existingProfile) {
            return res.status(409).json({
                success: false,
                message: "Doctor profile already exists"
            });
        }

        const experienceNumber = Number(experience);
        const feeNumber = Number(consultationFee);

        if (
            !Number.isFinite(experienceNumber) ||
            experienceNumber < 0 ||
            experienceNumber > 60 ||
            !Number.isFinite(feeNumber) ||
            feeNumber < 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Enter valid experience and consultation fee"
            });
        }

        if (
            typeof specialization !== "string" ||
            typeof qualification !== "string" ||
            !specialization.trim() ||
            !qualification.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Enter valid specialization and qualification"
            });
        }

        if (
            availableDays !== undefined &&
            !Array.isArray(availableDays)
        ) {
            return res.status(400).json({
                success: false,
                message: "Available days must be an array"
            });
        }

        const doctor = await Doctor.create({
            user: req.user._id,
            specialization: specialization.trim(),
            qualification: qualification.trim(),
            experience: experienceNumber,
            consultationFee: feeNumber,
            about,
            availableDays
        });

        res.status(201).json({
            success: true,
            message: "Doctor profile created successfully!",
            doctor
        });

    } catch (error) {
        console.error("Create Doctor Profile Error:", error);

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Doctor profile already exists"
            });
        }

        if (error.name === "ValidationError") {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: "Unable to create doctor profile"
        });
    }
};


// ===================================
// 4. GET MY DOCTOR PROFILE
// ===================================

const getMyDoctorProfile = async (req, res) => {
    try {
        const doctor = await Doctor.findOne({
            user: req.user._id
        }).populate("user", "name email phone");

        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: "Doctor profile not found"
            });
        }

        res.status(200).json({
            success: true,
            doctor
        });

    } catch (error) {
        console.error("Get Doctor Profile Error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to fetch doctor profile"
        });
    }
};


// ===================================
// 5. GET ALL AVAILABLE DOCTORS
// ===================================

const getAllDoctors = async (req, res) => {
    try {
        const doctors = await Doctor.find({
            isAvailable: true
        })
            .populate({
                path: "user",
                match: {
                    role: "doctor",
                    isActive: true
                },
                select: "name email phone"
            })
            .sort({ createdAt: -1 });

        const activeDoctors = doctors.filter(
            doctor => doctor.user !== null
        );

        res.status(200).json({
            success: true,
            totalDoctors: activeDoctors.length,
            doctors: activeDoctors
        });

    } catch (error) {
        console.error("Get All Doctors Error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to fetch doctors"
        });
    }
};


// ===================================
// 6. SEARCH AND FILTER DOCTORS
// ===================================

const searchDoctors = async (req, res) => {
    try {
        const {
            keyword,
            specialization,
            minFee,
            maxFee,
            sortBy = "createdAt",
            order = "desc",
            page = 1,
            limit = 10
        } = req.query;

        const minimumFee = Number(minFee);
        const maximumFee = Number(maxFee);

        if (
            (minFee !== undefined &&
                (!Number.isFinite(minimumFee) || minimumFee < 0)) ||
            (maxFee !== undefined &&
                (!Number.isFinite(maximumFee) || maximumFee < 0))
        ) {
            return res.status(400).json({
                success: false,
                message: "Enter valid minimum and maximum fees"
            });
        }

        if (
            minFee !== undefined &&
            maxFee !== undefined &&
            minimumFee > maximumFee
        ) {
            return res.status(400).json({
                success: false,
                message: "Minimum fee cannot be greater than maximum fee"
            });
        }

        const currentPage = Math.max(1, Number(page) || 1);

        const pageLimit = Math.min(
            50,
            Math.max(1, Number(limit) || 10)
        );

        const userQuery = {
            role: "doctor",
            isActive: true
        };

        if (keyword && keyword.trim()) {
            userQuery.name = {
                $regex: keyword.trim(),
                $options: "i"
            };
        }

        const users = await User.find(userQuery).select("_id");

        const userIds = users.map(user => user._id);

        const doctorQuery = {
            user: { $in: userIds },
            isAvailable: true
        };

        if (specialization && specialization.trim()) {
            doctorQuery.specialization = {
                $regex: specialization.trim(),
                $options: "i"
            };
        }

        if (minFee !== undefined || maxFee !== undefined) {
            doctorQuery.consultationFee = {};

            if (minFee !== undefined) {
                doctorQuery.consultationFee.$gte = minimumFee;
            }

            if (maxFee !== undefined) {
                doctorQuery.consultationFee.$lte = maximumFee;
            }
        }

        const allowedSortFields = [
            "createdAt",
            "consultationFee",
            "experience"
        ];

        const sortField = allowedSortFields.includes(sortBy)
            ? sortBy
            : "createdAt";

        const sortOrder = order === "asc" ? 1 : -1;

        const skip = (currentPage - 1) * pageLimit;

        const totalDoctors = await Doctor.countDocuments(doctorQuery);

        const doctors = await Doctor.find(doctorQuery)
            .populate("user", "name email phone")
            .sort({ [sortField]: sortOrder })
            .skip(skip)
            .limit(pageLimit);

        res.status(200).json({
            success: true,
            totalDoctors,
            currentPage,
            totalPages: Math.ceil(totalDoctors / pageLimit),
            doctors
        });

    } catch (error) {
        console.error("Search Doctors Error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to search doctors"
        });
    }
};


// ===================================
// 7. UPDATE DOCTOR PROFILE
// ===================================

const updateDoctorProfile = async (req, res) => {
    try {
        const {
            specialization,
            qualification,
            experience,
            consultationFee,
            about,
            availableDays,
            isAvailable
        } = req.body;

        const doctor = await Doctor.findOne({
            user: req.user._id
        });

        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: "Doctor profile not found"
            });
        }

        if (specialization !== undefined) {
            if (
                typeof specialization !== "string" ||
                !specialization.trim()
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Enter a valid specialization"
                });
            }

            doctor.specialization = specialization.trim();
        }

        if (qualification !== undefined) {
            if (
                typeof qualification !== "string" ||
                !qualification.trim()
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Enter a valid qualification"
                });
            }

            doctor.qualification = qualification.trim();
        }

        if (about !== undefined) {
            if (typeof about !== "string") {
                return res.status(400).json({
                    success: false,
                    message: "About must be text"
                });
            }

            doctor.about = about;
        }

        if (experience !== undefined) {
            const experienceNumber = Number(experience);

            if (
                !Number.isFinite(experienceNumber) ||
                experienceNumber < 0 ||
                experienceNumber > 60
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Experience must be between 0 and 60 years"
                });
            }

            doctor.experience = experienceNumber;
        }

        if (consultationFee !== undefined) {
            const feeNumber = Number(consultationFee);

            if (
                !Number.isFinite(feeNumber) ||
                feeNumber < 0
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Enter a valid consultation fee"
                });
            }

            doctor.consultationFee = feeNumber;
        }

        if (availableDays !== undefined) {
            if (!Array.isArray(availableDays)) {
                return res.status(400).json({
                    success: false,
                    message: "Available days must be an array"
                });
            }

            doctor.availableDays = availableDays;
        }

        if (isAvailable !== undefined) {
            if (typeof isAvailable !== "boolean") {
                return res.status(400).json({
                    success: false,
                    message: "isAvailable must be true or false"
                });
            }

            doctor.isAvailable = isAvailable;
        }

        await doctor.save();

        res.status(200).json({
            success: true,
            message: "Doctor profile updated successfully",
            doctor
        });

    } catch (error) {
        console.error("Update Doctor Profile Error:", error);

        if (error.name === "ValidationError") {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: "Unable to update doctor profile"
        });
    }
};


// ===================================
// EXPORT ALL FUNCTIONS
// ===================================

module.exports = {
    getDoctorAppointments,
    updateAppointmentStatus,
    createDoctorProfile,
    getMyDoctorProfile,
    getAllDoctors,
    searchDoctors,
    updateDoctorProfile
};

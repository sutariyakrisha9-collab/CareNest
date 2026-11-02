
const User = require("../models/User");
const Doctor = require("../models/Doctor");
const bcrypt = require("bcryptjs");

// ===================================
// 1. SEARCH PATIENTS AND DOCTORS
// ===================================

const searchUsers = async (req, res) => {
    try {
        const {
            keyword,
            role,
            page = 1,
            limit = 5
        } = req.query;

        const currentPage = Math.max(1, parseInt(page) || 1);

        const perPage = Math.min(
            50,
            Math.max(1, parseInt(limit) || 5)
        );

        // Include both active and inactive users
        const query = {
            role: { $in: ["patient", "doctor"] }
        };

        if (keyword && keyword.trim()) {
            query.$or = [
                {
                    name: {
                        $regex: keyword.trim(),
                        $options: "i"
                    }
                },
                {
                    email: {
                        $regex: keyword.trim(),
                        $options: "i"
                    }
                }
            ];
        }

        if (role) {
            if (!["patient", "doctor"].includes(role)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid role. Use patient or doctor."
                });
            }

            query.role = role;
        }

        const totalUsers = await User.countDocuments(query);

        const users = await User.find(query)
            .select("-password")
            .sort({ createdAt: -1 })
            .skip((currentPage - 1) * perPage)
            .limit(perPage);

        res.status(200).json({
            success: true,
            totalUsers,
            currentPage,
            totalPages: Math.ceil(totalUsers / perPage),
            users
        });

    } catch (error) {
        console.error("Search Users Error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to search users"
        });
    }
};


// ===================================
// 2. ADMIN ADD DOCTOR
// ===================================

const addDoctor = async (req, res) => {
    let createdUser = null;

    try {
        const {
            name,
            email,
            phone,
            password,
            specialization,
            qualification,
            experience,
            consultationFee,
            about,
            availableDays
        } = req.body;

        if (
            !name ||
            !email ||
            !phone ||
            !password ||
            !specialization ||
            !qualification ||
            experience === undefined ||
            consultationFee === undefined
        ) {
            return res.status(400).json({
                success: false,
                message: "Please fill all required fields"
            });
        }

        if (
            typeof name !== "string" ||
            typeof email !== "string" ||
            typeof phone !== "string" ||
            typeof specialization !== "string" ||
            typeof qualification !== "string" ||
            typeof password !== "string"
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid input data"
            });
        }

        if (name.trim().length < 3 || name.trim().length > 50) {
            return res.status(400).json({
                success: false,
                message: "Name must contain 3 to 50 characters"
            });
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            return res.status(400).json({
                success: false,
                message: "Enter a valid email address"
            });
        }

        if (!/^\d{10}$/.test(phone.trim())) {
            return res.status(400).json({
                success: false,
                message: "Phone number must contain exactly 10 digits"
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must contain at least 6 characters"
            });
        }

        const experienceNumber = Number(experience);
        const feeNumber = Number(consultationFee);

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

        if (!Number.isFinite(feeNumber) || feeNumber < 0) {
            return res.status(400).json({
                success: false,
                message: "Enter a valid consultation fee"
            });
        }

        if (
            specialization.trim().length > 100 ||
            qualification.trim().length > 150
        ) {
            return res.status(400).json({
                success: false,
                message: "Specialization or qualification is too long"
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

        const existingUser = await User.findOne({
            email: email.trim().toLowerCase()
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "Email already registered"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        createdUser = await User.create({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            phone: phone.trim(),
            password: hashedPassword,
            role: "doctor"
        });

        const doctor = await Doctor.create({
            user: createdUser._id,
            specialization: specialization.trim(),
            qualification: qualification.trim(),
            experience: experienceNumber,
            consultationFee: feeNumber,
            about: about || "",
            availableDays: availableDays || []
        });

        const safeUser = {
            _id: createdUser._id,
            name: createdUser.name,
            email: createdUser.email,
            phone: createdUser.phone,
            role: createdUser.role
        };

        res.status(201).json({
            success: true,
            message: "Doctor added successfully!",
            user: safeUser,
            doctor
        });

    } catch (error) {
        console.error("Add Doctor Error:", error);

        if (createdUser) {
            await User.findByIdAndDelete(createdUser._id);
        }

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Email or doctor profile already exists"
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
            message: "Unable to add doctor"
        });
    }
};


// ===================================
// 3. ADMIN UPDATE DOCTOR
// ===================================

const updateDoctor = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            name,
            email,
            phone,
            specialization,
            qualification,
            experience,
            consultationFee,
            about,
            availableDays
        } = req.body;

        const doctor = await Doctor.findById(id);

        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: "Doctor not found"
            });
        }

        const user = await User.findById(doctor.user);

        if (!user || user.role !== "doctor") {
            return res.status(404).json({
                success: false,
                message: "Doctor account not found"
            });
        }

        if (name !== undefined) {
            if (
                typeof name !== "string" ||
                name.trim().length < 3 ||
                name.trim().length > 50
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Name must contain 3 to 50 characters"
                });
            }

            user.name = name.trim();
        }

        if (email !== undefined) {
            if (
                typeof email !== "string" ||
                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Enter a valid email address"
                });
            }

            const normalizedEmail = email.trim().toLowerCase();

            const existingEmail = await User.findOne({
                email: normalizedEmail,
                _id: { $ne: user._id }
            });

            if (existingEmail) {
                return res.status(409).json({
                    success: false,
                    message: "Email already registered"
                });
            }

            user.email = normalizedEmail;
        }

        if (phone !== undefined) {
            if (
                typeof phone !== "string" ||
                !/^\d{10}$/.test(phone.trim())
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Phone number must contain exactly 10 digits"
                });
            }

            user.phone = phone.trim();
        }

        if (specialization !== undefined) {
            if (
                typeof specialization !== "string" ||
                !specialization.trim() ||
                specialization.trim().length > 100
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
                !qualification.trim() ||
                qualification.trim().length > 150
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Enter a valid qualification"
                });
            }

            doctor.qualification = qualification.trim();
        }

        if (experience !== undefined) {
            const value = Number(experience);

            if (
                !Number.isFinite(value) ||
                value < 0 ||
                value > 60
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Experience must be between 0 and 60"
                });
            }

            doctor.experience = value;
        }

        if (consultationFee !== undefined) {
            const value = Number(consultationFee);

            if (!Number.isFinite(value) || value < 0) {
                return res.status(400).json({
                    success: false,
                    message: "Enter a valid consultation fee"
                });
            }

            doctor.consultationFee = value;
        }

        if (about !== undefined) {
            if (
                typeof about !== "string" ||
                about.length > 1000
            ) {
                return res.status(400).json({
                    success: false,
                    message: "About must not exceed 1000 characters"
                });
            }

            doctor.about = about.trim();
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

        await user.save();
        await doctor.save();

        res.status(200).json({
            success: true,
            message: "Doctor updated successfully!",
            doctor: {
                ...doctor.toObject(),
                user: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    role: user.role
                }
            }
        });

    } catch (error) {
        console.error("Update Doctor Error:", error);

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Email already registered"
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
            message: "Unable to update doctor"
        });
    }
};


// ===================================
// 4. ADMIN DELETE DOCTOR
// ===================================

const deleteDoctor = async (req, res) => {
    try {
        const { id } = req.params;

        const doctor = await Doctor.findById(id);

        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: "Doctor not found"
            });
        }

        const user = await User.findById(doctor.user);

        if (!user || user.role !== "doctor") {
            return res.status(404).json({
                success: false,
                message: "Doctor account not found"
            });
        }

        // Soft delete: preserve account and appointment history
        user.isActive = false;
        doctor.isAvailable = false;

        await user.save();
        await doctor.save();

        res.status(200).json({
            success: true,
            message: "Doctor deactivated successfully!"
        });

    } catch (error) {
        console.error("Delete Doctor Error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to deactivate doctor"
        });
    }
};


// ===================================
// 5. ADMIN ACTIVATE / DEACTIVATE PATIENT
// ===================================

const updatePatientStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;

        if (typeof isActive !== "boolean") {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid status"
            });
        }

        if (!/^[0-9a-fA-F]{24}$/.test(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid patient ID"
            });
        }

        const patient = await User.findOne({
            _id: id,
            role: "patient"
        });

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: "Patient not found"
            });
        }

        patient.isActive = isActive;
        await patient.save();

        res.status(200).json({
            success: true,
            message: isActive
                ? "Patient activated successfully!"
                : "Patient deactivated successfully!",
            patient: {
                _id: patient._id,
                name: patient.name,
                email: patient.email,
                phone: patient.phone,
                role: patient.role,
                isActive: patient.isActive
            }
        });

    } catch (error) {
        console.error("Update Patient Status Error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to update patient status"
        });
    }
};


// ===================================
// EXPORT FUNCTIONS
// ===================================

module.exports = {
    searchUsers,
    addDoctor,
    updateDoctor,
    deleteDoctor,
    updatePatientStatus
};

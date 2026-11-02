
const Appointment = require("../models/Appointment");
const User = require("../models/User");

// ===================================
// CHECK DOCTOR APPOINTMENT CONFLICT
// ===================================

const checkAppointmentConflict = async (
    doctorId,
    appointmentDate,
    excludeAppointmentId = null
) => {
    const startTime = new Date(appointmentDate);

    const endTime = new Date(
        startTime.getTime() + 30 * 60 * 1000
    );

    const query = {
        doctor: doctorId,
        status: { $in: ["pending", "confirmed"] },
        appointmentDate: { $lt: endTime },
        $expr: {
            $gt: [
                {
                    $add: [
                        "$appointmentDate",
                        {
                            $multiply: [
                                { $ifNull: ["$duration", 30] },
                                60000
                            ]
                        }
                    ]
                },
                startTime
            ]
        }
    };

    if (excludeAppointmentId) {
        query._id = { $ne: excludeAppointmentId };
    }

    return await Appointment.findOne(query);
};


// ===================================
// BOOK APPOINTMENT - PATIENT
// ===================================

const bookAppointment = async (req, res) => {
    try {
        const { doctor, appointmentDate, reason } = req.body;

        if (!doctor || !appointmentDate || !reason) {
            return res.status(400).json({
                success: false,
                message: "Doctor, appointment date and reason are required"
            });
        }

        if (!/^[0-9a-fA-F]{24}$/.test(doctor)) {
            return res.status(400).json({
                success: false,
                message: "Invalid doctor ID"
            });
        }

        const doctorUser = await User.findOne({
            _id: doctor,
            role: "doctor",
            isActive: true
        });

        if (!doctorUser) {
            return res.status(404).json({
                success: false,
                message: "Doctor not found"
            });
        }

        const date = new Date(appointmentDate);

        if (isNaN(date.getTime()) || date <= new Date()) {
            return res.status(400).json({
                success: false,
                message: "Please select a valid future appointment date"
            });
        }

        if (
            typeof reason !== "string" ||
            reason.trim().length === 0 ||
            reason.length > 500
        ) {
            return res.status(400).json({
                success: false,
                message: "Reason must contain 1 to 500 characters"
            });
        }

        const conflict = await checkAppointmentConflict(
            doctor,
            date
        );

        if (conflict) {
            return res.status(409).json({
                success: false,
                message: "This doctor is not available during this time. Please select another time."
            });
        }

        const appointment = await Appointment.create({
            patient: req.user._id,
            doctor,
            appointmentDate: date,
            duration: 30,
            reason: reason.trim()
        });

        res.status(201).json({
            success: true,
            message: "Appointment booked successfully!",
            appointment
        });

    } catch (error) {
        console.error("Book Appointment Error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to book appointment"
        });
    }
};


// ===================================
// GET MY APPOINTMENTS - PATIENT
// ===================================

const getMyAppointments = async (req, res) => {
    try {
        const appointments = await Appointment.find({
            patient: req.user._id
        })
            .populate("doctor", "name email phone")
            .sort({ appointmentDate: 1 });

        res.status(200).json({
            success: true,
            total: appointments.length,
            appointments
        });

    } catch (error) {
        console.error("Get Appointments Error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to fetch appointments"
        });
    }
};


// ===================================
// UPDATE MY APPOINTMENT - PATIENT
// ===================================

const updateAppointment = async (req, res) => {
    try {
        const { appointmentDate, reason } = req.body;

        if (!appointmentDate && reason === undefined) {
            return res.status(400).json({
                success: false,
                message: "Provide appointment date or reason to update"
            });
        }

        const appointment = await Appointment.findOne({
            _id: req.params.id,
            patient: req.user._id
        });

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: "Appointment not found"
            });
        }

        if (["cancelled", "completed"].includes(appointment.status)) {
            return res.status(400).json({
                success: false,
                message: "This appointment cannot be updated"
            });
        }

        if (appointmentDate) {
            const date = new Date(appointmentDate);

            if (isNaN(date.getTime()) || date <= new Date()) {
                return res.status(400).json({
                    success: false,
                    message: "Please select a valid future appointment date"
                });
            }

            const conflict = await checkAppointmentConflict(
                appointment.doctor,
                date,
                appointment._id
            );

            if (conflict) {
                return res.status(409).json({
                    success: false,
                    message: "This doctor is not available during this time. Please select another time."
                });
            }

            appointment.appointmentDate = date;
        }

        if (reason !== undefined) {
            if (
                typeof reason !== "string" ||
                !reason.trim() ||
                reason.length > 500
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Reason must contain 1 to 500 characters"
                });
            }

            appointment.reason = reason.trim();
        }

        await appointment.save();

        res.status(200).json({
            success: true,
            message: "Appointment updated successfully!",
            appointment
        });

    } catch (error) {
        console.error("Update Appointment Error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to update appointment"
        });
    }
};


// ===================================
// CANCEL MY APPOINTMENT - PATIENT
// ===================================

const cancelAppointment = async (req, res) => {
    try {
        const appointment = await Appointment.findOne({
            _id: req.params.id,
            patient: req.user._id
        });

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: "Appointment not found"
            });
        }

        if (appointment.status === "completed") {
            return res.status(400).json({
                success: false,
                message: "Completed appointment cannot be cancelled"
            });
        }

        if (appointment.status === "cancelled") {
            return res.status(400).json({
                success: false,
                message: "Appointment is already cancelled"
            });
        }

        appointment.status = "cancelled";

        await appointment.save();

        res.status(200).json({
            success: true,
            message: "Appointment cancelled successfully!"
        });

    } catch (error) {
        console.error("Cancel Appointment Error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to cancel appointment"
        });
    }
};


// ===================================
// SEARCH, FILTER AND PAGINATION
// ADMIN AND DOCTOR
// ===================================

const searchAppointments = async (req, res) => {
    try {
        const {
            keyword,
            status,
            page = 1,
            limit = 5
        } = req.query;

        const currentPage = Math.max(
            1,
            parseInt(page, 10) || 1
        );

        const perPage = Math.min(
            50,
            Math.max(1, parseInt(limit, 10) || 5)
        );

        const query = {};

        // Doctor can see only their own appointments.
        // Admin can see all appointments.

        if (req.user.role === "doctor") {
            query.doctor = req.user._id;
        }

        const allowedStatuses = [
            "pending",
            "confirmed",
            "completed",
            "cancelled"
        ];

        if (status) {
            if (!allowedStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid appointment status"
                });
            }

            query.status = status;
        }

        // Search patient by name or email
        if (keyword && keyword.trim()) {
            const matchingPatients = await User.find({
                role: "patient",
                $or: [
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
                ]
            }).select("_id");

            query.patient = {
                $in: matchingPatients.map(user => user._id)
            };
        }

        const totalAppointments =
            await Appointment.countDocuments(query);

        const appointments = await Appointment.find(query)
            .populate("patient", "name email phone")
            .populate("doctor", "name email phone")
            .sort({ appointmentDate: -1 })
            .skip((currentPage - 1) * perPage)
            .limit(perPage);

        res.status(200).json({
            success: true,
            totalAppointments,
            currentPage,
            totalPages: Math.ceil(
                totalAppointments / perPage
            ),
            appointments
        });

    } catch (error) {
        console.error("Search Appointments Error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to search appointments"
        });
    }
};


// ===================================
// UPDATE APPOINTMENT STATUS - ADMIN
// ===================================

const updateAppointmentStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const appointmentId = req.params.id;

        const allowedStatuses = [
            "pending",
            "confirmed",
            "completed",
            "cancelled"
        ];

        if (!/^[0-9a-fA-F]{24}$/.test(appointmentId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid appointment ID"
            });
        }

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status. Use pending, confirmed, completed or cancelled."
            });
        }

        const appointment = await Appointment.findById(
            appointmentId
        );

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: "Appointment not found"
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
// EXPORT ALL FUNCTIONS
// ===================================

module.exports = {
    bookAppointment,
    getMyAppointments,
    updateAppointment,
    cancelAppointment,
    searchAppointments,
    updateAppointmentStatus
};

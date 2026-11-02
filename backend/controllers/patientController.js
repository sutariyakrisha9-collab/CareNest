
const User = require("../models/User");

// PATIENT DASHBOARD
const getPatientDashboard = async (req, res) => {
    try {

        // Get logged-in patient from database
        const patient = await User.findById(req.user._id)
            .select("-password");

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: "Patient not found"
            });
        }

        // Check patient role
        if (patient.role !== "patient") {
            return res.status(403).json({
                success: false,
                message: "Only patients can access this dashboard"
            });
        }

        // Dashboard response
        res.status(200).json({
            success: true,
            message: "Welcome to CareNest Patient Dashboard!",

            dashboard: {
                patient: {
                    id: patient._id,
                    name: patient.name,
                    email: patient.email,
                    phone: patient.phone,
                    role: patient.role
                },

                statistics: {
                    totalAppointments: 0,
                    upcomingAppointments: 0,
                    completedAppointments: 0,
                    medicalRecords: 0
                }
            }
        });

    } catch (error) {

        console.error("Patient Dashboard Error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to load patient dashboard"
        });
    }
};

module.exports = { getPatientDashboard };

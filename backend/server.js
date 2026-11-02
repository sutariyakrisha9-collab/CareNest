
require("dotenv").config();

const express = require("express");
const cors = require("cors");

const {
    notFound,
    errorHandler
} = require("./middleware/errorMiddleware");

const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const patientRoutes = require("./routes/patientRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const doctorRoutes = require("./routes/doctorRoutes");
const medicalRecordRoutes = require("./routes/medicalRecordRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

// ===============================
// CORS Configuration
// ===============================
app.use(cors({
    origin: [
        "http://localhost:5500",
        "http://127.0.0.1:5500",
        "https://carenest-virid.vercel.app"
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

// ===============================
// Body Parsing Middleware
// ===============================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===============================
// Home Route
// ===============================
app.get("/", (req, res) => {
    res.status(200).send("Welcome to CareNest Backend API!");
});

// ===============================
// API Routes
// ===============================
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/patient", patientRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/doctor", doctorRoutes);
app.use("/api/medical-records", medicalRecordRoutes);
app.use("/api/admin", adminRoutes);

// ===============================
// 404 Error Middleware
// ===============================
app.use(notFound);

// ===============================
// Centralized Error Handler
// ===============================
app.use(errorHandler);

// ===============================
// Server Port
// ===============================
const PORT = process.env.PORT || 5000;

// ===============================
// Start Server
// ===============================
const startServer = async () => {
    try {
        await connectDB();

        app.listen(PORT, () => {
            console.log(`CareNest Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Server startup failed:", error.message);
        process.exit(1);
    }
};

startServer();

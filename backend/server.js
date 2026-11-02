require("dotenv").config();
const {
    notFound,
    errorHandler
} = require("./middleware/errorMiddleware");

const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const patientRoutes = require("./routes/patientRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const doctorRoutes = require("./routes/doctorRoutes");
const medicalRecordRoutes = require("./routes/medicalRecordRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));



// Home Route
app.get("/", (req, res) => {
    res.send("Welcome to CareNest Backend API!");
});

// Authentication Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/patient", patientRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/doctor", doctorRoutes);
app.use("/api/medical-records", medicalRecordRoutes);
app.use("/api/admin", adminRoutes);


// 404 Error Middleware
app.use(notFound);

// Centralized Error Handler
app.use(errorHandler);

// Server Port
const PORT = process.env.PORT || 5000;

// Start Server
const startServer = async () => {
    await connectDB();

    app.listen(PORT, () => {
        console.log(`CareNest Server is running on port ${PORT}`);
    });
};

startServer();

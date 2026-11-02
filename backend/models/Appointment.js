
const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema({

    // Patient ID
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    // Doctor ID
    doctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    // Appointment Date and Time
    appointmentDate: {
        type: Date,
        required: true
    },

    // Appointment Duration (30 Minutes)
    duration: {
        type: Number,
        default: 30,
        min: 1
    },

    // Appointment Reason
    reason: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500
    },

    // Appointment Status
    status: {
        type: String,
        enum: ["pending", "confirmed", "completed", "cancelled"],
        default: "pending"
    },

    // Additional Notes
    notes: {
        type: String,
        trim: true,
        maxlength: 1000,
        default: ""
    }

}, {
    timestamps: true
});

module.exports = mongoose.model("Appointment", appointmentSchema);

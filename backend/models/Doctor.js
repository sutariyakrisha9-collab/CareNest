
const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema({

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true
    },

    specialization: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },

    qualification: {
        type: String,
        required: true,
        trim: true,
        maxlength: 150
    },

    experience: {
        type: Number,
        required: true,
        min: 0,
        max: 60
    },

    consultationFee: {
        type: Number,
        required: true,
        min: 0
    },

    about: {
        type: String,
        trim: true,
        maxlength: 1000,
        default: ""
    },

    availableDays: {
        type: [String],
        enum: [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday"
        ],
        default: []
    },

    isAvailable: {
        type: Boolean,
        default: true
    }

}, {
    timestamps: true
});

module.exports = mongoose.model("Doctor", doctorSchema);

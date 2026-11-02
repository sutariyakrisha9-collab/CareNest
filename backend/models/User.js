
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 3,
        maxlength: 50
    },

    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },

    phone: {
        type: String,
        required: true,
        match: /^[0-9]{10}$/
    },

    password: {
        type: String,
        required: true,
        minlength: 6
    },

    role: {
        type: String,
        enum: ["patient", "doctor", "admin"],
        default: "patient"
    },

    isActive: {
        type: Boolean,
        default: true
    }

}, {
    timestamps: true
});

const User = mongoose.model("User", userSchema);

module.exports = User;

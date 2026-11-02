
const mongoose = require("mongoose");

const medicalRecordSchema = new mongoose.Schema({

    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },

    description: {
        type: String,
        trim: true,
        maxlength: 500,
        default: ""
    },

    fileName: {
        type: String,
        required: true
    },

    filePath: {
        type: String,
        required: true
    },

    fileType: {
        type: String,
        required: true
    },

    fileSize: {
        type: Number,
        required: true
    }

}, {
    timestamps: true
});

module.exports = mongoose.model(
    "MedicalRecord",
    medicalRecordSchema
);

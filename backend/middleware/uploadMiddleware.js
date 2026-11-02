
const multer = require("multer");
const path = require("path");
const crypto = require("crypto");
const fs = require("fs");

// Create upload directory automatically
const uploadPath = path.join(
    __dirname,
    "..",
    "uploads",
    "medical-records"
);

if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
}

const storage = multer.diskStorage({

    destination: (req, file, cb) => {
        cb(null, uploadPath);
    },

    filename: (req, file, cb) => {
        const uniqueName =
            crypto.randomBytes(16).toString("hex");

        cb(
            null,
            uniqueName + path.extname(file.originalname).toLowerCase()
        );
    }

});

const fileFilter = (req, file, cb) => {

    const allowedTypes = [
        "application/pdf",
        "image/jpeg",
        "image/png"
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(
            new Error("Only PDF, JPG and PNG files are allowed!"),
            false
        );
    }

};

const upload = multer({

    storage: storage,

    fileFilter: fileFilter,

    limits: {
        fileSize: 5 * 1024 * 1024
    }

});

module.exports = upload;

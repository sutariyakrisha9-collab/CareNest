// Not Found Middleware
const notFound = (req, res, next) => {
    const error = new Error(`Route Not Found: ${req.originalUrl}`);

    res.status(404);
    next(error);
};

// Centralized Error Handler
const errorHandler = (err, req, res, next) => {

    let statusCode = res.statusCode === 200 ? 500 : res.statusCode;

    // Mongoose Invalid ObjectId Error
    if (err.name === "CastError") {
        statusCode = 400;
        err.message = "Invalid ID format";
    }

    // MongoDB Duplicate Value Error
    if (err.code === 11000) {
        statusCode = 409;
        err.message = "Duplicate value already exists";
    }

    // Mongoose Validation Error
    if (err.name === "ValidationError") {
        statusCode = 400;
    }

    res.status(statusCode).json({
        success: false,
        message: err.message || "Internal Server Error",
        stack: process.env.NODE_ENV === "development"
            ? err.stack
            : undefined
    });
};

module.exports = {
    notFound,
    errorHandler
};
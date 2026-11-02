
require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

const createAdmin = async () => {
    try {

        await mongoose.connect(process.env.MONGO_URI);

        console.log("MongoDB Connected!");

        const existingAdmin = await User.findOne({
            email: "admin@carenest.com"
        });

        if (existingAdmin) {
            console.log("Admin account already exists!");
            return;
        }

        const hashedPassword = await bcrypt.hash(
            "Admin@12345",
            12
        );

        const admin = await User.create({
            name: "CareNest Admin",
            email: "admin@carenest.com",
            phone: "9999999999",
            password: hashedPassword,
            role: "admin"
        });

        console.log("Admin Created Successfully!");
        console.log("Admin Email:", admin.email);
        console.log("Admin Role:", admin.role);

    } catch (error) {

        console.log("Admin Creation Error:", error.message);

    } finally {
        await mongoose.disconnect();
    }
};

createAdmin();

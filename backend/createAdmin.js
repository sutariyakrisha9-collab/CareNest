
require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

const createAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB Connected!");

        const email = "admin@carenest.com";
        const newPassword = "CareNestAdmin@2026";

        const hashedPassword = await bcrypt.hash(newPassword, 12);

        const existingAdmin = await User.findOne({ email });

        if (existingAdmin) {
            existingAdmin.name = "CareNest Admin";
            existingAdmin.password = hashedPassword;
            existingAdmin.role = "admin";
            existingAdmin.isActive = true;

            await existingAdmin.save();

            console.log("Existing Admin Password Reset Successfully!");
        } else {
            await User.create({
                name: "CareNest Admin",
                email,
                phone: "9999999999",
                password: hashedPassword,
                role: "admin",
                isActive: true
            });

            console.log("Admin Created Successfully!");
        }

        console.log("Admin Email:", email);
        console.log("Admin Password:", newPassword);

    } catch (error) {
        console.log("Admin Creation Error:", error.message);
    } finally {
        await mongoose.disconnect();
    }
};

createAdmin();

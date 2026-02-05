const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("--> Mongoose connected successfully!");
    } catch (err) {
        console.error("--> Mongoose connect failed:", err);
        process.exit(1);
    }
};

module.exports = { connectDB };
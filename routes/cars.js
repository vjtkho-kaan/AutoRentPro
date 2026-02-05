const express = require('express');
const router = express.Router();
const Car = require('../models/Car.js'); 

// GET /api/v1/cars
router.get('/', async (req, res) => {
    try {
        const statusFilter = req.query.status;
        const query = statusFilter ? { status: statusFilter } : {};

        // Dùng Mongoose: Car.find()

        const cars = await Car.find(query);

        res.status(200).json(cars);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Lỗi Server" });
    }
});

module.exports = router;
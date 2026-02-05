const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking'); 
const Car = require('../models/Car'); 
const authorize = require('../middleware/auth'); // Import trạm kiểm soát

// Logic tính toán
const isBookingOverlap = require('../models/availability');
const calculateRentalCost = require('../models/pricing');

// 1. GET ALL BOOKINGS - Chỉ ADMIN mới được xem
// URL: GET http://localhost:3000/api/v1/bookings
router.get('/', authorize(['ADMIN']), async (req, res) => {
    try {
        // .populate('carId') giúp lấy luôn thông tin xe thay vì chỉ hiện ID
        const bookings = await Booking.find().populate('carId');
        res.status(200).json(bookings);
    } catch (err) {
        res.status(500).json({ message: "Lỗi Server", error: err.message });
    }
});

// 2. GET BOOKING BY ID - ADMIN hoặc CUSTOMER đều xem được
// URL: GET http://localhost:3000/api/v1/bookings/:id
router.get('/:id', authorize(['ADMIN', 'CUSTOMER']), async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id).populate('carId');
        if (!booking) {
            return res.status(404).json({ message: "Không tìm thấy Booking này" });
        }
        res.status(200).json(booking);
    } catch (err) {
        res.status(500).json({ message: "ID không hợp lệ hoặc lỗi Server" });
    }
});

// 3. POST CREATE BOOKING - Chỉ CUSTOMER mới được đặt xe
// URL: POST http://localhost:3000/api/v1/bookings
router.post('/', authorize(['CUSTOMER']), async (req, res) => {
    try {
        const { carId, userId, startDate, endDate } = req.body;

        const car = await Car.findById(carId);
        if (!car) {
            return res.status(404).json({ message: "Car not found" });
        }

        const carBookings = await Booking.find({ 
            carId: carId,
            status: { $ne: 'CANCELLED' }
        });

        if (isBookingOverlap(startDate, endDate, carBookings)) {
            return res.status(409).json({ message: "Xe đã bị trùng lịch!" });
        }

        const pricing = calculateRentalCost(startDate, endDate, car.pricePerDay);

        const newBooking = await Booking.create({
            carId,
            userId,
            startDate,
            endDate,
            totalPrice: pricing.total,
            status: 'CONFIRMED'
        });

        res.status(201).json({ 
            message: "Booking thành công (Mongoose + Authorized)", 
            data: newBooking 
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Lỗi Server", error: err.message });
    }
});

module.exports = router;
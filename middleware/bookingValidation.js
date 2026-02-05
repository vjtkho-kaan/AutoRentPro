// ==============================================
// BOOKING VALIDATION MIDDLEWARE
// ==============================================
const Booking = require('../models/Booking');
const Car = require('../models/Car');

// === DATE VALIDATION ===
exports.validateBookingDates = (req, res, next) => {
    try {
        const { startDate, endDate } = req.body;

        // Convert to Date objects
        const start = new Date(startDate);
        const end = new Date(endDate);
        const now = new Date();
        now.setHours(0, 0, 0, 0); // Reset to start of day

        // 1. Check if dates are valid
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({
                success: false,
                message: 'Ngày không hợp lệ'
            });
        }

        // 2. Start date must be >= today
        if (start < now) {
            return res.status(400).json({
                success: false,
                message: 'Ngày bắt đầu phải từ hôm nay trở đi'
            });
        }

        // 3. End date must be > start date
        if (end <= start) {
            return res.status(400).json({
                success: false,
                message: 'Ngày kết thúc phải sau ngày bắt đầu'
            });
        }

        // 4. Minimum rental period: 1 day
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 1) {
            return res.status(400).json({
                success: false,
                message: 'Thời gian thuê tối thiểu là 1 ngày'
            });
        }

        // 5. Maximum advance booking: 90 days
        const maxAdvanceDays = 90;
        const advanceTime = Math.abs(start - now);
        const advanceDays = Math.ceil(advanceTime / (1000 * 60 * 60 * 24));
        
        if (advanceDays > maxAdvanceDays) {
            return res.status(400).json({
                success: false,
                message: `Chỉ có thể đặt trước tối đa ${maxAdvanceDays} ngày`
            });
        }

        // 6. Maximum rental period: 30 days
        const maxRentalDays = 30;
        if (diffDays > maxRentalDays) {
            return res.status(400).json({
                success: false,
                message: `Thời gian thuê tối đa là ${maxRentalDays} ngày`
            });
        }

        // Attach validated dates to request
        req.validatedDates = {
            startDate: start,
            endDate: end,
            durationDays: diffDays
        };

        next();

    } catch (error) {
        console.error('Date validation error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi xác thực ngày'
        });
    }
};

// === CAR AVAILABILITY CHECK ===
exports.checkCarAvailability = async (req, res, next) => {
    try {
        const { carId } = req.body || req.params;
        const { startDate, endDate } = req.validatedDates || req.body;

        // 1. Check if car exists
        const car = await Car.findById(carId);
        if (!car) {
            return res.status(404).json({
                success: false,
                message: 'Xe không tồn tại'
            });
        }

        // 2. Check if car is active
        if (!car.isActive) {
            return res.status(400).json({
                success: false,
                message: 'Xe này hiện không khả dụng'
            });
        }

        // 3. Check if car status is AVAILABLE
        if (car.status !== 'AVAILABLE') {
            const statusMessages = {
                'RENTED': 'Xe đang được thuê',
                'MAINTENANCE': 'Xe đang bảo trì',
                'INACTIVE': 'Xe không hoạt động'
            };
            return res.status(400).json({
                success: false,
                message: statusMessages[car.status] || 'Xe không khả dụng'
            });
        }

        // 4. Check for overlapping bookings
        const excludeBookingId = req.params.id; // For update operations
        const isAvailable = await Booking.isCarAvailable(
            carId, 
            new Date(startDate), 
            new Date(endDate),
            excludeBookingId
        );

        if (!isAvailable) {
            return res.status(409).json({
                success: false,
                message: 'Xe đã được đặt trong khoảng thời gian này'
            });
        }

        // Attach car to request
        req.availableCar = car;
        next();

    } catch (error) {
        console.error('Car availability check error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi kiểm tra xe'
        });
    }
};

// === PRICE CALCULATION & VALIDATION ===
exports.calculateAndValidatePrice = (req, res, next) => {
    try {
        const car = req.availableCar;
        const { durationDays } = req.validatedDates;
        const { insuranceFee = 0 } = req.body;

        // 1. Calculate base price
        let basePrice = car.pricePerDay * durationDays;

        // 2. Apply weekend surcharge (15% for weekends)
        const start = new Date(req.validatedDates.startDate);
        const end = new Date(req.validatedDates.endDate);
        let weekendDays = 0;
        
        for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
            const dayOfWeek = d.getDay();
            if (dayOfWeek === 0 || dayOfWeek === 6) { // Sunday or Saturday
                weekendDays++;
            }
        }
        
        const weekendSurcharge = weekendDays * car.pricePerDay * 0.15;
        basePrice += weekendSurcharge;

        // 3. Apply long-term discount (10% for 7+ days, 15% for 14+ days)
        let discount = 0;
        if (durationDays >= 14) {
            discount = basePrice * 0.15;
        } else if (durationDays >= 7) {
            discount = basePrice * 0.10;
        }
        basePrice -= discount;

        // 4. Calculate service fee (10% of base price)
        const serviceFee = Math.round(basePrice * 0.10);

        // 5. Calculate total price
        const totalPrice = Math.round(basePrice + serviceFee + insuranceFee);
        const deposit = car.deposit;

        // 6. Validate price if provided (prevent manipulation)
        if (req.body.totalPrice && Math.abs(req.body.totalPrice - totalPrice) > 1) {
            return res.status(400).json({
                success: false,
                message: 'Giá không khớp. Vui lòng tải lại trang.',
                calculatedPrice: totalPrice,
                providedPrice: req.body.totalPrice
            });
        }

        // Attach pricing details to request
        req.pricingDetails = {
            basePrice: Math.round(basePrice),
            insuranceFee: Math.round(insuranceFee),
            serviceFee,
            weekendSurcharge: Math.round(weekendSurcharge),
            discount: Math.round(discount),
            deposit,
            totalPrice
        };

        next();

    } catch (error) {
        console.error('Price calculation error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi tính giá'
        });
    }
};

// === USER VALIDATION ===
exports.validateUserBooking = async (req, res, next) => {
    try {
        const userId = req.session.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Vui lòng đăng nhập để đặt xe'
            });
        }

        // Check for pending/unpaid bookings
        const pendingBookings = await Booking.find({
            userId: userId,
            paymentStatus: 'PENDING',
            createdAt: { $gte: new Date(Date.now() - 30 * 60 * 1000) } // Last 30 minutes
        });

        if (pendingBookings.length >= 3) {
            return res.status(429).json({
                success: false,
                message: 'Bạn có quá nhiều booking chưa thanh toán. Vui lòng hoàn tất thanh toán hoặc hủy booking cũ.'
            });
        }

        // Check for cancelled bookings (abuse prevention)
        const recentCancellations = await Booking.countDocuments({
            userId: userId,
            status: 'CANCELLED',
            cancelledAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
        });

        if (recentCancellations >= 5) {
            return res.status(429).json({
                success: false,
                message: 'Bạn đã hủy quá nhiều booking gần đây. Vui lòng liên hệ hỗ trợ.'
            });
        }

        next();

    } catch (error) {
        console.error('User booking validation error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi xác thực người dùng'
        });
    }
};

// === COMBINED BOOKING VALIDATION ===
exports.validateBooking = [
    exports.validateBookingDates,
    exports.checkCarAvailability,
    exports.calculateAndValidatePrice,
    exports.validateUserBooking
];

// === AJAX AVAILABILITY CHECK (Lightweight) ===
exports.quickAvailabilityCheck = async (req, res) => {
    try {
        const { carId, startDate, endDate } = req.query;

        if (!carId || !startDate || !endDate) {
            return res.json({
                available: false,
                message: 'Thiếu thông tin'
            });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        // Quick date validation
        if (start < now || end <= start) {
            return res.json({
                available: false,
                message: 'Ngày không hợp lệ'
            });
        }

        // Check car
        const car = await Car.findById(carId);
        if (!car || !car.isActive || car.status !== 'AVAILABLE') {
            return res.json({
                available: false,
                message: 'Xe không khả dụng'
            });
        }

        // Check availability
        const isAvailable = await Booking.isCarAvailable(carId, start, end);

        return res.json({
            available: isAvailable,
            message: isAvailable ? 'Xe khả dụng' : 'Xe đã được đặt trong thời gian này'
        });

    } catch (error) {
        console.error('Quick availability check error:', error);
        return res.json({
            available: false,
            message: 'Lỗi hệ thống'
        });
    }
};

// === PRICE CALCULATION ENDPOINT (AJAX) ===
exports.calculatePrice = async (req, res) => {
    try {
        const { carId, startDate, endDate, insuranceFee = 0 } = req.body;

        const car = await Car.findById(carId);
        if (!car) {
            return res.status(404).json({
                success: false,
                message: 'Xe không tồn tại'
            });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end - start);
        const durationDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Calculate base price
        let basePrice = car.pricePerDay * durationDays;

        // Weekend surcharge
        let weekendDays = 0;
        for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
            const dayOfWeek = d.getDay();
            if (dayOfWeek === 0 || dayOfWeek === 6) weekendDays++;
        }
        const weekendSurcharge = weekendDays * car.pricePerDay * 0.15;
        basePrice += weekendSurcharge;

        // Long-term discount
        let discount = 0;
        if (durationDays >= 14) {
            discount = basePrice * 0.15;
        } else if (durationDays >= 7) {
            discount = basePrice * 0.10;
        }
        basePrice -= discount;

        // Service fee
        const serviceFee = Math.round(basePrice * 0.10);
        const totalPrice = Math.round(basePrice + serviceFee + insuranceFee);

        return res.json({
            success: true,
            pricing: {
                durationDays,
                basePrice: Math.round(basePrice),
                weekendSurcharge: Math.round(weekendSurcharge),
                discount: Math.round(discount),
                serviceFee,
                insuranceFee: Math.round(insuranceFee),
                deposit: car.deposit,
                totalPrice,
                pricePerDay: car.pricePerDay
            }
        });

    } catch (error) {
        console.error('Price calculation error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi tính giá'
        });
    }
};

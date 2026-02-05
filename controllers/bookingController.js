const Booking = require('../models/Booking');
const Car = require('../models/Car');
const User = require('../models/User');

// --- CÁC HÀM BỔ TRỢ ---
const calculateCost = (start, end, pricePerDay) => {
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    return days * pricePerDay;
};

const isOverlap = (newStart, newEnd, existingBookings) => {
    return existingBookings.some(booking => {
        const bookedStart = new Date(booking.startDate);
        const bookedEnd = new Date(booking.endDate);
        return newStart < bookedEnd && newEnd > bookedStart;
    });
};

// --- MAIN CONTROLLER ---

// A. Hiển thị danh sách (READ)
exports.renderBookingList = async (req, res) => {
    try {
        const bookings = await Booking.find()
            .populate('userId')
            .populate({ path: 'carId', populate: { path: 'ownerId' } })
            .sort({ createdAt: -1 })
            .lean();

        const formattedBookings = bookings.map(b => ({
            ...b,
            startDate: b.startDate ? new Date(b.startDate).toLocaleDateString('vi-VN') : 'N/A',
            endDate: b.endDate ? new Date(b.endDate).toLocaleDateString('vi-VN') : 'N/A',
            totalPrice: b.totalPrice ? b.totalPrice.toLocaleString('en-US') : 0,
            
            // Các cờ trạng thái
            isPending: b.status === 'PENDING',
            isConfirmedUnpaid: b.status === 'CONFIRMED_UNPAID',
            isConfirmedPaid: b.status === 'CONFIRMED_PAID',
            isCompleted: b.status === 'COMPLETED',
            isCancelled: b.status === 'CANCELLED',

            // Logic nút bấm
            canChangeStatus: !['COMPLETED', 'CANCELLED'].includes(b.status),
            canEditContent: ['PENDING', 'CONFIRMED_UNPAID'].includes(b.status),
            canDelete: b.status === 'CANCELLED'
        }));

        res.render('bookings/list', { bookings: formattedBookings, title: 'Quản lý Đơn hàng' });
    } catch (err) {
        res.status(500).send("Lỗi Server: " + err.message);
    }
};

// B. Hiển thị Form tạo mới (GET)
exports.renderCreateBookingPage = async (req, res) => {
    try {
        const customers = await User.find({ role: 'CUSTOMER' }).lean();
        const cars = await Car.find({ status: 'AVAILABLE' }).populate('ownerId').lean();
        res.render('bookings/create', { users: customers, cars, title: 'Tạo đơn hàng mới' });
    } catch (err) {
        res.status(500).send("Lỗi: " + err.message);
    }
};

// C. Xử lý Tạo mới (POST) - [FIX] Có Validate Inline
exports.createBooking = async (req, res) => {
    try {
        const { userId, carId, startDate, endDate } = req.body;
        const start = new Date(startDate);
        const end = new Date(endDate);

        // Helper: Render lại form với lỗi
        const renderError = async (message) => {
            const customers = await User.find({ role: 'CUSTOMER' }).lean();
            const cars = await Car.find({ status: 'AVAILABLE' }).populate('ownerId').lean();
            return res.render('bookings/create', { 
                users: customers, 
                cars, 
                error: message, // Gửi lỗi sang View
                oldData: req.body, // Giữ lại dữ liệu vừa nhập
                title: 'Tạo đơn hàng mới' 
            });
        };

        if (end <= start) return await renderError("Ngày kết thúc phải sau ngày bắt đầu!");

        const car = await Car.findById(carId);
        if (!car) return await renderError("Xe không tồn tại!");

        // Check trùng lịch
        const carBookings = await Booking.find({ 
            carId: carId, 
            status: { $ne: 'CANCELLED' } 
        });

        if (isOverlap(start, end, carBookings)) {
            return await renderError("Xe đã bị trùng lịch trong khoảng thời gian này!");
        }

        const total = calculateCost(start, end, car.pricePerDay);
        
        await Booking.create({
            userId, carId, startDate: start, endDate: end, totalPrice: total, status: 'PENDING'
        });

        res.redirect('/bookings');
    } catch (err) {
        res.status(500).send("Lỗi tạo: " + err.message);
    }
};

// D. Cập nhật Trạng thái đơn hàng (UPDATE STATUS)
exports.updateBookingStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const bookingId = req.params.id;

        // 1. Cập nhật trạng thái của Booking trước
        const updatedBooking = await Booking.findByIdAndUpdate(bookingId, { status }, { new: true });

        if (!updatedBooking) {
            return res.status(404).send("Không tìm thấy đơn hàng!");
        }

        // 2. [LOGIC MỚI] Tự động cập nhật trạng thái Xe (Car)
        const carId = updatedBooking.carId;

        if (['CONFIRMED_UNPAID', 'CONFIRMED_PAID'].includes(status)) {
            // Nếu Đơn được XÁC NHẬN -> Set xe thành "Đang thuê" (RENTED)
            // Lúc này xe sẽ ẩn khỏi danh sách "Tạo đơn mới" (vì ở đó ta chỉ lấy xe AVAILABLE)
            await Car.findByIdAndUpdate(carId, { status: 'RENTED' });
        } 
        else if (['COMPLETED', 'CANCELLED'].includes(status)) {
            // Nếu Đơn HOÀN THÀNH hoặc HỦY -> Trả xe về "Sẵn sàng" (AVAILABLE)
            await Car.findByIdAndUpdate(carId, { status: 'AVAILABLE' });
        }
        else if (status === 'PENDING') {
            // Nếu quay lại PENDING -> Cũng trả xe về AVAILABLE (để chờ xử lý lại)
            await Car.findByIdAndUpdate(carId, { status: 'AVAILABLE' });
        }

        res.redirect('/bookings');
    } catch (err) {
        res.status(500).send("Lỗi cập nhật trạng thái: " + err.message);
    }
};

// E. Xóa đơn
exports.deleteBooking = async (req, res) => {
    try {
        await Booking.findByIdAndDelete(req.params.id);
        res.redirect('/bookings');
    } catch (err) {
        res.status(500).send("Lỗi xóa: " + err.message);
    }
};

// F. Hiển thị Form Sửa (GET)
exports.renderEditBookingPage = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id).lean();
        if (!booking) return res.redirect('/bookings');

        const customers = await User.find({ role: 'CUSTOMER' }).lean();
        const cars = await Car.find().populate('ownerId').lean();

        // Format Date YYYY-MM-DD cho input
        if(booking.startDate) booking.startDate = new Date(booking.startDate).toISOString().split('T')[0];
        if(booking.endDate) booking.endDate = new Date(booking.endDate).toISOString().split('T')[0];

        res.render('bookings/edit', { booking, users: customers, cars, title: 'Chỉnh sửa đơn hàng' });
    } catch (err) {
        res.status(500).send("Lỗi: " + err.message);
    }
};

// G. Xử lý Cập nhật Booking (POST) - [FIX] Xử lý đổi trạng thái xe khi đổi xe
exports.updateBooking = async (req, res) => {
    try {
        const { userId, carId, startDate, endDate } = req.body;
        const start = new Date(startDate);
        const end = new Date(endDate);
        const bookingId = req.params.id;

        // 1. Lấy đơn hàng CŨ (trước khi update) để so sánh
        const oldBooking = await Booking.findById(bookingId);
        if (!oldBooking) return res.redirect('/bookings');

        // Helper: Render lại form Edit với lỗi
        const renderError = async (message) => {
            const customers = await User.find({ role: 'CUSTOMER' }).lean();
            const cars = await Car.find().populate('ownerId').lean();
            const bookingData = { _id: bookingId, userId, carId, startDate, endDate }; // Giữ lại data vừa nhập
            return res.render('bookings/edit', { booking: bookingData, users: customers, cars, error: message, title: 'Chỉnh sửa đơn hàng' });
        };

        if (end <= start) return await renderError("Ngày kết thúc phải sau ngày bắt đầu!");

        // 2. Kiểm tra xe mới có tồn tại không
        const newCar = await Car.findById(carId);
        if (!newCar) return await renderError("Xe không tồn tại!");
        
        // 3. Check trùng lịch (Trừ chính đơn này ra)
        const carBookings = await Booking.find({ 
            carId: carId, 
            status: { $ne: 'CANCELLED' },
            _id: { $ne: bookingId } 
        });

        if (isOverlap(start, end, carBookings)) return await renderError("Xe mới đã bị trùng lịch!");

        const total = calculateCost(start, end, newCar.pricePerDay);

        // 4. [LOGIC QUAN TRỌNG] Xử lý trạng thái Xe nếu có thay đổi Xe
        // Chỉ xử lý nếu đơn hàng đang ở trạng thái "Đã xác nhận" (tức là xe đang RENTED)
        const isConfirmed = ['CONFIRMED_UNPAID', 'CONFIRMED_PAID'].includes(oldBooking.status);

        if (isConfirmed && oldBooking.carId.toString() !== carId) {
            // A. Trả xe CŨ về trạng thái Sẵn sàng (AVAILABLE)
            await Car.findByIdAndUpdate(oldBooking.carId, { status: 'AVAILABLE' });

            // B. Set xe MỚI thành Đang thuê (RENTED)
            await Car.findByIdAndUpdate(carId, { status: 'RENTED' });
        }

        // 5. Cập nhật thông tin Booking
        await Booking.findByIdAndUpdate(bookingId, {
            userId, carId, startDate: start, endDate: end, totalPrice: total
        });

        res.redirect('/bookings');
    } catch (err) {
        console.error(err);
        res.status(500).send("Lỗi cập nhật: " + err.message);
    }
};
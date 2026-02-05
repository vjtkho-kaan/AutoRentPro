require('dotenv').config();
const express = require('express');
const { connectDB } = require('./config/db');
const path = require('path'); 
const { engine } = require('express-handlebars'); 

const app = express();

// =======================
// 1. CẤU HÌNH VIEW ENGINE (Handlebars)
// =======================
app.engine('hbs', engine({
    extname: '.hbs',
    defaultLayout: 'main',
    layoutsDir: path.join(__dirname, 'views/layouts'),
    partialsDir: path.join(__dirname, 'views/partials'),
    helpers: {
        eq: (a, b) => a === b,
        // Helper format ngày giờ kiểu Việt Nam
        formatDate: (date) => {
            if (!date) return 'Không có dữ liệu';
            return new Date(date).toLocaleString('vi-VN');
        }
    }
}));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views')); 

// =======================
// 2. MIDDLEWARE
// =======================
app.use(express.json()); // Đọc JSON từ API
app.use(express.urlencoded({ extended: true })); // Đọc dữ liệu từ Form HTML
app.use(express.static(path.join(__dirname, 'public'))); // Thư mục Public

// =======================
// 3. KẾT NỐI DATABASE
// =======================
connectDB();

// =======================
// 4. ROUTES
// =======================

// --- A. API Routes (ĐÃ TẮT) ---
// app.use('/api/v1/cars', require('./routes/cars'));
// app.use('/api/v1/bookings', require('./routes/bookings'));


// --- B. UI Routes (Trả về HTML giao diện) ---

// 1. MODULE CARS (Quản lý Xe)
const carController = require('./controllers/carController'); 

app.get('/', (req, res) => { res.redirect('/cars'); });  // Trang chủ -> Cars
app.get('/cars', carController.renderCarList);           // Xem danh sách
app.get('/cars/create', carController.renderCreatePage); // Form thêm mới
app.post('/cars/store', carController.addNewCar);        // Xử lý lưu
app.post('/cars/delete/:id', carController.deleteCar);   // Xử lý xóa
app.get('/cars/edit/:id', carController.renderEditPage); // Form sửa
app.post('/cars/update/:id', carController.updateCar);   // Xử lý cập nhật


// 2. MODULE USERS (Quản lý Người dùng)
const userController = require('./controllers/userController'); 

app.get('/users', userController.renderUserList);              // Xem danh sách
app.post('/users/delete/:id', userController.deleteUser);      // Xóa User
app.get('/users/edit/:id', userController.renderEditUserPage); // Form sửa User
app.post('/users/update/:id', userController.updateUser);      // Xử lý cập nhật User
app.get('/users/create', userController.renderCreateUserPage); // Form thêm mới
app.post('/users/store', userController.createUser);           // Xử lý lưu User mới


// 3. MODULE BOOKINGS (Quản lý Đơn hàng)
const bookingController = require('./controllers/bookingController');

app.get('/bookings', bookingController.renderBookingList);              // Xem danh sách
app.get('/bookings/create', bookingController.renderCreateBookingPage); // Form tạo mới
app.post('/bookings/store', bookingController.createBooking);           // Xử lý tạo đơn
app.post('/bookings/update-status/:id', bookingController.updateBookingStatus); // Cập nhật trạng thái
app.post('/bookings/delete/:id', bookingController.deleteBooking);      // Xóa đơn hàng
app.get('/bookings/edit/:id', bookingController.renderEditBookingPage); // Hiển thị Form sửa
app.post('/bookings/update/:id', bookingController.updateBooking);      // Xử lý Lưu sau khi sửa


// =======================
// 5. KHỞI CHẠY SERVER
// =======================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`---------------------------------------------`);
    console.log(`✅ Server AutoRentPro đang chạy tại port ${PORT}`);
    console.log(`---------------------------------------------`);
    console.log(`🚗 Quản lý Xe:       http://localhost:${PORT}/cars`);
    console.log(`👤 Quản lý User:     http://localhost:${PORT}/users`);
    console.log(`📅 Quản lý Booking:  http://localhost:${PORT}/bookings`);
    console.log(`---------------------------------------------`);
});
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { connectDB } = require('./config/db');
const path = require('path'); 
const { engine } = require('express-handlebars'); 
const { attachUser, isAuthenticated, isAdmin } = require('./middleware/auth');

const app = express();

// =======================
// 1. SECURITY & RATE LIMITING
// =======================
app.use(helmet({
  contentSecurityPolicy: false // Tạm tắt để dùng CDN Bootstrap
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 100, // Tối đa 100 request mỗi IP
  message: 'Quá nhiều request, vui lòng thử lại sau'
});
app.use(limiter);

// =======================
// 2. CẤU HÌNH VIEW ENGINE (Handlebars)
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
// 3. MIDDLEWARE
// =======================
app.use(express.json()); // Đọc JSON từ API
app.use(express.urlencoded({ extended: true })); // Đọc dữ liệu từ Form HTML
app.use(express.static(path.join(__dirname, 'public'))); // Thư mục Public

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'autorentpro-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    touchAfter: 24 * 3600 // Lazy session update (seconds)
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 ngày
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production' // HTTPS only in production
  }
}));

// Attach user info to all views
app.use(attachUser);

// =======================
// 4. KẾT NỐI DATABASE
// =======================
connectDB();

// =======================
// 5. ROUTES
// =======================

// --- A. PUBLIC ROUTES (Không cần đăng nhập) ---
app.use('/auth', require('./routes/auth'));

// Root redirect - nếu đã login thì vào /cars, chưa thì vào /auth/login
app.get('/', (req, res) => {
  if (req.session && req.session.userId) {
    res.redirect('/cars');
  } else {
    res.redirect('/auth/login');
  }
});

// --- B. PROTECTED ROUTES (Cần authentication) ---

// 1. MODULE CARS (Quản lý Xe) - CHỈ ADMIN
const carController = require('./controllers/carController'); 

app.get('/cars', isAuthenticated, isAdmin, carController.renderCarList);
app.get('/cars/create', isAuthenticated, isAdmin, carController.renderCreatePage);
app.post('/cars/store', isAuthenticated, isAdmin, carController.addNewCar);
app.post('/cars/delete/:id', isAuthenticated, isAdmin, carController.deleteCar);
app.get('/cars/edit/:id', isAuthenticated, isAdmin, carController.renderEditPage);
app.post('/cars/update/:id', isAuthenticated, isAdmin, carController.updateCar);

// 2. MODULE USERS (Quản lý Người dùng) - CHỈ ADMIN
const userController = require('./controllers/userController'); 

app.get('/users', isAuthenticated, isAdmin, userController.renderUserList);
app.post('/users/delete/:id', isAuthenticated, isAdmin, userController.deleteUser);
app.get('/users/edit/:id', isAuthenticated, isAdmin, userController.renderEditUserPage);
app.post('/users/update/:id', isAuthenticated, isAdmin, userController.updateUser);
app.get('/users/create', isAuthenticated, isAdmin, userController.renderCreateUserPage);
app.post('/users/store', isAuthenticated, isAdmin, userController.createUser);

// 3. MODULE BOOKINGS (Quản lý Đơn hàng) - TẤT CẢ USER ĐĂNG NHẬP
const bookingController = require('./controllers/bookingController');

app.get('/bookings', isAuthenticated, bookingController.renderBookingList);
app.get('/bookings/create', isAuthenticated, bookingController.renderCreateBookingPage);
app.post('/bookings/store', isAuthenticated, bookingController.createBooking);
app.post('/bookings/update-status/:id', isAuthenticated, isAdmin, bookingController.updateBookingStatus);
app.post('/bookings/delete/:id', isAuthenticated, isAdmin, bookingController.deleteBooking);
app.get('/bookings/edit/:id', isAuthenticated, bookingController.renderEditBookingPage);
app.post('/bookings/update/:id', isAuthenticated, bookingController.updateBooking);

// --- C. ERROR HANDLING ---
app.use((req, res) => {
  res.status(404).render('error', {
    title: '404 - Không tìm thấy',
    message: 'Trang bạn tìm kiếm không tồn tại',
    error: { status: 404 }
  });
});

// =======================
// 6. KHỞI CHẠY SERVER
// =======================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`---------------------------------------------`);
    console.log(`✅ Server AutoRentPro đang chạy tại port ${PORT}`);
    console.log(`---------------------------------------------`);
    console.log(`🔐 Auth:             http://localhost:${PORT}/auth/login`);
    console.log(`🚗 Quản lý Xe:       http://localhost:${PORT}/cars`);
    console.log(`👤 Quản lý User:     http://localhost:${PORT}/users`);
    console.log(`📅 Quản lý Booking:  http://localhost:${PORT}/bookings`);
    console.log(`---------------------------------------------`);
});

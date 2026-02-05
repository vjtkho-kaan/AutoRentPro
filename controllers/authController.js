// ==============================================
// AUTHENTICATION CONTROLLER
// ==============================================
const User = require('../models/User');

// ============ HIỂN THỊ TRANG LOGIN ============
exports.showLogin = (req, res) => {
  const message = req.query.message || null;
  res.render('auth/login', { 
    title: 'Đăng nhập', 
    message,
    layout: 'auth' // Sử dụng layout riêng cho auth
  });
};

// ============ XỬ LÝ ĐĂNG NHẬP ============
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.render('auth/login', {
        title: 'Đăng nhập',
        error: 'Vui lòng nhập đầy đủ email và mật khẩu',
        layout: 'auth'
      });
    }

    // Tìm user và include password
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.render('auth/login', {
        title: 'Đăng nhập',
        error: 'Email hoặc mật khẩu không đúng',
        layout: 'auth'
      });
    }

    // Kiểm tra active
    if (!user.isActive) {
      return res.render('auth/login', {
        title: 'Đăng nhập',
        error: 'Tài khoản đã bị vô hiệu hóa',
        layout: 'auth'
      });
    }

    // So sánh password
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      return res.render('auth/login', {
        title: 'Đăng nhập',
        error: 'Email hoặc mật khẩu không đúng',
        layout: 'auth'
      });
    }

    // Tạo session
    req.session.userId = user._id;
    req.session.userName = user.name;
    req.session.userEmail = user.email;
    req.session.role = user.role;

    // Redirect đến trang mà user muốn truy cập ban đầu
    const returnTo = req.session.returnTo || '/';
    delete req.session.returnTo;
    
    res.redirect(returnTo);
    
  } catch (error) {
    console.error('Login error:', error);
    res.render('auth/login', {
      title: 'Đăng nhập',
      error: 'Có lỗi xảy ra, vui lòng thử lại',
      layout: 'auth'
    });
  }
};

// ============ HIỂN THỊ TRANG ĐĂNG KÝ ============
exports.showRegister = (req, res) => {
  res.render('auth/register', { 
    title: 'Đăng ký',
    layout: 'auth'
  });
};

// ============ XỬ LÝ ĐĂNG KÝ ============
exports.register = async (req, res) => {
  try {
    const { name, email, password, confirmPassword, phone } = req.body;

    // Validation cơ bản
    if (!name || !email || !password || !confirmPassword || !phone) {
      return res.render('auth/register', {
        title: 'Đăng ký',
        error: 'Vui lòng điền đầy đủ thông tin',
        layout: 'auth',
        formData: { name, email, phone }
      });
    }

    // Kiểm tra password match
    if (password !== confirmPassword) {
      return res.render('auth/register', {
        title: 'Đăng ký',
        error: 'Mật khẩu xác nhận không khớp',
        layout: 'auth',
        formData: { name, email, phone }
      });
    }

    // Kiểm tra độ dài password
    if (password.length < 8) {
      return res.render('auth/register', {
        title: 'Đăng ký',
        error: 'Mật khẩu phải có ít nhất 8 ký tự',
        layout: 'auth',
        formData: { name, email, phone }
      });
    }

    // Kiểm tra email đã tồn tại
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.render('auth/register', {
        title: 'Đăng ký',
        error: 'Email đã được sử dụng',
        layout: 'auth',
        formData: { name, email, phone }
      });
    }

    // Tạo user mới
    const user = await User.create({
      name,
      email,
      password, // Sẽ tự động hash bởi pre-save hook
      phone,
      role: 'user' // Mặc định là user
    });

    // Tự động đăng nhập sau khi đăng ký
    req.session.userId = user._id;
    req.session.userName = user.name;
    req.session.userEmail = user.email;
    req.session.role = user.role;

    res.redirect('/?message=Đăng ký thành công!');
    
  } catch (error) {
    console.error('Register error:', error);
    
    // Xử lý lỗi validation từ mongoose
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message);
      return res.render('auth/register', {
        title: 'Đăng ký',
        error: errors.join(', '),
        layout: 'auth',
        formData: req.body
      });
    }

    res.render('auth/register', {
      title: 'Đăng ký',
      error: 'Có lỗi xảy ra, vui lòng thử lại',
      layout: 'auth',
      formData: req.body
    });
  }
};

// ============ XỬ LÝ ĐĂNG XUẤT ============
exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.redirect('/auth/login?message=Đã đăng xuất thành công');
  });
};

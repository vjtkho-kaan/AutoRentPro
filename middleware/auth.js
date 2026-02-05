// ================================================
// MIDDLEWARE BẢO MẬT - AUTHENTICATION & AUTHORIZATION
// ================================================

/**
 * Middleware kiểm tra xem người dùng đã đăng nhập chưa
 */
const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.userId) {
    return next();
  }
  // Redirect đến trang login với message
  req.session.returnTo = req.originalUrl;
  res.redirect('/auth/login?message=Vui lòng đăng nhập để tiếp tục');
};

/**
 * Middleware kiểm tra role Admin
 */
const isAdmin = (req, res, next) => {
  if (req.session && req.session.role === 'admin') {
    return next();
  }
  res.status(403).render('shared/error', {
    title: 'Truy cập bị từ chối',
    message: 'Bạn không có quyền truy cập trang này. Chỉ Admin mới được phép.',
    error: { status: 403 }
  });
};

/**
 * Middleware kiểm tra user hoặc admin
 */
const isUser = (req, res, next) => {
  if (req.session && req.session.userId) {
    return next();
  }
  res.status(401).render('shared/error', {
    title: 'Chưa xác thực',
    message: 'Bạn cần đăng nhập để thực hiện thao tác này.',
    error: { status: 401 }
  });
};

/**
 * Middleware gắn thông tin người dùng vào locals để dùng trong view
 */
const attachUser = (req, res, next) => {
  if (req.session && req.session.userId) {
    res.locals.currentUser = {
      id: req.session.userId,
      name: req.session.userName,
      email: req.session.userEmail,
      role: req.session.role
    };
    res.locals.isAuthenticated = true;
    res.locals.isAdmin = req.session.role === 'admin';
  } else {
    res.locals.isAuthenticated = false;
    res.locals.isAdmin = false;
  }
  next();
};

module.exports = {
  isAuthenticated,
  isAdmin,
  isUser,
  attachUser
};
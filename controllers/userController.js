const User = require('../models/User');

// --- 1. READ: Xem danh sách User ---
exports.renderUserList = async (req, res) => {
    try {
        const sortType = req.query.sort || 'latest';
        let sortQuery = { createdAt: -1 }; // Mặc định: Mới nhất
        
        // Xử lý logic sắp xếp
        if (sortType === 'oldest') sortQuery = { createdAt: 1 };
        if (sortType === 'alpha') sortQuery = { name: 1 };

        const allUsers = await User.find().sort(sortQuery).lean();
        
        // Tách Admin và User thường để hiển thị riêng (nếu cần)
        const admins = allUsers.filter(u => u.role === 'ADMIN');
        const others = allUsers.filter(u => u.role !== 'ADMIN');

        res.render('users/list', { 
            admins, 
            users: others, 
            currentSort: sortType,
            title: 'Quản lý Người dùng' 
        });
    } catch (err) {
        res.status(500).send("Lỗi Server: " + err.message);
    }
};

// --- 2. CREATE (UI): Hiển thị Form thêm mới ---
exports.renderCreateUserPage = async (req, res) => {
    try {
        res.render('users/create', { title: 'Tạo người dùng mới' });
    } catch (err) {
        res.status(500).send("Lỗi: " + err.message);
    }
};

// --- 3. CREATE (Logic): Xử lý Lưu User mới ---
exports.createUser = async (req, res) => {
    try {
        // [SỬA] Không lấy password từ form nữa
        const { name, email, role, phone } = req.body;

        // Kiểm tra Email đã tồn tại chưa
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.render('createUser', { 
                error: "Email này đã được sử dụng!", 
                oldData: req.body, 
                title: 'Thêm người dùng mới' 
            });
        }

        const newUser = new User({
            name,
            email,
            password: '123456', 
            role,
            phone
        });

        await newUser.save();
        res.redirect('/users');

    } catch (err) {
        res.status(500).send("Lỗi tạo user: " + err.message);
    }
};

// --- 4. UPDATE (UI): Hiển thị trang Edit ---
exports.renderEditUserPage = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).lean();
        if (!user) return res.redirect('/users');
        
        res.render('users/edit', { user, title: 'Chỉnh sửa người dùng' });
    } catch (err) {
        res.status(500).send("Lỗi Server: " + err.message);
    }
};

// --- 5. UPDATE (Logic): Xử lý cập nhật ---
exports.updateUser = async (req, res) => {
    try {
        const { name, email, role, phone } = req.body;
        
        await User.findByIdAndUpdate(req.params.id, {
            name, 
            email, 
            role,
            phone // Cập nhật cả số điện thoại
        });

        res.redirect('/users');
    } catch (err) {
        res.status(500).send("Lỗi cập nhật user: " + err.message);
    }
};

// --- 6. DELETE: Xóa User ---
exports.deleteUser = async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.redirect('/users');
    } catch (err) {
        res.status(500).send("Lỗi xóa user: " + err.message);
    }
};
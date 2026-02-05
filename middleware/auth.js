// Middleware kiểm tra quyền hạn dựa trên header 'x-user-role'
const authorize = (allowedRoles) => {
    return (req, res, next) => {
        const userRole = req.headers['x-user-role']; // Lấy role từ Header

        // 1. Nếu không có role trong header
        if (!userRole) {
            return res.status(401).json({ message: "Yêu cầu cung cấp quyền truy cập (Missing Header: x-user-role)" });
        }

        // 2. Nếu role không nằm trong danh sách được phép
        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({ 
                message: `Truy cập bị từ chối. Quyền '${userRole}' không thể thực hiện hành động này.` 
            });
        }

        // 3. Hợp lệ thì cho đi tiếp
        next();
    };
};

module.exports = authorize;
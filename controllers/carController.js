const Car = require('../models/Car');
const User = require('../models/User');

// --- MAIN CONTROLLER ---

// 1. Hiển thị danh sách xe (READ) - Có Sắp xếp & Hiển thị Chủ xe
exports.renderCarList = async (req, res) => {
    try {
        const sortType = req.query.sort || 'latest'; // Mặc định: Mới thêm vào trước

        // A. Cấu hình Sắp xếp cho Database (MongoDB)
        let dbSort = {};
        switch (sortType) {
            case 'latest': dbSort = { createdAt: -1 }; break; // Mới thêm vào DB
            case 'oldest': dbSort = { createdAt: 1 }; break;  // Cũ nhất
            case 'year_desc': dbSort = { year: -1 }; break;   // Năm SX: Mới -> Cũ
            case 'year_asc': dbSort = { year: 1 }; break;     // Năm SX: Cũ -> Mới
            case 'brand_alpha': dbSort = { brand: 1, model: 1 }; break; // Tên hãng A-Z
            default: dbSort = { createdAt: -1 };
        }

        // B. Lấy dữ liệu từ DB
        let cars = await Car.find()
            .populate('ownerId') // [QUAN TRỌNG] Lấy thông tin Chủ xe từ bảng User
            .sort(dbSort)        // Sort các trường cơ bản
            .lean();

        // C. Xử lý Sắp xếp Tên Chủ Xe (Logic JavaScript vì MongoDB khó sort bảng khác)
        if (sortType === 'owner_alpha') {
            cars.sort((a, b) => {
                const nameA = a.ownerId ? a.ownerId.name.toUpperCase() : '';
                const nameB = b.ownerId ? b.ownerId.name.toUpperCase() : '';
                return nameA.localeCompare(nameB); // So sánh chuỗi A-Z
            });
        }

        // D. Xử lý hiển thị (Trạng thái màu sắc & Format ngày)
        cars = cars.map(car => ({
            ...car,
            isAvailable: car.status === 'AVAILABLE',
            isRented: car.status === 'RENTED',
            isMaintenance: car.status === 'MAINTENANCE',
            // Format ngày tạo để hiển thị đẹp hơn
            createdAtFormatted: car.createdAt ? new Date(car.createdAt).toLocaleDateString('vi-VN') : ''
        }));

        res.render('cars/list', { 
            cars, 
            title: 'Quản lý Xe',
            currentSort: sortType // Để giữ trạng thái select box
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Lỗi Server: " + err.message);
    }
};

// 2. Hiển thị Form thêm mới (Kèm danh sách Owner)
exports.renderCreatePage = async (req, res) => {
    try {
        // [LOGIC] Chỉ lấy user có role là CAR_OWNER
        const owners = await User.find({ role: 'CAR_OWNER' }).lean();
        res.render('cars/create', { owners, title: 'Thêm xe mới' });
    } catch (err) {
        res.status(500).send("Lỗi: " + err.message);
    }
};

// 3. Xử lý lưu xe mới
exports.addNewCar = async (req, res) => {
    try {
        const { brand, model, year, plateNumber, pricePerDay, ownerId } = req.body;

        // Check trùng biển số
        const existingCar = await Car.findOne({ plateNumber });
        if (existingCar) {
            const owners = await User.find({ role: 'CAR_OWNER' }).lean();
            return res.render('createCar', { 
                owners,
                error: `Biển số ${plateNumber} đã tồn tại!`,
                oldData: req.body 
            });
        }

        const newCar = new Car({
            brand, model, year, plateNumber, pricePerDay,
            status: 'AVAILABLE',
            ownerId: ownerId // [QUAN TRỌNG] Lưu ID chủ xe
        });

        await newCar.save();
        res.redirect('/cars'); 
    } catch (err) {
        res.status(500).send("Lỗi Server: " + err.message);
    }
};

// 4. Xóa xe (DELETE)
exports.deleteCar = async (req, res) => {
    try {
        await Car.findByIdAndDelete(req.params.id);
        res.redirect('/cars');
    } catch (err) {
        res.status(500).send("Lỗi khi xóa xe: " + err.message);
    }
};

// 5. Hiển thị trang Edit (Kèm danh sách Owner)
exports.renderEditPage = async (req, res) => {
    try {
        const car = await Car.findById(req.params.id).lean();
        const owners = await User.find({ role: 'CAR_OWNER' }).lean();

        if (!car) return res.redirect('/cars');

        res.render('cars/edit', { car, owners, title: 'Chỉnh sửa xe' });
    } catch (err) {
        res.status(500).send("Lỗi: " + err.message);
    }
};

// 6. Xử lý Update
exports.updateCar = async (req, res) => {
    try {
        const { brand, model, year, plateNumber, pricePerDay, status, ownerId } = req.body;
        
        await Car.findByIdAndUpdate(req.params.id, {
            brand, model, year, plateNumber, pricePerDay, status, ownerId
        });

        res.redirect('/cars');
    } catch (err) {
        res.status(500).send("Lỗi Update: " + err.message);
    }
};
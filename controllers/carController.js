const Car = require('../models/Car');
const User = require('../models/User');

// --- MAIN CONTROLLER ---

// 1. Hiển thị danh sách xe (READ) - Có Sắp xếp & Hiển thị Chủ xe
exports.renderCarList = async (req, res) => {
    try {
        const sortType = req.query.sort || 'latest';

        let dbSort = {};
        switch (sortType) {
            case 'latest': dbSort = { createdAt: -1 }; break;
            case 'oldest': dbSort = { createdAt: 1 }; break;
            case 'year_desc': dbSort = { year: -1 }; break;
            case 'year_asc': dbSort = { year: 1 }; break;
            case 'brand_alpha': dbSort = { brand: 1, model: 1 }; break;
            case 'price_asc': dbSort = { pricePerDay: 1 }; break;
            case 'price_desc': dbSort = { pricePerDay: -1 }; break;
            case 'rating': dbSort = { averageRating: -1 }; break;
            default: dbSort = { createdAt: -1 };
        }

        let cars = await Car.find()
            .populate('ownerId')
            .sort(dbSort)
            .lean();

        // Sắp xếp theo tên chủ xe
        if (sortType === 'owner_alpha') {
            cars.sort((a, b) => {
                const nameA = a.ownerId ? a.ownerId.name.toUpperCase() : '';
                const nameB = b.ownerId ? b.ownerId.name.toUpperCase() : '';
                return nameA.localeCompare(nameB);
            });
        }

        // Thêm flags trạng thái
        cars = cars.map(car => ({
            ...car,
            isAvailable: car.status === 'AVAILABLE',
            isRented: car.status === 'RENTED',
            isMaintenance: car.status === 'MAINTENANCE',
            createdAtFormatted: car.createdAt ? new Date(car.createdAt).toLocaleDateString('vi-VN') : ''
        }));

        res.render('cars/list', { 
            cars, 
            title: 'Quản lý Xe',
            currentSort: sortType
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Lỗi Server: " + err.message);
    }
};

// 2. Hiển thị Form thêm mới
exports.renderCreatePage = async (req, res) => {
    try {
        // Lấy tất cả users để chọn làm owner
        const owners = await User.find().lean();
        res.render('cars/create', { owners, title: 'Thêm xe mới' });
    } catch (err) {
        res.status(500).send("Lỗi: " + err.message);
    }
};

// 3. Xử lý lưu xe mới với enterprise fields
exports.addNewCar = async (req, res) => {
    try {
        const { 
            brand, model, year, plateNumber, pricePerDay, status,
            category, transmission, fuelType, seats,
            features, location, description,
            mileageLimit, extraMileageCharge, deposit, insuranceIncluded,
            images
        } = req.body;

        // Check trùng biển số
        const existingCar = await Car.findOne({ plateNumber });
        if (existingCar) {
            const owners = await User.find().lean();
            return res.render('cars/create', { 
                owners,
                error: `Biển số ${plateNumber} đã tồn tại!`,
                oldData: req.body,
                title: 'Thêm xe mới'
            });
        }

        // Xử lý features array
        let featuresArray = [];
        if (features) {
            featuresArray = Array.isArray(features) ? features : [features];
        }

        // Xử lý images array
        let imagesArray = [];
        if (images && images.trim()) {
            imagesArray = [images.trim()];
        }

        const newCar = new Car({
            brand, 
            model, 
            year: parseInt(year), 
            plateNumber, 
            pricePerDay: parseFloat(pricePerDay),
            status: status || 'AVAILABLE',
            // Enterprise fields
            category,
            transmission,
            fuelType,
            seats: parseInt(seats) || 5,
            features: featuresArray,
            location: location || {},
            description,
            mileageLimit: parseInt(mileageLimit) || 200,
            extraMileageCharge: parseFloat(extraMileageCharge) || 5000,
            deposit: parseFloat(deposit) || 0,
            insuranceIncluded: insuranceIncluded === 'on',
            images: imagesArray
        });

        await newCar.save();
        res.redirect('/cars'); 
    } catch (err) {
        console.error('Error creating car:', err);
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

// 5. Hiển thị trang Edit
exports.renderEditPage = async (req, res) => {
    try {
        const car = await Car.findById(req.params.id).lean();
        const owners = await User.find().lean();

        if (!car) return res.redirect('/cars');

        res.render('cars/edit', { car, owners, title: 'Chỉnh sửa xe' });
    } catch (err) {
        res.status(500).send("Lỗi: " + err.message);
    }
};

// 6. Xử lý Update với enterprise fields
exports.updateCar = async (req, res) => {
    try {
        const { 
            brand, model, year, plateNumber, pricePerDay, status,
            category, transmission, fuelType, seats,
            features, location, description,
            mileageLimit, extraMileageCharge, deposit, insuranceIncluded,
            images
        } = req.body;

        // Xử lý features array
        let featuresArray = [];
        if (features) {
            featuresArray = Array.isArray(features) ? features : [features];
        }

        // Xử lý images array
        let imagesArray = [];
        if (images && images.trim()) {
            imagesArray = [images.trim()];
        }

        await Car.findByIdAndUpdate(req.params.id, {
            brand, 
            model, 
            year: parseInt(year),
            plateNumber, 
            pricePerDay: parseFloat(pricePerDay),
            status,
            // Enterprise fields
            category,
            transmission,
            fuelType,
            seats: parseInt(seats) || 5,
            features: featuresArray,
            location: location || {},
            description,
            mileageLimit: parseInt(mileageLimit) || 200,
            extraMileageCharge: parseFloat(extraMileageCharge) || 5000,
            deposit: parseFloat(deposit) || 0,
            insuranceIncluded: insuranceIncluded === 'on',
            images: imagesArray
        });

        res.redirect('/cars');
    } catch (err) {
        console.error('Error updating car:', err);
        res.status(500).send("Lỗi Update: " + err.message);
    }
};
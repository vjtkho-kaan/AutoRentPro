// ==============================================
// SEED ENTERPRISE CARS - Full Data for Testing
// ==============================================
require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('../models/Car');
const User = require('../models/User');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/autorentpro';

// Sample car data với đầy đủ enterprise fields
const enterpriseCars = [
    {
        brand: 'Toyota',
        model: 'Camry 2.5Q',
        year: 2024,
        pricePerDay: 1200000,
        plateNumber: '30A-12345',
        status: 'AVAILABLE',
        category: 'COMFORT',
        transmission: 'AUTOMATIC',
        fuelType: 'PETROL',
        seats: 5,
        description: 'Toyota Camry 2024 thế hệ mới, nội thất sang trọng, tiện nghi đầy đủ. Phù hợp cho công việc và gia đình.',
        features: ['GPS', 'AIR_CONDITIONING', 'BLUETOOTH', 'USB_CHARGER', 'CRUISE_CONTROL', 'LEATHER_SEATS'],
        location: { city: 'Hồ Chí Minh', district: 'Quận 1', address: '123 Nguyễn Huệ' },
        mileageLimit: 200,
        extraMileageCharge: 5000,
        insuranceIncluded: true,
        deposit: 5000000,
        images: ['https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800'],
        averageRating: 4.8,
        totalReviews: 45
    },
    {
        brand: 'Honda',
        model: 'City RS',
        year: 2023,
        pricePerDay: 850000,
        plateNumber: '30A-23456',
        status: 'AVAILABLE',
        category: 'ECONOMY',
        transmission: 'AUTOMATIC',
        fuelType: 'PETROL',
        seats: 5,
        description: 'Honda City RS với thiết kế thể thao, tiết kiệm nhiên liệu. Lựa chọn tuyệt vời cho di chuyển hàng ngày.',
        features: ['GPS', 'AIR_CONDITIONING', 'BLUETOOTH', 'USB_CHARGER', 'BACKUP_CAMERA'],
        location: { city: 'Hồ Chí Minh', district: 'Quận 7', address: '456 Nguyễn Văn Linh' },
        mileageLimit: 250,
        extraMileageCharge: 4000,
        insuranceIncluded: true,
        deposit: 3000000,
        images: ['https://images.unsplash.com/photo-1606611013016-969c19ba27bb?w=800'],
        averageRating: 4.5,
        totalReviews: 32
    },
    {
        brand: 'Mercedes-Benz',
        model: 'E300 AMG',
        year: 2024,
        pricePerDay: 3500000,
        plateNumber: '30A-34567',
        status: 'AVAILABLE',
        category: 'LUXURY',
        transmission: 'AUTOMATIC',
        fuelType: 'PETROL',
        seats: 5,
        description: 'Mercedes E300 AMG - Đẳng cấp doanh nhân. Nội thất da cao cấp, công nghệ tiên tiến, trải nghiệm lái đỉnh cao.',
        features: ['GPS', 'AIR_CONDITIONING', 'BLUETOOTH', 'USB_CHARGER', 'CRUISE_CONTROL', 'LEATHER_SEATS', 'SUNROOF', 'WIFI'],
        location: { city: 'Hà Nội', district: 'Hoàn Kiếm', address: '789 Phố Huế' },
        mileageLimit: 150,
        extraMileageCharge: 15000,
        insuranceIncluded: true,
        deposit: 20000000,
        images: ['https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800'],
        averageRating: 4.9,
        totalReviews: 28
    },
    {
        brand: 'Ford',
        model: 'Everest Titanium',
        year: 2023,
        pricePerDay: 1800000,
        plateNumber: '30A-45678',
        status: 'AVAILABLE',
        category: 'SUV',
        transmission: 'AUTOMATIC',
        fuelType: 'DIESEL',
        seats: 7,
        description: 'Ford Everest 7 chỗ mạnh mẽ, phù hợp cho gia đình lớn hoặc di chuyển nhóm. Offroad tốt.',
        features: ['GPS', 'AIR_CONDITIONING', 'BLUETOOTH', 'USB_CHARGER', 'CRUISE_CONTROL', 'CHILD_SEAT', 'ROOF_RACK'],
        location: { city: 'Hồ Chí Minh', district: 'Thủ Đức', address: '321 Xa lộ Hà Nội' },
        mileageLimit: 200,
        extraMileageCharge: 6000,
        insuranceIncluded: true,
        deposit: 8000000,
        images: ['https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800'],
        averageRating: 4.6,
        totalReviews: 19
    },
    {
        brand: 'VinFast',
        model: 'VF8 Plus',
        year: 2024,
        pricePerDay: 2000000,
        plateNumber: '30A-56789',
        status: 'AVAILABLE',
        category: 'PREMIUM',
        transmission: 'AUTOMATIC',
        fuelType: 'ELECTRIC',
        seats: 5,
        description: 'VinFast VF8 - SUV điện thông minh. Zero emission, công nghệ tự lái ADAS, sạc nhanh.',
        features: ['GPS', 'AIR_CONDITIONING', 'BLUETOOTH', 'USB_CHARGER', 'CRUISE_CONTROL', 'AUTOPILOT', 'WIFI'],
        location: { city: 'Hà Nội', district: 'Cầu Giấy', address: '88 Xuân Thủy' },
        mileageLimit: 300,
        extraMileageCharge: 3000,
        insuranceIncluded: true,
        deposit: 10000000,
        images: ['https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800'],
        averageRating: 4.7,
        totalReviews: 15
    },
    {
        brand: 'Kia',
        model: 'Carnival',
        year: 2023,
        pricePerDay: 2200000,
        plateNumber: '30A-67890',
        status: 'AVAILABLE',
        category: 'VAN',
        transmission: 'AUTOMATIC',
        fuelType: 'DIESEL',
        seats: 11,
        description: 'Kia Carnival 11 chỗ - MPV cao cấp cho gia đình lớn hoặc di chuyển đoàn. Rộng rãi, thoải mái.',
        features: ['GPS', 'AIR_CONDITIONING', 'BLUETOOTH', 'USB_CHARGER', 'CHILD_SEAT', 'DVD_PLAYER'],
        location: { city: 'Đà Nẵng', district: 'Hải Châu', address: '555 Nguyễn Văn Linh' },
        mileageLimit: 180,
        extraMileageCharge: 7000,
        insuranceIncluded: true,
        deposit: 12000000,
        images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'],
        averageRating: 4.4,
        totalReviews: 22
    },
    {
        brand: 'Mazda',
        model: 'CX-5 Premium',
        year: 2024,
        pricePerDay: 1400000,
        plateNumber: '30A-78901',
        status: 'RENTED',
        category: 'SUV',
        transmission: 'AUTOMATIC',
        fuelType: 'PETROL',
        seats: 5,
        description: 'Mazda CX-5 Premium với thiết kế KODO đẹp mắt. Nội thất sang trọng, lái mượt mà.',
        features: ['GPS', 'AIR_CONDITIONING', 'BLUETOOTH', 'USB_CHARGER', 'CRUISE_CONTROL', 'LEATHER_SEATS', 'SUNROOF'],
        location: { city: 'Hồ Chí Minh', district: 'Quận 3', address: '222 Võ Văn Tần' },
        mileageLimit: 200,
        extraMileageCharge: 5000,
        insuranceIncluded: true,
        deposit: 6000000,
        images: ['https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800'],
        averageRating: 4.7,
        totalReviews: 38
    },
    {
        brand: 'Hyundai',
        model: 'Accent 1.4AT',
        year: 2023,
        pricePerDay: 650000,
        plateNumber: '30A-89012',
        status: 'AVAILABLE',
        category: 'ECONOMY',
        transmission: 'AUTOMATIC',
        fuelType: 'PETROL',
        seats: 5,
        description: 'Hyundai Accent tiết kiệm, bền bỉ. Phù hợp di chuyển trong thành phố với chi phí hợp lý.',
        features: ['AIR_CONDITIONING', 'BLUETOOTH', 'USB_CHARGER', 'BACKUP_CAMERA'],
        location: { city: 'Hà Nội', district: 'Đống Đa', address: '100 Tây Sơn' },
        mileageLimit: 300,
        extraMileageCharge: 3000,
        insuranceIncluded: true,
        deposit: 2000000,
        images: ['https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800'],
        averageRating: 4.3,
        totalReviews: 56
    },
    {
        brand: 'BMW',
        model: '520i M Sport',
        year: 2024,
        pricePerDay: 4000000,
        plateNumber: '30A-90123',
        status: 'MAINTENANCE',
        category: 'LUXURY',
        transmission: 'AUTOMATIC',
        fuelType: 'PETROL',
        seats: 5,
        description: 'BMW 520i M Sport - Chiếc sedan thể thao đẳng cấp. Động cơ mạnh mẽ, nội thất da Nappa.',
        features: ['GPS', 'AIR_CONDITIONING', 'BLUETOOTH', 'USB_CHARGER', 'CRUISE_CONTROL', 'LEATHER_SEATS', 'SUNROOF', 'WIFI', 'AUTOPILOT'],
        location: { city: 'Hồ Chí Minh', district: 'Quận 2', address: '10 Mai Chí Thọ' },
        mileageLimit: 150,
        extraMileageCharge: 20000,
        insuranceIncluded: true,
        deposit: 25000000,
        images: ['https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800'],
        averageRating: 4.9,
        totalReviews: 12
    },
    {
        brand: 'Toyota',
        model: 'Innova Cross',
        year: 2024,
        pricePerDay: 1500000,
        plateNumber: '30A-01234',
        status: 'AVAILABLE',
        category: 'VAN',
        transmission: 'AUTOMATIC',
        fuelType: 'HYBRID',
        seats: 7,
        description: 'Toyota Innova Cross Hybrid - MPV tiết kiệm nhiên liệu với công nghệ hybrid. Lý tưởng cho gia đình.',
        features: ['GPS', 'AIR_CONDITIONING', 'BLUETOOTH', 'USB_CHARGER', 'CRUISE_CONTROL', 'CHILD_SEAT'],
        location: { city: 'Hà Nội', district: 'Long Biên', address: '888 Nguyễn Văn Cừ' },
        mileageLimit: 250,
        extraMileageCharge: 4000,
        insuranceIncluded: true,
        deposit: 7000000,
        images: ['https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800'],
        averageRating: 4.6,
        totalReviews: 25
    }
];

async function seedEnterpriseCars() {
    try {
        console.log('🚗 Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Find any user to assign cars (admin or user)
        let owner = await User.findOne({});
        
        if (!owner) {
            console.log('⚠️ No user found, creating one...');
            owner = await User.create({
                name: 'Auto Dealer Pro',
                email: 'dealer@autorentpro.com',
                password: 'Password123!',
                phone: '0909123456',
                role: 'user'
            });
            console.log('✅ Created user:', owner.email);
        } else {
            console.log('✅ Using existing user:', owner.email);
        }

        // Clear existing sample cars (optional - keep real data)
        console.log('\n🧹 Clearing old sample cars...');
        await Car.deleteMany({ plateNumber: { $regex: /^30A-/ } });

        // Insert enterprise cars
        console.log('\n📦 Inserting enterprise cars...');
        for (const carData of enterpriseCars) {
            carData.ownerId = owner._id;
            const car = await Car.create(carData);
            console.log(`  ✅ ${car.brand} ${car.model} (${car.category}) - ${car.status}`);
        }

        console.log(`\n🎉 Successfully seeded ${enterpriseCars.length} enterprise cars!`);
        
        // Summary
        const summary = await Car.aggregate([
            { $group: { _id: '$category', count: { $sum: 1 } } }
        ]);
        console.log('\n📊 Cars by category:');
        summary.forEach(s => console.log(`   ${s._id}: ${s.count}`));

        const statusSummary = await Car.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);
        console.log('\n📊 Cars by status:');
        statusSummary.forEach(s => console.log(`   ${s._id}: ${s.count}`));

    } catch (error) {
        console.error('❌ Error seeding cars:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('\n👋 Disconnected from MongoDB');
    }
}

// Run if called directly
if (require.main === module) {
    seedEnterpriseCars();
}

module.exports = seedEnterpriseCars;

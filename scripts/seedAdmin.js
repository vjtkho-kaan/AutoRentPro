// ==============================================
// SCRIPT SEED ADMIN MẶC ĐỊNH
// ==============================================
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const ADMIN_CREDENTIALS = {
  name: 'System Administrator',
  email: 'admin@autorentpro.com',
  password: 'Admin@123456', // THAY ĐỔI NGAY TRONG PRODUCTION!
  phone: '0123456789',
  role: 'admin',
  isActive: true
};

async function seedAdmin() {
  try {
    // Kết nối MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Đã kết nối MongoDB');

    // Kiểm tra xem admin đã tồn tại chưa
    const existingAdmin = await User.findOne({ email: ADMIN_CREDENTIALS.email });
    
    if (existingAdmin) {
      console.log('⚠️  Admin đã tồn tại:', existingAdmin.email);
      console.log('   Role:', existingAdmin.role);
      console.log('   Name:', existingAdmin.name);
    } else {
      // Tạo admin mới
      const admin = await User.create(ADMIN_CREDENTIALS);
      console.log('');
      console.log('🎉 ĐÃ TẠO ADMIN THÀNH CÔNG!');
      console.log('=====================================');
      console.log('Email:    ', admin.email);
      console.log('Password: ', ADMIN_CREDENTIALS.password);
      console.log('Name:     ', admin.name);
      console.log('Role:     ', admin.role);
      console.log('=====================================');
      console.log('⚠️  HÃY ĐỔI MẬT KHẨU SAU KHI ĐĂNG NHẬP!');
      console.log('');
    }

    // Đóng kết nối
    await mongoose.connection.close();
    console.log('✅ Hoàn thành');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Lỗi khi seed admin:', error);
    process.exit(1);
  }
}

seedAdmin();

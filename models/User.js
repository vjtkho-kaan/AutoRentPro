const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Tên là bắt buộc'],
    trim: true,
    minlength: [2, 'Tên phải có ít nhất 2 ký tự'],
    maxlength: [50, 'Tên không được quá 50 ký tự']
  },
  email: {
    type: String,
    required: [true, 'Email là bắt buộc'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Email không hợp lệ']
  },
  password: {
    type: String,
    required: [true, 'Mật khẩu là bắt buộc'],
    minlength: [8, 'Mật khẩu phải có ít nhất 8 ký tự'],
    select: false // Don't return password in queries by default
  },
  phone: {
    type: String,
    required: [true, 'Số điện thoại là bắt buộc'],
    match: [/^[0-9]{10}$/, 'Số điện thoại phải có 10 chữ số']
  },
  role: {
    type: String,
    enum: {
      values: ['user', 'admin'],
      message: 'Role phải là user hoặc admin'
    },
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true // Tự động thêm createdAt và updatedAt
});

// Hash password trước khi lưu
userSchema.pre('save', async function() {
  // Chỉ hash nếu password được thay đổi hoặc là tài khoản mới
  if (!this.isModified('password')) return;
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method để so sánh password
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Lỗi khi so sánh mật khẩu');
  }
};

// Method để ẩn thông tin nhạy cảm khi convert sang JSON
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model('User', userSchema);
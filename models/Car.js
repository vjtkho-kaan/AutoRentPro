const mongoose = require('mongoose');

const carSchema = new mongoose.Schema({
    brand: { type: String, required: true }, // Dùng thống nhất là 'brand'
    model: { type: String, required: true },
    year: { type: Number, required: true },  // [MỚI] Thêm năm sản xuất
    plateNumber: { type: String, required: true, unique: true },
    pricePerDay: { type: Number, required: true, min: 0 },
    status: {
        type: String,
        enum: ['AVAILABLE', 'RENTED', 'MAINTENANCE'],
        default: 'AVAILABLE'
    },
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
});

module.exports = mongoose.model('Car', carSchema);
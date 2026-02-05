const mongoose = require('mongoose');

const carSchema = new mongoose.Schema({
    // === BASIC INFO ===
    brand: { 
        type: String, 
        required: [true, 'Hãng xe là bắt buộc'],
        trim: true
    },
    model: { 
        type: String, 
        required: [true, 'Model xe là bắt buộc'],
        trim: true
    },
    year: { 
        type: Number, 
        required: [true, 'Năm sản xuất là bắt buộc'],
        min: [2000, 'Xe phải từ năm 2000 trở lên'],
        max: [new Date().getFullYear() + 1, 'Năm sản xuất không hợp lệ']
    },
    plateNumber: { 
        type: String, 
        required: [true, 'Biển số xe là bắt buộc'],
        unique: true,
        uppercase: true,
        trim: true
    },

    // === CATEGORY & SPECIFICATIONS ===
    category: {
        type: String,
        enum: {
            values: ['ECONOMY', 'COMFORT', 'PREMIUM', 'SUV', 'VAN', 'LUXURY'],
            message: '{VALUE} không phải là loại xe hợp lệ'
        },
        required: [true, 'Loại xe là bắt buộc'],
        default: 'ECONOMY'
    },
    transmission: {
        type: String,
        enum: {
            values: ['AUTOMATIC', 'MANUAL'],
            message: '{VALUE} không phải là loại hộp số hợp lệ'
        },
        required: [true, 'Loại hộp số là bắt buộc'],
        default: 'MANUAL'
    },
    fuelType: {
        type: String,
        enum: {
            values: ['PETROL', 'DIESEL', 'ELECTRIC', 'HYBRID'],
            message: '{VALUE} không phải là loại nhiên liệu hợp lệ'
        },
        required: [true, 'Loại nhiên liệu là bắt buộc'],
        default: 'PETROL'
    },
    seats: {
        type: Number,
        required: [true, 'Số chỗ ngồi là bắt buộc'],
        min: [2, 'Xe phải có ít nhất 2 chỗ'],
        max: [16, 'Xe không được quá 16 chỗ'],
        default: 5
    },
    features: {
        type: [String],
        default: [],
        // GPS, AC, BLUETOOTH, USB, BACKUP_CAMERA, SUNROOF, LEATHER_SEATS, etc.
    },

    // === PRICING ===
    pricePerDay: { 
        type: Number, 
        required: [true, 'Giá thuê theo ngày là bắt buộc'],
        min: [0, 'Giá không thể âm']
    },
    mileageLimit: {
        type: Number,
        default: 200, // km per day
        min: [0, 'Giới hạn km không thể âm']
    },
    extraMileageCharge: {
        type: Number,
        default: 5000, // VND per extra km
        min: [0, 'Phí thêm km không thể âm']
    },
    deposit: {
        type: Number,
        required: [true, 'Tiền cọc là bắt buộc'],
        min: [0, 'Tiền cọc không thể âm'],
        default: function() {
            return this.pricePerDay * 3; // 3 days worth as deposit
        }
    },

    // === LOCATION ===
    location: {
        address: {
            type: String,
            required: [true, 'Địa chỉ là bắt buộc']
        },
        city: {
            type: String,
            required: [true, 'Thành phố là bắt buộc']
        },
        district: String,
        coordinates: {
            lat: Number,
            lng: Number
        }
    },

    // === MEDIA & DESCRIPTION ===
    images: {
        type: [String],
        default: [],
        validate: {
            validator: function(v) {
                return v.length <= 10;
            },
            message: 'Tối đa 10 ảnh cho mỗi xe'
        }
    },
    description: {
        type: String,
        maxlength: [1000, 'Mô tả không được quá 1000 ký tự']
    },

    // === AVAILABILITY & STATUS ===
    status: {
        type: String,
        enum: {
            values: ['AVAILABLE', 'RENTED', 'MAINTENANCE', 'INACTIVE'],
            message: '{VALUE} không phải là trạng thái hợp lệ'
        },
        default: 'AVAILABLE'
    },
    isActive: {
        type: Boolean,
        default: true
    },

    // === RATINGS ===
    averageRating: {
        type: Number,
        default: 0,
        min: [0, 'Rating không thể âm'],
        max: [5, 'Rating không thể quá 5'],
        set: v => Math.round(v * 10) / 10 // Round to 1 decimal
    },
    totalReviews: {
        type: Number,
        default: 0,
        min: [0, 'Số review không thể âm']
    },

    // === OWNER ===
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Chủ xe là bắt buộc']
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// === INDEXES ===
carSchema.index({ category: 1, status: 1 });
carSchema.index({ 'location.city': 1 });
carSchema.index({ pricePerDay: 1 });
carSchema.index({ averageRating: -1 });

// === VIRTUAL FIELDS ===
carSchema.virtual('isAvailable').get(function() {
    return this.status === 'AVAILABLE' && this.isActive;
});

carSchema.virtual('displayName').get(function() {
    return `${this.brand} ${this.model} (${this.year})`;
});

// === INSTANCE METHODS ===
carSchema.methods.updateRating = async function(newRating) {
    const totalRating = (this.averageRating * this.totalReviews) + newRating;
    this.totalReviews += 1;
    this.averageRating = totalRating / this.totalReviews;
    await this.save();
};

module.exports = mongoose.model('Car', carSchema);
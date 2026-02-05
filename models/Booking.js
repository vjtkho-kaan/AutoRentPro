const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    // === REFERENCES ===
    carId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Car',
        required: [true, 'Xe là bắt buộc']
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Người thuê là bắt buộc']
    },

    // === BOOKING DATES ===
    startDate: { 
        type: Date, 
        required: [true, 'Ngày bắt đầu là bắt buộc']
    },
    endDate: { 
        type: Date, 
        required: [true, 'Ngày kết thúc là bắt buộc'],
        validate: {
            validator: function(value) {
                return value > this.startDate;
            },
            message: 'Ngày kết thúc phải sau ngày bắt đầu'
        }
    },
    actualStartDate: {
        type: Date // Thời gian thực tế nhận xe
    },
    actualEndDate: {
        type: Date // Thời gian thực tế trả xe
    },

    // === LOCATION ===
    pickupLocation: {
        type: String,
        required: [true, 'Địa điểm nhận xe là bắt buộc']
    },
    dropoffLocation: {
        type: String,
        required: [true, 'Địa điểm trả xe là bắt buộc']
    },

    // === MILEAGE TRACKING ===
    mileageStart: {
        type: Number,
        min: [0, 'Số km không thể âm']
    },
    mileageEnd: {
        type: Number,
        min: [0, 'Số km không thể âm'],
        validate: {
            validator: function(value) {
                return !this.mileageStart || value >= this.mileageStart;
            },
            message: 'Số km cuối phải lớn hơn hoặc bằng số km đầu'
        }
    },
    mileageDriven: {
        type: Number,
        default: 0
    },

    // === PRICING BREAKDOWN ===
    basePrice: {
        type: Number,
        required: [true, 'Giá cơ bản là bắt buộc'],
        min: [0, 'Giá không thể âm']
    },
    insuranceFee: {
        type: Number,
        default: 0,
        min: [0, 'Phí bảo hiểm không thể âm']
    },
    serviceFee: {
        type: Number,
        default: function() {
            return Math.round(this.basePrice * 0.10); // 10% platform fee
        },
        min: [0, 'Phí dịch vụ không thể âm']
    },
    extraMileageFee: {
        type: Number,
        default: 0,
        min: [0, 'Phí km thêm không thể âm']
    },
    deposit: {
        type: Number,
        required: [true, 'Tiền cọc là bắt buộc'],
        min: [0, 'Tiền cọc không thể âm']
    },
    totalPrice: {
        type: Number,
        required: [true, 'Tổng giá là bắt buộc'],
        min: [0, 'Tổng giá không thể âm']
    },
    refundAmount: {
        type: Number,
        default: 0,
        min: [0, 'Số tiền hoàn lại không thể âm']
    },

    // === PAYMENT ===
    paymentStatus: {
        type: String,
        enum: {
            values: ['PENDING', 'PAID', 'REFUNDED', 'FAILED', 'PARTIAL'],
            message: '{VALUE} không phải là trạng thái thanh toán hợp lệ'
        },
        default: 'PENDING'
    },
    paymentMethod: {
        type: String,
        enum: {
            values: ['CARD', 'CASH', 'BANK_TRANSFER', 'WALLET'],
            message: '{VALUE} không phải là phương thức thanh toán hợp lệ'
        }
    },
    paymentId: {
        type: String // Stripe/Payment Gateway transaction ID
    },
    paidAt: {
        type: Date
    },

    // === BOOKING STATUS ===
    status: {
        type: String,
        enum: {
            values: ['PAYMENT_PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
            message: '{VALUE} không phải là trạng thái booking hợp lệ'
        },
        default: 'PAYMENT_PENDING'
    },
    cancellationReason: {
        type: String,
        maxlength: [500, 'Lý do hủy không được quá 500 ký tự']
    },
    cancelledAt: {
        type: Date
    },
    cancelledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    // === NOTES ===
    notes: {
        type: String,
        maxlength: [1000, 'Ghi chú không được quá 1000 ký tự']
    }
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// === INDEXES ===
bookingSchema.index({ carId: 1, startDate: 1, endDate: 1 });
bookingSchema.index({ userId: 1, status: 1 });
bookingSchema.index({ status: 1, createdAt: -1 });

// === VIRTUAL FIELDS ===
bookingSchema.virtual('durationDays').get(function() {
    if (!this.startDate || !this.endDate) return 0;
    const diffTime = Math.abs(this.endDate - this.startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
});

bookingSchema.virtual('isActive').get(function() {
    return ['CONFIRMED', 'IN_PROGRESS'].includes(this.status);
});

bookingSchema.virtual('canCancel').get(function() {
    if (this.status !== 'CONFIRMED') return false;
    const now = new Date();
    const hoursDiff = (this.startDate - now) / (1000 * 60 * 60);
    return hoursDiff > 24; // Can cancel if more than 24 hours before start
});

// === INSTANCE METHODS ===

// Calculate total price dynamically
bookingSchema.methods.calculateTotalPrice = function() {
    const days = this.durationDays;
    this.totalPrice = this.basePrice + this.insuranceFee + this.serviceFee + this.extraMileageFee;
    return this.totalPrice;
};

// Calculate extra mileage fee
bookingSchema.methods.calculateExtraMileageFee = function(extraMileageRate) {
    if (!this.mileageStart || !this.mileageEnd) return 0;
    
    this.mileageDriven = this.mileageEnd - this.mileageStart;
    const allowedMileage = this.durationDays * 200; // Assuming 200km/day limit
    const extraMileage = Math.max(0, this.mileageDriven - allowedMileage);
    
    this.extraMileageFee = extraMileage * (extraMileageRate || 5000);
    return this.extraMileageFee;
};

// Check if booking can be completed
bookingSchema.methods.canComplete = function() {
    return this.status === 'IN_PROGRESS' && this.actualEndDate;
};

// === STATIC METHODS ===

// Check car availability for date range
bookingSchema.statics.isCarAvailable = async function(carId, startDate, endDate, excludeBookingId = null) {
    const query = {
        carId: carId,
        status: { $in: ['CONFIRMED', 'IN_PROGRESS'] },
        $or: [
            // New booking starts during existing booking
            { startDate: { $lte: startDate }, endDate: { $gt: startDate } },
            // New booking ends during existing booking
            { startDate: { $lt: endDate }, endDate: { $gte: endDate } },
            // New booking completely contains existing booking
            { startDate: { $gte: startDate }, endDate: { $lte: endDate } }
        ]
    };

    if (excludeBookingId) {
        query._id = { $ne: excludeBookingId };
    }

    const conflictingBooking = await this.findOne(query);
    return !conflictingBooking;
};

module.exports = mongoose.model('Booking', bookingSchema);
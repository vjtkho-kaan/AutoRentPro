const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    // === REFERENCES ===
    bookingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        required: [true, 'Booking là bắt buộc']
    },
    carId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Car',
        required: [true, 'Xe là bắt buộc']
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Người đánh giá là bắt buộc']
    },

    // === RATINGS (1-5 stars) ===
    overallRating: {
        type: Number,
        required: [true, 'Đánh giá tổng thể là bắt buộc'],
        min: [1, 'Đánh giá tối thiểu là 1 sao'],
        max: [5, 'Đánh giá tối đa là 5 sao']
    },
    cleanliness: {
        type: Number,
        min: [1, 'Đánh giá độ sạch tối thiểu là 1 sao'],
        max: [5, 'Đánh giá độ sạch tối đa là 5 sao']
    },
    communication: {
        type: Number,
        min: [1, 'Đánh giá giao tiếp tối thiểu là 1 sao'],
        max: [5, 'Đánh giá giao tiếp tối đa là 5 sao']
    },
    accuracy: {
        type: Number,
        min: [1, 'Đánh giá độ chính xác tối thiểu là 1 sao'],
        max: [5, 'Đánh giá độ chính xác tối đa là 5 sao']
    },
    value: {
        type: Number,
        min: [1, 'Đánh giá giá trị tối thiểu là 1 sao'],
        max: [5, 'Đánh giá giá trị tối đa là 5 sao']
    },

    // === COMMENT ===
    comment: {
        type: String,
        required: [true, 'Nhận xét là bắt buộc'],
        minlength: [10, 'Nhận xét phải có ít nhất 10 ký tự'],
        maxlength: [1000, 'Nhận xét không được quá 1000 ký tự']
    },

    // === OWNER RESPONSE ===
    response: {
        type: String,
        maxlength: [500, 'Phản hồi không được quá 500 ký tự']
    },
    respondedAt: {
        type: Date
    },

    // === HELPFUL VOTES ===
    helpfulCount: {
        type: Number,
        default: 0,
        min: [0, 'Số lượt hữu ích không thể âm']
    },

    // === STATUS ===
    isEdited: {
        type: Boolean,
        default: false
    },
    editedAt: {
        type: Date
    },
    isHidden: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// === INDEXES ===
reviewSchema.index({ carId: 1, createdAt: -1 });
reviewSchema.index({ userId: 1 });
reviewSchema.index({ bookingId: 1 }, { unique: true }); // One review per booking

// === VIRTUAL FIELDS ===
reviewSchema.virtual('averageRating').get(function() {
    const ratings = [this.cleanliness, this.communication, this.accuracy, this.value].filter(r => r != null);
    if (ratings.length === 0) return this.overallRating;
    const sum = ratings.reduce((a, b) => a + b, this.overallRating);
    return Math.round((sum / (ratings.length + 1)) * 10) / 10;
});

reviewSchema.virtual('canEdit').get(function() {
    if (this.isEdited) return false;
    const daysSinceCreation = (new Date() - this.createdAt) / (1000 * 60 * 60 * 24);
    return daysSinceCreation <= 7; // Can edit within 7 days
});

// === INSTANCE METHODS ===
reviewSchema.methods.markAsEdited = function() {
    this.isEdited = true;
    this.editedAt = new Date();
};

// === PRE-SAVE MIDDLEWARE ===
reviewSchema.pre('save', async function(next) {
    // Update car's average rating when review is created/updated
    if (this.isModified('overallRating') && !this.isNew) {
        const Car = mongoose.model('Car');
        const car = await Car.findById(this.carId);
        if (car) {
            // Recalculate average rating from all reviews
            const Review = mongoose.model('Review');
            const reviews = await Review.find({ carId: this.carId, isHidden: false });
            const totalRating = reviews.reduce((sum, r) => sum + r.overallRating, 0);
            car.averageRating = totalRating / reviews.length;
            car.totalReviews = reviews.length;
            await car.save();
        }
    }
});

// === POST-SAVE MIDDLEWARE ===
reviewSchema.post('save', async function(doc) {
    // Update car rating after new review
    if (this.wasNew) { // Only for new reviews
        const Car = mongoose.model('Car');
        const car = await Car.findById(doc.carId);
        if (car) {
            await car.updateRating(doc.overallRating);
        }
    }
});

module.exports = mongoose.model('Review', reviewSchema);

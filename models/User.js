const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    numberPhone: { type: String, required: false },
    role: { 
        type: String, 
        enum: ['ADMIN', 'CUSTOMER', 'CAR_OWNER'], 
        default: 'CUSTOMER'
    }
}, { 
    timestamps: true 
});

module.exports = mongoose.model('User', userSchema);
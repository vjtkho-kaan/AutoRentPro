// Quick script to check admin user in database
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function checkAdmin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');
        
        const admin = await User.findOne({ email: 'admin@autorentpro.com' });
        
        if (!admin) {
            console.log('❌ Admin user not found!');
        } else {
            console.log('\n📋 Admin User Details:');
            console.log('Name:', admin.name);
            console.log('Email:', admin.email);
            console.log('Phone:', admin.phone);
            console.log('Role:', admin.role);
            console.log('IsActive:', admin.isActive);
            console.log('CreatedAt:', admin.createdAt);
            console.log('\n');
            
            if (admin.role !== 'admin') {
                console.log('⚠️  WARNING: Role is NOT admin! Current role:', admin.role);
                console.log('🔧 Fixing role...');
                admin.role = 'admin';
                await admin.save();
                console.log('✅ Role fixed to admin');
            } else {
                console.log('✅ Role is correct: admin');
            }
        }
        
        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

checkAdmin();

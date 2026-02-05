// Quick check script
require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('../models/Car');

async function check() {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const count = await Car.countDocuments();
    console.log('Total cars:', count);
    
    const cats = await Car.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    console.log('By category:', JSON.stringify(cats));
    
    const statuses = await Car.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    console.log('By status:', JSON.stringify(statuses));
    
    // Show first car with enterprise fields
    const sample = await Car.findOne().lean();
    if (sample) {
        console.log('\nSample car:');
        console.log('  Brand:', sample.brand, sample.model);
        console.log('  Category:', sample.category);
        console.log('  Transmission:', sample.transmission);
        console.log('  Features:', sample.features);
    }
    
    await mongoose.disconnect();
}

check().catch(console.error);

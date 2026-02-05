const calculateRentalCost = require('./pricing');
const isBookingOverlap = require('./availability');
const validateBooking = require('./bookingValidator');

try {
    console.log("demo.js is running...");

    // pricing
    console.log("1. Test Pricing:");
    const price = calculateRentalCost('2025-01-01', '2025-01-05', 500000);
    console.log(price); // Mong đợi: 4 ngày, 2tr

    // availability
    console.log("\n2. Test Availability:");
    const existing = [
        { startDate: '2025-01-01', endDate: '2025-01-05' }
    ];
    // Case trùng
    const isOverlap = isBookingOverlap('2025-01-03', '2025-01-06', existing);
    console.log("Có trùng không (Expect: true):", isOverlap);

    // validator
    console.log("\n3. Test Validator:");
    const valid = validateBooking({ carId: '', startDate: '2025-01-01', endDate: '2025-01-02' });
    console.log("Kết quả validate (Expect: false):", valid);

} catch (error) {
    console.error("LỖI:", error.message);
}

const http = require('http');
const fs = require('fs').promises; 
const url = require('url');


const calculateRentalCost = require('./pricing');
const isBookingOverlap = require('./availability');
const validateBooking = require('./bookingValidator');

const PORT = 3000;
const DATA_DIR = './data';

// Đọc file JSON và parse sang Object
async function readData(fileName) {
    try {
        const data = await fs.readFile(`${DATA_DIR}/${fileName}`, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error(`Lỗi đọc file ${fileName}:`, err);
        return []; // Nếu lỗi (ví dụ file chưa có) thì trả về mảng rỗng
    }
}

// Ghi Object vào file JSON
async function writeData(fileName, data) {
    await fs.writeFile(`${DATA_DIR}/${fileName}`, JSON.stringify(data, null, 2));
}

// Xử lý luồng dữ liệu (Stream) của POST request để lấy Body
function getRequestBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            if (!body) return resolve({});
            try {
                resolve(JSON.parse(body));
            } catch (e) {
                reject(new Error("Invalid JSON format"));
            }
        });
    });
}

const server = http.createServer(async (req, res) => {
    // 1. Cấu hình Header chuẩn JSON và CORS (cho phép gọi từ mọi nơi)
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // 2. Phân tích URL
    const parsedUrl = url.parse(req.url, true);
    const path = parsedUrl.pathname;
    const method = req.method;

    console.log(`[${new Date().toISOString()}] ${method} ${path}`);

    try {
        // === ROUTE 1: GET /cars (Xem danh sách xe + Lọc) ===
        if (path === '/cars' && method === 'GET') {
            const cars = await readData('cars.json');
            
            // Xử lý query param ?status=AVAILABLE
            const statusFilter = parsedUrl.query.status;
            let result = cars;

            if (statusFilter) {
                result = cars.filter(car => car.status === statusFilter);
            }

            res.statusCode = 200;
            res.end(JSON.stringify(result));
        }

        // === ROUTE 2: POST /bookings (Đặt xe) ===
        else if (path === '/bookings' && method === 'POST') {
            const body = await getRequestBody(req);

            // Bước 1: Validate dữ liệu (Kế thừa Chapter 2)
            const validation = validateBooking(body);
            if (!validation.valid) {
                res.statusCode = 400;
                res.end(JSON.stringify({ message: validation.message }));
                return;
            }

            // Bước 2: Load dữ liệu Booking và Car
            const bookings = await readData('bookings.json');
            const cars = await readData('cars.json');

            // Bước 3: Tìm xe để lấy giá
            const car = cars.find(c => c.id === body.carId);
            if (!car) {
                res.statusCode = 404;
                res.end(JSON.stringify({ message: "Car ID not found" }));
                return;
            }

            // Bước 4: Check trùng lịch (Kế thừa Chapter 2)
            const carBookings = bookings.filter(b => b.carId === body.carId);
            if (isBookingOverlap(body.startDate, body.endDate, carBookings)) {
                res.statusCode = 409; // Conflict
                res.end(JSON.stringify({ message: "Xe đã bị trùng lịch!" }));
                return;
            }

            // Bước 5: Tính tiền (Kế thừa Chapter 2)
            const pricing = calculateRentalCost(body.startDate, body.endDate, car.pricePerDay);

            // Bước 6: Lưu booking mới
            const newBooking = {
                id: "b" + Date.now(), // Tạo ID unique
                ...body,
                totalPrice: pricing.total,
                status: "CONFIRMED",
                createdAt: new Date().toISOString()
            };

            bookings.push(newBooking);
            await writeData('bookings.json', bookings);

            res.statusCode = 201;
            res.end(JSON.stringify({ 
                message: "Booking thành công", 
                booking: newBooking 
            }));
        }

        // === 404 Not Found ===
        else {
            res.statusCode = 404;
            res.end(JSON.stringify({ message: "API không tồn tại" }));
        }

    } catch (err) {
        console.error(err);
        res.statusCode = 500;
        res.end(JSON.stringify({ message: "Lỗi Server nội bộ" }));
    }
});

// Khởi động Server
server.listen(PORT, () => {
    console.log(`Server AutoRent Pro đang chạy tại http://localhost:${PORT}`);
});
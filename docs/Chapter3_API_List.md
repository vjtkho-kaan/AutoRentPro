# API DESIGN: CAR - BOOKING - USER

## 1. Car APIs
- GET /cars
  - Trả về danh sách xe
  - Query params:
    - status: string ("AVAILABLE" | "RENTED" | "MAINTENANCE")
    - minPrice: number
- GET /cars/:id
  - Trả về chi tiết xe theo id
  - URL param:
    - id: string
- POST /cars
  - Thêm xe mới
  - Body:
    - brand: string
    - model: string
    - pricePerDay: number
    - status: string
    - plateNumber: string

## 2. Booking APIs
- POST /bookings
  - Tạo booking mới
  - Body:
    - carId: string
    - userId: string
    - startDate: string (yyyy-mm-dd)
    - endDate: string (yyyy-mm-dd)
- GET /bookings/:id
  - Trả về chi tiết booking
  - URL param:
    - id: string
- GET /my-bookings
  - Trả về lịch sử thuê của user
  - Query param:
    - userId: string

## 3. User APIs
- POST /users/register
  - Đăng ký tài khoản
  - Body:
    - name: string
    - email: string
    - password: string
- POST /users/login
  - Đăng nhập
  - Body:
    - email: string
    - password: string

## Lưu ý khi tạo booking
Khi gọi POST /bookings, hệ thống sẽ:
1. Kiểm tra dữ liệu đầu vào (bookingValidator.js)
2. Kiểm tra trùng lịch (availability.js)
3. Tính tổng tiền thuê (pricing.js)
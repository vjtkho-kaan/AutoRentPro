
# JSON MODEL DESIGN: USER - CAR - BOOKING

## 1. User
- id: string
- name: string
- email: string
- role: string ("CUSTOMER" | "CAR_OWNER" | "ADMIN")
- password: string

Ví dụ:
{
  "id": "u1",
  "name": "Nguyen Van A",
  "email": "ana@gmail.com",
  "role": "CUSTOMER"
}

## 2. Car
- id: string
- brand: string
- model: string
- pricePerDay: number
- status: string ("AVAILABLE" | "RENTED" | "MAINTENANCE")
- plateNumber: string

Ví dụ:
{
  "id": "c1",
  "brand": "Toyota",
  "model": "Vios 2023",
  "pricePerDay": 500000,
  "status": "AVAILABLE",
  "plateNumber": "30A-12345"
}

## 3. Booking
- id: string
- carId: string
- userId: string
- startDate: string (yyyy-mm-dd)
- endDate: string (yyyy-mm-dd)
- totalPrice: number
- status: string ("CONFIRMED" | "PENDING" | ...)

Ví dụ:
{
  "id": "b1",
  "carId": "c4",
  "userId": "u1",
  "startDate": "2026-01-10",
  "endDate": "2026-01-15",
  "totalPrice": 12500000,
  "status": "CONFIRMED"
}
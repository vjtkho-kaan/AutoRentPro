# MongoDB Schema Design

## 1. Collection: `users`
```json
{
  "_id": ObjectId("..."),
  "name": "Nguyen Viet Khoa",
  "email": "khoanv@fpt.edu.vn",
  "role": "CUSTOMER", // Enum: CUSTOMER, OWNER, ADMIN
  "phone": "0909..."
}
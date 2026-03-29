# Authentication API Documentation

เอกสารนี้สรุปวิธีการใช้งาน API ที่เกี่ยวข้องกับการยืนยันตัวตน (Authentication) ทั้งหมดในระบบ RoPa Web Service

---

## 1. สมัครสมาชิก (Register)
**Endpoint:** `POST /auth/register`
**Description:** ใช้สำหรับสร้างบัญชีผู้ใช้งานใหม่ (ค่า [role](file:///c:/Users/prava/SF222-Deployment/RoPa-Web-Service/server/app/api/routers/users.py#13-19) จะถูกตั้งเป็น `null` เสมอ เพื่อการรักษาความปลอดภัยและรอ Admin มาอนุมัติตำแหน่งในภายหลัง)

### Request Body (JSON)
```json
{
  "username": "johndoe",
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "password": "strongpassword123"
}
```

### Response (200 OK)
ส่งกลับเป็นข้อมูลโปรไฟล์โดยไม่มีการส่งรหัสผ่านกลับมา
```json
{
  "username": "johndoe",
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "role": null,
  "status": "ACTIVE",
  "last_login_at": null,
  "created_at": "2026-03-29T11:00:00Z",
  "updated_at": "2026-03-29T11:00:00Z"
}
```

---

## 2. เข้าสู่ระบบ (Login)
**Endpoint:** `POST /auth/login`
**Description:** ใช้สำหรับล็อกอินเข้าสู่ระบบ รองรับการกรอกอักษรเข้าแบบยืดหยุ่น โดยสามารถระบุ **username หรือ email** ในช่อง `username` ก็ได้

### Request Body (x-www-form-urlencoded)
*เนื่องจากอิงตามมาตรฐานความปลอดภัย OAuth2 ข้อมูลต้องถูกส่งผ่าน HTTP Form แบบเข้ารหัส ไม่ใช่ JSON*
- `username` (string): ใส่ชื่อผู้ใช้ (เช่น `johndoe`) **หรือ** อีเมล (เช่น `john@example.com`) ก็ได้
- [password](file:///c:/Users/prava/SF222-Deployment/RoPa-Web-Service/server/app/core/security.py#7-9) (string): รหัสผ่าน

### Response (200 OK)
```json
{
  "access_token": "eyJhbGciOiJIUzI...",
  "refresh_token": "eyJhbGciOiJIUzI...",
  "token_type": "bearer"
}
```
* **access_token:** บัตรผ่านสำหรับใช้ดึงข้อมูลใน API อื่น ๆ ตัวบัตรฝังอายุการใช้งานไว้ที่ **15 นาที** ตามทึ่ตั้งค่าล่าสุด
* **refresh_token:** บัตรผ่านสำรองสำหรับใช้ยื่นต่ออายุเข้าสู่ระบบ มีอายุ **7 วัน**
* **วิธีใช้:** ให้นำค่า [access_token](file:///c:/Users/prava/SF222-Deployment/RoPa-Web-Service/server/app/core/security.py#14-23) ไปแนบใน Header `Authorization: Bearer <access_token>` ทุกครั้งที่เรียกใช้ API ระดับที่มีการป้องกัน (Proteced Routes)

---

## 3. ขอต่ออายุบัตรผ่าน (Refresh Token)
**Endpoint:** `POST /auth/refresh`
**Description:** เมื่อ [access_token](file:///c:/Users/prava/SF222-Deployment/RoPa-Web-Service/server/app/core/security.py#14-23) ขาดอายุ (เกิน 15 นาทีตามหลักความปลอดภัย) ให้ยิง API นี้เพื่อเอา Refresh Token ไปแลก Access Token ใบใหม่มาใช้ต่อเนื่องได้เลย โดยไม่ต้องให้ User รู้สึกรำคาญและต้องมากรอกรหัสผ่านซ้ำบ่อย ๆ

### Request Body (JSON)
```json
{
  "refresh_token": "eyJhbGciOiJIUzI... (ค่า Refresh Token เก่าที่ได้จากตอน Login)"
}
```

### Response (200 OK)
จะได้ค่า Token **ชุดใหม่** ส่งกลับมาเพื่อใช้หมุนเวียนต่อไป
```json
{
  "access_token": "eyJhbGciOiJIUzI...",
  "refresh_token": "eyJhbGciOiJIUzI...",
  "token_type": "bearer"
}
```

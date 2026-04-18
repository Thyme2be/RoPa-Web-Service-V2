# 🔐 Authentication API Specification (Deep Dive)
**ระบบบริหารจัดการการเข้าถึงและรักษาความปลอดภัย (Security & Access Management)**

เอกสารฉบับนี้ให้รายละเอียดเชิงลึกเกี่ยวกับพารามิเตอร์ทุกตัวใน Payload พร้อมตัวอย่างสถานการณ์ต่างๆ (Use Cases) และตรรกะเบื้องหลังระบบยืนยันตัวตนครับ

---

## 1. ข้อมูลพื้นฐานทางเทคนิค (Technical Overview)

- **Auth Strategy**: JWT (JSON Web Token)
- **Token Expiration**:
    - **Access Token**: 30 นาที (ใช้สำหรับการส่งไปกับทุก Request)
    - **Refresh Token**: 7 วัน (ใช้สำหรับขอ Access Token ใหม่โดยไม่ต้องใช้รหัสผ่าน)
- **Header Structure**: `Authorization: Bearer <Access_Token>`

---

## 2. รายละเอียดจุดเชื่อมต่อ (Service Endpoints)

### 2.1 เข้าสู่ระบบ (POST /auth/login)
ใช้สำหรับเริ่มต้น Session และรับชุด Token

**Request Body (JSON):**
| Variable | Type | Description |
| :--- | :--- | :--- |
| `username_or_email` | String | ระบุได้ทั้ง Username หรือ Email ที่ลงทะเบียนไว้ |
| `password` | String | รหัสผ่านผู้ใช้งาน |

**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiI...",
  "refresh_token": "def456-ghi789-jkl012"
}
```

**ตัวอย่าง Error Payload (401 Unauthorized):**
```json
{
  "detail": "ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง"
}
```

---

### 2.2 ข้อมูลตัวตน (GET /auth/me)
ดึงข้อมูลพื้นฐานเพื่อแสดงผลในส่วน Header หรือ Profile ของหน้าจอ

**Response (200 OK):**
```json
{
  "title": "นาย",
  "first_name": "ปริญญา",
  "last_name": "วัฒนานุกูล",
  "role": "ADMIN"
}
```
*หมายเหตุ: ฟิลด์ `role` สามารถนำไปใช้ในการซ่อน/แสดงเมนูในฝั่ง Frontend ได้ (ADMIN, DPO, AUDITOR, OWNER, PROCESSOR)*

---

### 2.3 ลงทะเบียนผู้ใช้ใหม่ (POST /auth/register)
สำหรับการสมัครสมาชิกในกรณีที่ไม่ได้ถูกสร้างโดย Admin

**Request Body (JSON):**
| Variable | Type | Requirement | Description |
| :--- | :--- | :--- | :--- |
| `username` | String | **Required** | ชื่อผู้ใช้ (ไม่ซ้ำ) |
| `email` | String | **Required** | อีเมล (ต้องเป็นรูปแบบ email@domain.com) |
| `password` | String | **Required** | ขั้นต่ำ 6 ตัวอักษร (Hash อัตโนมัติ) |
| `title` | String | **Required** | คำนำหน้าชื่อ (นาย, นางสาว, ฯลฯ) |
| `first_name` | String | **Required** | ชื่อจริง |
| `last_name` | String | **Required** | นามสกุล |
| `role` | Enum | Optional | ADMIN, DPO, AUDITOR, OWNER, PROCESSOR (Default: OWNER) |
| `department` | String | Optional | สังกัดแผนก |
| `company_name` | String | Optional | ชื่อบริษัทสังกัต |

**Response (201 Created):** คืนค่าข้อมูลผู้ใช้ที่บันทึกสำเร็จ (ไม่แสดง Password)

---

### 2.4 ต่ออายุ Token (POST /auth/refresh)
เมื่อ Access Token หมดอายุ (401) ให้ใช้ Refresh Token เพื่อขอ Access Token ใหม่

**Request Body:**
```json
{
  "refresh_token": "def456-ghi789-jkl012"
}
```
**Response (200 OK):** คืนค่าชุด Token ใหม่ทั้งสองตัว (Rotate Refresh Token)

---

## 3. การจัดการข้อผิดพลาด (Detailed Error Cases)

| สถานการณ์ | Status Code | JSON Response Detail |
| :--- | :--- | :--- |
| อีเมลซ้ำตอนสมัคร | `409 Conflict` | `{"detail": "อีเมลนี้มีการลงทะเบียนไว้แล้ว"}` |
| รหัสผ่านสั้นเกินไป | `422 Unprocessable` | `{"detail": [{"msg": "รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร"}]}` |
| Token หมดอายุ | `401 Unauthorized` | `{"detail": "Could not validate credentials"}` |
| ไม่มีสิทธิ์เข้าถึง Role | `403 Forbidden` | `{"detail": "สิทธิ์การเข้าถึงไม่ถูกต้อง"}` |

---

> [!TIP]
> **Implementation Guide**: แนะนำให้เก็บ `access_token` ไว้ในหน่วยความจำ (state) และเก็บ `refresh_token` ไว้ใน HttpOnly Cookie หรือ LocalStorage (ตามความเหมาะสมของความปลอดภัย) และใช้ระบบ Interceptor ในการทำ Auto-refresh เมื่อเจอสถานะ 401 ครับ

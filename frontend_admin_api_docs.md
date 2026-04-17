# คู่มือการเชื่อมต่อ Admin API สำหรับ Frontend

เอกสารฉบับนี้จัดทำขึ้นสำหรับทีม Frontend โดยเฉพาะ เพื่อใช้อ้างอิงการเชื่อมต่อ (Integration) ชุด API สำหรับผู้ดูแลระบบ (Admin) โครงสร้างข้อมูล ชนิดตัวแปร และ Payload ถูกสรุปให้เรียบร้อยแล้ว แนะนำให้อ้างอิงตัวแปรตามพิมพ์เล็ก/ใหญ่ (Camel/Snake Case) ตามตารางด้านล่างครับ

> [!IMPORTANT]
> **Authentication Requirement**: ทุก API ในหน้านี้ต้องแนบ Header `Authorization: Bearer <your-jwt-token>` ซึ่ง Token นั้นจะต้องเป็นของบัญชีที่มี Role เป็น `ADMIN` เท่านั้น หากส่ง Token ของระดับอื่นมา ระบบจะแจ้งเตือน `403 Forbidden`

---

## 1. 👥 ระบบการจัดการผู้ใช้ (User Management)

### 1.1 เรียกดูผู้ใช้งานทั้งหมดพร้อมตัวกรองระบบ (List & Filter)
ใช้สำหรับวาดตารางและทำช่องค้นหา/กรองข้อมูล

*   **Endpoint**: `GET /admin/users`
*   **Query Parameters** (แนบต่อท้าย URL `?search=...&page=1`):
    *   `search` (String, Optional) - พิมพ์ข้อความค้นหา (ระบบจะควานหาทั้งใน ชื่อนามสกุล และ อีเมล)
    *   `status` (String, Optional) - รันตาม ENUM: `ACTIVE` หรือ `INACTIVE`
    *   `role` (String, Optional) - รันตามตาราง Role โค้ด เช่น `OWNER`, `PROCESSOR`, `ADMIN`
    *   `page` (Int) - หน้าที่ต้องการดึงข้อมูล (Default: `1`)
    *   `limit` (Int) - จำนวนรายการต่อหน้า (Default: `10`)
*   **Response Payload**:
    ```json
    {
      "total": 50,
      "page": 1,
      "limit": 10,
      "items": [
        {
          "id": 5,
          "user_code": "user-05",
          "title": "นาย",
          "first_name": "สมชาย",
          "last_name": "ใจดี",
          "email": "somchai@gmail.com",
          "role": "PROCESSOR",
          "department": null,
          "company_name": "บริษัท เอบีซี จำกัด",
          "status": "ACTIVE",
          "created_at": "2026-04-17T08:00:00Z",
          "is_active": true
        }
      ]
    }
    ```
    > [!TIP]
    > Frontend ไม่ต้องต่อ String เอง ระบบแยกตัวแปร `title` ออกจาก `first_name` ให้แล้ว 

### 1.2 สร้างผู้ใช้ใหม่ (Create)
*   **Endpoint**: `POST /admin/users`
*   **Request JSON Body**:
    ```json
    {
      "username": "somchai_abc",
      "title": "นาย",
      "first_name": "สมชาย",
      "last_name": "ใจดี",
      "email": "somchai@gmail.com",
      "password": "Password1234",
      "role": "PROCESSOR",
      "department": "",
      "company_name": "บริษัท เอบีซี จำกัด",
      "auditor_type": null,
      "status": "ACTIVE"
    }
    ```
    *(ถ้าฟิลด์ไหนไม่มีให้ส่งเป็น `""` หรือ `null`)*

### 1.3 แก้ไขและเปลี่ยนแปลงข้อมูลผู้ใช้ (Update)
*   **Endpoint**: `PUT /admin/users/{user_id}`
*   **Request JSON Body** (ส่งมาเฉพาะฟิลด์ที่ต้องการอัปเดต ไม่บังคับส่งทั้งหมด):
    ```json
    {
      "title": "ดร.", 
      "first_name": "สมชาย", 
      "last_name": "แก้ไขนามสกุล",
      "password": "NewPassword1234",  // ถ้าไม่เปลี่ยน ไม่ต้องส่งมา
      "department": "แผนก IT",
      "company_name": null,
      "role": "OWNER"
    }
    ```

### 1.4 ปิดการใช้งานผู้ใช้ (Delete / Deactivate)
*   **Endpoint**: `DELETE /admin/users/{user_id}`
*   **ผลลัพธ์**: ส่งกลับเป็น Status `204 No Content`
    > [!NOTE]
    > ข้อมูลจะไม่หายไปจากฐานข้อมูล แต่จะเป็นการปรับ "status" ให้กลายเป็น "INACTIVE" อัตโนมัติ (Soft Delete)

---

## 2. 🏢 ระบบข้อมูลพื้นฐาน (Master Data CRUD)

ใช้สำหรับหน้าจอการจัดการตั้งค่า แผนก, บทบาท, และบริษัท

### 2.1 ข้อมูลแผนก (Departments)
*   **List & Search** (`GET /admin/departments`): มี Query `search`, `page`, `limit` เหมือนผู้ใช้
*   **Create** (`POST /admin/departments`): ส่ง Body `{ "name": "แผนก IT" }`
*   **Update** (`PUT /admin/departments/{id}`): ส่ง Body `{ "name": "ชื่อแผนกใหม่" }`
*   **Delete** (`DELETE /admin/departments/{id}`): ไม่ลบทิ้งจริง แต่ซ่อนให้หายไปจาก Dropdown (`is_active = FALSE`)

### 2.2 ข้อมูลบริษัท (Companies)
*   **List & Search** (`GET /admin/companies`): มี Query `search`, `page`, `limit`
*   **Create** (`POST /admin/companies`): ส่ง Body `{ "name": "บริษัท XYZ" }`
*   **Update** (`PUT /admin/companies/{id}`): ส่ง Body `{ "name": "บริษัท XYZ โฉมใหม่" }`
*   **Delete** (`DELETE /admin/companies/{id}`): 204 No Content (Soft delete)

### 2.3 จัดการชื่อบทบาท (Roles)
*   **List & Search** (`GET /admin/roles`): มี Query เพิ่มจากปกติ คือ `search` จะหาทั้งชื่อและรหัส (Code)
*   **Create** (`POST /admin/roles`): **ตัวนี้ต้องส่ง Code ควบคู่มาด้วย!**
    ```json
    { 
      "code": "SUPERVISOR", 
      "name": "หัวหน้าผู้ควบคุมข้อมูล" 
    }
    ```
*   **Update** (`PUT /admin/roles/{id}`): `{ "name": "เปลี่ยนชื่อแปลไทย" }` (สามารถแก้ code ได้ถ้าจำเป็น)
*   **Delete** (`DELETE /admin/roles/{id}`) 

**หน้าตา Response ตัวอย่างของฝั่ง Master Data ทั้ง 3 ตัว:**
```json
{
  "total": 1,
  "page": 1,
  "limit": 10,
  "items": [
    {
      "id": 1,
      "name": "แผนก IT",
      "is_active": true,
      "created_at": "2026-04-17T09:00:00Z",
      ... "code": "ADMIN" // (มีเพิ่มให้เฉพาะเส้น Roles)
    }
  ]
}
```

---

## 3. 📊 ดึงสถิติหน้ากระดานส่วนกลาง (Dashboards)

### 3.1 สถิติการเกิดเอกสาร (Organization Overview)
*   **Endpoint**: `GET /dashboard`
*   **Query**:
    *   `period` (Default = `"30_days"`) ค่าที่เป็นไปได้: `7_days`, `30_days`, `custom`, `overdue`, `all`
    *   `custom_date` (ใช้ถ้า period เป็น custom ส่งรูปแบบ `YYYY-MM-DD`)

### 3.2 สถิติประชากรในระบบ (User Stats Dashboard)
*   **Endpoint**: `GET /dashboard/users`
*   **Query**: ใช้รูปแบบฟิลเตอร์ `period` และ `custom_date` รูปแบบเดียวกัน
*   **สิ่งที่ Frontend จะได้รับ** (โครงสร้างถูกเตรียม String ปรุงสุกให้พร้อมโชว์ตารางแล้ว):
    ```json
    {
      "selected_period": "30_days",
      "user_overview": {
        "total": 45,
        "roles": { "OWNER": 10, "PROCESSOR": 5, "DPO": 2, "AUDITOR": 8, "ADMIN": 20, "EXECUTIVE": 0 }
      },
      "role_breakdowns": {
        "owner_breakdown": {
          "by_department": [
            { "department": "แผนกที่ 1 [แผนกการเงิน]", "count": 10 }
          ]
        },
        "processor_breakdown": {
          "by_company": [
            { "company": "บริษัทที่ 1 [บริษัท อิมพอร์ต จำกัด]", "count": 5 }
          ]
        },
        "auditor_breakdown": {
          "internal": { "by_department": [...] },
          "external": { "by_company": [...] }
        }
      }
    }
    ```

### 3.3 สควอทส่องกล้องพนักงานรายบุคคล (Per-User Dashboard)
*   **Endpoint**: `GET /{username}/dashboard`
*   **การอ้างอิง**: ใช้ `username` ของผู้ใช้นั้นๆ หย่อนลงไปใน Path ตรงๆ
*   **ผลลัพธ์**: จะคายรายละเอียดเลยว่า คนคนนี้สร้างตารางไปแล้วกี่อัน, ค้างตรวจงานอยู่กี่ตัว หรือ อนุมัติเอกสารไปแล้วกี่กระดาษ

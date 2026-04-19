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
*   **List & Search** (`GET /admin/roles`): มี Query `search`, `page`, `limit`
*   **Create** (`POST /admin/roles`):
    ```json
    { 
      "name": "หัวหน้าผู้ควบคุมข้อมูล" 
    }
    ```
*   **Update** (`PUT /admin/roles/{id}`): `{ "name": "เปลี่ยนชื่อแปลไทย" }`
*   **Delete** (`DELETE /admin/roles/{id}`)  

**หน้าตา Response ตัวอย่างของฝั่ง Master Data ทั้ง 3**:
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
      "created_at": "2026-04-17T09:00:00Z"
    }
  ]
}
```

---

## 3. 📊 ระบบรายงานและแดชบอร์ด (Dashboard APIs)

ใช้สำหรับสรุปภาพรวมข้อมูล สถิติผู้ใช้ และการติดตามงาน

### 3.1 ดูรายการเอกสารทั้งหมด (Admin Document List)
**Endpoint**: `GET /admin/documents`
**หน้าที่**: ดึงรายชื่อกิจกรรมการประมวลผลข้อมูล (RoPa) ทั้งหมดในระบบ พร้อมข้อมูลผู้รับผิดชอบและแผนก

**Query Parameters**:
- `search` (Optional): ค้นหาจากชื่อกิจกรรมหรือรหัสเอกสาร
- `status` (Optional): กรองตามสถานะ (`DRAFT`, `IN_PROGRESS`, `UNDER_REVIEW`, `COMPLETED`)
- `page` (Default: 1): เลขหน้า
- `limit` (Default: 10): รายการต่อหน้า

**Response Payload**:
```json
{
  "total": 50,
  "page": 1,
  "limit": 10,
  "items": [
    {
      "id": "78768007-991f-49f9-aa84-af13253b2661",
      "document_number": "RP-2024-001",
      "title": "กิจกรรมการจัดการข้อมูลพนักงาน",
      "owner_name": "สมชาย ใจดี",
      "department": "ฝ่ายบุคคล",
      "dpo_name": "วิศรุต DPO",
      "updated_at": "2026-04-19T10:00:00Z",
      "status": "IN_PROGRESS"
    }
  ]
}
```

### 3.2 แดชบอร์ดภาพรวมองค์กร (Organisation Dashboard)
**Endpoint**: `GET /dashboard?period=7d`
*   **Query Parameters**: 
    *   `period` (String) - `7_days`, `30_days`, `overdue`, `all`, `custom`
    *   `custom_date` (String, YYYY-MM-DD) - ใช้เมื่อเลือก period เป็น `custom`
*   **Response**: คืนค่าสถิติเอกสารแยกตามสถานะและการทำงานของแต่ละ Role (DO, DP, DPO, Auditor)

### 3.3 สถิติผู้ใช้งานรายบทบาท (User Stats Dashboard)
ใช้สำหรับวาดกราฟวงกลม (Center Donut) และตารางสรุปสถิติจำนวนคน
*   **Endpoint**: `GET /dashboard/users`
*   **Query Parameters**: เหมือน 3.1
*   **Response Payload**:
    ```json
    {
      "selected_period": "30_days",
      "user_overview": { "total": 100, "roles": { "ADMIN": 5, "DPO": 5, ... } },
      "role_breakdowns": {
        "owner_breakdown": { "by_department": [...] },
        "processor_breakdown": { "by_company": [...] },
        "auditor_breakdown": { "internal": { "by_department": [...] }, "external": { "by_company": [...] } }
      }
    }
    ```

### 3.3 แดชบอร์ดรายบุคคล (Per-User Role Dashboard)
ใช้สำหรับ Admin เพื่อดูความคืบหน้างาน "ในมุมมองของ User คนนั้นๆ"
*   **Endpoint**: `GET /admin/users/{id}/dashboard`
*   **Response Payload**:
    ```json
    {
      "user": {
        "id": 3,
        "email": "user@mail.com",
        "first_name": "สมชาย",
        "last_name": "มั่นคง",
        "role": "DPO",
        "status": "ACTIVE"
      },
      "role_dashboard": {
        // ข้อมูลจะเปลี่ยนไปตามบทบาทของ User คนนั้น เช่น
        // ถ้าเป็น DPO จะเห็น risk_overview, pending_dpo_review
        // ถ้าเป็น Auditor จะเห็น pending_audits, overdue_audits
      },
      "statistics": {
        "owned_documents": 5,
        "last_activity": "2026-04-18T15:30:00Z"
      }
    }
    ```

### 3.4 แดชบอร์ดสรุปรายบทบาท (Role-Specific Dedicated)
สำหรับกรณีที่ต้องการดึงเฉพาะสถิติของบทบาทนั้นๆ (รวมถึง Admin ดูเอง)
*   `GET /dashboard/owner` - สถิติฝั่ง Data Owner
*   `GET /dashboard/processor` - สถิติฝั่ง Processor
*   `GET /dashboard/auditor` - สถิติฝั่ง Auditor
*   `GET /dashboard/executive` - ภาพรวมเชิงบริหาร (Executive View)
*   `GET /dashboard/dpo` - สถิติฝั่ง DPO



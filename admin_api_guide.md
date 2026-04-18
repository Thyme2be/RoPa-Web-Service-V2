# เอกสารข้อกำหนดทางเทคนิค API ฉบับสมบูรณ์ (Admin Service Full Specification)
**สำหรับการพัฒนาส่วนต่อประสานผู้ใช้งาน (Frontend Integration)**

เอกสารฉบับนี้รวบรวมรายละเอียดเชิงลึกของ API ทั้งหมดในส่วนงานผู้ดูแลระบบ (Admin) โดยระบุโครงสร้างข้อมูล (Payload) ครบถ้วนทุก Endpoint

---

## 1. การจัดการผู้ใช้งาน (User Management)
เส้นทางหลัก (Path): `/admin/users`

### 1.1 ดึงรายการผู้ใช้งาน (GET)
ใช้สำหรับแสดงผลตารางรายชื่อผู้ใช้งานทั้งหมดในระบบ

- **Query Parameters**: `search`, `status`, `role`, `page`, `limit`
- **Response Payload**:
```json
{
  "total": 50,
  "page": 1,
  "limit": 10,
  "items": [
    {
      "id": 1,
      "user_code": "user-01",
      "title": "นาย",
      "first_name": "ปริญญา",
      "last_name": "วัฒนานุกูล",
      "email": "user@example.com",
      "role": "ADMIN",
      "department": "IT",
      "company_name": "ABC Corp",
      "status": "ACTIVE",
      "created_at": "2024-04-18T10:00:00Z",
      "is_active": true
    }
  ]
}
```

### 1.2 สร้างผู้ใช้งานใหม่ (POST)
- **Request Payload**:
```json
{
  "email": "newuser@example.com",
  "username": "newuser",
  "password": "password123",
  "title": "นางสาว",
  "first_name": "สมศรี",
  "last_name": "รักเรียน",
  "role": "OWNER",
  "department": "HR",
  "company_name": "ABC Corp",
  "auditor_type": "INTERNAL",
  "status": "ACTIVE"
}
```
- **Response Payload**: ข้อมูลผู้ใช้งานที่สร้างสำเร็จ (รูปแบบเดียวกับ Item ในรายการ GET)

### 1.3 แก้ไขข้อมูลผู้ใช้งาน (PUT)
- **Path**: `/admin/users/{user_id}`
- **Request Payload** (ส่งเฉพาะฟิลด์ที่ต้องการแก้ไข):
```json
{
  "title": "ดร.",
  "first_name": "สมชาย",
  "status": "INACTIVE"
}
```

---

## 2. การจัดการข้อมูลหลัก (Master Data Management)
เส้นทางหลัก: `/admin/departments`, `/admin/companies`, `/admin/roles`

### 2.1 ดึงรายการข้อมูลหลัก (GET)
- **Response Payload (ตัวอย่างสำหรับ Departments)**:
```json
{
  "total": 5,
  "page": 1,
  "limit": 10,
  "items": [
    {
      "id": 1,
      "name": "เทคโนโลยีสารสนเทศ (IT)",
      "is_active": true,
      "created_at": "2024-04-18T09:00:00Z"
    }
  ]
}
```

### 2.2 เพิ่มข้อมูลหลักใหม่ (POST)
- **Request Payload**:
```json
{
  "name": "ชื่อรายการใหม่"
}
```

---

## 3. แดชบอร์ดสถิติระดับองค์กร (Analytics Dashboard)

### 3.1 ภาพรวมเอกสาร (GET /dashboard)
- **Response Payload**:
```json
{
  "selected_period": "30_days",
  "document_overview": {
    "total": 100,
    "statuses": {
      "IN_PROGRESS": 20,
      "PENDING": 15,
      "UNDER_REVIEW": 10,
      "COMPLETED": 55
    }
  },
  "role_based_stats": {
    "data_owner_docs": { "title": "...", "completed": 50, "incomplete": 10 },
    "processor_docs": { "title": "...", "completed": 30, "incomplete": 5 },
    "dpo_docs": { "title": "...", "completed": 20, "incomplete": 2 },
    "auditor_docs": { "title": "...", "completed": 15, "incomplete": 0 }
  },
  "revision_and_deletion_stats": {
    "owner_revisions": { "title": "...", "completed": 5, "incomplete": 2 },
    "destroyed_docs": { "title": "...", "completed": 10, "incomplete": 0 },
    "due_for_destruction": { "title": "...", "completed": 0, "incomplete": 3 }
  }
}
```

### 3.2 สถิติผู้ใช้งาน (GET /dashboard/users)
- **Response Payload**:
```json
{
  "selected_period": "30_days",
  "user_overview": {
    "total": 45,
    "roles": { "ADMIN": 2, "DPO": 3, "OWNER": 20, "PROCESSOR": 10, "AUDITOR": 10 }
  },
  "role_breakdowns": {
    "owner_breakdown": {
      "by_department": [ { "department": "...", "count": 10 } ]
    },
    "auditor_breakdown": {
      "internal": { "by_department": [ { "department": "...", "count": 5 } ] },
      "external": { "by_company": [ { "company": "...", "count": 5 } ] }
    }
  }
}
```

---

## 4. รหัสสถานะและข้อผิดพลาด (Status Codes)

| รหัสสถานะ | คำอธิบาย |
| :--- | :--- |
| `200` | ดำเนินการสำเร็จ |
| `201` | สร้างข้อมูลสำเร็จ |
| `400` | ข้อมูลขาเข้าไม่ถูกต้อง (Validation Error) |
| `401` | ไม่พบสิทธิ์การเข้าถึง (Missing/Expired Token) |
| `403` | ปฏิเสธการเข้าถึง (บทบาทไม่ใช่ ADMIN) |
| `409` | ข้อมูลขัดแย้ง (เช่น อีเมลซ้ำ) |

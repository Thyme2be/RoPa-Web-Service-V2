# 📑 Master API Specification: Latest Unified Version (2026-04-19)

เอกสารฉบับนี้รวบรวมรายละเอียดทางเทคนิคทั้งหมดของ API ที่มีการปรับปรุงล่าสุด เพื่อให้ทีม Frontend สามารถเชื่อมต่อระบบได้อย่างถูกต้อง 100%

---

## 1. 📊 ระบบแดชบอร์ดรายบุคคล (Per-User Dashboard Integration)
**Endpoint**: `GET /admin/users/{id}/dashboard` (เดิมคือ `/{id}/dashboard`)

### 🔹 การเปลี่ยนแปลงโครงสร้าง Response (Latest Contract)
ระบบได้คืนค่าข้อมูลผู้ใช้ (User Object) ไว้ที่ระดับบนสุด (Top-level) ตามความต้องการของ Frontend

**Response Payload Example**:
```json
{
  "user": {
    "id": 5,
    "email": "pravarit@mail.com",
    "first_name": "ประวริศ",
    "last_name": "เป้งเซ่ง",
    "role": "OWNER",
    "status": "ACTIVE"
  },
  "role_dashboard": {
    /* ข้อมูลสถิติตรวจแล้ว/ยังไม่อันนี้ขึ้นอยู่กับบทบาท (Role) ของผู้ใช้ */
  },
  "statistics": {
    "documents_created": { "COMPLETED": 5, "IN_PROGRESS": 2 },
    "processor_assignments": 3,
    "auditor_assignments": 1,
    "owned_assignments": 4
  }
}
```

---

## 🔍 2. ระบบการสืบค้นข้อมูลในตาราง (Enhanced Search Support)
**Endpoints**: 
*   `GET /dashboard/documents-from-dpo` (สำหรับ Auditor และ Owner/Processor)
*   `GET /dashboard/dpo/documents` (สำหรับ DPO)

### 🔹 พารามิเตอร์ใหม่
*   **`search`** (String, Optional): ค้นหาจาก **"ชื่อกิจกรรม (Title)"** หรือ **"รหัสเอกสาร (Document Number)"**
*   **พฤติกรรม**: แสดงผลเฉพาะรายการที่ชื่อหรือรหัสมีคำที่ตรงกับคำค้นหา (Case-insensitive)

---

## ✅ 3. ระบบยืนยันผลโดยผู้ตรวจสอบ (Auditor Verification Workflow)
**Endpoint**: `PATCH /auditor/assignments/{assignment_id}/verify`
**สถานะ**: พร้อมใช้งาน (NEW)

### 🔹 รายละเอียดการใช้งาน
*   **เป้าหมาย**: ใช้เมื่อผู้ตรวจสอบ (Auditor) ตรวจสอบเอกสารเสร็จแล้วและต้องการกดยืนยันผล
*   **สิทธิ์การใช้งาน**: เฉพาะ Auditor ที่ได้รับมอบหมายงานนั้นๆ หรือ Admin เท่านั้น
*   **No Request Body**: ไม่ต้องส่ง Payload ไปเพิ่ม
*   **โหมดการทำงาน**: เมื่อเรียกใช้ สถานะใน `AuditorAssignmentModel` จะเปลี่ยนเป็น **`VERIFIED`**

---

## 🗑️ 4. ระบบอนุมัติการทำลายเอกสาร (Destruction Approval & State Sync)
**Endpoint**: `PATCH /admin/deletion-requests/{request_id}/approve`
**สถานะ**: พร้อมใช้งาน (NEW)

### 🔹 โครงสร้างคำขอ (Request Payload)
```json
{
  "status": "APPROVED",
  "rejection_reason": "เหตุผลประกอบ (กรณีไม่อนุมัติ)"
}
```

### 🔹 ตรรกะการ Sync ข้อมูลอัตโนมัติ
เมื่อสถานะคำขอได้รับการอนุมัติ (`APPROVED`):
1.  **Request Status**: เปลี่ยนเป็น `APPROVED`
2.  **Document Status Sync**: ระบบจะไปค้นหาเอกสารต้นทางและเปลี่ยน `deletion_status` เป็น **`DELETED`** ให้อัตโนมัติทันที เพื่อให้ข้อมูลสอดคล้องกันทั่วทั้งระบบ

---

## 🛠️ ข้อควรระวังด้านเทคนิค (Technical Implementation Notes)
1.  **SQL Extract**: ระบบเปลี่ยนมาใช้ `extract('year', ...)` แทน `date_part` เพื่อความสากลของฐานข้อมูล
2.  **Error 404/403**:
    *   **404**: หากไม่พบ ID รากของข้อมูล (เช่น Assignment ID หรือ Request ID)
    *   **403**: หากผู้ใช้ที่พยายามกด Verify/Approve ไม่มีสิทธิ์ตามบทบาท (RBAC)
3.  **Search Input**: แนะนำให้ Frontend ทำ Debounce สำหรับช่อง Search อย่างน้อย 300ms ก่อนส่ง Request

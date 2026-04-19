# 📑 Unified Master API Specification (Latest Update: 2026-04-19)

เอกสารฉบับนี้ระบุข้อกำหนดทางเทคนิค (Technical Specifications) และโครงสร้างข้อมูล (Data Contracts) สำหรับการสื่อสารระหว่าง Backend และ Frontend โดยรวบรวมการปรับปรุงระบบทั้งหมดเพื่อให้การทำงานสอดคล้องกันอย่างสมบูรณ์

---

## 1. 📂 ระบบตารางรายการเอกสาร (Admin Document Management)
**Endpoint**: `GET /admin/documents`

ใช้สำหรับแสดงข้อมูลกิจกรรมการประมวลผล (RoPa) ทั้งหมดในมุมมองของผู้ดูแลระบบ

### 🔹 ตัวแปรสำหรับการสืบค้น (Query Parameters)
*   **`search`** (String): ค้นหาจากชื่อกิจกรรม (Title) หรือรหัสเอกสาร (Document Number)
*   **`status`** (Enum): กรองตามสถานะ (`DRAFT`, `IN_PROGRESS`, `UNDER_REVIEW`, `COMPLETED`)
*   **`page`** (Integer): ลำดับหน้าข้อมูล (Default: 1)
*   **`limit`** (Integer): จำนวนรายการต่อหน้า (Default: 10, สูงสุด: 100)

### 🔹 โครงสร้างข้อมูลที่ตอบกลับ (Response Payload)
| Field Key | Type | Description |
| :--- | :--- | :--- |
| `total` | Integer | จำนวนรายการทั้งหมดที่พบ |
| `items[].id` | UUID | รหัสเอกสารอ้างอิงภายใน |
| `items[].document_number`| String | รหัสทางราชการ (เช่น RP-2024-001) |
| `items[].title` | String | ชื่อกิจกรรมการประมวลผล |
| `items[].owner_name` | String | ชื่อ-นามสกุล ของผู้รับผิดชอบ (Data Owner) |
| `items[].department` | String | แผนก/หน่วยงาน สังกัดของผู้รับผิดชอบ |
| `items[].dpo_name` | String | ชื่อเจ้าหน้าที่ DPO ที่รับผิดชอบล่าสุด |
| `items[].updated_at` | DateTime | วันเวลาที่มีการอัปเดตล่าสุด |
| `items[].status` | Enum | สถานะปัจจุบันของเอกสาร |

---

## 📊 2. ระบบแดชบอร์ดรายบุคคล (Per-User Dashboard Support)
**Endpoint**: `GET /admin/users/{id}/dashboard`

### 🔹 โครงสร้างข้อมูล (Response Payload)
ระบบได้คืนค่าข้อมูลผู้ใช้ที่ถูกสืบค้นในระดับบนสุด (Top-level) เพื่อความสะดวกในการแสดงผลหัวข้อหน้าจอ
```json
{
  "user": {
    "id": 3,
    "email": "pravarit@mail.com",
    "first_name": "ประวริศ",
    "last_name": "เป้งเซ่ง",
    "role": "OWNER",
    "status": "ACTIVE"
  },
  "role_dashboard": {
    /* ข้อมูลสถิติผันแปรตามบทบาทของผู้ใช้ (Role-Specific) */
  },
  "statistics": {
    /* สถิติสรุปกิจกรรมการใช้งานของผู้ใช้ */
  }
}
```

---

## 🤝 3. ระบบมอบหมายงานผู้ตรวจสอบ (Auditor Assignment Logic)
**Endpoint**: `POST /documents/{document_id}/assign-auditor`

**พฤติกรรมหลัก**: เปลี่ยนจากการใช้รหัส ID เป็นการระบุด้วย **คำนำหน้า-ชื่อ-นามสกุล** โดยระบบจะทำการค้นหาผู้ใช้ที่ลงทะเบียนไว้ในฐานข้อมูลโดยอัตโนมัติ

### 🔹 โครงสร้างคำขอ (Request Payload)
| Field Key | Type | Description |
| :--- | :--- | :--- |
| `title` | String | คำนำหน้าชื่อ (เช่น นาย, นางสาว, ดร.) |
| `first_name` | String | ชื่อจริง (ต้องตรงกับฐานข้อมูล) |
| `last_name` | String | นามสกุล (ต้องตรงกับฐานข้อมูล) |
| `auditor_type` | Enum | ประเภทผู้ตรวจสอบ (`INTERNAL` หรือ `EXTERNAL`) |
| `department` | String | แผนกหรือหน่วยงานของผู้ตรวจสอบ |
| `due_date` | DateTime | วันที่กำหนดส่งงานการตรวจสอบ |

> [!CAUTION]
> **Error Scenario**: หากระบบค้นหาชื่อผู้ใช้ไม่พบ จะส่งคืนค่า **`404 Not Found`** พร้อมข้อความแจ้งเตือน "ไม่พบผู้ตรวจสอบรายนี้ในระบบ"

---

## 🧐 4. ตรรกะการตรวจประเมินของ DPO (Review Cycle Management)
**Endpoint**: `POST /dashboard/dpo/documents/{document_id}/comments`

**พฤติกรรมหลัก**: แยกการบันทึกสำหรับการทำงานต่อเนื่อง (Next) และการยืนยันผล (Confirm)

### 🔹 ตัวแปรควบคุม (`is_final`)
*   **`is_final: false`**: สำหรับการ "บันทึกร่าง" (Draft) เมื่อกดปุ่มถัดไปใน UI สถานะของเอกสารจะ**ไม่เปลี่ยนแปลง**
*   **`is_final: true`**: สำหรับ "ยืนยันผลการตรวจสอบ" ระบบจะทำการตัดสินสถานะทันที

### 🔹 กระบวนการเมื่อเสร็จสิ้น (Approval Process)
เมื่อส่งค่า `is_final: true` และตรวจสอบแล้วว่า**ไม่มีคอมเมนต์ตกค้าง**:
1.  **Status Change**: สถานะเอกสารจะเปลี่ยนเป็น **`COMPLETED`** ทันที
2.  **ID Transformation**: รหัสเอกสารจะถูกเปลี่ยนคำนำหน้าจาก **`DFT-` เป็น `RP-`** (เช่น DFT-2024-01 -> RP-2024-01)
3.  **Scheduling**: ระบบจะคำนวณ `last_approved_at` และ `next_review_due_at` (1 ปี หรือตามที่ระบุ) โดยอัตโนมัติ

---

## 📋 คำแนะนำสำหรับทีม Frontend (Implementation Notes)
1.  **DPO Table Logic**: เมื่อ DPO คลิกบันทึกในแต่ละขั้นตอน ให้ส่งค่า `is_final: false` เสมอ และส่ง `is_final: true` เฉพาะในปุ่ม "ยืนยันการตรวจสอบ" สุดท้ายเท่านั้น
2.  **Error Handling**: ทุก Endpoint มีการตรวจสอบสิทธิ์การเข้าถึง (RBAC) หากรหัสตอบกลับเป็น `403` แสดงว่าผู้ใช้คนนั้นไม่มีสิทธิ์ในเอกสารใบดังกล่าว

# 📋 Data Processor — Frontend Integration Guide

**สำหรับ**: Frontend Developer  
**วันที่อัพเดท**: 6 เมษายน 2569  
**API Prefix**: `/processor`  
**Authentication**: Data processor role required

---

## 📌 สารบัญ

1. [🎯 ภาพรวมระบบ](#ภาพรวมระบบ)
2. [🔌 API Endpoints ทั้งหมด](#api-endpoints-ทั้งหมด)
3. [🎨 UI Structure & Flow](#ui-structure--flow)
4. [📊 Data Models](#data-models)
5. [⚡ Backend Logic & Rules](#backend-logic--rules)
6. [🔗 Integration Checklist](#integration-checklist)

---

## 🎯 ภาพรวมระบบ

### ส่วนประกอบ Frontend สำหรับ Data Processor

```
┌─────────────────────────────────────────────────────────────┐
│                    Data Processor Portal                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Sidebar 1: รายการ RoPA          Sidebar 2: เอกสาร       │
│  ──────────────────────          ──────────────────       │
│  📊 สถิติ 4 ใบ                    📊 สถิติ 2 ใบ           │
│  ├─ งานทั้งหมด                    ├─ เอกสารทั้งหมด       │
│  ├─ รอดำเนินการ                   └─ เอกสารสมบูรณ์       │
│  ├─ แก้ไขตาม FEEDBACK                                     │
│  └─ ส่งงานแล้ว                   📋 ตารางรายการ          │
│                                  ├─ รายการที่ดำเนินการ   │
│  📝 ตาราง                        └─ ฉบับร่าง             │
│  ├─ เลือก filter & sort          ┌─ ปุ่ม "แก้ไข"         │
│  ├─ cell: รหัส/ชื่อ/ผู้มอบหมาย        └─ ปุ่ม "ลบ"        │
│  ├─ วันที่/สถานะ/ดำเนินการ                               │
│  │                                  Sidebar 3: feedback    │
│  └─ ปุ่ม "แก้ไข" → เปิดฟอร์ม        ──────────────────   │
│                                     📋 ตาราง feedback      │
│  🔴 ปุ่ม "เลือกรายการ"              ├─ filter by time      │
│  └─ Modal → select confirmed        ├─ แถวต่อแถว          │
│     items → "ส่ง"                   └─ ปุ่ม "ดูรายละเอียด" │
│                                        → detail page       │
└─────────────────────────────────────────────────────────────┘
```

### Frontend ต้องสร้าง:
1. **Sidebar 1** — รายการ RoPA ที่ได้รับมอบหมาย
2. **Sidebar 2** — เอกสารตรวจของ Auditor + ฉบับร่าง
3. **Sidebar 3** — ข้อเสนอแนะจาก Auditor
4. **ฟอร์ม 6 ส่วน** — กรอกข้อมูล RoPA (ใช้ร่วมกันทั้ง 3 sidebar)
5. **Modal** — เลือกรายการส่ง (ready-to-send)

---

## 🔌 API Endpoints ทั้งหมด

### 📌 Sidebar 1: รายการ RoPA

#### 1. `GET /processor/assignments` — ดึงรายการ RoPA
```http
GET /processor/assignments?page=1&page_size=10&status=&date_from=&date_to=
```

**Query Parameters:**
| Parameter | Type | Default | หมายเหตุ |
|-----------|------|---------|---------|
| `page` | int | 1 | หน้าที่ต้องการ |
| `page_size` | int | 10 | จำนวนแถวต่อหน้า (max 100) |
| `status` | string | null | กรอง: "รอดำเนินการ", "แก้ไขตาม FEEDBACK", "ส่งงานแล้ว" |
| `date_from` | datetime | null | กรองจากวันที่นี้เป็นต้นไป |
| `date_to` | datetime | null | กรองถึงวันที่นี้ |

**Response (200):**
```json
{
  "stats": {
    "total": 12,           // งานทั้งหมด
    "in_progress": 5,      // รอดำเนินการ
    "needs_revision": 3,   // แก้ไขตาม FEEDBACK
    "submitted": 4         // ส่งงานแล้ว
  },
  "records": [
    {
      "id": "uuid",
      "doc_code": "RP-2026-1000",
      "title": "ข้อมูลลูกค้าและประวัติการสั่งซื้อ",
      "assigned_by": "สมชาย วิทยาศาสตร์",
      "received_at": "2026-03-15T08:30:00Z",
      "processor_status": "pending",
      "status_display": "กำลังดำเนินการ",
      "can_edit": true
    },
    ...
  ],
  "total": 12,
  "page": 1,
  "page_size": 10
}
```

**Frontend ใช้:**
- แสดง **stats** ใน 4 กล่องสถิติด้านบน
- วน loop แสดง **records** ในตาราง
- ปุ่ม "แก้ไข" → call endpoint #2

---

#### 2. `GET /processor/assignments/{record_id}` — ดึงฟอร์มเพื่อแก้ไข
```http
GET /processor/assignments/uuid-here
```

**Response (200):**
```json
{
  // ── metadata ──
  "id": "uuid",
  "doc_code": "RP-2026-1000",
  "title": "ข้อมูลลูกค้าและประวัติการสั่งซื้อ",
  "processor_status": "in_progress",
  "draft_code": "DFT-5525",
  "assigned_by": "สมชาย วิทยาศาสตร์",
  "received_at": "2026-03-15T08:30:00Z",
  "confirmed_at": null,           // null = ยังไม่ยืนยัน
  "sent_to_owner_at": null,
  "updated_at": "2026-04-06T10:20:00Z",
  "audit_status": "needs_revision",     // null = ยังไม่ตรวจ
  "audit_status_display": "ต้องแก้ไข",
  "is_read_only": false,  // ← Frontend ใช้ตัดสินใจ disable input
  
  // ── Section 1 ──
  "title_prefix": "นาย",
  "first_name": "สมชาย",
  "last_name": "วิทยาศาสตร์",
  "address": "123 ถนนสุขุมวิท...",
  "email": "somchai@company.com",
  "phone": "08-1234-5678",
  
  // ── Section 2 ──
  "processor_name": "บริษัท ABC Co.,Ltd",
  "data_controller_address": "456 ถนนเพชรบุรี...",
  "processing_activity": "จัดเก็บข้อมูลลูกค้า",
  "purpose": "เพื่อการจัดการบัญชี...",
  
  // ── Section 3 ──
  "personal_data": ["ชื่อ-นามสกุล", "เบอร์โทร"],  // ← array
  "data_category": ["ลูกค้า", "พนักงาน"],          // ← array
  "data_type": "general",
  
  // ── Section 4 ──
  "collection_method": "electronic",
  "data_source": "from_owner",
  "retention_storage_type": ["electronic", "document"],  // ← array
  "retention_method": ["database", "cloud"],             // ← array
  "retention_duration": "5",
  "retention_duration_unit": "year",
  "retention_access_condition": "เข้าถึงได้โดยเจ้าหน้าที่...",
  "retention_deletion_method": "ลบจากระบบ...",
  
  // ── Section 5 ──
  "legal_basis": "ฐานปฏิบัติตามสัญญา",
  "transfer_is_transfer": true,
  "transfer_country": "สิงคโปร์",
  "transfer_is_in_group": false,
  "transfer_company_name": null,
  "transfer_method": "โอนทางอิเล็กทรอนิกส์",
  "transfer_protection_std": "Standard Contractual Clauses",
  "transfer_exception": "ไม่มี",
  
  // ── Section 6 ──
  "security_organizational": "มี Policy ป้องกัน...",
  "security_access_control": "ตรวจสอบการเข้าถึง...",
  "security_technical": "เข้ารหัส TLS...",
  "security_responsibility": "กำหนดหน้าที่...",
  "security_physical": "ล็อค...",
  "security_audit": "ตรวจสอบ..."
}
```

**Frontend ใช้:**
- แสดง metadata ด้านบนฟอร์ม
- Fill ข้อมูลลงฟอร์ม 6 ส่วน
- **`is_read_only` = true?** → disable all input + ซ่อนปุ่มส่ง
- แสดง `audit_status_display` ถ้ามี

---

#### 3. `PUT /processor/assignments/{record_id}/save-draft` — บันทึกฉบับร่าง
```http
PUT /processor/assignments/uuid-here/save-draft
Content-Type: application/json

{
  // ส่งเฉพาะ field ที่เปลี่ยนแปลง อาจไม่ครบก็ได้
  "first_name": "สมชาย",
  "last_name": "วิทยาศาสตร์",
  "personal_data": ["ชื่อ-นามสกุล", "เบอร์โทร"],
  "data_type": "general",
  // ... อื่นๆ
}
```

**Response (200):**
```json
{
  "message": "บันทึกฉบับร่างเรียบร้อย",
  "draft_code": "DFT-5525",  // ← แสดงให้ผู้ใช้เห็น
  "record_id": "uuid"
}
```

**Frontend ควร:**
- เรียกเมื่อกด "บันทึก" หรือ auto-save ทุก 30 วินาที
- เก็บ `draft_code` แสดงให้ผู้ใช้เห็น
- อนุญาตให้ส่ง partial data (ไม่ต้องกรอกครบ)

---

#### 4. `PUT /processor/assignments/{record_id}/confirm` — ยืนยันข้อมูล RoPA
```http
PUT /processor/assignments/uuid-here/confirm
Content-Type: application/json

{
  // ต้องส่งข้อมูลครบทั้ง 6 ส่วน
  "title_prefix": "นาย",
  "first_name": "สมชาย",
  "last_name": "วิทยาศาสตร์",
  // ... ทั้งหมด required fields
}
```

**Response (200):**
```json
{
  "message": "ยืนยันข้อมูล RoPA เรียบร้อย",
  "record_id": "uuid"
}
```

**Response (422) — ถ้าขาด field:**
```json
{
  "detail": {
    "message": "กรุณากรอกข้อมูลให้ครบถ้วน",
    "missing_fields": ["first_name", "email", "transfer_country"]
  }
}
```

**Frontend ควร:**
- เรียกเมื่อกด "ยืนยันข้อมูล" หรือ "พร้อมส่ง"
- แสดง toast error ถ้ามี `missing_fields` + highlight fields ที่ขาด
- บันทึก `is_read_only: false` ก่อน confirm ถ้าไม่อย่างนั้นจะ disable ฟอร์มแล้วติดค้าง

---

#### 5. `GET /processor/ready-to-send` — เลือกรายการส่ง (Modal)
```http
GET /processor/ready-to-send?page=1&page_size=10
```

**Response (200):**
```json
{
  "records": [
    {
      "id": "uuid",
      "doc_code": "RP-2026-1000",
      "title": "ข้อมูลลูกค้า",
      "created_at": "2026-03-15T08:30:00Z"
    }
  ],
  "total": 2,
  "page": 1,
  "page_size": 10
}
```

**Frontend ใช้:**
- Modal เปิดเมื่อกด "เลือกรายการ" (ปุ่มสีแดง) ใน sidebar 1
- แสดงตารางรายการที่พร้อมส่ง (CONFIRMED status)
- ปุ่ม "เลือก" → เรียก endpoint #6

---

#### 6. `POST /processor/send-to-owner/{record_id}` — ส่ง RoPA
```http
POST /processor/send-to-owner/uuid-here
```

**Response (200):**
```json
{
  "message": "ส่ง RoPA ให้ผู้รับผิดชอบข้อมูลเรียบร้อย",
  "record_id": "uuid"
}
```

**Frontend ควร:**
- ปิด modal
- refresh sidebars ทั้งหมด หรือ re-fetch assignments

---

### 📌 Sidebar 2: เอกสาร

#### 7. `GET /processor/documents` — ดึงเอกสาร
```http
GET /processor/documents?active_page=1&drafts_page=1&page_size=10&status=&time_range=30_days
```

**Query Parameters:**
| Parameter | Type | ตัวเลือก |
|-----------|------|---------|
| `active_page` | int | 1, 2, 3... |
| `drafts_page` | int | 1, 2, 3... |
| `page_size` | int | 1-100 |
| `status` | string | "อนุมัติ", "รอตรวจสอบ", "ต้องแก้ไข" |
| `time_range` | string | "7_days", "30_days", "90_days", "all" |

**Response (200):**
```json
{
  "stats": {
    "total": 96,      // เอกสารในกระบวนการตรวจ
    "complete": 84    // เอกสารที่อนุมัติแล้ว
  },
  
  // ตาราง "รายการที่ดำเนินการ"
  "active_records": [
    {
      "id": "uuid",
      "doc_code": "RP-2026-1000",
      "title": "ข้อมูลลูกค้า",
      "sent_at": "2026-03-20T10:00:00Z",
      "audit_status": "approved",
      "audit_status_display": "อนุมัติ",
      "can_edit": false  // false = read-only, hide edit button
    }
  ],
  "active_total": 10,
  "active_page": 1,
  
  // ตาราง "ฉบับร่าง"
  "drafts": [
    {
      "id": "uuid",
      "draft_code": "DFT-5525",
      "title": "ข้อมูลพนักงาน",
      "updated_at": "2026-04-05T15:30:00Z"
    }
  ],
  "drafts_total": 3,
  "drafts_page": 1,
  "page_size": 10
}
```

**Frontend ใช้:**
- แสดง **stats** ด้านบน (2 กล่อง)
- ตาราง 1: "รายการที่ดำเนินการ" → ปุ่ม "ดูเอกสาร" → call endpoint #2
- ตาราง 2: "ฉบับร่าง" → ปุ่ม "✏ แก้ไข" → call endpoint #2, ปุ่ม "🗑 ลบ" → call endpoint #8

---

#### 8. `DELETE /processor/drafts/{record_id}` — ลบฉบับร่าง
```http
DELETE /processor/drafts/uuid-here
```

**Response (204):**
```
// ไม่มี body
```

**Frontend ควร:**
- แสดง confirm dialog ก่อนลบ
- refresh sidebar 2 หลังลบสำเร็จ

---

### 📌 Sidebar 3: ข้อเสนอแนะ

#### 9. `GET /processor/feedback` — ดึงรายการ feedback
```http
GET /processor/feedback?page=1&page_size=10&time_range=30_days&date_from=
```

**Query Parameters:**
| Parameter | Type |
|-----------|------|
| `page` | int |
| `page_size` | int |
| `time_range` | string: "7_days", "30_days", "90_days", "all" |
| `date_from` | datetime |

**Response (200):**
```json
{
  "feedbacks": [
    {
      "audit_id": "uuid",
      "doc_code": "RP-2026-1001",
      "title": "ข้อมูลสัญญา",
      "sent_at": "2026-04-03T09:15:00Z",
      "received_at": "2026-04-03T09:15:00Z"
    }
  ],
  "total": 5,
  "page": 1,
  "page_size": 10
}
```

**Frontend ใช้:**
- แสดง feedbacks ในตาราง
- ปุ่ม "ดูข้อเสนอแนะ" → call endpoint #10

---

#### 10. `GET /processor/feedback/{audit_id}` — ดูรายละเอียด feedback
```http
GET /processor/feedback/uuid-here
```

**Response (200):**
```json
{
  "audit_id": "uuid",
  "doc_code": "RP-2026-1001",
  "title": "ข้อมูลสัญญา",
  "last_modified": "2026-04-03T09:15:00Z",
  "auditor_name": "วิริยา พรหมรักษ์",
  "processor_record_id": "uuid-processor-record",  // ← ใช้ไป edit
  "section_feedbacks": [
    {
      "section": "section_5",
      "section_label": "ส่วนที่ 5 : ฐานทางกฎหมายและการส่งต่อ",
      "comment": "กรุณายืนยันว่า SCCs ถูกต้อง..."
    },
    {
      "section": "section_6",
      "section_label": "ส่วนที่ 6 : มาตรการรักษาความมั่นคง...",
      "comment": "ระบุ encoding algorithm..."
    }
  ]
}
```

**Frontend ใช้:**
- แสดง metadata ด้านบน
- Loop `section_feedbacks` แสดง comment แยกตามส่วน
- ปุ่ม "แก้ไขเอกสาร" → redirect ไปเปิดฟอร์ม
  ```javascript
  // เมื่อกดปุ่ม "แก้ไขเอกสาร"
  window.location.href = `/processor/assignments/${response.processor_record_id}`;
  ```

---

## 🎨 UI Structure & Flow

### Sidebar 1 Flow
```
[Sidebar 1]
    ↓ GET /processor/assignments
    ├─ แสดง stats 4 ใบ
    ├─ แสดงตาราง
    │  └─ ปุ่ม "แก้ไข" → [ฟอร์ม]
    │
    └─ 🔴 ปุ่ม "เลือกรายการ" → [Modal]
       ↓ GET /processor/ready-to-send
       ├─ แสดงตาราง CONFIRMED items
       │  └─ ปุ่ม "เลือก" → GET /processor/assignments/{id}
       │     ↓ (ฟอร์มเปิดขึ้นมา)
       │     └─ ปุ่ม "ส่ง" → POST /processor/send-to-owner/{id}
       │
       └─ (ปิด modal, refresh sidebar 1)
```

### Sidebar 2 Flow
```
[Sidebar 2]
    ↓ GET /processor/documents
    ├─ แสดง stats 2 ใบ
    │
    ├─ ตาราง "รายการที่ดำเนินการ"
    │  └─ ปุ่ม "ดูเอกสาร" → GET /processor/assignments/{id}
    │     └─ (ฟอร์มเปิดขึ้นมา is_read_only = true/false)
    │
    └─ ตาราง "ฉบับร่าง"
       ├─ ปุ่ม "✏ แก้ไข" → GET /processor/assignments/{id}
       │  └─ (ฟอร์มเปิดขึ้นมา)
       │
       └─ ปุ่ม "🗑 ลบ" → DELETE /processor/drafts/{id}
          └─ (refresh sidebar 2, record ลบไปแล้ว)
```

### Sidebar 3 Flow
```
[Sidebar 3]
    ↓ GET /processor/feedback
    ├─ Filter by time_range
    │
    ├─ แสดงตาราง feedback
    │  └─ ปุ่ม "ดูข้อเสนอแนะ" → GET /processor/feedback/{audit_id}
    │     ↓ (เปิด detail page)
    │     ├─ แสดง metadata
    │     ├─ แสดง auditor_name
    │     ├─ Loop section_feedbacks → แสดง comment
    │     │
    │     └─ ปุ่ม "แก้ไขเอกสาร"
    │        → redirect ไป /processor/assignments/{processor_record_id}
    │           └─ (เรียก endpoint #2 แสดงฟอร์ม is_read_only = false)
```

---

## 📊 Data Models

### ProcessorFormData (ส่งไป Backend)
```json
{
  // Section 1 — รายละเอียดผู้บันทึก
  "title_prefix": "นาย",      // optional
  "first_name": "สมชาย",       // *required
  "last_name": "วิทยา",       // *required
  "address": "...",           // *required
  "email": "...",             // *required
  "phone": "...",             // *required
  
  // Section 2 — รายละเอียดกิจกรรม
  "processor_name": "...",    // *required
  "data_controller_address": "...",  // *required
  "processing_activity": "...",      // *required
  "purpose": "...",                  // *required
  
  // Section 3 — ข้อมูล
  "personal_data": ["ชื่อ-นามสกุล", "เบอร์โทร"],  // *required, array
  "data_category": ["ลูกค้า"],      // *required, array
  "data_type": "general",                // *required
  
  // Section 4 — การเก็บ
  "collection_method": "electronic",    // *required
  "data_source": "from_owner",         // *required
  "retention_storage_type": ["electronic"],     // *required, array
  "retention_method": ["database"],             // *required, array
  "retention_duration": "5",                    // *required
  "retention_duration_unit": "year",            // *required
  "retention_access_condition": "...",          // *required
  "retention_deletion_method": "...",           // *required
  
  // Section 5 — ฐานทางกฎหมาย
  "legal_basis": "...",                 // *required
  "transfer_is_transfer": true,         // *required (conditional)
  "transfer_country": "...",            // required ถ้า transfer_is_transfer=true
  "transfer_is_in_group": false,
  "transfer_company_name": null,
  "transfer_method": "...",             // required ถ้า transfer_is_transfer=true
  "transfer_protection_std": "...",     // required ถ้า transfer_is_transfer=true
  "transfer_exception": "...",          // required ถ้า transfer_is_transfer=true
  
  // Section 6 — มาตรการรักษาความปลอดภัย
  "security_organizational": "...",
  "security_access_control": "...",
  "security_technical": "...",
  "security_responsibility": "...",
  "security_physical": "...",
  "security_audit": "..."
}
```

### Response from GET /processor/assignments/{id}
```json
{
  // fields เดียวกับ ProcessorFormData ข้างบน + metadata ด้านบน

  // ── Metadata ──
  "id": "uuid",
  "doc_code": "RP-2026-1000",
  "title": "ชื่อเอกสาร",
  "processor_status": "in_progress",
  "draft_code": "DFT-5525",
  "assigned_by": "ชื่อ Data Owner",
  "received_at": "2026-03-15T08:30:00Z",
  "confirmed_at": null,
  "sent_to_owner_at": null,
  "updated_at": "2026-04-06T10:20:00Z",
  "audit_status": null,
  "audit_status_display": "รอตรวจสอบ",
  "is_read_only": false
}
```

---

## ⚡ Backend Logic & Rules

### Status Transitions

```
ProcessorRecord.processor_status:
  PENDING (initial)
    ├─ save-draft → IN_PROGRESS
    └─ (ยังไม่เปิดฟอร์ม)
  
  IN_PROGRESS (กำลังแก้ไข)
    ├─ save-draft → IN_PROGRESS (ยังคงอยู่)
    ├─ confirm → CONFIRMED (ยืนยันครบแล้ว)
    └─ delete-draft → PENDING (ล้างข้อมูล)
  
  CONFIRMED (กรอกครบแล้ว)
    ├─ send-to-owner → SUBMITTED (ส่งแล้ว)
    └─ (ไม่สามารถแก้ไขได้อีก)
  
  SUBMITTED (ส่งแล้ว)
    └─ (อ่านอย่างเดียว จนกว่า Auditor ส่งกลับ)
  
  NEEDS_REVISION (Auditor ส่งกลับมาแก้)
    ├─ save-draft → IN_PROGRESS (ไป confirm ใหม่)
    └─ confirm → CONFIRMED
```

### is_read_only Logic
```
is_read_only = false ถ้า:
  ❌ processor_status = SUBMITTED → read-only
  ❌ audit_status = PENDING_REVIEW → read-only
  ❌ audit_status = APPROVED → read-only
  ✅ audit_status = NEEDS_REVISION → สามารถแก้ได้
  ✅ ยังไม่มี audit + processor_status ไม่ใช่ SUBMITTED → สามารถแก้ได้
```

### field Arrays (JSON)
```
Frontend ส่ง: ["item1", "item2"]  (array)
Backend เก็บ: '["item1", "item2"]'  (JSON string ใน TEXT column)
```

**Fields ที่เป็น array:**
- `personal_data`
- `data_category`
- `retention_storage_type`
- `retention_method`

### Conditional Required (transfer_is_transfer)
```
ถ้า transfer_is_transfer = true → ต้องกรอก:
  - transfer_country
  - transfer_method
  - transfer_protection_std
  - transfer_exception

ถ้า transfer_is_transfer = false → optional
```

---

## 🔗 Integration Checklist

### ✅ Auth & Setup
- [ ] Backend returns role เป็น "Data processor"
- [ ] Frontend check role ก่อนเข้า /processor portal
- [ ] API calls ส่ง JWT token ใน header `Authorization: Bearer <token>`

### ✅ Sidebar 1 — รายการ RoPA
- [ ] Display stats (4 boxes) from `GET /processor/assignments`
- [ ] Display table with pagination
- [ ] Filter by status (dropdown)
- [ ] Filter by date range (datepicker)
- [ ] ปุ่ม "แก้ไข" → call `GET /processor/assignments/{id}` → open form
- [ ] ปุ่ม "เลือกรายการ" (สีแดง) → open modal
- [ ] Modal: call `GET /processor/ready-to-send`
- [ ] Modal: ปุ่ม "เลือก" → form opens with can_edit logic
- [ ] Modal: ปุ่ม "ส่ง" → call `POST /processor/send-to-owner/{id}`

### ✅ Sidebar 2 — เอกสาร
- [ ] Display stats (2 boxes) from `GET /processor/documents`
- [ ] Display "รายการที่ดำเนินการ" table
- [ ] Display "ฉบับร่าง" table (separate pagination)
- [ ] Filter by status, time_range
- [ ] ปุ่ม "ดูเอกสาร" (รายการที่ดำเนินการ) → form opens
- [ ] ปุ่ม "✏ แก้ไข" (ฉบับร่าง) → form opens
- [ ] ปุ่ม "🗑 ลบ" (ฉบับร่าง) → confirm dialog → call `DELETE /processor/drafts/{id}`

### ✅ Form (6 Sections)
- [ ] Build form with 6 sections layout
- [ ] Call `GET /processor/assignments/{id}` to populate fields
- [ ] Section 1: title_prefix, first_name, last_name, address, email, phone
- [ ] Section 2: processor_name, data_controller_address, processing_activity, purpose
- [ ] Section 3: personal_data (multi-select), data_category (checkboxes), data_type (radio)
- [ ] Section 4: collection_method (radio), data_source (radio), retention fields...
- [ ] Section 5: legal_basis, transfer fields (conditional)
- [ ] Section 6: security fields (textarea)
- [ ] Check `is_read_only` → disable all inputs if true
- [ ] ปุ่ม "บันทึก" (save-draft) → call `PUT /processor/assignments/{id}/save-draft`
  - [ ] แสดง draft_code ที่บันทึกสำเร็จ
  - [ ] อนุญาตให้ส่ง partial data
- [ ] ปุ่ม "ยืนยันข้อมูล" (confirm) → call `PUT /processor/assignments/{id}/confirm`
  - [ ] ตรวจ response ถ้า 422 → highlight missing_fields
  - [ ] ตรวจ `transfer_is_transfer` → เรียก validate conditionally

### ✅ Sidebar 3 — ข้อเสนอแนะ
- [ ] Call `GET /processor/feedback` display table
- [ ] Filter by time_range, date_from
- [ ] ปุ่ม "ดูข้อเสนอแนะ" → call `GET /processor/feedback/{audit_id}`
- [ ] Detail page: display auditor_name, section_feedbacks
- [ ] ปุ่ม "แก้ไขเอกสาร" → redirect to form using `processor_record_id`

### ✅ Error Handling
- [ ] Display error toast ถ้า API return 400, 403, 404
- [ ] Display validation errors จาก 422 response
- [ ] Disable ปุ่มขณะ loading
- [ ] Show loading spinner ระหว่าง API calls

### ✅ Real-time Updates
- [ ] Refresh sidebars หลังจาก submit success
- [ ] Update stats หลังจาก send-to-owner
- [ ] Remove deleted rows จาก table

---

## 📝 Tips for Frontend Dev

### 1. JSON Array Handling
```javascript
// Receive จาก Backend
const personal_data = ["ชื่อ-นามสกุล", "เบอร์โทร"];  // array

// Send ไป Backend (ส่งแบบ array เหมือนเดิม)
const payload = {
  personal_data: ["ชื่อ-นามสกุล", "เบอร์โทร"],
  data_category: ["ลูกค้า"],
  // ...
};
await fetch('/processor/assignments/UUID/save-draft', {
  method: 'PUT',
  body: JSON.stringify(payload)
});
```

### 2. Conditional Fields (transfer_is_transfer)
```javascript
// Frontend logic
const [transferIsTransfer, setTransferIsTransfer] = useState(false);

return (
  <>
    <Radio label="ส่งต่างประเทศ" checked={transferIsTransfer} onChange={...} />
    
    {transferIsTransfer && (
      <>
        <Input label="ประเทศปลายทาง" required={true} />
        <Input label="วิธีการโอน" required={true} />
        <Input label="มาตรฐานคุ้มครอง" required={true} />
        <Textarea label="ข้อยกเว้น" required={true} />
      </>
    )}
  </>
);
```

### 3. Pagination
```javascript
// Sidebar 1 (separate pagination)
const [page, setPage] = useState(1);
const response = await fetch(`/processor/assignments?page=${page}&page_size=10`);

// Sidebar 2 (TWO tables = two separate pageinations)
const [activePage, setActivePage] = useState(1);
const [draftsPage, setDraftsPage] = useState(1);
const response = await fetch(`/processor/documents?active_page=${activePage}&drafts_page=${draftsPage}`);
```

### 4. Draft Code Display
```javascript
// หลังจาก save-draft สำเร็จ
const response = await fetch(`/processor/assignments/${id}/save-draft`, { ... });
const data = await response.json();
alert(`บันทึกเป็นฉบับร่าง: ${data.draft_code}`);  // "DFT-5525"
```

### 5. Form Edit Permission
```javascript
// From API response
const { is_read_only, processor_status, audit_status } = data;

if (is_read_only) {
  // Disable all inputs + hide buttons
  document.querySelectorAll('input, textarea, select').forEach(el => {
    el.disabled = true;
  });
  document.querySelector('.save-button').style.display = 'none';
  document.querySelector('.confirm-button').style.display = 'none';
} else {
  // Enable editing
}
```

---

## 🎯 Mini Checklist: ขั้นตอนเริ่มต้น

1. **สร้าง 3 sidebar components** (sidebar 1, 2, 3)
2. **สร้าง Form component** (6 sections)
3. **สร้าง utilities:**
   - API client functions (GET, PUT, POST, DELETE)
   - Form validation
   - Error handling
   - Loading states
4. **เชื่อม endpoints** ตามลำดับ
5. **Test flow** ครบทั้ง 3 sidebar
6. **Deploy & QA**

---

**Document Version**: 1.0  
**Last Updated**: 6 เมษายน 2569  
**Status**: Ready for Frontend Development
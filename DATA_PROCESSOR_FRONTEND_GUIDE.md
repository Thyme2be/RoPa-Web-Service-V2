# Data Processor Frontend Guide

**Generated**: April 8, 2026
**Branch**: feat/backend-data-auditor
**Base URL**: `/processor` (ต้องแนบ Authorization header ทุก request)

---

## ภาพรวม Data Processor Portal

Data Processor Portal มี **3 Sidebar** หลัก:

| Sidebar | ชื่อ | หน้าที่ |
|---|---|---|
| 1 | รายการ RoPA | รายการงานที่ได้รับมอบหมาย + กรอกฟอร์ม |
| 2 | เอกสาร | ติดตามสถานะเอกสารที่ส่งให้ Auditor แล้ว |
| 3 | ข้อเสนอแนะ | ดู feedback จาก Auditor ที่ตีกลับ |

---

## Authentication & Role

```
Role ที่ต้องการ: "Data Processor"
Header: Authorization: Bearer <token>
```

---

## Workflow ภาพรวม

```
Data Owner มอบหมายงานให้ Data Processor
    ↓
[[ DATA PROCESSOR PORTAL เริ่มตรงนี้ ]]
    ↓
Sidebar 1 — กรอกฟอร์ม 6 ส่วน
  → บันทึกฉบับร่าง (save-draft) ได้ทุกเวลา
  → กด ยืนยัน (confirm) เมื่อกรอกครบ
  → เลือกรายการแล้วกด ส่งให้ Data Owner
    ↓
Data Owner รวบรวม (owner form + processor form) ส่งให้ Auditor
    ↓
Sidebar 2 — ติดตามสถานะว่า Auditor ตรวจถึงไหน
    ↓
ถ้า Auditor ตีกลับ processor form
    ↓
Sidebar 3 — ดู feedback แล้วกด "แก้ไขเอกสาร"
  → redirect กลับไป Sidebar 1 (ฟอร์มเดิม แก้ได้แล้ว)
```

---

## สถานะที่ใช้ในระบบ

### `processor_status` — สถานะการทำงานของ Data Processor (Sidebar 1)

| ค่าใน DB | แสดงบนหน้าจอ | badge | ความหมาย |
|---|---|---|---|
| `"pending"` | กำลังดำเนินการ | เทา | ได้รับมอบหมายแต่ยังไม่เริ่ม |
| `"in_progress"` | กำลังดำเนินการ | เทา | กำลังกรอก หรือ save draft ไว้แล้ว |
| `"confirmed"` | กำลังดำเนินการ | เทา | กรอกครบ ยืนยันแล้ว รอส่ง |
| `"submitted"` | ส่งงานแล้ว | น้ำเงิน | ส่งให้ Data Owner แล้ว |
| `"needs_revision"` | **รอแก้ไข** | **แดง** | **Auditor ตีกลับ** — มาจาก feedback |

> **หมายเหตุ:** `"pending"`, `"in_progress"`, `"confirmed"` แสดง badge เดียวกัน "กำลังดำเนินการ"

### `audit_status` — สถานะจาก Auditor (Sidebar 2)

| ค่าใน DB | แสดงบนหน้าจอ | badge | ความหมาย |
|---|---|---|---|
| `null` / `"pending_review"` | รอตรวจสอบ | เทา | ยังไม่มี Auditor ตรวจ |
| `"approved"` | อนุมัติ | เขียว | Auditor อนุมัติทั้ง 2 ฟอร์มแล้ว |
| `"needs_revision"` | **ต้องแก้ไข** | **แดง** | **Auditor ตีกลับ** — มี feedback ใน Sidebar 3 |

---

## Sidebar 1 — รายการ RoPA

### GET `/processor/assignments`

**Query Parameters:**

| param | ค่า | default |
|---|---|---|
| `status_filter` | `"in_progress"` / `"needs_revision"` / `"submitted"` | null (ทั้งหมด) |
| `date_from` | ISO datetime | null |
| `date_to` | ISO datetime | null |
| `page` | integer ≥ 1 | `1` |
| `page_size` | integer 1-100 | `10` |

**Response:**
```json
{
  "stats": {
    "total": 12,
    "in_progress": 5,
    "needs_revision": 3,
    "submitted": 4
  },
  "records": [
    {
      "id": "uuid-BBB",
      "doc_code": "RP-2026-1000",
      "title": "ข้อมูลลูกค้าและประวัติการสั่งซื้อ",
      "assigned_by": "สมชาย ใจดี",
      "received_at": "2026-03-28T09:15:00Z",
      "processor_status": "needs_revision",
      "status_display": "รอแก้ไข",
      "can_edit": true
    }
  ],
  "total": 12,
  "page": 1,
  "page_size": 10
}
```

**คำอธิบาย fields:**

| field | แสดงที่ | หมายเหตุ |
|---|---|---|
| `stats.total` | card "งานทั้งหมด" | นับทุก status รวมกัน |
| `stats.in_progress` | card "รอดำเนินการ" | PENDING + IN_PROGRESS + CONFIRMED |
| `stats.needs_revision` | card "แก้ไขตาม FEEDBACK" | มาจาก Auditor ตีกลับ |
| `stats.submitted` | card "ส่งงานแล้ว" | ส่งให้ Data Owner แล้ว |
| `id` | — | ใช้ส่งไป GET /assignments/{id} ตอนกดปุ่ม |
| `status_display` | badge ในตาราง | แสดงข้อความภาษาไทย |
| `can_edit` | ปุ่มดำเนินการ | `false` = ซ่อน/disable ปุ่มแก้ไข |

**ปุ่ม "เลือกรายการ" (Modal):**
- กดแล้วเปิด modal รายการที่ส่งได้ → เรียก `GET /processor/ready-to-send`
- เลือกรายการใน modal → store `record_id` ใน state (ไม่เปิดฟอร์ม)
- กดปุ่ม "ส่ง" → เรียก `POST /processor/send-to-owner/{record_id}`

---

### GET `/processor/ready-to-send`

เรียกเมื่อเปิด modal "เลือกรายการที่ต้องการส่ง"

**Query Parameters:** `page`, `page_size`

**Response:**
```json
{
  "records": [
    {
      "id": "uuid-BBB",
      "doc_code": "RP-2026-1000",
      "title": "ข้อมูลลูกค้า...",
      "created_at": "2026-03-01T00:00:00Z"
    }
  ],
  "total": 3,
  "page": 1,
  "page_size": 10
}
```

> แสดงเฉพาะ records ที่ `processor_status = "confirmed"` เท่านั้น

---

### GET `/processor/assignments/{record_id}`

เรียกเมื่อกดปุ่ม "แก้ไข" (Sidebar 1), "ดูเอกสาร" (Sidebar 2), หรือ "แก้ไขเอกสาร" (Sidebar 3)

**Path Parameter:** `record_id` = `ProcessorRecord.id`

**Response:**
```json
{
  "id": "uuid-BBB",
  "doc_code": "RP-2026-1000",
  "title": "ข้อมูลลูกค้า...",
  "processor_status": "in_progress",
  "draft_code": "DFT-5525",
  "assigned_by": "สมชาย ใจดี",
  "received_at": "2026-03-01T00:00:00Z",
  "confirmed_at": null,
  "sent_to_owner_at": null,
  "updated_at": "2026-03-28T10:00:00Z",
  "audit_status": null,
  "audit_status_display": "รอตรวจสอบ",
  "is_read_only": false,
  "title_prefix": "นาย",
  "first_name": "สมชาย",
  ...ฟอร์ม 6 ส่วนทั้งหมด...
}
```

**`is_read_only` — สำคัญมาก:**

| สถานการณ์ | `is_read_only` | ความหมาย |
|---|---|---|
| PENDING / IN_PROGRESS / CONFIRMED (ยังไม่มี audit) | `false` | แก้ไขได้ |
| SUBMITTED (รอ Data Owner ส่ง Auditor) | `true` | ดูได้อย่างเดียว |
| Auditor ตีกลับ (`audit_status = needs_revision`) | `false` | **แก้ไขได้อีกครั้ง** |
| Auditor รอตรวจ / อนุมัติ (`pending_review` / `approved`) | `true` | ดูได้อย่างเดียว |

> Frontend ใช้ `is_read_only` ตัดสินใจว่า disable input ทั้งหมดหรือไม่ — **ไม่ต้องคำนวณเอง**

---

### PUT `/processor/assignments/{record_id}/save-draft`

บันทึกฉบับร่าง — กดได้ทุกเวลา ไม่ต้องกรอกครบ

**Request Body:** (ส่งเฉพาะ field ที่กรอก)
```json
{
  "first_name": "สมชาย",
  "last_name": "ใจดี",
  "processor_name": "บริษัท ABC"
}
```

**Response:**
```json
{
  "message": "บันทึกฉบับร่างเรียบร้อย",
  "record_id": "uuid-BBB",
  "draft_code": "DFT-5525"
}
```

> - สร้าง `draft_code` อัตโนมัติครั้งแรกที่กด save
> - อัปเดตเฉพาะ field ที่ส่งมา (ไม่ลบข้อมูลเดิม)
> - `processor_status`: PENDING / NEEDS_REVISION → IN_PROGRESS

---

### PUT `/processor/assignments/{record_id}/confirm`

ยืนยันข้อมูล — กดเมื่อกรอกครบทุก field required

**Request Body:** (ส่งข้อมูลฟอร์มทั้งหมด)
```json
{
  "first_name": "สมชาย",
  "last_name": "ใจดี",
  "address": "123 ถนนสุขุมวิท...",
  "email": "somchai@company.com",
  "phone": "0812345678",
  "processor_name": "บริษัท ABC จำกัด",
  "data_controller_address": "456 ถนน...",
  "processing_activity": "จัดเก็บข้อมูลลูกค้า",
  "purpose": "ใช้ในการให้บริการ",
  "personal_data": ["ชื่อ-นามสกุล", "เบอร์โทร"],
  "data_category": ["ลูกค้า"],
  "data_type": "general",
  "collection_method": "electronic",
  "data_source": "from_owner",
  "retention_storage_type": ["electronic"],
  "retention_method": ["server"],
  "retention_duration": "5",
  "retention_duration_unit": "year",
  "retention_access_condition": "เฉพาะผู้มีสิทธิ์",
  "retention_deletion_method": "ลบถาวรจากระบบ",
  "legal_basis": "สัญญา",
  "transfer_is_transfer": false,
  ...Section 6...
}
```

**Response:**
```json
{
  "message": "ยืนยันข้อมูล RoPA เรียบร้อย",
  "record_id": "uuid-BBB"
}
```

**Fields Required สำหรับ confirm:**

| Section | Required fields |
|---|---|
| 1 | `first_name`, `last_name`, `address`, `email`, `phone` |
| 2 | `processor_name`, `data_controller_address`, `processing_activity`, `purpose` |
| 3 | `personal_data`, `data_category`, `data_type` |
| 4 | `collection_method`, `data_source`, `retention_storage_type`, `retention_method`, `retention_duration`, `retention_duration_unit`, `retention_access_condition`, `retention_deletion_method` |
| 5 | `legal_basis` (+ transfer fields ถ้า `transfer_is_transfer=true`) |
| 6 | ไม่มี required (optional ทั้งหมด) |

> ถ้ากรอกไม่ครบ → 422 `{"missing_fields": ["first_name", "email", ...]}`

---

### POST `/processor/send-to-owner/{record_id}`

ส่งให้ Data Owner — เรียกหลังจากเลือกรายการใน modal แล้วกดปุ่ม "ส่ง"

**ไม่มี Request Body**

**Response:**
```json
{
  "message": "ส่งข้อมูลให้ Data Owner เรียบร้อย",
  "record_id": "uuid-BBB"
}
```

> - เฉพาะ `processor_status = "confirmed"` เท่านั้น
> - หลังส่ง: `processor_status = "submitted"`, `sent_to_owner_at = now`

---

## Sidebar 2 — เอกสาร

### GET `/processor/documents`

**Query Parameters:**

| param | ค่า | default |
|---|---|---|
| `time_range` | `"7_days"` / `"30_days"` / `"90_days"` / `"all"` | `"30_days"` |
| `date_from` | ISO datetime | null |
| `status_filter` | `"approved"` / `"needs_revision"` / `"pending_review"` | null |
| `active_page` | integer ≥ 1 | `1` |
| `drafts_page` | integer ≥ 1 | `1` |
| `page_size` | integer 1-100 | `10` |

**Response:**
```json
{
  "stats": {
    "total": 96,
    "complete": 84
  },
  "active_records": [
    {
      "id": "uuid-BBB",
      "doc_code": "RP-2026-0900",
      "title": "ข้อมูลการให้บริการ...",
      "sent_at": "2026-03-28T09:15:00Z",
      "audit_status": "needs_revision",
      "audit_status_display": "ต้องแก้ไข",
      "can_edit": true
    }
  ],
  "active_total": 24,
  "active_page": 1,
  "drafts": [
    {
      "id": "uuid-CCC",
      "draft_code": "DFT-5525",
      "title": "ข้อมูลธุรกิจคู่ค้า...",
      "updated_at": "2026-03-27T14:00:00Z"
    }
  ],
  "drafts_total": 3,
  "drafts_page": 1,
  "page_size": 10
}
```

**ตาราง "รายการที่ดำเนินการ" (`active_records`):**

แสดงเอกสารที่ส่งให้ Data Owner แล้ว และอยู่ในกระบวนการตรวจของ Auditor

| field | แสดงที่ | หมายเหตุ |
|---|---|---|
| `audit_status_display` | badge ในตาราง | "รอตรวจสอบ" / "อนุมัติ" / "ต้องแก้ไข" |
| `can_edit` | ปุ่ม "ดูเอกสาร" | `true` = แก้ไขได้ (Auditor ตีกลับ), `false` = read-only |
| `sent_at` | คอลัมน์ "วันที่ส่งข้อมูล" | วันที่ส่งให้ Data Owner |

**ตาราง "ฉบับร่าง" (`drafts`):**

แสดง records ที่เคยกด save draft ค้างไว้ (`processor_status = in_progress` + มี `draft_code`)

| ปุ่ม | เรียก endpoint |
|---|---|
| ✏ แก้ไข | `GET /processor/assignments/{id}` |
| 🗑 ลบ | `DELETE /processor/drafts/{id}` |

---

### DELETE `/processor/drafts/{record_id}`

ลบฉบับร่าง — เรียกเมื่อกดปุ่ม 🗑 ในตาราง "ฉบับร่าง"

**Response:** 204 No Content

> ไม่ได้ลบ record จริง — แค่ล้างข้อมูลทั้งหมดในฟอร์มและ reset status กลับเป็น PENDING

---

## Sidebar 3 — ข้อเสนอแนะ

### GET `/processor/feedback`

**Query Parameters:**

| param | ค่า | default |
|---|---|---|
| `page` | integer ≥ 1 | `1` |
| `page_size` | integer 1-100 | `10` |
| `time_range` | `"7_days"` / `"30_days"` / `"90_days"` / `"all"` | null |
| `date_from` | ISO datetime | null |

**Response:**
```json
{
  "feedbacks": [
    {
      "audit_id": "uuid-audit",
      "doc_code": "RP-2026-0900",
      "title": "ข้อมูลการให้บริการ...",
      "sent_at": "2026-03-30T14:30:00Z",
      "received_at": "2026-03-30T14:30:00Z"
    }
  ],
  "total": 3,
  "page": 1,
  "page_size": 10
}
```

> แสดงเฉพาะเอกสารที่ `audit_status = needs_revision` และมี `processor_feedback`

---

### GET `/processor/feedback/{audit_id}`

เรียกเมื่อกดปุ่ม "ดูข้อเสนอแนะ" ในตาราง

**Path Parameter:** `audit_id` = `AuditorAudit.id`

**Response:**
```json
{
  "audit_id": "uuid-audit",
  "doc_code": "ROPA-2026-0900",
  "title": "ข้อมูลการให้บริการ...",
  "last_modified": "2026-03-30T14:30:00Z",
  "auditor_name": "พรรษชล บุญมาก",
  "section_feedbacks": [
    {
      "section": "section_5",
      "section_label": "ส่วนที่ 5 : ฐานทางกฎหมายและการส่งต่อ",
      "comment": "กรุณายืนยันว่า Server สิงคโปร์มี SCCs รองรับ"
    },
    {
      "section": "section_6",
      "section_label": "ส่วนที่ 6 : มาตรการรักษาความมั่นคงปลอดภัย (TOMs)",
      "comment": "ระบุมาตรการ Encryption at Rest ให้ชัดเจนกว่านี้"
    }
  ],
  "processor_record_id": "uuid-BBB"
}
```

**คำอธิบาย fields:**

| field | แสดงที่ |
|---|---|
| `doc_code` | "รหัสเอกสาร : ROPA-2026-0900" |
| `last_modified` | "วันที่แก้ไขล่าสุด : 30/03/2026" |
| `auditor_name` | "ผู้ตรวจสอบ : พรรษชล บุญมาก" |
| `section_feedbacks` | กล่อง comment แยกตามส่วน |
| `processor_record_id` | ใช้กดปุ่ม "แก้ไขเอกสาร" |

**ปุ่ม "แก้ไขเอกสาร":**
```
กด "แก้ไขเอกสาร"
    ↓
GET /processor/assignments/{processor_record_id}
    ↓
is_read_only = false (เพราะ audit_status = needs_revision)
    ↓
แก้ไขฟอร์มได้ → save-draft → confirm → send-to-owner
```

---

## ฟอร์ม 6 ส่วน — โครงสร้าง field ทั้งหมด

### ส่วนที่ 1: รายละเอียดของผู้บันทึก RoPA

| field | ประเภท | required |
|---|---|---|
| `title_prefix` | string (นาย/นาง/นางสาว) | ไม่ |
| `first_name` | string | ✅ |
| `last_name` | string | ✅ |
| `address` | string | ✅ |
| `email` | string | ✅ |
| `phone` | string | ✅ |

### ส่วนที่ 2: รายละเอียดกิจกรรม

| field | ประเภท | required |
|---|---|---|
| `processor_name` | string | ✅ |
| `data_controller_address` | string | ✅ |
| `processing_activity` | string | ✅ |
| `purpose` | string | ✅ |

### ส่วนที่ 3: ข้อมูลที่จัดเก็บ

| field | ประเภท | required | หมายเหตุ |
|---|---|---|---|
| `personal_data` | `List[string]` | ✅ | multi-select → ส่งเป็น array |
| `data_category` | `List[string]` | ✅ | checkboxes → ส่งเป็น array |
| `data_type` | string | ✅ | `"general"` หรือ `"sensitive"` |

### ส่วนที่ 4: การได้มาและการเก็บรักษา

| field | ประเภท | required | หมายเหตุ |
|---|---|---|---|
| `collection_method` | string | ✅ | `"electronic"` หรือ `"document"` |
| `data_source` | string | ✅ | `"from_owner"` หรือ `"from_other"` |
| `retention_storage_type` | `List[string]` | ✅ | checkboxes → ส่งเป็น array |
| `retention_method` | `List[string]` | ✅ | multi-select → ส่งเป็น array |
| `retention_duration` | string | ✅ | ตัวเลข เช่น `"5"` |
| `retention_duration_unit` | string | ✅ | `"year"` หรือ `"month"` |
| `retention_access_condition` | string | ✅ | |
| `retention_deletion_method` | string | ✅ | |

### ส่วนที่ 5: ฐานทางกฎหมายและการส่งต่อ

| field | ประเภท | required | หมายเหตุ |
|---|---|---|---|
| `legal_basis` | string | ✅ | |
| `transfer_is_transfer` | boolean | ไม่ | `true` = มีการโอนข้อมูลต่างประเทศ |
| `transfer_country` | string | ถ้า transfer=true | |
| `transfer_is_in_group` | boolean | ไม่ | |
| `transfer_company_name` | string | ไม่ | |
| `transfer_method` | string | ถ้า transfer=true | |
| `transfer_protection_std` | string | ถ้า transfer=true | |
| `transfer_exception` | string | ถ้า transfer=true | |

### ส่วนที่ 6: มาตรการรักษาความมั่นคงปลอดภัย (TOMs)

| field | ประเภท | required |
|---|---|---|
| `security_organizational` | string | ไม่ |
| `security_access_control` | string | ไม่ |
| `security_technical` | string | ไม่ |
| `security_responsibility` | string | ไม่ |
| `security_physical` | string | ไม่ |
| `security_audit` | string | ไม่ |

---

## Error Responses ทั่วไป

| HTTP Status | เกิดเมื่อไหร่ | ข้อความ |
|---|---|---|
| 401 | ไม่มี / token หมดอายุ | Unauthorized |
| 403 | Role ไม่ใช่ Data Processor | Forbidden |
| 403 | พยายามเข้าถึงงานของคนอื่น | Forbidden |
| 404 | ไม่พบ record | `"Record not found"` |
| 403 | แก้ไข record ที่ submitted แล้ว | `"Cannot edit a submitted record"` |
| 422 | confirm แต่กรอกไม่ครบ | `{"missing_fields": [...]}` |

---

## สรุป Endpoints ทั้งหมด

| # | Method | Path | Sidebar | ทำอะไร |
|---|---|---|---|---|
| 1 | GET | `/processor/assignments` | 1 | ดึงตารางงาน + stats 4 ใบ |
| 2 | GET | `/processor/assignments/{id}` | 1,2,3 | เปิดฟอร์ม 6 ส่วน |
| 3 | PUT | `/processor/assignments/{id}/save-draft` | 1 | บันทึกฉบับร่าง |
| 4 | PUT | `/processor/assignments/{id}/confirm` | 1 | ยืนยันข้อมูล (กรอกครบ) |
| 5 | GET | `/processor/ready-to-send` | 1 | ดึงรายการใน modal เลือกส่ง |
| 6 | POST | `/processor/send-to-owner/{id}` | 1 | ส่งให้ Data Owner |
| 7 | GET | `/processor/documents` | 2 | ดึงตารางรายการ + ฉบับร่าง + stats |
| 8 | DELETE | `/processor/drafts/{id}` | 2 | ลบฉบับร่าง |
| 9 | GET | `/processor/feedback` | 3 | ดึงตารางข้อเสนอแนะ |
| 10 | GET | `/processor/feedback/{audit_id}` | 3 | ดูรายละเอียด feedback |

---

## ตัวอย่าง Full Flow (Sidebar 3 → แก้ไข → ส่งใหม่)

```
1. Auditor ตีกลับ processor form
   → processor_status = "needs_revision" (Sidebar 1 แสดง badge แดง "รอแก้ไข")
   → audit_status = "needs_revision" (Sidebar 2 แสดง badge แดง "ต้องแก้ไข")
   → Sidebar 3 แสดงรายการ feedback

2. กดปุ่ม "ดูข้อเสนอแนะ" ใน Sidebar 3
   → GET /processor/feedback/{audit_id}
   → แสดง comment แยกตามส่วน

3. กดปุ่ม "แก้ไขเอกสาร"
   → GET /processor/assignments/{processor_record_id}
   → is_read_only = false (แก้ไขได้แล้ว)

4. แก้ไขข้อมูลตาม feedback แล้วกด "บันทึกฉบับร่าง"
   → PUT /assignments/{id}/save-draft

5. กรอกครบแล้วกด "ยืนยัน"
   → PUT /assignments/{id}/confirm

6. กดปุ่ม "เลือกรายการ" → เลือกใน modal → กด "ส่ง"
   → POST /processor/send-to-owner/{id}
   → processor_status = "submitted" อีกครั้ง

7. Data Owner รวบรวมส่ง Auditor ใหม่
   → รอผล Auditor ใน Sidebar 2
```

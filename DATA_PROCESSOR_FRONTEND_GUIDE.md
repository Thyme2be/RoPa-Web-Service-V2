# คู่มือ Frontend — Data Processor

> เอกสารนี้สำหรับนักพัฒนา Frontend ที่ทำหน้าจอฝั่ง **Data Processor**
> อธิบายทุก API endpoint พร้อม request/response ตัวอย่าง, โครงสร้างหน้าจอ, และ business logic ทั้งหมด

**Base URL**: `/processor`
**Role ที่ต้องมี**: `Data Processor`
**Auth**: ต้องแนบ `Authorization: Bearer <token>` ทุก request

---

## โครงสร้างหน้าจอโดยรวม

```
Sidebar 1 — รายการ RoPA           (GET /processor/assignments)
  └── ฟอร์ม 6 ส่วน                (GET /processor/assignments/{id})
       ├── บันทึกฉบับร่าง         (PUT /processor/assignments/{id}/save-draft)
       ├── ยืนยันข้อมูล           (PUT /processor/assignments/{id}/confirm)
       └── Modal เลือกรายการส่ง   (GET /processor/ready-to-send)
            └── ส่งให้ Data Owner  (POST /processor/send-to-owner/{id})

Sidebar 2 — เอกสาร               (GET /processor/documents)
  └── ลบฉบับร่าง                  (DELETE /processor/drafts/{id})

Sidebar 3 — ข้อเสนอแนะ           (GET /processor/feedback)
  └── ดูรายละเอียด feedback       (GET /processor/feedback/{audit_id})
       └── ปุ่ม "แก้ไขเอกสาร"   → redirect ไป GET /assignments/{processor_record_id}
```

---

## Sidebar 1 — รายการ RoPA ที่ได้รับมอบหมาย

### `GET /processor/assignments`

แสดงรายการ RoPA ทั้งหมดที่ Data Owner มอบหมายให้ผู้ใช้คนนี้

**Query Parameters**

| Parameter | Type | ค่าเริ่มต้น | คำอธิบาย |
|---|---|---|---|
| `status` | string | — | กรองตามสถานะ: `in_progress` / `needs_revision` / `submitted` (รองรับทั้งภาษาอังกฤษและไทย) |
| `date_from` | datetime | — | กรองตั้งแต่วันที่รับมอบหมาย |
| `date_to` | datetime | — | กรองถึงวันที่รับมอบหมาย |
| `page` | int | `1` | หน้าปัจจุบัน |
| `page_size` | int | `10` | จำนวนแถวต่อหน้า (สูงสุด 100) |

**Response 200**

```json
{
  "stats": {
    "total": 15,
    "in_progress": 8,
    "needs_revision": 2,
    "submitted": 5
  },
  "records": [
    {
      "id": "3f2e1a0b-...",
      "doc_code": "RP-2026-0002",
      "title": "ข้อมูลลูกค้าและประวัติการสั่งซื้อ",
      "assigned_by": "สมชาย ใจดี",
      "received_at": "2026-04-01T08:00:00Z",
      "processor_status": "in_progress",
      "status_display": "กำลังดำเนินการ",
      "can_edit": true
    }
  ],
  "total": 15,
  "page": 1,
  "page_size": 10
}
```

**คำอธิบาย Fields**

| Field | คำอธิบาย |
|---|---|
| `stats.total` | จำนวน RoPA ทั้งหมดที่ได้รับมอบหมาย (นับทุกสถานะ ไม่ filter) |
| `stats.in_progress` | นับรวม status: `pending` + `in_progress` + `confirmed` (ยังไม่ส่ง) |
| `stats.needs_revision` | รายการที่ Auditor ส่งกลับให้แก้ไข |
| `stats.submitted` | รายการที่ส่งให้ Data Owner แล้ว |
| `id` | UUID ของ ProcessorRecord — ใช้ใน URL ทุก endpoint ที่ต้องการ `record_id` |
| `doc_code` | รหัสไฟล์ของ Processor เช่น `RP-2026-0002` (unique ต่อไฟล์ ไม่ซ้ำกับ owner) |
| `can_edit` | `true` = แก้ไขได้, `false` = เฉพาะ SUBMITTED (ส่งแล้วแก้ไม่ได้) |

**สถานะ (processor_status) ทั้งหมด**

| ค่าใน DB | status_display | can_edit | คำอธิบาย |
|---|---|---|---|
| `pending` | กำลังดำเนินการ | ✅ true | ได้รับมอบหมายแล้ว ยังไม่เคยเปิดฟอร์ม |
| `in_progress` | กำลังดำเนินการ | ✅ true | กำลังกรอก หรือบันทึกฉบับร่างแล้ว |
| `confirmed` | กำลังดำเนินการ | ✅ true | ยืนยันครบแล้ว รอส่ง (อยู่ใน modal) |
| `submitted` | ส่งงานแล้ว | ❌ false | ส่งให้ Data Owner แล้ว |
| `needs_revision` | รอแก้ไข | ✅ true | Auditor ส่งกลับให้แก้ไข |

---

## ฟอร์ม 6 ส่วน — ดู/แก้ไข

### `GET /processor/assignments/{record_id}`

เปิดฟอร์ม 6 ส่วน — ใช้ร่วมกันจากทุก sidebar

**Response 200**

```json
{
  "id": "3f2e1a0b-...",
  "doc_code": "RP-2026-1000",
  "title": "ข้อมูลลูกค้า",
  "processor_status": "in_progress",
  "draft_code": "DFT-5025",
  "assigned_by": "สมชาย ใจดี",
  "received_at": "2026-04-01T08:00:00Z",
  "confirmed_at": null,
  "sent_to_owner_at": null,
  "updated_at": "2026-04-05T10:30:00Z",
  "audit_status": null,
  "audit_status_display": "รอตรวจสอบ",
  "is_read_only": false,

  "title_prefix": "นาย",
  "first_name": "สมศักดิ์",
  "last_name": "ดีมาก",
  "address": "123 ถ.สุขุมวิท กรุงเทพฯ",
  "email": "somsak@example.com",
  "phone": "081-234-5678",

  "processor_name": "บริษัท ABC จำกัด",
  "data_controller_address": "456 ถ.พระราม 4",
  "processing_activity": "ระบบบริหารลูกค้าสัมพันธ์",
  "purpose": "เพื่อติดตามและบริหารจัดการลูกค้า",

  "personal_data": ["ชื่อ-นามสกุล", "เบอร์โทร", "อีเมล"],
  "data_category": ["ลูกค้า"],
  "data_type": "general",

  "collection_method": "electronic",
  "data_source": "from_owner",
  "retention_storage_type": ["electronic"],
  "retention_method": ["cloud_storage"],
  "retention_duration": "5",
  "retention_duration_unit": "year",
  "retention_access_condition": "เฉพาะเจ้าหน้าที่ที่ได้รับอนุญาต",
  "retention_deletion_method": "ลบออกจากระบบถาวร",

  "legal_basis": "ฐานสัญญา",
  "transfer_is_transfer": false,
  "transfer_country": null,
  "transfer_is_in_group": null,
  "transfer_company_name": null,
  "transfer_method": null,
  "transfer_protection_std": null,
  "transfer_exception": null,

  "security_organizational": "นโยบายความปลอดภัยข้อมูล",
  "security_access_control": "ระบบ RBAC",
  "security_technical": "การเข้ารหัส AES-256",
  "security_responsibility": "แผนกไอที",
  "security_physical": "ประตูล็อค กล้องวงจรปิด",
  "security_audit": "ตรวจสอบทุก 6 เดือน"
}
```

**คำอธิบาย Fields สำคัญ**

| Field | คำอธิบาย |
|---|---|
| `is_read_only` | **สำคัญมาก** — `true` ให้ disable ทุก input, `false` แก้ไขได้ |
| `draft_code` | รหัสฉบับร่าง เช่น `DFT-5025` — แสดงที่หัวหน้าฟอร์ม (null ถ้ายังไม่เคย save draft) |
| `audit_status` | `null` / `"pending_review"` / `"approved"` / `"needs_revision"` |
| `personal_data` | **List** — multi-select dropdown |
| `data_category` | **List** — checkboxes |
| `retention_storage_type` | **List** — checkboxes |
| `retention_method` | **List** — multi-select dropdown |

**กฎ is_read_only — frontend ต้องทำตาม**

```
มี audit + audit_status = "needs_revision"  →  is_read_only = false  (แก้ไขได้)
มี audit + audit_status อื่น               →  is_read_only = true   (ดูอย่างเดียว)
ไม่มี audit + processor_status = submitted  →  is_read_only = true   (รอ Auditor ตรวจ)
ไม่มี audit + processor_status อื่น        →  is_read_only = false  (แก้ไขได้)
```

**Fields ฟอร์ม 6 ส่วน และ Required Fields สำหรับ confirm**

| Section | Fields | Required สำหรับ confirm |
|---|---|---|
| Section 1 — ผู้บันทึก | `title_prefix`, `first_name`, `last_name`, `address`, `email`, `phone` | `first_name`, `last_name`, `address`, `email`, `phone` |
| Section 2 — กิจกรรม | `processor_name`, `data_controller_address`, `processing_activity`, `purpose` | ทั้งหมด |
| Section 3 — ข้อมูล | `personal_data` (list), `data_category` (list), `data_type` | ทั้งหมด |
| Section 4 — เก็บรักษา | `collection_method`, `data_source`, `retention_storage_type` (list), `retention_method` (list), `retention_duration`, `retention_duration_unit`, `retention_access_condition`, `retention_deletion_method` | ทั้งหมด |
| Section 5 — กฎหมาย | `legal_basis`, `transfer_is_transfer`, และถ้า transfer=true: `transfer_country`, `transfer_method`, `transfer_protection_std`, `transfer_exception` | `legal_basis` + transfer fields ถ้า transfer=true |
| Section 6 — ความปลอดภัย | `security_organizational`, `security_access_control`, `security_technical`, `security_responsibility`, `security_physical`, `security_audit` | ไม่ required |

**ค่าที่รับได้ของ radio/select fields**

| Field | ค่าที่รับได้ |
|---|---|
| `data_type` | `"general"` (ทั่วไป) / `"sensitive"` (อ่อนไหว) |
| `collection_method` | `"electronic"` (อิเล็กทรอนิกส์) / `"document"` (เอกสาร) |
| `data_source` | `"from_owner"` (จากเจ้าของข้อมูลโดยตรง) / `"from_other"` (จากแหล่งอื่น) |
| `retention_duration_unit` | `"year"` (ปี) / `"month"` (เดือน) |

---

## บันทึกฉบับร่าง

### `PUT /processor/assignments/{record_id}/save-draft`

บันทึกงานที่ยังไม่เสร็จ — กรอกไม่ครบก็บันทึกได้

**Request Body** (ส่งเฉพาะ field ที่กรอก ไม่ต้องส่งครบ)

```json
{
  "first_name": "สมศักดิ์",
  "last_name": "ดีมาก",
  "processor_name": "บริษัท ABC จำกัด",
  "personal_data": ["ชื่อ-นามสกุล", "เบอร์โทร"],
  "retention_duration": "5",
  "retention_duration_unit": "year"
}
```

**Response 200**

```json
{
  "message": "บันทึกฉบับร่างเรียบร้อย",
  "draft_code": "DFT-5025",
  "record_id": "3f2e1a0b-..."
}
```

**พฤติกรรม**
- สร้าง `draft_code` อัตโนมัติ (format `DFT-XXXX`) ครั้งแรกที่กด save — frontend ต้องแสดง draft_code จาก response
- Status เปลี่ยน: `pending` / `needs_revision` → `in_progress`
- เขียนเฉพาะ field ที่ส่งมา ไม่ลบข้อมูลเดิมที่กรอกไว้
- Error 403: ถ้า status เป็น `submitted`

---

## ยืนยันข้อมูล RoPA

### `PUT /processor/assignments/{record_id}/confirm`

กรอกครบแล้ว กด "ยืนยัน" เพื่อเตรียมส่ง

**Request Body** (ต้องส่ง required fields ครบ)

```json
{
  "first_name": "สมศักดิ์",
  "last_name": "ดีมาก",
  "address": "123 ถ.สุขุมวิท",
  "email": "somsak@example.com",
  "phone": "081-234-5678",
  "processor_name": "บริษัท ABC จำกัด",
  "data_controller_address": "456 ถ.พระราม 4",
  "processing_activity": "ระบบ CRM",
  "purpose": "บริหารจัดการลูกค้า",
  "personal_data": ["ชื่อ-นามสกุล", "เบอร์โทร"],
  "data_category": ["ลูกค้า"],
  "data_type": "general",
  "collection_method": "electronic",
  "data_source": "from_owner",
  "retention_storage_type": ["electronic"],
  "retention_method": ["cloud_storage"],
  "retention_duration": "5",
  "retention_duration_unit": "year",
  "retention_access_condition": "เฉพาะเจ้าหน้าที่",
  "retention_deletion_method": "ลบถาวร",
  "legal_basis": "ฐานสัญญา",
  "transfer_is_transfer": false,
  "security_organizational": "นโยบายความปลอดภัย"
}
```

**Response 200**

```json
{
  "message": "ยืนยันข้อมูล RoPA เรียบร้อย",
  "record_id": "3f2e1a0b-..."
}
```

**Response 422** (กรอกไม่ครบ)

```json
{
  "detail": {
    "message": "กรุณากรอกข้อมูลให้ครบถ้วน",
    "missing_fields": ["retention_duration", "data_type"]
  }
}
```

**พฤติกรรม**
- ตรวจสอบ required fields — ถ้าขาด return 422 พร้อม list ของ field ที่ขาด (frontend แสดง highlight)
- Status เปลี่ยน: → `confirmed`
- Record ปรากฏใน modal "เลือกรายการที่ต้องการส่ง" (GET /ready-to-send)
- Record หายจากตาราง "ฉบับร่าง" ใน Sidebar 2
- Error 403: ถ้า status เป็น `submitted`

---

## Modal เลือกรายการที่ต้องการส่ง

### `GET /processor/ready-to-send`

แสดง records ที่ยืนยันแล้ว (status=`confirmed`) รอส่งให้ Data Owner

**Query Parameters**: `page`, `page_size`

**Response 200**

```json
{
  "records": [
    {
      "id": "3f2e1a0b-...",
      "doc_code": "RP-2026-0002",
      "title": "ข้อมูลลูกค้า",
      "created_at": "2026-03-15T09:00:00Z"
    }
  ],
  "total": 3,
  "page": 1,
  "page_size": 10
}
```

**พฤติกรรม**: `created_at` คือวันที่ Data Owner สร้างเอกสาร RoPA (ไม่ใช่วันที่ Processor confirm)

---

## ส่ง RoPA ให้ผู้รับผิดชอบข้อมูล

### `POST /processor/send-to-owner/{record_id}`

ส่ง RoPA ที่ยืนยันแล้วไปให้ Data Owner — ต้องเป็น `confirmed` เท่านั้น

**Request Body**: ไม่มี

**Response 200**

```json
{
  "message": "ส่ง RoPA ให้ผู้รับผิดชอบข้อมูลเรียบร้อย",
  "record_id": "3f2e1a0b-..."
}
```

**พฤติกรรม**
- Status เปลี่ยน: `confirmed` → `submitted`
- บันทึก `sent_to_owner_at` = เวลาปัจจุบัน
- Record หายจาก modal ready-to-send
- Record ปรากฏในตาราง "รายการที่ดำเนินการ" ของ Sidebar 2 สถานะ "รอตรวจสอบ"
- Error 400: ถ้า status ไม่ใช่ `confirmed`

---

## Sidebar 2 — เอกสาร

### `GET /processor/documents`

แสดง 2 ตารางพร้อมกัน: "รายการที่ดำเนินการ" และ "ฉบับร่าง"

**Query Parameters**

| Parameter | คำอธิบาย |
|---|---|
| `status` | กรองตาราง "รายการที่ดำเนินการ" ตาม audit_status |
| `date_from` | กรองตาม sent_to_owner_at |
| `time_range` | `7_days` / `30_days` / `90_days` / `all` |
| `active_page` | หน้าของตาราง "รายการที่ดำเนินการ" (default: 1) |
| `drafts_page` | หน้าของตาราง "ฉบับร่าง" (default: 1) |
| `page_size` | จำนวนแถวต่อหน้า (ใช้กับทั้ง 2 ตาราง) |

**Response 200**

```json
{
  "stats": {
    "total": 10,
    "complete": 3
  },
  "active_records": [
    {
      "id": "3f2e1a0b-...",
      "doc_code": "RP-2026-0002",
      "title": "ข้อมูลลูกค้า",
      "sent_at": "2026-04-02T14:00:00Z",
      "audit_status": "pending_review",
      "audit_status_display": "รอตรวจสอบ",
      "can_edit": false
    }
  ],
  "active_total": 10,
  "active_page": 1,
  "drafts": [
    {
      "id": "uuid-อีกอัน",
      "draft_code": "DFT-5030",
      "title": "ข้อมูลพนักงาน",
      "updated_at": "2026-04-08T16:20:00Z"
    }
  ],
  "drafts_total": 2,
  "drafts_page": 1,
  "page_size": 10
}
```

**ตาราง "รายการที่ดำเนินการ"** (active_records)

แสดง records ที่ส่งให้ Data Owner แล้ว และ RopaDocument อยู่ในกระบวนการ Auditor

| audit_status | audit_status_display | can_edit | ความหมาย |
|---|---|---|---|
| `pending_review` | รอตรวจสอบ | false | Auditor ยังไม่ตรวจไฟล์ Processor นี้ |
| `approved` | อนุมัติ | false | ไฟล์ Processor ผ่านการตรวจแล้ว |
| `needs_revision` | ต้องแก้ไข | true | Auditor ตีกลับ — ต้องแก้ไขและส่งใหม่ |

> หมายเหตุ: `audit_status` ที่แสดงใน Sidebar 2 คือ `processor_review_status` เฉพาะ — ไม่ใช่สถานะรวมของทั้งเอกสาร

**stats**

| Field | คำอธิบาย |
|---|---|
| `stats.total` | จำนวน records ใน active_records ทั้งหมด (ก่อน pagination) |
| `stats.complete` | จำนวน records ที่ audit_status = `approved` (Auditor อนุมัติแล้ว) |

**ตาราง "ฉบับร่าง"** (drafts)

แสดงเฉพาะ records ที่ status = `in_progress` และมี `draft_code` (เคยกด save draft แล้ว)

---

## ลบฉบับร่าง

### `DELETE /processor/drafts/{record_id}`

ลบฉบับร่าง — ล้างข้อมูลฟอร์มทั้งหมดและ draft_code (ไม่ลบ ProcessorRecord จริง)

**Response 204** (No Content — ไม่มี body)

**พฤติกรรม**
- Reset ข้อมูลทุก field ในฟอร์มเป็น null
- `draft_code` = null
- Status เปลี่ยน: `in_progress` → `pending`
- Record หายจากตาราง "ฉบับร่าง" ใน Sidebar 2
- Record กลับไปอยู่ใน Sidebar 1 สถานะ "กำลังดำเนินการ" (แต่ไม่มีข้อมูลแล้ว)
- Error 404: ถ้าไม่ใช่ `in_progress` หรือไม่มี `draft_code`

---

## Sidebar 3 — ข้อเสนอแนะ

### `GET /processor/feedback`

รายการแจ้งเตือน feedback จาก Auditor ที่ต้องแก้ไข

**Query Parameters**: `date_from`, `time_range` (`7_days`/`30_days`/`90_days`/`all`), `page`, `page_size`

**Response 200**

```json
{
  "feedbacks": [
    {
      "audit_id": "uuid-ของ-AuditorAudit",
      "doc_code": "RP-2026-1000",
      "title": "ข้อมูลลูกค้า",
      "sent_at": "2026-04-05T11:00:00Z",
      "received_at": "2026-04-05T11:00:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "page_size": 10
}
```

**เงื่อนไขที่แสดงใน Sidebar 3**

1. เป็นเอกสารที่ current_user ถูก assign
2. `audit_status = needs_revision` (ต้องแก้ไข)
3. มี `processor_feedback` (Auditor เขียน comment ให้ Processor จริงๆ)

---

### `GET /processor/feedback/{audit_id}`

ดูรายละเอียด feedback — แสดง comment แยกตามส่วน

**Response 200**

```json
{
  "audit_id": "uuid-ของ-AuditorAudit",
  "ropa_doc_id": "uuid-ของ-RopaDocument",
  "doc_code": "RP-2026-1000",
  "title": "ข้อมูลลูกค้า",
  "updated_at": "2026-04-05T11:00:00Z",
  "auditor_name": "วิชัย ตรวจสอบ",
  "processor_record_id": "3f2e1a0b-...",
  "feedbacks": [
    {
      "section": "section_5",
      "section_label": "ส่วนที่ 5 : ฐานทางกฎหมายและการส่งต่อ",
      "comment": "กรุณายืนยัน SCCs สำหรับการส่งข้อมูลต่างประเทศ"
    },
    {
      "section": "section_6",
      "section_label": "ส่วนที่ 6 : มาตรการรักษาความมั่นคงปลอดภัย (TOMs)",
      "comment": "กรุณาระบุวิธีการเข้ารหัสข้อมูลให้ชัดเจนยิ่งขึ้น"
    }
  ]
}
```

**คำอธิบาย Fields**

| Field | คำอธิบาย |
|---|---|
| `processor_record_id` | UUID ของ ProcessorRecord — ใช้ redirect ไปหน้าแก้ไข: `GET /assignments/{processor_record_id}` |
| `feedbacks` | รายการ comment แต่ละส่วน (section_1 ถึง section_6) |
| `auditor_name` | ชื่อ Auditor ที่ส่ง feedback |
| `updated_at` | วันที่แก้ไขล่าสุดของ audit |

**การใช้งาน**: หน้านี้มีปุ่ม **"แก้ไขเอกสาร"** → frontend redirect ไปยัง `GET /processor/assignments/{processor_record_id}`

---

## Flow การทำงานทั้งหมด

```
Data Owner assign งาน
  → ProcessorRecord ถูกสร้าง (status: pending)
  ↓
Sidebar 1 — เห็นรายการ "กำลังดำเนินการ"
  ↓
กดปุ่มแก้ไข → GET /assignments/{id} (is_read_only: false)
  ↓
[ตัวเลือก A] กดบันทึกฉบับร่าง
  → PUT /save-draft → ได้ draft_code
  → status: in_progress
  → ปรากฏใน Sidebar 2 ตาราง "ฉบับร่าง"
  ↓
[ตัวเลือก B] กดยืนยัน (กรอกครบแล้ว)
  → PUT /confirm → ต้องกรอกครบ required fields
  → status: confirmed
  → หายจาก "ฉบับร่าง", ปรากฏใน modal ready-to-send
  ↓
เปิด modal → GET /ready-to-send → เลือกรายการ
  ↓
กดส่ง → POST /send-to-owner/{id}
  → status: submitted
  → ปรากฏใน Sidebar 2 "รายการที่ดำเนินการ" (audit_status: รอตรวจสอบ)
  ↓
Auditor ตรวจสอบ:
  [อนุมัติ] audit_status: approved
    → Sidebar 2 แสดง "อนุมัติ", can_edit: false

  [ตีกลับ] audit_status: needs_revision
    → status: needs_revision
    → Sidebar 2: can_edit = true
    → ปรากฏใน Sidebar 3
    ↓
    กด "แก้ไขเอกสาร" → GET /assignments/{id} (is_read_only: false)
    → กลับไปขั้นตอน save-draft / confirm อีกครั้ง
```

---

## Section Keys ทั้งหมด

| Section Key | ชื่อแสดง |
|---|---|
| `section_1` | ส่วนที่ 1 : รายละเอียดของผู้บันทึก RoPA |
| `section_2` | ส่วนที่ 2 : รายละเอียดกิจกรรม |
| `section_3` | ส่วนที่ 3 : ข้อมูลที่จัดเก็บ |
| `section_4` | ส่วนที่ 4 : การได้มาและการเก็บรักษา |
| `section_5` | ส่วนที่ 5 : ฐานทางกฎหมายและการส่งต่อ |
| `section_6` | ส่วนที่ 6 : มาตรการรักษาความมั่นคงปลอดภัย (TOMs) |

---

## HTTP Error Codes

| Code | สาเหตุ |
|---|---|
| 400 | ข้อผิดพลาด logic เช่น ส่งงานที่ไม่ใช่ confirmed |
| 403 | ไม่มีสิทธิ์ (role ไม่ถูกต้อง หรือพยายามแก้ record ที่ submitted) |
| 404 | ไม่พบ record (หรือเป็น record ของคนอื่น) |
| 422 | กรอก required fields ไม่ครบ (confirm endpoint) |

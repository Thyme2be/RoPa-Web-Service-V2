# Auditor Frontend Guide

**Generated**: April 8, 2026
**Branch**: feat/backend-data-auditor
**Base URL**: `/auditor` (ต้องแนบ Authorization header ทุก request)

---

## ภาพรวม Auditor Portal

Auditor Portal มี **3 Sidebar** หลัก:

| Sidebar | ชื่อ | หน้าที่ |
|---|---|---|
| 1 | แดชบอร์ด | สรุปภาพรวม + กราฟรายเดือน |
| 2 | เอกสาร | ตรวจสอบและส่งข้อเสนอแนะฟอร์ม RoPA |
| 3 | เอกสารครบกำหนด | จัดการเอกสารที่หมดอายุ (ลบถาวร) |

---

## Authentication & Role

```
Role ที่ต้องการ: "Auditor"
Header: Authorization: Bearer <token>
```

- ทุก endpoint ต้องส่ง Bearer Token
- ถ้า token ไม่มี role `"Auditor"` → 403 Forbidden
- ถ้า Auditor ไม่มี AuditorProfile ใน DB → 403 `"ไม่พบข้อมูล Auditor Profile กรุณาติดต่อ Admin"`

---

## Workflow ภาพรวม (เชื่อมกับ Data Owner & Data Processor)

```
Data Owner สร้างเอกสาร RoPA
    ↓
Data Owner มอบหมายให้ Data Processor กรอกฟอร์ม
    ↓
Data Processor กรอกและส่งฟอร์มกลับให้ Data Owner
    ↓
Data Owner รวบรวม (owner form + processor form) แล้วส่งให้ Auditor
    ↓
[[ AUDITOR PORTAL เริ่มตรงนี้ ]]
    ↓
Auditor ตรวจ owner form  → อนุมัติ หรือ ตีกลับ Data Owner
Auditor ตรวจ processor form → อนุมัติ หรือ ตีกลับ Data Processor (ผ่าน Data Owner)
    ↓
ทั้ง 2 ฟอร์มอนุมัติ → เอกสาร status = APPROVED + กำหนด expires_at
    ↓
ถึงวัน expires_at → เอกสารปรากฏใน Sidebar 3 → Auditor ลบถาวร
```

### สิ่งที่ Auditor ทำส่งผลต่อระบบอื่น

| การกระทำของ Auditor | ผลกระทบ |
|---|---|
| อนุมัติ owner form | `AuditorAudit.owner_review_status = "approved"` |
| อนุมัติ processor form | `AuditorAudit.processor_review_status = "approved"` |
| ทั้ง 2 ฟอร์มอนุมัติ | `RopaDocument.status = "approved"`, `AuditorAudit.audit_status = "approved"` |
| ตีกลับ owner form | `RopaDocument.status = "rejected_owner"` → Data Owner เห็นสถานะตีกลับ |
| ตีกลับ processor form | `RopaDocument.status = "rejected_processor"` + `ProcessorRecord.processor_status = "needs_revision"` → Data Processor เห็นสีแดงใน Sidebar 1, 2 |
| ลบเอกสาร | Hard delete ทั้งหมด (doc + owner_record + processor_records + auditor_audits) |

---

## โครงสร้างตาราง Sidebar 2 (สำคัญมาก)

**1 เอกสาร RoPA = 2 แถวในตาราง:**

| แถว | form_type | form_label | ดูฟอร์มของใคร |
|---|---|---|---|
| แถวที่ 1 | `"owner"` | `"ผู้รับผิดชอบข้อมูล"` | OwnerRecord (Data Owner กรอก) |
| แถวที่ 2 | `"processor"` | `"ผู้ประมวลผลข้อมูลส่วนบุคคล"` | ProcessorRecord (Data Processor กรอก) |

**ทั้ง 2 แถวมี ropa_doc_id เดียวกัน แต่ส่ง feedback แยกกันได้อิสระ**

---

## Sidebar 1 — แดชบอร์ด

### GET `/auditor/dashboard`

**Query Parameters:**

| param | ค่า | default |
|---|---|---|
| `time_range` | `"7_days"` / `"30_days"` / `"90_days"` / `"all"` | `"30_days"` |

**Response:**
```json
{
  "total_documents": 1248,
  "pending_review": 42,
  "monthly_trend": [
    { "month": 1, "this_year": 45, "last_year": 30 },
    { "month": 2, "this_year": 52, "last_year": 38 },
    ...
    { "month": 12, "this_year": 0, "last_year": 71 }
  ]
}
```

**คำอธิบาย fields:**

| field | แสดงที่ | ความหมาย |
|---|---|---|
| `total_documents` | card "จำนวนเอกสารทั้งหมด" | นับ **ไฟล์** ทั้งหมด (owner form + processor form) — **1 doc = 2 ไฟล์** → ถ้ามี 5 docs = แสดง 10 |
| `pending_review` | card "รายการที่รอตรวจสอบ" | นับ **ไฟล์** ที่ยัง `pending_review` แยกอิสระ — owner นับ 1, processor นับ 1 (เหมือน Sidebar 2) |
| `monthly_trend` | กราฟแท่ง (ปีนี้ vs ปีที่แล้ว) | นับ **ไฟล์** ต่อเดือน (1 doc = 2 ไฟล์) ไม่ใช้ time_range filter แสดงทุกเดือน 1-12 |

**การแสดง UI:**
- card `total_documents` → ไม่เน้นสี (สีเทา)
- card `pending_review` → เน้นสี (สีน้ำเงิน หรือ primary color)
- กราฟ: แท่งสี `ปีนี้` vs แท่งสี `ปีที่แล้ว` ตาม mock ที่เห็นในรูป
- dropdown "ช่วงเวลา" ส่ง `time_range` param → ดึงข้อมูลใหม่ (ส่งผลต่อ cards เท่านั้น กราฟไม่เปลี่ยน)

---

## Sidebar 2 — เอกสาร

### GET `/auditor/documents`

**Query Parameters:**

| param | ค่า | default |
|---|---|---|
| `time_range` | `"7_days"` / `"30_days"` / `"90_days"` / `"all"` | `"30_days"` |
| `date_from` | ISO datetime string | null |
| `page` | integer ≥ 1 | `1` |
| `page_size` | integer 1-100 | `10` |

**Response:**
```json
{
  "stats": {
    "pending_feedback": 12,
    "pending_since_yesterday": 4
  },
  "records": [
    {
      "ropa_doc_id": "uuid-xxxxxxxx",
      "doc_code": "RP-2026-0900",
      "title": "ข้อมูลการให้บริการด้านโลจิสติกส์ดิจิทัล",
      "form_type": "owner",
      "form_label": "ผู้รับผิดชอบข้อมูล",
      "received_at": "2026-03-28T09:15:00Z",
      "sent_at": null,
      "action": "fill",
      "review_status": "pending_review"
    },
    {
      "ropa_doc_id": "uuid-xxxxxxxx",
      "doc_code": "RP-2026-0900",
      "title": "ข้อมูลการให้บริการด้านโลจิสติกส์ดิจิทัล",
      "form_type": "processor",
      "form_label": "ผู้ประมวลผลข้อมูลส่วนบุคคล",
      "received_at": "2026-03-28T09:15:00Z",
      "sent_at": null,
      "action": "fill",
      "review_status": "pending_review"
    },
    ...
  ],
  "total": 24,
  "page": 1,
  "page_size": 10
}
```

**คำอธิบาย fields:**

| field | แสดงที่ | ความหมาย |
|---|---|---|
| `stats.pending_feedback` | card "รายการที่รอการตอบกลับทั้งหมด" | นับ form rows (ไม่ใช่ documents) ที่ยัง `pending_review` — 1 doc ที่ยังไม่ได้ตรวจ = +2 |
| `stats.pending_since_yesterday` | ตัวเลขสีแดงใต้ card "รายการที่รอการตอบกลับ" | นับ form rows ที่ยัง `pending_review` **และ** `received_at >= วันนี้ 00:00` — ใช้ `owner_received_at` / `processor_received_at` แยกต่อ form (เพิ่มขึ้นจากเมื่อวาน) |
| `doc_code` | คอลัมน์ "รหัสเอกสาร" | รหัส เช่น `RP-2026-0900` |
| `title` | คอลัมน์ "ชื่อรายการ" | ชื่อ RoPA เช่น "ข้อมูลลูกค้า..." |
| `form_label` | ใต้ชื่อรายการ หรือ badge | "ผู้รับผิดชอบข้อมูล" / "ผู้ประมวลผลข้อมูลส่วนบุคคล" |
| `received_at` | คอลัมน์ "วันที่ได้รับ" | วันที่ form นั้นๆ ส่งมาให้ Auditor — **แยกต่อ form** (owner กับ processor อาจต่างกันได้ถ้ามี resubmit) |
| `sent_at` | คอลัมน์ "วันที่ส่ง" | วันที่ Auditor ส่ง feedback กลับ (null = ยังไม่ส่ง → แสดงเป็น "-") |
| `action` | คอลัมน์ "การดำเนินการ" ปุ่ม | `"fill"` = ปุ่มแดง "กรอกข้อเสนอแนะ", `"view"` = ปุ่มเทา "ดูข้อเสนอแนะ" |
| `review_status` | badge สถานะ | ดูตาราง badge ด้านล่าง |

**Badge สถานะ (`review_status`):**

| ค่า | ป้าย | สี |
|---|---|---|
| `"pending_review"` | รอตรวจสอบ | เทา / เหลือง |
| `"approved"` | อนุมัติแล้ว | เขียว |
| `"needs_revision"` | ต้องแก้ไข | แดง |

**การแสดง 2 แถวต่อ 1 เอกสาร:**
```
┌────────────────┬──────────────────────────────┬───────────────┬──────────────┬──────────────────────┐
│ รหัสเอกสาร    │ ชื่อรายการ                   │ วันที่ได้รับ  │ วันที่ส่ง   │ การดำเนินการ         │
├────────────────┼──────────────────────────────┼───────────────┼──────────────┼──────────────────────┤
│ RP-2026-0900   │ ข้อมูลการให้บริการ...        │ 28/03, 09:15  │ -            │ [กรอกข้อเสนอแนะ]    │
│                │ [ผู้รับผิดชอบข้อมูล]         │               │              │                      │
├────────────────┼──────────────────────────────┼───────────────┼──────────────┼──────────────────────┤
│ RP-2026-0900   │ ข้อมูลการให้บริการ...        │ 28/03, 09:15  │ -            │ [กรอกข้อเสนอแนะ]    │
│                │ [ผู้ประมวลผลข้อมูลฯ]         │               │              │                      │
└────────────────┴──────────────────────────────┴───────────────┴──────────────┴──────────────────────┘
```

> **หมายเหตุ:** Pagination ทำงานบน "แถว" ไม่ใช่ "เอกสาร" — `page_size=10` = 10 แถว = 5 เอกสาร (ถ้าทุก doc ยังไม่ผ่านสักฟอร์ม)

---

### GET `/auditor/documents/{ropa_doc_id}?form_type=owner|processor`

เรียกเมื่อกดปุ่ม "กรอกข้อเสนอแนะ" หรือ "ดูข้อเสนอแนะ" ในตาราง

**Path Parameter:** `ropa_doc_id` — UUID ของเอกสาร

**Query Parameter (บังคับ):** `form_type=owner` หรือ `form_type=processor`
- กด action ของแถว owner → ส่ง `?form_type=owner`
- กด action ของแถว processor → ส่ง `?form_type=processor`

**Response:**
```json
{
  "ropa_doc_id": "uuid-xxxxxxxx",
  "doc_code": "ROPA-2026-0900",
  "title": "ข้อมูลการให้บริการด้านโลจิสติกส์ดิจิทัล",
  "last_modified": "2026-03-28T10:00:00Z",
  "auditor_name": "พรรษชล บุญมาก",
  "form_type": "processor",
  "form_label": "ผู้ประมวลผลข้อมูลส่วนบุคคล",
  "review_status": "pending_review",
  "form_data": {
    "title_prefix": "นาย",
    "first_name": "สมชาย",
    "last_name": "ใจดี",
    "address": "123 ถนนสุขุมวิท...",
    ...
  },
  "feedbacks": []
}
```

**คำอธิบาย fields header (แสดงด้านบนฟอร์ม):**

| field | แสดงที่ |
|---|---|
| `doc_code` | "รหัสเอกสาร : ROPA-2026-0900" |
| `last_modified` | "วันที่แก้ไขล่าสุด : 28/03/2026, 10:00" |
| `auditor_name` | "ผู้ตรวจสอบ : พรรษชล บุญมาก" |
| `form_label` | ชื่อหัวข้อใหญ่ของฟอร์ม เช่น "เอกสาร RoPA จากทางผู้ประมวลผลข้อมูลส่วนบุคคล" |

**`form_data` — โครงสร้างตาม `form_type`:**

#### form_type = `"owner"` (OwnerRecord)

```
ส่วนที่ 1: รายละเอียดของผู้บันทึก RoPA
  record_name, address, email, phone

ส่วนที่ 2: รายละเอียดกิจกรรม
  data_subject_name, processing_activity, purpose

ส่วนที่ 3: ข้อมูลที่จัดเก็บ
  personal_data, data_category, data_type

ส่วนที่ 4: การได้มาและการเก็บรักษา
  collection_method, source_direct, source_indirect,
  retention_storage_type, retention_method,
  retention_duration, retention_access_control,
  retention_deletion_method

ส่วนที่ 5: ฐานทางกฎหมายและการส่งต่อ
  legal_basis, minor_under10, minor_10to20,
  transfer_is_transfer, transfer_country,
  transfer_company_name, transfer_method,
  transfer_protection_std, transfer_exception,
  exemption_disclosure, rejection_note

ส่วนที่ 6: มาตรการรักษาความมั่นคงปลอดภัย (TOMs)
  security_organizational, security_technical,
  security_physical, security_access_control,
  security_responsibility, security_audit
```

#### form_type = `"processor"` (ProcessorRecord)

```
ส่วนที่ 1: รายละเอียดของผู้บันทึก RoPA
  title_prefix, first_name, last_name,
  address, email, phone

ส่วนที่ 2: รายละเอียดกิจกรรม
  processor_name, data_controller_address,
  processing_activity, purpose

ส่วนที่ 3: ข้อมูลที่จัดเก็บ
  personal_data (array), data_category (array), data_type

ส่วนที่ 4: การได้มาและการเก็บรักษา
  collection_method, data_source,
  retention_storage_type (array), retention_method (array),
  retention_duration, retention_duration_unit,
  retention_access_condition, retention_deletion_method

ส่วนที่ 5: ฐานทางกฎหมายและการส่งต่อ
  legal_basis, transfer_is_transfer, transfer_country,
  transfer_is_in_group, transfer_company_name,
  transfer_method, transfer_protection_std, transfer_exception

ส่วนที่ 6: มาตรการรักษาความมั่นคงปลอดภัย (TOMs)
  security_organizational, security_technical,
  security_physical, security_access_control,
  security_responsibility, security_audit
```

> **ฟอร์มทั้งหมดแสดงแบบ read-only** — Auditor ดูข้อมูลอย่างเดียว ไม่ได้แก้ไข

**`feedbacks` — feedback เดิมที่เคยส่งไปแล้ว (ถ้ามี):**
```json
"feedbacks": [
  {
    "section": "section_2",
    "section_label": "ส่วนที่ 2 : รายละเอียดกิจกรรม",
    "comment": "กรุณาระบุวัตถุประสงค์ให้ชัดเจนขึ้น"
  }
]
```
- `feedbacks = []` → ยังไม่เคยส่ง feedback (action = "fill") หรืออนุมัติแล้ว
- `feedbacks` มีข้อมูล → เคยตีกลับ (action = "view") → แสดง comment ท้ายแต่ละส่วน

---

### POST `/auditor/documents/{ropa_doc_id}/submit-feedback`

เรียกเมื่อกดปุ่ม "ส่งข้อเสนอแนะ" หลังจากตรวจฟอร์มเสร็จ

**Request Body:**
```json
{
  "form_type": "owner",
  "feedbacks": [],
  "expires_at": "2028-03-28T00:00:00Z"
}
```

**Logic การส่ง:**

#### กรณี 1: อนุมัติ (`feedbacks = []`)
```json
{
  "form_type": "owner",
  "feedbacks": [],
  "expires_at": "2028-03-28T00:00:00Z"
}
```
- `feedbacks` ต้องเป็น array ว่าง `[]`
- `expires_at` **บังคับต้องส่ง** เมื่อ feedbacks ว่าง (วันหมดอายุที่ Auditor กำหนด)
- ถ้าไม่ส่ง `expires_at` → 422 Validation Error

#### กรณี 2: ตีกลับ (`feedbacks` มีข้อมูล)
```json
{
  "form_type": "processor",
  "feedbacks": [
    {
      "section": "section_2",
      "section_label": "ส่วนที่ 2 : รายละเอียดกิจกรรม",
      "comment": "กรุณาระบุวัตถุประสงค์ให้ชัดเจนขึ้น"
    },
    {
      "section": "section_5",
      "section_label": "ส่วนที่ 5 : ฐานทางกฎหมายและการส่งต่อ",
      "comment": "ฐานทางกฎหมายไม่ครบถ้วน"
    }
  ],
  "expires_at": null
}
```
- `feedbacks` มีอย่างน้อย 1 รายการ
- `expires_at` ไม่จำเป็น (ส่ง null หรือไม่ส่งก็ได้)

**ค่าที่ใส่ใน `section`:**

| section | section_label |
|---|---|
| `"section_1"` | ส่วนที่ 1 : รายละเอียดของผู้บันทึก RoPA |
| `"section_2"` | ส่วนที่ 2 : รายละเอียดกิจกรรม |
| `"section_3"` | ส่วนที่ 3 : ข้อมูลที่จัดเก็บ |
| `"section_4"` | ส่วนที่ 4 : การได้มาและการเก็บรักษา |
| `"section_5"` | ส่วนที่ 5 : ฐานทางกฎหมายและการส่งต่อ |
| `"section_6"` | ส่วนที่ 6 : มาตรการรักษาความมั่นคงปลอดภัย (TOMs) |

**Response:**
```json
{
  "message": "อนุมัติเอกสารเรียบร้อย",
  "ropa_doc_id": "uuid-xxxxxxxx",
  "action": "approved"
}
```
หรือ
```json
{
  "message": "ส่งข้อเสนอแนะเรียบร้อย",
  "ropa_doc_id": "uuid-xxxxxxxx",
  "action": "needs_revision"
}
```

**ตรรกะที่เกิดขึ้น Backend (Frontend ไม่ต้องทำเพิ่ม แค่รับ response):**

| กรณี | สิ่งที่ backend ทำ |
|---|---|
| อนุมัติ owner form | `owner_review_status = "approved"`, set `expires_at` บนเอกสาร |
| อนุมัติ processor form | `processor_review_status = "approved"`, set `expires_at` บนเอกสาร |
| อนุมัติทั้ง 2 ฟอร์ม | `doc.status = "approved"` → เอกสารเสร็จสมบูรณ์ |
| ตีกลับ owner form | `owner_review_status = "needs_revision"`, `doc.status = "rejected_owner"` |
| ตีกลับ processor form | `processor_review_status = "needs_revision"`, `doc.status = "rejected_processor"`, `ProcessorRecord.processor_status = "needs_revision"` |

**UI Flow หน้าฟอร์ม (Sidebar 2):**

```
1. เข้าหน้าฟอร์ม → แสดง header (doc_code, last_modified, auditor_name)
2. แสดงฟอร์ม 6 ส่วน แบบ read-only
3. ท้ายแต่ละส่วน → มี "เพิ่มข้อเสนอแนะ" button (toggle)
   - กด → เปิด textarea ให้กรอก comment
   - ไม่กด → ส่วนนั้นไม่มี feedback
4. ปุ่ม "ส่งข้อเสนอแนะ" ด้านล่างสุด:
   - ถ้าไม่มี feedback ใดเลย → แสดง date picker "วันหมดอายุ" (expires_at) บังคับกรอก
   - ถ้ามี feedback → ส่งได้เลย (ไม่ต้อง expires_at)
5. กด confirm → POST submit-feedback
6. หลังสำเร็จ → navigate กลับหน้า Sidebar 2 (list)
```

---

## Sidebar 3 — เอกสารครบกำหนด

### GET `/auditor/expired-documents`

**Query Parameters:**

| param | ค่า | default |
|---|---|---|
| `time_range` | `"7_days"` / `"30_days"` / `"90_days"` / `"all"` | `"30_days"` |
| `date_from` | ISO datetime string (filter วันครบกำหนด) | null |
| `page` | integer ≥ 1 | `1` |
| `page_size` | integer 1-100 | `10` |

**Response:**
```json
{
  "stats": {
    "expired_count": 10,
    "deleted_count": 6
  },
  "records": [
    {
      "ropa_doc_id": "uuid-xxxxxxxx",
      "doc_code": "RP-2026-0901",
      "title": "ข้อมูลลูกค้าและบริการแพลตฟอร์ม",
      "expires_at": "2028-03-29T00:00:00Z"
    },
    ...
  ],
  "total": 10,
  "page": 1,
  "page_size": 10
}
```

**คำอธิบาย stats:**

| field | card | ความหมาย |
|---|---|---|
| `expired_count` | "รายการที่ครบกำหนด" | เอกสารที่ `expires_at` ผ่านมาแล้ว และยังอยู่ในระบบ (ยังไม่ลบ) |
| `deleted_count` | "รายการที่ดำเนินการลบเสร็จสิ้น" | เอกสารที่ Auditor กดลบไปแล้ว (นับจาก `deleted_document_logs` table) |

> **หมายเหตุ:** `deleted_count` กรองตาม `time_range` เดียวกันกับ `expired_count`

**ตารางแสดงเฉพาะเอกสารที่ยังไม่ได้ลบ** เรียงตาม `expires_at` จากน้อยไปมาก

---

### GET `/auditor/expired-documents/{ropa_doc_id}?form_type=owner|processor`

เรียกเมื่อกดปุ่ม "ดูเอกสาร" ในตาราง Sidebar 3

**Response:** เหมือนกับ `GET /auditor/documents/{id}` **ทุกอย่าง** ยกเว้น:
- `feedbacks` = `[]` เสมอ (ไม่แสดง feedback section)
- `review_status` = `"approved"` เสมอ (เอกสารที่มาถึง Sidebar 3 ผ่านอนุมัติแล้ว)

**UI ต่างจาก Sidebar 2:**
- ไม่มี section feedback / textarea
- ไม่มีปุ่ม "ส่งข้อเสนอแนะ"
- มีปุ่ม **"ลบเอกสาร"** แทน (ด้านล่างสุด)
- กดแล้วแสดง popup ยืนยัน → กด confirm → DELETE endpoint

---

### DELETE `/auditor/documents/{ropa_doc_id}`

> **⚠️ HARD DELETE — ลบถาวร ไม่สามารถกู้คืนได้**

เรียกหลังจาก Auditor กดยืนยันใน popup

**ไม่มี Request Body**

**Response:**
```json
{
  "message": "ลบเอกสารเรียบร้อย",
  "ropa_doc_id": "uuid-xxxxxxxx"
}
```

**สิ่งที่เกิดขึ้น (Backend) — HARD DELETE:**
1. Insert บันทึกลงใน `deleted_document_logs` (เก็บ ropa_doc_id, doc_code, title, auditor, deleted_at) — เพื่อให้นับ `deleted_count` ใน Sidebar 3 stats ได้
2. `db.delete(doc)` — **ลบถาวรออกจาก DB ทันที** (CASCADE ลบ owner_record, processor_records, auditor_audits ด้วย)
3. เอกสารหายไปจากทุก sidebar ทันที **หาคืนไม่ได้**

> **UI:** ต้องมี popup ยืนยัน "คุณแน่ใจหรือไม่ว่าต้องการลบเอกสารนี้? การดำเนินการนี้ไม่สามารถยกเลิกได้" ก่อนเรียก DELETE

---

## Error Responses ทั่วไป

| HTTP Status | เกิดเมื่อไหร่ | ข้อความ |
|---|---|---|
| 401 | ไม่มี / token หมดอายุ | Unauthorized |
| 403 | Role ไม่ใช่ Auditor | Forbidden |
| 403 | ไม่มี AuditorProfile | `"ไม่พบข้อมูล Auditor Profile กรุณาติดต่อ Admin"` |
| 403 | พยายามลบเอกสารของ auditor อื่น | `"ไม่มีสิทธิ์ลบเอกสารนี้"` |
| 404 | ไม่พบเอกสาร | `"ไม่พบเอกสาร"` |
| 404 | Auditor ไม่ได้ assigned เอกสารนั้น | `"ไม่พบเอกสารนี้ หรือไม่มีสิทธิ์เข้าถึง"` |
| 422 | ลืมส่ง `expires_at` ตอนอนุมัติ | `"กรุณาระบุ expires_at (วันหมดอายุ) เมื่ออนุมัติเอกสาร"` |
| 400 | `form_type` ไม่ใช่ owner/processor | `"form_type ต้องเป็น 'owner' หรือ 'processor'"` |

---

## State Management แนะนำ

### Sidebar 2 — สิ่งที่ต้อง store ใน state ก่อน navigate ไปหน้าฟอร์ม

```typescript
// เมื่อกดปุ่มใน table row
selectedDocument = {
  ropa_doc_id: row.ropa_doc_id,
  form_type: row.form_type,   // "owner" | "processor"
  action: row.action           // "fill" | "view"
}
// แล้ว navigate ไปหน้า /auditor/documents/[ropa_doc_id]?form_type=[form_type]
```

### Sidebar 3 — สิ่งที่ต้อง store ก่อน navigate ไปหน้าดูเอกสาร

```typescript
// กดปุ่ม "ดูเอกสาร" ใน table
// เอกสาร Sidebar 3 → เลือก form_type อย่างไร?
// เนื่องจากเป็นการดูเพื่อลบ ไม่ได้แยก owner/processor
// แนะนำ: default เป็น form_type=owner ก่อน
// หรือ: แสดง tab เลือก owner / processor ในหน้าดูเอกสาร
selectedExpiredDoc = {
  ropa_doc_id: row.ropa_doc_id
}
```

---

## สรุป Endpoints ทั้งหมด

| # | Method | Path | Sidebar | ทำอะไร |
|---|---|---|---|---|
| 1 | GET | `/auditor/dashboard` | 1 | ดึง stats + กราฟ |
| 2 | GET | `/auditor/documents` | 2 | ดึงตารางเอกสาร (2 แถว/doc) |
| 3 | GET | `/auditor/documents/{id}?form_type=` | 2 | ดูฟอร์ม 6 ส่วน |
| 4 | POST | `/auditor/documents/{id}/submit-feedback` | 2 | ส่ง feedback (อนุมัติ/ตีกลับ) |
| 5 | GET | `/auditor/expired-documents` | 3 | ดึงตารางเอกสารหมดอายุ |
| 6 | GET | `/auditor/expired-documents/{id}?form_type=` | 3 | ดูฟอร์มก่อนลบ |
| 7 | DELETE | `/auditor/documents/{id}` | 3 | ลบเอกสารถาวร |

---

## การเชื่อมโยงกับ Data Owner และ Data Processor

### สิ่งที่ Auditor เห็นมาจากไหน

```
RoPA Document (สร้างโดย Data Owner)
  ├── owner_record        ← ฟอร์ม form_type="owner"   ที่แสดงในหน้าตรวจ
  ├── processor_records   ← ฟอร์ม form_type="processor" ที่แสดงในหน้าตรวจ
  └── auditor_audits      ← เก็บ feedback และสถานะของ Auditor
```

### ผลกระทบย้อนกลับไป Data Owner & Data Processor

| Auditor ทำ | Data Owner เห็น | Data Processor เห็น |
|---|---|---|
| อนุมัติทั้ง 2 ฟอร์ม | `doc.status = "approved"` (สีเขียว) | ไม่มีการเปลี่ยนแปลง |
| ตีกลับ owner form | `doc.status = "rejected_owner"` → ต้องแก้ไขใหม่ | ไม่มีการเปลี่ยนแปลง |
| ตีกลับ processor form | `doc.status = "rejected_processor"` | `ProcessorRecord.processor_status = "needs_revision"` → **badge แดง "ต้องแก้ไข"** ใน Data Processor Sidebar 1 และ 2 |
| ลบเอกสาร | เอกสารหายจากทุก view | เอกสารหายจากทุก view |

> **สำคัญ:** เมื่อ Auditor ตีกลับ processor form — status ที่เปลี่ยนคือ `ProcessorRecord.processor_status = "needs_revision"` ซึ่ง Data Processor จะเห็นเป็น badge สีแดงใน Sidebar 1 (รายการงานของฉัน) และ Sidebar 2 (ประวัติ) โดย **ไม่ต้องทำอะไรเพิ่มใน Auditor frontend** — backend จัดการให้

---

## ตัวอย่าง Full Flow (Sidebar 2)

```
1. Auditor เข้าหน้า /auditor/documents
   → GET /auditor/documents?time_range=30_days&page=1
   → แสดงตาราง 2 แถวต่อ doc

2. Auditor กดปุ่ม "กรอกข้อเสนอแนะ" ของ processor form ของ RP-2026-0900
   → Navigate ไป /auditor/documents/[uuid]?form_type=processor
   → GET /auditor/documents/[uuid]?form_type=processor

3. Auditor อ่านฟอร์ม 6 ส่วน (read-only)
   → พบปัญหาที่ section_2 และ section_5
   → กด "เพิ่มข้อเสนอแนะ" ท้าย section_2 → พิมพ์ comment
   → กด "เพิ่มข้อเสนอแนะ" ท้าย section_5 → พิมพ์ comment

4. กด "ส่งข้อเสนอแนะ"
   → POST /auditor/documents/[uuid]/submit-feedback
   Body: { form_type: "processor", feedbacks: [{...}, {...}] }

5. Backend:
   - audit.processor_review_status = "needs_revision"
   - doc.status = "rejected_processor"
   - ProcessorRecord.processor_status = "needs_revision"

6. Response: { action: "needs_revision" }
   → Frontend navigate กลับ /auditor/documents
   → แถว processor ของ RP-2026-0900 เปลี่ยนเป็น badge แดง "ต้องแก้ไข"
   → ปุ่มเปลี่ยนเป็น "ดูข้อเสนอแนะ" (action = "view")

7. ต่อมา Data Processor แก้ไขและส่งใหม่
   → เอกสารผ่าน workflow กลับมาถึง Auditor อีกครั้ง
   → แถว processor กลับเป็น "รอตรวจสอบ" (pending_review) ใหม่
```

# Frontend Integration Guide — Data Processor API

Base URL: `/api/v1`  
Authentication: ทุก request ต้องใส่ Header `Authorization: Bearer <access_token>`  
Role ที่ใช้ได้: `PROCESSOR` เท่านั้น

---

## สารบัญ

1. [ตารางเอกสาร (2 กลุ่ม)](#1-get-processortablesassigned--ตารางเอกสาร)
2. [ดูฟอร์ม Processor Section](#2-get-processordocumentsiddocument_idsection--ดูฟอร์ม)
3. [บันทึกฉบับร่าง](#3-patch-processordocumentsiddocument_idsection--บันทึกฉบับร่าง)
4. [บันทึก (Submit)](#4-post-processordocumentsiddocument_idsectionsubmit--บันทึก-submit)
5. [ดู Feedback จาก DO](#5-get-processordocumentsiddocument_idfeedbacks--ดู-feedback)
6. [ลบฉบับร่าง](#6-delete-processordocumentsiddocument_idsectiondraft--ลบฉบับร่าง)
7. [ส่งเอกสารให้ DO](#7-post-processordocumentsiddocument_idsend-to-do--ส่งเอกสารให้-do)

---

## Flow การทำงานของ Data Processor

```
[DP เข้าหน้าหลัก]
        |
        v
GET /tables/assigned
   ├── ตาราง "เอกสารที่ดำเนินการ" (แสดงทุกเอกสาร)
   └── ตาราง "ฉบับร่าง" (แสดงเฉพาะ DRAFT + NEEDS_FIX)
        |
        v (กดดูเอกสาร)
GET /documents/{id}/section
   └── โหลดฟอร์มทุก section พร้อม sub-tables
        |
        ├── PATCH /documents/{id}/section     (บันทึกฉบับร่าง ทำได้หลายครั้ง)
        |
        └── POST /documents/{id}/section/submit  (บันทึกสมบูรณ์ → status = SUBMITTED)
                 |
                 v (badge เปลี่ยนเป็น DP_DONE)
        POST /documents/{id}/send-to-do  (ส่งให้ DO ทราบ)

[ถ้า DO ส่ง feedback มา → badge = NEEDS_FIX]
        |
        v
GET /documents/{id}/feedbacks   (ดู feedback inline ในฟอร์ม)
        |
        v (แก้ไขฟอร์มแล้ว submit ใหม่)
POST /documents/{id}/section/submit  (feedback ถูก resolve อัตโนมัติ)
```

---

## Badge สถานะ DP (ProcessorStatusBadge)

Badge ที่แสดงในตาราง DP มีเพียง **3 ค่า** เท่านั้น:

| code | label | เงื่อนไข |
|------|-------|---------|
| `WAITING_DP` | รอ DP | ยังไม่มี section หรือ status = DRAFT |
| `DP_DONE` | DP ดำเนินการเสร็จสิ้น | status = SUBMITTED และไม่มี feedback OPEN |
| `NEEDS_FIX` | รอแก้ไข | มี feedback จาก DO/DPO ที่ status = OPEN อยู่ |

> ตรวจ `NEEDS_FIX` ก่อนเสมอ แม้ status = SUBMITTED แต่ถ้ามี feedback OPEN ก็แสดง NEEDS_FIX

---

## 1. GET /processor/tables/assigned — ตารางเอกสาร

**หน้า UI:** หน้าหลักของ Data Processor (sidebar เดียว)  
**เรียกเมื่อ:** เข้าหน้าหลัก หรือ refresh ตาราง

### Response `200`
```json
{
  "active": [
    {
      "document_id": "uuid",
      "document_number": "DFT-2025-01",
      "title": "string",
      "do_name": "string | null",
      "processor_section_id": "uuid | null",
      "processor_section_status": "DRAFT | SUBMITTED | null",
      "assignment_status": "IN_PROGRESS | SUBMITTED | OVERDUE",
      "due_date": "datetime | null",
      "received_at": "datetime",
      "status": {
        "label": "รอ DP",
        "code": "WAITING_DP"
      },
      "has_open_feedback": false,
      "created_at": "datetime"
    }
  ],
  "drafts": [
    {
      "document_id": "uuid",
      "document_number": "DFT-2025-01",
      "title": "string",
      "processor_section_id": "uuid | null",
      "last_saved_at": "datetime | null"
    }
  ]
}
```

### ตาราง active (เอกสารที่ดำเนินการ)
- แสดง **ทุกเอกสาร** ที่ DP ถูก assign ไม่ว่าสถานะจะเป็นอะไร
- ไม่แสดงเอกสารที่ `deletion_status = DELETED`
- actions ในตาราง:
  - **ดู** → เรียก `GET /documents/{id}/section`
  - **ส่งให้ DO** → เรียก `POST /documents/{id}/send-to-do` (แสดงเฉพาะเมื่อ `status.code = DP_DONE`)

### ตาราง drafts (ฉบับร่าง)
- แสดงเฉพาะเอกสารที่ `processor_section.status = DRAFT` หรือ `has_open_feedback = true`
- เอกสารที่ SUBMITTED โดยไม่มี feedback จะไม่ปรากฏในตารางนี้
- actions ในตาราง:
  - **แก้ไข** → เรียก `GET /documents/{id}/section` แล้วเปิดฟอร์ม
  - **ลบ** → เรียก `DELETE /documents/{id}/section/draft`

---

## 2. GET /processor/documents/{document_id}/section — ดูฟอร์ม

**หน้า UI:** หน้าฟอร์มกรอกข้อมูล Processor Section  
**เรียกเมื่อ:** กดดูหรือแก้ไขเอกสาร

### Response `200`
```json
{
  "id": "uuid",
  "document_id": "uuid",
  "processor_id": 1,
  "status": "DRAFT | SUBMITTED",
  "updated_at": "datetime",
  "do_suggestion": "string | null",

  "title_prefix": "string | null",
  "first_name": "string | null",
  "last_name": "string | null",
  "address": "string | null",
  "email": "string | null",
  "phone": "string | null",

  "processor_name": "string | null",
  "controller_address": "string | null",
  "processing_activity": "string | null",
  "purpose_of_processing": "string | null",

  "personal_data_items": [{ "id": "uuid", "type": "string", "other_description": "string | null" }],
  "data_categories": [{ "id": "uuid", "category": "string" }],
  "data_types": [{ "id": "uuid", "type": "string", "is_sensitive": false }],
  "collection_methods": [{ "id": "uuid", "method": "string" }],
  "data_sources": [{ "id": "uuid", "source": "string", "other_description": "string | null" }],
  "storage_types": [{ "id": "uuid", "type": "string" }],
  "storage_methods": [{ "id": "uuid", "method": "string", "other_description": "string | null" }],

  "data_source_other": "string | null",
  "retention_value": 1,
  "retention_unit": "YEARS | MONTHS | DAYS | null",
  "access_policy": "string | null",
  "deletion_method": "string | null",

  "legal_basis": "string | null",
  "has_cross_border_transfer": false,
  "transfer_country": "string | null",
  "transfer_in_group": "string | null",
  "transfer_method": "string | null",
  "transfer_protection_standard": "string | null",
  "transfer_exception": "string | null",

  "org_measures": "string | null",
  "access_control_measures": "string | null",
  "technical_measures": "string | null",
  "responsibility_measures": "string | null",
  "physical_measures": "string | null",
  "audit_measures": "string | null"
}
```

### หมายเหตุสำคัญ
- `do_suggestion` → แสดงเป็น read-only box บนหน้าฟอร์ม เขียนโดย DO เพื่อแนะนำ DP
- sub-tables (`personal_data_items` ฯลฯ) → ส่งกลับมาเป็น list พร้อม `id` สำหรับแสดงผล
- ถ้า section ยังไม่มีข้อมูล list จะเป็น `[]` (empty array)

### Error Cases
| Status | detail | สาเหตุ |
|--------|--------|--------|
| `403` | Access denied | DP คนนี้ไม่ได้ถูก assign เอกสารนี้ |
| `404` | ไม่พบ Processor Section | ยังไม่มี section (ปกติสร้างพร้อม document) |

---

## 3. PATCH /processor/documents/{document_id}/section — บันทึกฉบับร่าง

**หน้า UI:** ปุ่ม "บันทึกฉบับร่าง" ในฟอร์ม  
**เรียกเมื่อ:** DP กด "บันทึกฉบับร่าง" — status คงเป็น `DRAFT`

### Request Body
ส่งเฉพาะ field ที่ต้องการบันทึก ไม่จำเป็นต้องส่งครบทุก field

```json
{
  "title_prefix": "นาย",
  "first_name": "สมชาย",
  "last_name": "ใจดี",
  "address": "123 ถนนสุขุมวิท",
  "email": "somchai@example.com",
  "phone": "0812345678",

  "processor_name": "บริษัท ABC จำกัด",
  "controller_address": "456 ถนนพระราม 9",
  "processing_activity": "การประมวลผลข้อมูลลูกค้า",
  "purpose_of_processing": "วิเคราะห์พฤติกรรมการใช้งาน",

  "personal_data_items": [
    { "type": "ชื่อ-นามสกุล", "other_description": null }
  ],
  "data_categories": [
    { "category": "ข้อมูลทั่วไป" }
  ],
  "data_types": [
    { "type": "ข้อมูลประจำตัว", "is_sensitive": false }
  ],
  "collection_methods": [
    { "method": "แบบฟอร์มออนไลน์" }
  ],
  "data_sources": [
    { "source": "ลูกค้าโดยตรง", "other_description": null }
  ],
  "storage_types": [
    { "type": "Cloud" }
  ],
  "storage_methods": [
    { "method": "เข้ารหัส AES-256", "other_description": null }
  ],

  "data_source_other": null,
  "retention_value": 3,
  "retention_unit": "YEARS",
  "access_policy": "เฉพาะทีม IT เท่านั้น",
  "deletion_method": "ลบถาวรจากระบบ",

  "legal_basis": "ความยินยอม",
  "has_cross_border_transfer": false,
  "transfer_country": null,
  "transfer_in_group": null,
  "transfer_method": null,
  "transfer_protection_standard": null,
  "transfer_exception": null,

  "org_measures": "นโยบายความปลอดภัยข้อมูล",
  "access_control_measures": "ระบบ Role-based Access",
  "technical_measures": "Firewall + Encryption",
  "responsibility_measures": "DPO รับผิดชอบ",
  "physical_measures": "ล็อคห้อง Server",
  "audit_measures": "ตรวจสอบ Log รายเดือน"
}
```

> **Sub-tables:** ถ้าส่ง field ใด ระบบจะลบของเก่าทั้งหมดแล้ว insert ใหม่
> ถ้าไม่ส่ง field นั้น ข้อมูลเดิมยังคงอยู่
>
> ตัวอย่าง: ถ้า `personal_data_items` ไม่ได้ส่งมา → ข้อมูลเดิมไม่เปลี่ยน
> แต่ถ้าส่ง `personal_data_items: []` → ลบทุกรายการ

### Response `200`
ส่งกลับ `ProcessorSectionFullRead` เหมือนกับ `GET /section`

### Error Cases
| Status | detail | สาเหตุ |
|--------|--------|--------|
| `403` | Access denied | DP คนนี้ไม่มีสิทธิ์ |
| `404` | ไม่พบ Processor Section | ไม่มี section |

---

## 4. POST /processor/documents/{document_id}/section/submit — บันทึก (Submit)

**หน้า UI:** ปุ่ม "บันทึก" ในฟอร์ม  
**เรียกเมื่อ:** DP กด "บันทึก" — เปลี่ยน status เป็น `SUBMITTED`

### Request Body
เหมือนกับ PATCH ทุกอย่าง (ส่งข้อมูลทุก section พร้อมกัน)

### Response `200`
ส่งกลับ `ProcessorSectionFullRead` เหมือนกับ `GET /section`

### สิ่งที่เกิดขึ้นเมื่อ Submit
1. บันทึก scalar fields ทั้งหมด
2. อัปเดต sub-tables (replace-all)
3. เปลี่ยน `processor_section.status` → `SUBMITTED`
4. เปลี่ยน `processor_assignment.status` → `SUBMITTED`
5. **Auto-resolve feedback:** feedback ทุกรายการที่ `status = OPEN` และ `to_user_id = DP` → เปลี่ยนเป็น `RESOLVED` พร้อม set `resolved_at`
6. Badge ในตารางเปลี่ยนเป็น `DP_DONE` (ถ้าไม่มี feedback OPEN ใหม่)

### หลัง Submit สำเร็จ
- Redirect กลับตาราง "เอกสารที่ดำเนินการ"
- Badge จะแสดง `DP_DONE`
- เอกสารจะหายออกจากตาราง "ฉบับร่าง"

### Error Cases
| Status | detail | สาเหตุ |
|--------|--------|--------|
| `403` | Access denied | DP ไม่มีสิทธิ์ |
| `404` | ไม่พบ Processor Section | ไม่มี section |

---

## 5. GET /processor/documents/{document_id}/feedbacks — ดู Feedback

**หน้า UI:** แสดง inline ในฟอร์ม (ไม่ใช่ popup แยก)  
**เรียกเมื่อ:** เปิดหน้าฟอร์ม ถ้า `has_open_feedback = true` ให้ดึง feedback มาแสดง

### Response `200`
```json
[
  {
    "id": "uuid",
    "review_cycle_id": "uuid | null",
    "section_number": 2,
    "from_user_id": 5,
    "to_user_id": 3,
    "target_type": "PROCESSOR_SECTION",
    "target_id": "uuid",
    "field_name": "processor_name",
    "comment": "กรุณาระบุชื่อบริษัทให้ครบถ้วน",
    "status": "OPEN | RESOLVED",
    "created_at": "datetime",
    "resolved_at": "datetime | null"
  }
]
```

### วิธีแสดง Feedback ใน UI
- `section_number` → ไฮไลต์ section นั้นในฟอร์ม
- `field_name` → ไฮไลต์ field นั้นโดยเฉพาะ (ถ้ามี)
- `comment` → แสดงข้อความอธิบายใต้ field หรือใน banner
- `status = OPEN` → แสดง (ยังต้องแก้ไข)
- `status = RESOLVED` → ซ่อน หรือแสดงเป็น strikethrough (แก้แล้ว)

### หมายเหตุ
- DP รับ feedback เท่านั้น ไม่สามารถส่ง feedback เอง
- DP แก้ข้อมูลในฟอร์มแล้วกด "บันทึก" → feedback ถูก resolve อัตโนมัติ
- ถ้าไม่มี feedback จะได้ `[]` (empty array)

### Error Cases
| Status | detail | สาเหตุ |
|--------|--------|--------|
| `403` | Access denied | DP ไม่มีสิทธิ์ |

---

## 6. DELETE /processor/documents/{document_id}/section/draft — ลบฉบับร่าง

**หน้า UI:** ปุ่มลบในตาราง "ฉบับร่าง"  
**เรียกเมื่อ:** DP กดลบเอกสารในตาราง "ฉบับร่าง"

### Request Body
ไม่มี

### Response `200`
```json
{
  "message": "ล้างข้อมูลฉบับร่างสำเร็จ"
}
```

### สิ่งที่เกิดขึ้น
1. ล้าง scalar fields ทั้งหมดใน `ropa_processor_sections` เป็น `NULL`
2. ลบ sub-tables ทั้งหมด (personal_data_items, data_categories, ฯลฯ)
3. `status` ยังคงเป็น `DRAFT` (เอกสารยังอยู่ใน assignment ตามเดิม)
4. เอกสารยังปรากฏในตาราง "เอกสารที่ดำเนินการ" — แต่ badge เปลี่ยนเป็น `WAITING_DP`

> **ไม่ได้ลบเอกสาร** แค่ล้างข้อมูลที่กรอกไว้ทั้งหมด เหมือนเริ่มกรอกใหม่

### Error Cases
| Status | detail | สาเหตุ |
|--------|--------|--------|
| `403` | Access denied | DP ไม่มีสิทธิ์ |
| `404` | ไม่พบ Processor Section | ไม่มี section |
| `400` | ลบได้เฉพาะฉบับร่าง (DRAFT) เท่านั้น | status เป็น SUBMITTED แล้ว ลบไม่ได้ |

---

## 7. POST /processor/documents/{document_id}/send-to-do — ส่งเอกสารให้ DO

**หน้า UI:** ปุ่มส่งในตาราง "เอกสารที่ดำเนินการ"  
**เรียกเมื่อ:** DP กดส่งเอกสารให้ DO หลังจาก submit แล้ว

### Request Body
ไม่มี

### Response `200`
```json
{
  "message": "ส่งเอกสารให้ผู้รับผิดชอบข้อมูลสำเร็จ"
}
```

### เงื่อนไข
- `processor_section.status` ต้องเป็น `SUBMITTED` ก่อนเท่านั้น
- ถ้ายังเป็น `DRAFT` → error 400

### สิ่งที่เกิดขึ้น
- `processor_assignment.status` → `SUBMITTED` (ถ้ายังไม่ได้เปลี่ยน)
- DO จะเห็นว่า DP submit แล้วในตาราง Active ของ DO

### Error Cases
| Status | detail | สาเหตุ |
|--------|--------|--------|
| `403` | Access denied | DP ไม่มีสิทธิ์ |
| `404` | ไม่พบ Processor Section | ไม่มี section |
| `400` | ต้องบันทึกฟอร์มให้สมบูรณ์ก่อนส่ง | status ยังเป็น DRAFT |

---

## สรุป Endpoint ทั้งหมด

| Method | Path | หน้า UI | เรียกเมื่อ |
|--------|------|---------|----------|
| `GET` | `/processor/tables/assigned` | หน้าหลัก | เข้าหน้าหลัก |
| `GET` | `/processor/documents/{id}/section` | หน้าฟอร์ม | กดดู/แก้ไขเอกสาร |
| `PATCH` | `/processor/documents/{id}/section` | หน้าฟอร์ม | กด "บันทึกฉบับร่าง" |
| `POST` | `/processor/documents/{id}/section/submit` | หน้าฟอร์ม | กด "บันทึก" |
| `GET` | `/processor/documents/{id}/feedbacks` | หน้าฟอร์ม (inline) | เปิดฟอร์มที่มี feedback |
| `DELETE` | `/processor/documents/{id}/section/draft` | ตารางฉบับร่าง | กดลบ |
| `POST` | `/processor/documents/{id}/send-to-do` | ตารางเอกสาร | กดส่งให้ DO |

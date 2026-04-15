# คู่มือ Frontend — Auditor

> เอกสารนี้สำหรับนักพัฒนา Frontend ที่ทำหน้าจอฝั่ง **Auditor**
> อธิบายทุก API endpoint พร้อม request/response ตัวอย่าง, โครงสร้างหน้าจอ, และ business logic ทั้งหมด

**Base URL**: `/auditor`
**Role ที่ต้องมี**: `Auditor`
**Auth**: ต้องแนบ `Authorization: Bearer <token>` ทุก request

---

## โครงสร้างหน้าจอโดยรวม

```
Sidebar 1 — แดชบอร์ด               (GET /auditor/dashboard)
Sidebar 2 — เอกสาร                 (GET /auditor/documents)
  └── ดูฟอร์ม 6 ส่วน              (GET /auditor/documents/{ropa_doc_id}?form_type=owner|processor)
       └── ส่งข้อเสนอแนะ          (POST /auditor/documents/{ropa_doc_id}/submit-feedback)
Sidebar 3 — เอกสารครบกำหนด        (GET /auditor/expired-documents)
  ├── ดูฟอร์มเอกสารครบกำหนด      (GET /auditor/expired-documents/{ropa_doc_id}?form_type=owner|processor)
  └── ลบเอกสาร                    (DELETE /auditor/documents/{ropa_doc_id})
```

---

## แนวคิดสำคัญ — 1 เอกสาร = 2 ไฟล์

เอกสาร RoPA 1 ฉบับ (`ropa_doc_id` เดียวกัน) มี **2 ไฟล์แยกกัน**:
- **ไฟล์ owner** = ฟอร์มที่ Data Owner กรอก → `form_type: "owner"`, รหัสไฟล์: `RP-2026-0001`
- **ไฟล์ processor** = ฟอร์มที่ Data Processor กรอก → `form_type: "processor"`, รหัสไฟล์: `RP-2026-0002`

Auditor ตรวจและอนุมัติ **แยกกันอิสระ** — อนุมัติ owner ก่อน processor ก็ได้ ไม่ต้องรอพร้อมกัน

```
เอกสาร RP-2026-1000 (ropa_doc_id: abc-123)
  ├── ไฟล์ Owner     (file_code: RP-2026-0001) → form_type: "owner"
  └── ไฟล์ Processor (file_code: RP-2026-0002) → form_type: "processor"
```

---

## Sidebar 1 — แดชบอร์ด

### `GET /auditor/dashboard`

แสดงสรุปภาพรวม: จำนวนไฟล์ทั้งหมด, ไฟล์รอตรวจ, กราฟรายเดือน

**Query Parameters**

| Parameter | ค่าที่รับได้ | ค่าเริ่มต้น | คำอธิบาย |
|---|---|---|---|
| `time_range` | `7_days` / `30_days` / `90_days` / `all` | `30_days` | ช่วงเวลาของ stats (ไม่ใช้กับกราฟ) |

**Response 200**

```json
{
  "total_documents": 24,
  "pending_review": 6,
  "monthly_trend": [
    {"month": 1, "this_year": 4, "last_year": 2},
    {"month": 2, "this_year": 6, "last_year": 3},
    {"month": 3, "this_year": 8, "last_year": 5},
    {"month": 4, "this_year": 6, "last_year": 4},
    {"month": 5, "this_year": 0, "last_year": 3},
    ...
    {"month": 12, "this_year": 0, "last_year": 2}
  ]
}
```

**คำอธิบาย Fields**

| Field | คำอธิบาย |
|---|---|
| `total_documents` | จำนวน**ไฟล์**ทั้งหมด = จำนวน audit records × 2 (เพราะ 1 เอกสาร = 2 ไฟล์) |
| `pending_review` | จำนวนไฟล์ที่รอตรวจ — นับ owner และ processor แยกกัน (ไม่ผูกกัน) |
| `monthly_trend` | กราฟ 12 เดือน (ทั้งปี ไม่ filter time_range) — 1 = มกราคม, 12 = ธันวาคม |
| `monthly_trend[].this_year` | จำนวนไฟล์ที่ส่งมาในเดือนนั้นปีนี้ |
| `monthly_trend[].last_year` | จำนวนไฟล์ที่ส่งมาในเดือนนั้นปีที่แล้ว |

---

## Sidebar 2 — เอกสาร

### `GET /auditor/documents`

รายการเอกสารที่ assigned ให้ Auditor คนนี้ — แสดง **2 แถวต่อ 1 เอกสาร** (owner row + processor row)

**Query Parameters**

| Parameter | ค่าที่รับได้ | ค่าเริ่มต้น | คำอธิบาย |
|---|---|---|---|
| `time_range` | `7_days` / `30_days` / `90_days` / `all` | `30_days` | ช่วงเวลา |
| `date_from` | datetime | — | กรองตั้งแต่วันที่ส่งมาตรวจ |
| `page` | int | `1` | หน้าปัจจุบัน |
| `page_size` | int | `10` | จำนวนแถวต่อหน้า |

**Response 200**

```json
{
  "stats": {
    "pending_feedback": 4,
    "pending_since_yesterday": 2
  },
  "records": [
    {
      "ropa_doc_id": "abc-123-...",
      "doc_code": "RP-2026-0001",
      "title": "ข้อมูลลูกค้า",
      "form_type": "owner",
      "form_label": "ผู้รับผิดชอบข้อมูล",
      "received_at": "2026-04-01T08:00:00Z",
      "sent_at": null,
      "action": "fill",
      "review_status": "pending_review"
    },
    {
      "ropa_doc_id": "abc-123-...",
      "doc_code": "RP-2026-0002",
      "title": "ข้อมูลลูกค้า",
      "form_type": "processor",
      "form_label": "ผู้ประมวลผลข้อมูลส่วนบุคคล",
      "received_at": "2026-04-01T08:00:00Z",
      "sent_at": "2026-04-03T14:00:00Z",
      "action": "view",
      "review_status": "approved"
    }
  ],
  "total": 20,
  "page": 1,
  "page_size": 10
}
```

**คำอธิบาย Fields**

| Field | คำอธิบาย |
|---|---|
| `stats.pending_feedback` | จำนวนไฟล์ที่ยังรอ feedback (owner และ processor นับแยกกัน) |
| `stats.pending_since_yesterday` | จำนวนไฟล์ที่เพิ่มขึ้นตั้งแต่เมื่อวาน (received วันนี้) |
| `ropa_doc_id` | UUID ของเอกสาร — ใช้ใน GET /documents/{id} และ POST submit-feedback |
| `doc_code` | รหัสไฟล์เฉพาะตัว (ไม่ใช่รหัสเอกสาร) เช่น `RP-2026-0001` (owner) / `RP-2026-0002` (processor) |
| `form_type` | `"owner"` หรือ `"processor"` — ใช้ส่งเป็น query param ใน GET /documents/{id} |
| `form_label` | ชื่อแสดงภาษาไทย |
| `received_at` | วันที่ไฟล์นั้นถูกส่งมาให้ตรวจ (owner/processor แยกกัน) |
| `sent_at` | วันที่ Auditor ส่ง feedback — null ถ้ายังไม่ได้ส่ง |
| `action` | `"fill"` = กรอกข้อเสนอแนะ (ยังไม่ตรวจ), `"view"` = ดูข้อเสนอแนะ (ตรวจแล้ว) |
| `review_status` | `"pending_review"` / `"approved"` / `"needs_revision"` |

---

## ดูฟอร์ม 6 ส่วน

### `GET /auditor/documents/{ropa_doc_id}`

ดูฟอร์มข้อมูลทั้ง 6 ส่วน — ใช้เมื่อกดปุ่ม "กรอกข้อเสนอแนะ" หรือ "ดูข้อเสนอแนะ"

**Query Parameters** (บังคับส่ง)

| Parameter | ค่าที่รับได้ | คำอธิบาย |
|---|---|---|
| `form_type` | `owner` / `processor` | บอกว่าต้องการดูฟอร์มของใคร |

**Response 200**

```json
{
  "ropa_doc_id": "abc-123-...",
  "doc_code": "RP-2026-0001",
  "title": "ข้อมูลลูกค้า",
  "last_modified": "2026-04-02T10:00:00Z",
  "auditor_name": "วิชัย ตรวจสอบ",
  "form_type": "owner",
  "form_label": "ผู้รับผิดชอบข้อมูล",
  "review_status": "pending_review",
  "form_data": {
    "record_name": "สมชาย ใจดี",
    "address": "123 ถ.สุขุมวิท",
    "email": "somchai@example.com",
    "phone": "02-123-4567",
    "data_subject_name": "ลูกค้า",
    "processing_activity": "ระบบ CRM",
    "purpose": "บริหารความสัมพันธ์ลูกค้า",
    "personal_data": "ชื่อ, เบอร์โทร, อีเมล",
    "data_category": "ทั่วไป",
    "data_type": "general",
    "collection_method": "electronic",
    "source_direct": true,
    "source_indirect": false,
    "retention_storage_type": "cloud",
    "retention_method": "ระบบ CRM",
    "retention_duration": 5,
    "retention_access_control": "เฉพาะเจ้าหน้าที่",
    "retention_deletion_method": "ลบถาวร",
    "legal_basis": "ฐานสัญญา",
    "minor_under10": false,
    "minor_10to20": false,
    "transfer_is_transfer": false,
    "transfer_country": null,
    "transfer_company_name": null,
    "transfer_method": null,
    "transfer_protection_std": null,
    "transfer_exception": null,
    "exemption_disclosure": null,
    "rejection_note": null,
    "security_organizational": "นโยบายความปลอดภัย",
    "security_technical": "AES-256",
    "security_physical": "ห้องล็อค",
    "security_access_control": "RBAC",
    "security_responsibility": "แผนกไอที",
    "security_audit": "ตรวจสอบทุก 6 เดือน"
  },
  "feedbacks": [
    {
      "section": "section_2",
      "section_label": "ส่วนที่ 2 : รายละเอียดกิจกรรม",
      "comment": "กรุณาระบุวัตถุประสงค์ให้ชัดเจนยิ่งขึ้น"
    }
  ]
}
```

**คำอธิบาย Fields สำคัญ**

| Field | คำอธิบาย |
|---|---|
| `doc_code` | รหัสไฟล์ (file_code) — เช่น `RP-2026-0001` สำหรับ owner |
| `form_data` | ข้อมูลฟอร์มทั้ง 6 ส่วน (อ่านอย่างเดียว — Auditor แก้ไขไม่ได้) |
| `feedbacks` | feedback ที่เคยส่งไว้ก่อนหน้า (ถ้ามี) — แสดงเป็น read-only |
| `review_status` | สถานะการตรวจฟอร์มนี้: `pending_review` / `approved` / `needs_revision` |

---

## ส่งข้อเสนอแนะ / อนุมัติ

### `POST /auditor/documents/{ropa_doc_id}/submit-feedback`

ส่ง feedback หลังตรวจฟอร์ม — กด "อนุมัติ" หรือ "ตีกลับ"

**Request Body**

```json
{
  "form_type": "owner",
  "feedbacks": []
}
```

| Field | Type | Required | คำอธิบาย |
|---|---|---|---|
| `form_type` | string | ✅ | `"owner"` หรือ `"processor"` |
| `feedbacks` | array | ✅ | **ถ้าว่าง `[]` = อนุมัติ**, ถ้ามีข้อมูล = ตีกลับ |

**กรณี 1: อนุมัติ** (feedbacks = [])

```json
{
  "form_type": "owner",
  "feedbacks": []
}
```

**กรณี 2: ตีกลับ** (feedbacks มีข้อมูล)

```json
{
  "form_type": "processor",
  "feedbacks": [
    {
      "section": "section_5",
      "section_label": "ส่วนที่ 5 : ฐานทางกฎหมายและการส่งต่อ",
      "comment": "กรุณายืนยัน SCCs สำหรับการส่งข้อมูลต่างประเทศ"
    },
    {
      "section": "section_6",
      "section_label": "ส่วนที่ 6 : มาตรการรักษาความมั่นคงปลอดภัย (TOMs)",
      "comment": "กรุณาระบุวิธีการเข้ารหัสข้อมูลให้ชัดเจน"
    }
  ]
}
```

**Response 200**

```json
{
  "message": "อนุมัติเรียบร้อย",
  "ropa_doc_id": "abc-123-...",
  "action": "approved"
}
```

หรือ

```json
{
  "message": "ส่งข้อเสนอแนะเรียบร้อย",
  "ropa_doc_id": "abc-123-...",
  "action": "needs_revision"
}
```

**สิ่งที่ Backend ทำ — Auditor ไม่ต้องกรอกวันหมดอายุ**

| กรณี | form_type | ผลที่เกิด |
|---|---|---|
| อนุมัติ | `owner` | `owner_review_status = approved`, คำนวณ `owner_expires_at` อัตโนมัติจาก `retention_duration` (ปี) |
| อนุมัติ | `processor` | `processor_review_status = approved`, คำนวณ `processor_expires_at` อัตโนมัติจาก `retention_duration` + `retention_duration_unit` |
| ทั้ง 2 อนุมัติ | — | `audit_status = APPROVED`, `doc.status = APPROVED` |
| ตีกลับ | `owner` | `owner_review_status = needs_revision`, `doc.status = REJECTED_OWNER` |
| ตีกลับ | `processor` | `processor_review_status = needs_revision`, `doc.status = REJECTED_PROCESSOR`, `ProcessorRecord.processor_status = NEEDS_REVISION` |

**การคำนวณวันหมดอายุ (expires_at)**

Backend คำนวณเองอัตโนมัติตอนอนุมัติ — **Auditor ไม่ต้องกรอก**:

| form_type | ดึงข้อมูลจาก | หน่วย | ตัวอย่าง |
|---|---|---|---|
| `owner` | `owner_records.retention_duration` | **ปี เท่านั้น** | retention_duration=5 → อนุมัติ 9 เม.ย. 2026 → หมดอายุ 9 เม.ย. 2031 |
| `processor` | `processor_records.retention_duration` + `retention_duration_unit` | `year` / `month` / `day` | retention_duration=3, unit=year → หมดอายุ 3 ปีหลังวันอนุมัติ |

**ข้อสำคัญ**: ตีกลับ (needs_revision) ไม่แตะ expires_at เลย — วันหมดอายุจะ set เฉพาะตอนอนุมัติ

---

## Sidebar 3 — เอกสารครบกำหนด

### `GET /auditor/expired-documents`

รายการไฟล์ที่ครบกำหนดอายุ — แสดง **แยกต่อไฟล์** (ไม่ใช่ต่อเอกสาร)

**หมายเหตุสำคัญ**: 1 เอกสารสามารถปรากฏ **2 แถว** ได้ ถ้าทั้ง owner file และ processor file ต่างหมดอายุ

**Query Parameters**

| Parameter | ค่าที่รับได้ | ค่าเริ่มต้น | คำอธิบาย |
|---|---|---|---|
| `time_range` | `7_days` / `30_days` / `90_days` / `all` | `30_days` | กรองตาม expires_at |
| `date_from` | datetime | — | กรองตั้งแต่วันที่หมดอายุ |
| `page` | int | `1` | หน้าปัจจุบัน |
| `page_size` | int | `10` | จำนวนแถวต่อหน้า |

**Response 200**

```json
{
  "stats": {
    "expired_count": 5,
    "deleted_count": 12
  },
  "records": [
    {
      "ropa_doc_id": "abc-123-...",
      "doc_code": "RP-2026-0001",
      "title": "ข้อมูลลูกค้า",
      "form_type": "owner",
      "form_label": "ผู้รับผิดชอบข้อมูล",
      "expires_at": "2026-03-31T00:00:00Z"
    },
    {
      "ropa_doc_id": "abc-123-...",
      "doc_code": "RP-2026-0002",
      "title": "ข้อมูลลูกค้า",
      "form_type": "processor",
      "form_label": "ผู้ประมวลผลข้อมูลส่วนบุคคล",
      "expires_at": "2026-02-15T00:00:00Z"
    },
    {
      "ropa_doc_id": "def-456-...",
      "doc_code": "RP-2026-0003",
      "title": "ข้อมูลพนักงาน",
      "form_type": "owner",
      "form_label": "ผู้รับผิดชอบข้อมูล",
      "expires_at": "2026-04-01T00:00:00Z"
    }
  ],
  "total": 5,
  "page": 1,
  "page_size": 10
}
```

**คำอธิบาย Fields**

| Field | คำอธิบาย |
|---|---|
| `stats.expired_count` | จำนวน**ไฟล์** (ไม่ใช่เอกสาร) ที่ครบกำหนดแล้ว |
| `stats.deleted_count` | จำนวนเอกสารที่ Auditor ลบแล้ว (hard delete ทั้งเอกสาร) |
| `doc_code` | รหัสไฟล์เฉพาะตัว เช่น `RP-2026-0001` (owner) / `RP-2026-0002` (processor) |
| `form_type` | `"owner"` หรือ `"processor"` — บอกว่าเป็นไฟล์ไหน |
| `form_label` | ชื่อแสดงภาษาไทย |
| `expires_at` | วันที่ครบกำหนดของไฟล์นั้นๆ (เรียงจากหมดอายุก่อน) |

---

## ดูฟอร์มเอกสารครบกำหนด

### `GET /auditor/expired-documents/{ropa_doc_id}`

ดูฟอร์มเอกสารครบกำหนด — เหมือน GET /documents/{id} แต่ไม่มี feedback section และมีปุ่ม "ลบเอกสาร"

**Query Parameters** (บังคับส่ง)

| Parameter | ค่าที่รับได้ | คำอธิบาย |
|---|---|---|
| `form_type` | `owner` / `processor` | บอกว่าต้องการดูไฟล์ไหน |

**Response 200** (รูปแบบเหมือน GET /documents/{id} แต่ feedbacks = [])

```json
{
  "ropa_doc_id": "abc-123-...",
  "doc_code": "RP-2026-0001",
  "title": "ข้อมูลลูกค้า",
  "last_modified": "2026-03-31T10:00:00Z",
  "auditor_name": "วิชัย ตรวจสอบ",
  "form_type": "owner",
  "form_label": "ผู้รับผิดชอบข้อมูล",
  "review_status": "approved",
  "form_data": { ... },
  "feedbacks": []
}
```

**หมายเหตุ**: `review_status` จะเป็น `"approved"` เสมอ (เอกสารที่มาถึง Sidebar 3 ต้องผ่านการอนุมัติแล้ว)

---

## ลบเอกสาร

### `DELETE /auditor/documents/{ropa_doc_id}`

ลบเอกสาร **Hard Delete** — ลบออกจาก DB จริง พร้อม CASCADE ทุก record ที่เกี่ยวข้อง

**Response 200**

```json
{
  "message": "ลบเอกสารเรียบร้อย",
  "ropa_doc_id": "abc-123-..."
}
```

**สิ่งที่ Backend ทำ**

1. บันทึก log ลง `deleted_document_logs` (เก็บ `ropa_doc_id`, `doc_code`, `title`) ก่อนลบ
2. `db.delete(doc)` → CASCADE ลบ `owner_records`, `processor_records`, `auditor_audits` ทั้งหมดด้วย
3. `deleted_count` ใน stats จะเพิ่มขึ้น 1

**ผลหลังลบ**: เอกสารหายจากทุก Sidebar ทันที

---

## review_status ทั้งหมด

| ค่า | ความหมาย | สีแนะนำ |
|---|---|---|
| `pending_review` | รอตรวจสอบ | เหลือง / amber |
| `approved` | อนุมัติ | เขียว |
| `needs_revision` | ต้องแก้ไข | แดง |

---

## action ใน Sidebar 2

| ค่า | ความหมาย | UI |
|---|---|---|
| `fill` | ยังไม่ได้ตรวจ — กรอกข้อเสนอแนะ | ปุ่ม "กรอกข้อเสนอแนะ" (enabled) |
| `view` | ตรวจแล้ว — ดูข้อเสนอแนะ | ปุ่ม "ดูข้อเสนอแนะ" |

---

## Flow การทำงานทั้งหมด

```
Data Owner ส่งเอกสารให้ Auditor
  → AuditorAudit ถูกสร้าง
  → doc.status = PENDING_AUDITOR
  ↓
Sidebar 2 — เห็น 2 แถว (owner + processor) สถานะ "รอตรวจสอบ"
  ↓
กดปุ่ม "กรอกข้อเสนอแนะ"
  → GET /documents/{ropa_doc_id}?form_type=owner|processor
  → ดูข้อมูลฟอร์ม 6 ส่วน
  ↓
เลือก:
  [อนุมัติ] → POST submit-feedback {feedbacks: []}
    → backend คำนวณ expires_at อัตโนมัติ
    → review_status = approved
    → ถ้าทั้ง 2 ฟอร์ม approved → doc.status = APPROVED
    → Sidebar 2: action = "view", review_status = "approved"

  [ตีกลับ] → POST submit-feedback {feedbacks: [{section, comment}, ...]}
    → review_status = needs_revision
    → doc.status = REJECTED_OWNER / REJECTED_PROCESSOR
    → Sidebar 2: action = "view", review_status = "needs_revision"
  ↓
(อนุมัติทั้ง 2 ฟอร์มแล้ว — รอวันครบกำหนด)
  ↓
Sidebar 3 — ปรากฏเมื่อ expires_at <= วันนี้
  → แสดงแยกแถวต่อไฟล์
  ↓
กดปุ่ม "ดูเอกสาร"
  → GET /expired-documents/{ropa_doc_id}?form_type=owner|processor
  ↓
กดปุ่ม "ลบเอกสาร" (hard delete)
  → DELETE /documents/{ropa_doc_id}
  → เอกสารหายจากทุก Sidebar
  → deleted_count เพิ่ม 1
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
| 400 | form_type ไม่ใช่ `owner` หรือ `processor` |
| 403 | ไม่พบ AuditorProfile (ต้องให้ Admin สร้างก่อน) |
| 404 | ไม่พบเอกสาร หรือไม่ได้รับ assign เอกสารนี้ |

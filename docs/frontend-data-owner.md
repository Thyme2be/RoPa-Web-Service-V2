# Frontend Integration Guide — Data Owner API

Base URL: `/api/v1`  
Authentication: ทุก request ต้องใส่ Header `Authorization: Bearer <access_token>`  
Role ที่ใช้ได้: `OWNER` เท่านั้น (ยกเว้น Processor routes ที่ใช้ role `PROCESSOR`)

---

## สารบัญ

1. [สร้างเอกสาร](#1-post-ownerdocuments--สร้างเอกสาร)
2. [Dashboard](#2-get-ownerdashboard--dashboard)
3. [ตาราง Active](#3-get-ownertablesactive--ตาราง-active)
4. [ตาราง Sent-to-DPO](#4-get-ownertablessent-to-dpo--ตาราง-sent-to-dpo)
5. [ตาราง Approved](#5-get-ownertablesapproved--ตาราง-approved)
6. [ตาราง Destroyed](#6-get-ownertablesdestroyed--ตาราง-destroyed)
7. [ดู Owner Section (Tab 1)](#7-get-ownerdocumentsiddocument_idsection--ดู-owner-section)
8. [บันทึกฉบับร่าง](#8-patch-ownerdocumentsiddocument_idsection--บันทึกฉบับร่าง)
9. [บันทึก (Submit)](#9-post-ownerdocumentsiddocument_idsectionsubmit--บันทึก-submit)
10. [ส่งให้ DPO](#10-post-ownerdocumentsiddocument_idsend-to-dpo--ส่งให้-dpo)
11. [ส่งแก้ไขคืน DPO](#11-post-ownerdocumentsiddocument_idsend-back-to-dpo--ส่งแก้ไขคืน-dpo)
12. [ส่งตรวจสอบรายปี](#12-post-ownerdocumentsiddocument_idannual-review--ส่งตรวจสอบรายปี)
13. [ดู Processor Section (Tab 2)](#13-get-ownerdocumentsiddocument_idprocessor-section--ดู-processor-section-tab-2)
14. [แก้ไขคำแนะนำถึง DP](#14-patch-ownerdocumentsiddocument_idprocessor-sectionsuggestion--แก้ไขคำแนะนำถึง-dp)
15. [ส่ง Feedback ให้ DP](#15-post-ownerdocumentsiddocument_idprocessor-sectionfeedback--ส่ง-feedback-ให้-dp)
16. [ดู Risk Assessment (Tab 3)](#16-get-ownerdocumentsiddocument_idrisk--ดู-risk-assessment)
17. [บันทึก Risk Assessment](#17-post-ownerdocumentsiddocument_idrisk--บันทึก-risk-assessment)
18. [ดู Deletion Request (Tab 4)](#18-get-ownerdocumentsiddocument_iddeletion--ดู-deletion-request)
19. [ยื่นคำร้องขอทำลาย](#19-post-ownerdocumentsiddocument_iddeletion--ยื่นคำร้องขอทำลาย)

---

## 1. POST /owner/documents — สร้างเอกสาร

**หน้า UI:** Modal "สร้างเอกสาร"  
**เรียกเมื่อ:** กดปุ่ม "สร้าง" ใน modal

### Request Body
```json
{
  "title": "string (required)",
  "description": "string | null",
  "review_interval_days": 365,
  "due_date": "2025-12-31T00:00:00Z | null",
  "processor_company": "string | null",
  "assigned_processor_id": 1
}
```

| Field | Required | หมายเหตุ |
|-------|----------|---------|
| `title` | ✅ | ชื่อเอกสาร |
| `assigned_processor_id` | ✅ | user.id ของ DP ที่จะ assign (ต้องมี role = PROCESSOR) |
| `review_interval_days` | ❌ | default 365 (ทบทวนรายปี) |
| `due_date` | ❌ | วันกำหนดส่ง |
| `processor_company` | ❌ | ชื่อบริษัทของ DP |

### Response `201 Created`
```json
{
  "document_id": "uuid",
  "document_number": "DFT-2025-01",
  "message": "สร้างเอกสารสำเร็จ"
}
```

> หลังสร้างสำเร็จ → redirect ไปหน้าตาราง Active หรือเปิดฟอร์ม Owner Section

---

## 2. GET /owner/dashboard — Dashboard

**หน้า UI:** หน้าแดชบอร์ด  
**เรียกเมื่อ:** เข้าหน้าแดชบอร์ด

### Response `200`
```json
{
  "total_documents": 25,
  "needs_fix_do_count": 2,
  "needs_fix_dp_count": 1,
  "risk_low_count": 10,
  "risk_medium_count": 8,
  "risk_high_count": 3,
  "under_review_storage_count": 4,
  "under_review_deletion_count": 1,
  "pending_do_count": 3,
  "pending_dp_count": 5,
  "completed_count": 12,
  "sensitive_document_count": 6,
  "overdue_destruction_count": 2,
  "annual_reviewed_count": 7,
  "annual_not_reviewed_count": 3,
  "destruction_due_count": 2,
  "deleted_count": 8
}
```

| Field | Card UI | คำอธิบาย |
|-------|---------|---------|
| `total_documents` | Card รวมทั้งหมด | เอกสารทั้งหมดที่ DO นี้สร้าง |
| `needs_fix_do_count` | Card ต้องแก้ไข (DO) | DPO ส่ง review กลับมาให้ DO แก้ไข (ReviewAssignment role=OWNER, FIX_IN_PROGRESS) |
| `needs_fix_dp_count` | Card ต้องแก้ไข (DP) | DP ต้องแก้ไข ไม่ว่า feedback จะมาจาก **DO หรือ DPO** ก็ตาม (นับ distinct document) |
| `risk_low_count` | Donut chart ความเสี่ยง | score < 8 |
| `risk_medium_count` | Donut chart ความเสี่ยง | score 8–14 |
| `risk_high_count` | Donut chart ความเสี่ยง | score ≥ 15 |
| `under_review_storage_count` | Card รอ DPO (จัดเก็บ) | UNDER_REVIEW ปกติ |
| `under_review_deletion_count` | Card รอ DPO (ทำลาย) | deletion_status = DELETE_PENDING |
| `pending_do_count` | Card รอดำเนินการ (DO) | IN_PROGRESS + owner_section.status = DRAFT |
| `pending_dp_count` | Card รอดำเนินการ (DP) | IN_PROGRESS + processor_section.status = DRAFT |
| `completed_count` | Card อนุมัติแล้ว | status = COMPLETED |
| `sensitive_document_count` | Card ข้อมูลอ่อนไหว | DO ติ๊กช่อง "ข้อมูลอ่อนไหว" ใน Section 4 ของฟอร์ม (owner_data_types มีอย่างน้อย 1 รายการที่ is_sensitive = true) |
| `overdue_destruction_count` | Card ล่าช้า | เอกสาร IN_PROGRESS ที่เลย `due_date` (วันกำหนดส่งที่ DO ตั้งตอนสร้าง) แล้ว แต่ DP ยังไม่ submit |
| `annual_reviewed_count` | Card รายปี (ตรวจแล้ว) | COMPLETED ที่ DO เคยกดส่งตรวจรายปีและ DPO อนุมัติแล้วอย่างน้อย 1 รอบ (review cycle_number > 1 และ APPROVED) |
| `annual_not_reviewed_count` | Card รายปี (ยังไม่ตรวจ) | COMPLETED ที่ครบกำหนดทบทวนรายปีแล้ว (`วันที่ DPO อนุมัติ + review_interval_days ≤ วันนี้`) แต่ DO ยังไม่ได้กดส่งตรวจใหม่ |
| `destruction_due_count` | Card ครบกำหนดทำลาย | COMPLETED ที่ retention period (จากฟอร์ม DO Section 5 หรือ DP Section 4) ครบกำหนดแล้ว แต่ยังไม่ยื่นขอทำลาย |
| `deleted_count` | Card ถูกทำลายแล้ว | deletion_status = DELETED |

---

## 3. GET /owner/tables/active — ตาราง Active

**หน้า UI:** ตาราง 1 — เอกสาร Active (IN_PROGRESS)  
**เรียกเมื่อ:** เข้าหน้าตารางเอกสาร tab "Active"

### Response `200` — Array
```json
[
  {
    "document_id": "uuid",
    "document_number": "DFT-2025-01",
    "title": "string",
    "dp_name": "string | null",
    "dp_company": "string | null",
    "owner_status": {
      "label": "รอส่วนของ Data Owner",
      "code": "WAITING_DO"
    },
    "processor_status": {
      "label": "รอส่วนของ Data Processor",
      "code": "WAITING_DP"
    },
    "due_date": "datetime | null",
    "created_at": "datetime",
    "owner_section_id": "uuid | null",
    "owner_section_status": "DRAFT | SUBMITTED | null",
    "processor_section_id": "uuid | null",
    "processor_section_status": "DRAFT | SUBMITTED | null"
  }
]
```

**`owner_status.code` ที่เป็นไปได้:**
| code | label | ความหมาย |
|------|-------|---------|
| `WAITING_DO` | รอส่วนของ Data Owner | DO ยังไม่ submit |
| `DO_DONE` | Data Owner ดำเนินการเสร็จสิ้น | DO submit แล้ว |
| `NEEDS_FIX` | รอแก้ไขจาก Data Owner | DPO ส่ง review กลับมา |
| `FIX_SENT` | ส่งการแก้ไขแล้ว | DO ส่งแก้ไขคืน DPO แล้ว |

**Actions ในแถว:**
- 👁️ ดูฟอร์ม → `GET /owner/documents/{document_id}/section`
- ✈️ ส่ง DPO → `POST /owner/documents/{document_id}/send-to-dpo` (เปิดใช้ได้เมื่อ owner + processor ทั้งคู่ SUBMITTED และมี Risk Assessment)

---

## 4. GET /owner/tables/sent-to-dpo — ตาราง Sent-to-DPO

**หน้า UI:** ตาราง 2 — เอกสารที่ส่ง DPO แล้ว (UNDER_REVIEW)

### Response `200` — Array
```json
[
  {
    "document_id": "uuid",
    "document_number": "RP-2025-01",
    "title": "string",
    "dpo_name": "string | null",
    "review_status": "IN_REVIEW | APPROVED | CHANGES_REQUESTED",
    "review_assignment_status": "FIX_IN_PROGRESS | FIX_SUBMITTED | null",
    "sent_at": "datetime | null",
    "reviewed_at": "datetime | null",
    "due_date": "datetime | null"
  }
]
```

**Actions ในแถว:**
- 👁️ ดูฟอร์ม
- ✈️ ส่งแก้ไขคืน DPO → `POST /owner/documents/{document_id}/send-back-to-dpo` (เปิดได้เมื่อ review_assignment_status = `FIX_IN_PROGRESS`)

---

## 5. GET /owner/tables/approved — ตาราง Approved

**หน้า UI:** ตาราง 3 — เอกสารที่ DPO อนุมัติแล้ว (COMPLETED)

### Response `200` — Array
```json
[
  {
    "document_id": "uuid",
    "document_number": "RP-2025-01",
    "title": "string",
    "do_name": "string | null",
    "dpo_name": "string | null",
    "last_approved_at": "datetime | null",
    "next_review_due_at": "datetime | null",
    "destruction_date": "datetime | null",
    "annual_review_overdue": false
  }
]
```

**Actions ในแถว:**
- 👁️ ดูฟอร์ม
- ✈️ ส่งตรวจสอบรายปี → `POST /owner/documents/{document_id}/annual-review` (เปิดเมื่อ `annual_review_overdue = true`)
- ✈️❌ ยื่นขอทำลาย → `POST /owner/documents/{document_id}/deletion`

---

## 6. GET /owner/tables/destroyed — ตาราง Destroyed

**หน้า UI:** ตาราง 4 — เอกสารที่ถูกทำลายแล้ว

### Response `200` — Array
```json
[
  {
    "document_id": "uuid",
    "document_number": "RP-2025-01",
    "title": "string",
    "do_name": "string | null",
    "dpo_name": "string | null",
    "deletion_approved_at": "datetime | null",
    "deletion_reason": "string | null"
  }
]
```

---

## 7. GET /owner/documents/{document_id}/section — ดู Owner Section

**หน้า UI:** ฟอร์มกรอก Tab 1 "ส่วนของผู้รับผิดชอบข้อมูล"  
**เรียกเมื่อ:** เปิดฟอร์ม (โหลดข้อมูลที่บันทึกไว้)

### Response `200`
```json
{
  "id": "uuid",
  "document_id": "uuid",
  "owner_id": 1,
  "status": "DRAFT | SUBMITTED",
  "updated_at": "datetime",

  "title_prefix": "นาย | นาง | นางสาว | null",
  "first_name": "string | null",
  "last_name": "string | null",
  "address": "string | null",
  "email": "string | null",
  "phone": "string | null",

  "contact_email": "string | null",
  "company_phone": "string | null",

  "data_owner_name": "string | null",
  "processing_activity": "string | null",
  "purpose_of_processing": "string | null",

  "personal_data_items": [
    { "id": "uuid", "type": "string", "other_description": "string | null" }
  ],
  "data_categories": [
    { "id": "uuid", "category": "string" }
  ],
  "data_types": [
    { "id": "uuid", "type": "GENERAL | SENSITIVE", "is_sensitive": false }
  ],
  "collection_methods": [
    { "id": "uuid", "method": "string" }
  ],
  "data_sources": [
    { "id": "uuid", "source": "string", "other_description": "string | null" }
  ],

  "storage_types": [
    { "id": "uuid", "type": "string" }
  ],
  "storage_methods": [
    { "id": "uuid", "method": "string", "other_description": "string | null" }
  ],
  "data_source_other": "string | null",
  "retention_value": 5,
  "retention_unit": "YEARS | MONTHS | DAYS | null",
  "access_control_policy": "string | null",
  "deletion_method": "string | null",

  "legal_basis": "string | null",
  "has_cross_border_transfer": false,
  "transfer_country": "string | null",
  "transfer_in_group": "string | null",
  "transfer_method": "string | null",
  "transfer_protection_standard": "string | null",
  "transfer_exception": "string | null",
  "exemption_usage": "string | null",
  "refusal_handling": "string | null",
  "minor_consent_types": ["UNDER_10", "10_TO_20"],

  "org_measures": "string | null",
  "access_control_measures": "string | null",
  "technical_measures": "string | null",
  "responsibility_measures": "string | null",
  "physical_measures": "string | null",
  "audit_measures": "string | null"
}
```

---

## 8. PATCH /owner/documents/{document_id}/section — บันทึกฉบับร่าง

**หน้า UI:** ปุ่ม "บันทึกฉบับร่าง"  
**เรียกเมื่อ:** กดบันทึกโดยไม่ต้องกรอกครบ, `status` ยังเป็น DRAFT

### Request Body
> ส่งเฉพาะ field ที่ต้องการบันทึก ไม่จำเป็นต้องครบ (ทุก field เป็น optional)

```json
{
  "title_prefix": "นาย",
  "first_name": "สมชาย",
  "last_name": "ใจดี",
  "address": "123 ถ.สุขุมวิท กรุงเทพ",
  "email": "somchai@example.com",
  "phone": "02-XXX-XXXX",

  "contact_email": "contact@company.com",
  "company_phone": "02-XXX-XXXX",

  "data_owner_name": "บริษัท ABC จำกัด",
  "processing_activity": "การรับสมัครพนักงาน",
  "purpose_of_processing": "เพื่อพิจารณาจ้างงาน",

  "personal_data_items": [
    { "type": "ชื่อ-นามสกุล", "other_description": null },
    { "type": "เบอร์โทรศัพท์", "other_description": null }
  ],
  "data_categories": [
    { "category": "พนักงาน" }
  ],
  "data_types": [
    { "type": "GENERAL", "is_sensitive": false },
    { "type": "SENSITIVE", "is_sensitive": true }
  ],
  "collection_methods": [
    { "method": "ข้อมูลอิเล็กทรอนิกส์" }
  ],
  "data_sources": [
    { "source": "จากเจ้าของข้อมูลโดยตรง", "other_description": null }
  ],

  "storage_types": [
    { "type": "ข้อมูลอิเล็กทรอนิกส์" }
  ],
  "storage_methods": [
    { "method": "Cloud Storage", "other_description": null }
  ],
  "retention_value": 5,
  "retention_unit": "YEARS",
  "access_control_policy": "กำหนดสิทธิ์เฉพาะผู้มีสิทธิ์",
  "deletion_method": "ลบถาวรจากระบบ",

  "legal_basis": "ปฏิบัติตามสัญญา",
  "has_cross_border_transfer": false,
  "minor_consent_types": ["NONE"],

  "org_measures": "มีนโยบาย PDPA",
  "access_control_measures": "ใช้ MFA",
  "technical_measures": "เข้ารหัสข้อมูล AES-256",
  "responsibility_measures": "กำหนดผู้รับผิดชอบ",
  "physical_measures": "ระบบ CCTV + keycard",
  "audit_measures": "audit log ทุก 3 เดือน"
}
```

> ⚠️ **Sub-tables (personal_data_items, data_categories, data_types, collection_methods, data_sources, storage_types, storage_methods, minor_consent_types):**  
> - ถ้าส่ง field นั้นมา → **ลบของเก่าทั้งหมดแล้ว insert ใหม่** (replace-all pattern)  
> - ถ้าไม่ส่ง field นั้น (`null` หรือไม่มี key) → ของเดิมยังคงอยู่ ไม่ถูกแตะ

### Response `200`
> คืน `OwnerSectionFullRead` เหมือน GET (ดูข้อ 7)

---

## 9. POST /owner/documents/{document_id}/section/submit — บันทึก (Submit)

**หน้า UI:** ปุ่ม "บันทึก" (สีแดง ปุ่มหลัก)  
**เรียกเมื่อ:** DO กรอกครบแล้ว ต้องการ submit — `status` เปลี่ยนเป็น `SUBMITTED`

### Request Body
> เหมือนกับ PATCH ทุกอย่าง (ดูข้อ 8)

### Response `200`
> คืน `OwnerSectionFullRead` ที่มี `status: "SUBMITTED"`

> หลัง submit สำเร็จ → badge ใน Active Table จะเปลี่ยนเป็น "Data Owner ดำเนินการเสร็จสิ้น"

---

## 10. POST /owner/documents/{document_id}/send-to-dpo — ส่งให้ DPO

**หน้า UI:** ปุ่ม ✈️ ในตาราง Active  
**เรียกเมื่อ:** DO ต้องการส่งเอกสารให้ DPO review

**เงื่อนไขก่อนกด (frontend ควร validate):**
- `owner_section_status === "SUBMITTED"`
- `processor_section_status === "SUBMITTED"`
- มี Risk Assessment แล้ว (เรียก GET /risk ก่อน ถ้า 404 = ยังไม่มี)

### Request Body
```json
{
  "dpo_id": 3
}
```

| Field | Required | หมายเหตุ |
|-------|----------|---------|
| `dpo_id` | ✅ | user.id ของ DPO ที่จะ assign (ต้องมี role = DPO) |

### Response `200`
```json
{
  "message": "ส่งให้ DPO สำเร็จ",
  "document_number": "RP-2025-01",
  "review_cycle_id": "uuid"
}
```

> หลังสำเร็จ → document_number เปลี่ยนจาก `DFT-` เป็น `RP-` และเอกสารย้ายไป ตาราง Sent-to-DPO

### Error Cases
| Status | Detail |
|--------|--------|
| `400` | `dpo_id ไม่ถูกต้องหรือ user ที่เลือกไม่ใช่ DPO` |
| `400` | `Owner Section ยังไม่ได้บันทึกให้สมบูรณ์` |
| `400` | `Processor Section ยังไม่ได้บันทึกให้สมบูรณ์` |
| `400` | `ยังไม่ได้ยืนยันการประเมินความเสี่ยง` |
| `400` | `เอกสารต้องอยู่ในสถานะ IN_PROGRESS` |

---

## 11. POST /owner/documents/{document_id}/send-back-to-dpo — ส่งแก้ไขคืน DPO

**หน้า UI:** ปุ่ม ✈️ ในตาราง Sent-to-DPO  
**เรียกเมื่อ:** DO แก้ไขตาม feedback ของ DPO แล้ว ต้องการแจ้ง DPO ว่าแก้เสร็จแล้ว

**เงื่อนไข:** `review_assignment_status === "FIX_IN_PROGRESS"`

### Request Body
> ไม่มี body

### Response `200`
```json
{ "message": "ส่งการแก้ไขคืนให้ DPO สำเร็จ" }
```

---

## 12. POST /owner/documents/{document_id}/annual-review — ส่งตรวจสอบรายปี

**หน้า UI:** ปุ่ม ✈️ ในตาราง Approved  
**เรียกเมื่อ:** เอกสาร COMPLETED ครบรอบทบทวน (`annual_review_overdue = true`)

### Request Body
```json
{
  "dpo_id": 3
}
```

| Field | Required | หมายเหตุ |
|-------|----------|---------|
| `dpo_id` | ✅ | user.id ของ DPO ที่จะ assign (ต้องมี role = DPO) |

### Response `200`
```json
{
  "message": "ส่งเอกสารตรวจสอบรายปีสำเร็จ",
  "review_cycle_id": "uuid"
}
```

### Error Cases
| Status | Detail |
|--------|--------|
| `400` | `dpo_id ไม่ถูกต้องหรือ user ที่เลือกไม่ใช่ DPO` |
| `400` | `เอกสารต้องอยู่ในสถานะ COMPLETED` |

---

## 13. GET /owner/documents/{document_id}/processor-section — ดู Processor Section (Tab 2)

**หน้า UI:** Tab 2 "ส่วนของผู้ประมวลผลข้อมูลส่วนบุคคล" (DO ดู read-only)  
**เรียกเมื่อ:** เปิด Tab 2

### Response `200`
```json
{
  "id": "uuid",
  "document_id": "uuid",
  "processor_id": 2,
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

  "personal_data_items": [...],
  "data_categories": [...],
  "data_types": [...],
  "collection_methods": [...],
  "data_sources": [...],

  "storage_types": [...],
  "storage_methods": [...],
  "data_source_other": "string | null",
  "retention_value": 3,
  "retention_unit": "YEARS | null",
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

> `do_suggestion` = คำแนะนำจาก DO ถึง DP แสดงที่ด้านบนสุดของ Tab 2 (text box ที่ DO แก้ไขได้)

---

## 14. PATCH /owner/documents/{document_id}/processor-section/suggestion — แก้ไขคำแนะนำถึง DP

**หน้า UI:** กล่องข้อความ "ระบุข้อเสนอแนะสำหรับผู้ประมวลผลข้อมูลส่วนบุคคล" ที่ด้านบน Tab 2  
**เรียกเมื่อ:** DO พิมพ์คำแนะนำและกด save (debounce หรือ blur)

### Request Body
```json
{
  "suggestion": "โปรดกรอกให้ครบทุก section และระบุมาตรการความปลอดภัยให้ชัดเจน"
}
```

### Response `200`
```json
{
  "message": "บันทึกคำแนะนำสำเร็จ",
  "do_suggestion": "โปรดกรอกให้ครบทุก section..."
}
```

---

## 15. POST /owner/documents/{document_id}/processor-section/feedback — ส่ง Feedback ให้ DP

**หน้า UI:** ปุ่ม "ส่งคำร้องขอเปลี่ยนแปลง" ล่างขวาของ Tab 2  
**เรียกเมื่อ:** DO เขียน feedback หลายรายการแล้วกดส่งพร้อมกันทีเดียว

### Request Body
```json
{
  "items": [
    {
      "section_number": 2,
      "field_name": "processor_name",
      "comment": "ชื่อ processor ไม่ถูกต้อง กรุณาระบุชื่อบริษัทให้ครบ"
    },
    {
      "section_number": 4,
      "field_name": null,
      "comment": "กรุณาระบุระยะเวลาการจัดเก็บข้อมูลให้ครบถ้วน"
    }
  ]
}
```

| Field | Required | หมายเหตุ |
|-------|----------|---------|
| `section_number` | ✅ | section ที่ต้องแก้ (1–6 สำหรับ DP) |
| `field_name` | ❌ | ชื่อ field ที่ต้องแก้ (optional, เพื่อ highlight ใน UI) |
| `comment` | ✅ | คำอธิบายที่ต้องแก้ |

### Response `201`
```json
[
  {
    "id": "uuid",
    "review_cycle_id": "uuid | null",
    "section_number": 2,
    "from_user_id": 1,
    "to_user_id": 2,
    "target_type": "PROCESSOR_SECTION",
    "target_id": "uuid",
    "field_name": "processor_name",
    "comment": "ชื่อ processor ไม่ถูกต้อง",
    "status": "OPEN",
    "created_at": "datetime",
    "resolved_at": null
  }
]
```

---

## 16. GET /owner/documents/{document_id}/risk — ดู Risk Assessment

**หน้า UI:** Tab 3 "การประเมินความเสี่ยงของเอกสาร"  
**เรียกเมื่อ:** เปิด Tab 3

### Response `200`
```json
{
  "id": "uuid",
  "document_id": "uuid",
  "assessed_by": 1,
  "likelihood": 3,
  "impact": 4,
  "risk_score": 12,
  "risk_level": "MEDIUM",
  "assessed_at": "datetime"
}
```

| risk_level | เงื่อนไข |
|------------|---------|
| `LOW` | score < 8 |
| `MEDIUM` | score 8–14 |
| `HIGH` | score ≥ 15 |

### Error
- `404` — ยังไม่มี Risk Assessment (ให้ frontend แสดงฟอร์มสำหรับกรอกครั้งแรก)

---

## 17. POST /owner/documents/{document_id}/risk — บันทึก Risk Assessment

**หน้า UI:** Tab 3 — ปุ่ม "ยืนยันการประเมิน"  
**เรียกเมื่อ:** DO เลือก likelihood + impact แล้วกดยืนยัน

### Request Body
```json
{
  "likelihood": 3,
  "impact": 4
}
```

| Field | Required | Range |
|-------|----------|-------|
| `likelihood` | ✅ | 1–5 |
| `impact` | ✅ | 1–5 |

> `risk_score` = likelihood × impact คำนวณโดย backend อัตโนมัติ

### Response `200`
> คืน `RiskAssessmentRead` เหมือน GET (ดูข้อ 16)

> หลัง submit → กลับไปหน้าตาราง Active (frontend จัดการ)

---

## 18. GET /owner/documents/{document_id}/deletion — ดู Deletion Request

**หน้า UI:** Tab 4 "ยื่นคำร้องขอทำลาย"  
**เรียกเมื่อ:** เปิด Tab 4

### Response `200`
```json
{
  "id": "uuid",
  "document_id": "uuid",
  "requested_by": 1,
  "owner_reason": "เอกสารครบกำหนดการจัดเก็บแล้ว",
  "dpo_id": 3,
  "dpo_decision": "APPROVED | REJECTED | null",
  "dpo_reason": "string | null",
  "status": "PENDING | APPROVED | REJECTED",
  "requested_at": "datetime",
  "decided_at": "datetime | null"
}
```

### Error
- `404` — ยังไม่มีคำร้อง (ให้ frontend แสดงฟอร์มสำหรับยื่นครั้งแรก)

---

## 19. POST /owner/documents/{document_id}/deletion — ยื่นคำร้องขอทำลาย

**หน้า UI:** Tab 4 — ปุ่ม ✈️❌ "ยื่นคำร้องขอทำลาย"  
**เรียกเมื่อ:** DO กรอกเหตุผลและกดยืนยัน (เข้าถึงได้จากทุกตาราง)

### Request Body
```json
{
  "owner_reason": "เอกสารครบกำหนดการจัดเก็บแล้ว 5 ปี"
}
```

### Response `201`
> คืน `DeletionRequestRead` เหมือน GET (ดูข้อ 18)

> หลัง submit → `deletion_status = DELETE_PENDING` และเอกสารจะปรากฏใน Card "รอ DPO ตรวจสอบ (ทำลาย)" ของ dashboard

### Error Cases
| Status | Detail |
|--------|--------|
| `400` | `มีคำร้องขอทำลายที่รอการอนุมัติอยู่แล้ว` |

---

## ข้อมูลอ้างอิง — Enum Values

### `minor_consent_types` (ใน Owner Section)
| ค่า | ความหมาย |
|-----|---------|
| `UNDER_10` | อายุไม่เกิน 10 ปี |
| `10_TO_20` | อายุ 10–20 ปี |
| `NONE` | ไม่มีการขอความยินยอมของผู้เยาว์ |

### `retention_unit`
| ค่า | ความหมาย |
|-----|---------|
| `DAYS` | วัน |
| `MONTHS` | เดือน |
| `YEARS` | ปี |

### `data_types[].type` + `is_sensitive`
| type | is_sensitive | ความหมาย |
|------|-------------|---------|
| `GENERAL` | `false` | ข้อมูลทั่วไป (checkbox ข้อมูลทั่วไป) |
| `SENSITIVE` | `true` | ข้อมูลอ่อนไหว (checkbox ข้อมูลอ่อนไหว) |

### Document `status`
| ค่า | ความหมาย |
|-----|---------|
| `IN_PROGRESS` | กำลังดำเนินการ (ตาราง Active) |
| `UNDER_REVIEW` | ส่ง DPO แล้ว (ตาราง Sent-to-DPO) |
| `COMPLETED` | DPO อนุมัติแล้ว (ตาราง Approved) |

### Document `deletion_status`
| ค่า | ความหมาย |
|-----|---------|
| `NULL` | ปกติ ยังไม่ขอทำลาย |
| `DELETE_PENDING` | ยื่นขอทำลายแล้ว รอ DPO อนุมัติ |
| `DELETED` | ถูกทำลายแล้ว (ตาราง Destroyed) |

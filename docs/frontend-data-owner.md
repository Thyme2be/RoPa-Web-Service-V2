# Frontend Integration Guide — Data Owner API

Base URL: `/api/v1`  
Authentication: ทุก request ต้องใส่ Header `Authorization: Bearer <access_token>`  
Role ที่ใช้ได้: `OWNER` เท่านั้น

---

## สารบัญ

0. [ดึงรายชื่อบริษัท DP (dropdown)](#0-get-ownerprocessorscompanies--ดึงรายชื่อบริษัท-dp)
1. [สร้างเอกสาร](#1-post-ownerdocuments--สร้างเอกสาร)
2. [Dashboard](#2-get-ownerdashboard--dashboard)
3. [ตาราง 1 — Active](#3-get-ownertablesactive--ตาราง-1-active)
4. [ตาราง 2 — Sent-to-DPO](#4-get-ownertablessent-to-dpo--ตาราง-2-sent-to-dpo)
5. [ตาราง 3 — Approved](#5-get-ownertablesapproved--ตาราง-3-approved)
6. [ตาราง 4 — Destroyed](#6-get-ownertablesdestroyed--ตาราง-4-destroyed)
7. [ดู Owner Section (Tab 1)](#7-get-ownerdocumentsiddocument_idsection--ดู-owner-section)
8. [บันทึกฉบับร่าง](#8-patch-ownerdocumentsiddocument_idsection--บันทึกฉบับร่าง)
9. [บันทึก (Submit)](#9-post-ownerdocumentsiddocument_idsectionsubmit--บันทึก-submit)
10. [ลบข้อมูลฉบับร่าง](#10-delete-ownerdocumentsiddocument_idsectiondraft--ลบฉบับร่าง)
11. [ส่งให้ DPO](#11-post-ownerdocumentsiddocument_idsend-to-dpo--ส่งให้-dpo)
12. [ส่งแก้ไขคืน DPO](#12-post-ownerdocumentsiddocument_idsend-back-to-dpo--ส่งแก้ไขคืน-dpo)
13. [ส่งตรวจสอบรายปี](#13-post-ownerdocumentsiddocument_idannual-review--ส่งตรวจสอบรายปี)
14. [ดู Processor Section (Tab 2)](#14-get-ownerdocumentsiddocument_idprocessor-section--ดู-processor-section-tab-2)
15. [แก้ไขคำแนะนำถึง DP](#15-patch-ownerdocumentsiddocument_idprocessor-sectionsuggestion--แก้ไขคำแนะนำถึง-dp)
16. [ส่ง Feedback ให้ DP](#16-post-ownerdocumentsiddocument_idprocessor-sectionfeedback--ส่ง-feedback-ให้-dp)
17. [ดู Risk Assessment (Tab 3)](#17-get-ownerdocumentsiddocument_idrisk--ดู-risk-assessment)
18. [บันทึก Risk Assessment](#18-post-ownerdocumentsiddocument_idrisk--บันทึก-risk-assessment)
19. [ดู Deletion Request (Tab 4)](#19-get-ownerdocumentsiddocument_iddeletion--ดู-deletion-request)
20. [ยื่นคำร้องขอทำลาย](#20-post-ownerdocumentsiddocument_iddeletion--ยื่นคำร้องขอทำลาย)

---

## 0. GET /owner/processors/companies — ดึงรายชื่อบริษัท DP

**หน้า UI:** เรียกตอนเปิด Modal "สร้างเอกสาร" เพื่อโหลด dropdown บริษัท  
**เรียกเมื่อ:** ก่อนแสดง modal (หรือตอน mount component)

### Response `200`
```json
{
  "companies": ["Thetadata", "บริษัท A", "บริษัท B"]
}
```

> คืนเฉพาะบริษัทที่มี PROCESSOR user active อยู่เท่านั้น  
> เรียงตามตัวอักษร A–Z

---

## 1. POST /owner/documents — สร้างเอกสาร

**หน้า UI:** Modal "สร้างเอกสาร"  
**เรียกเมื่อ:** กดปุ่ม "สร้าง" ใน modal

### Flow การทำงาน
```
ก่อนเปิด modal → GET /owner/processors/companies → โหลด dropdown บริษัท
                                                              ↓
                                              DO เลือกบริษัท เช่น "บริษัท A"
                                                              ↓
                                     กดสร้าง → POST /owner/documents
                                                              ↓
                              backend สุ่ม DP แบบ Round Robin จากบริษัทนั้น
                              (ดูว่าใครได้งานล่าสุด → เอาคนถัดไปเรียงตาม user.id)
                                                              ↓
                                           สร้างเอกสาร + assign DP คนนั้น
```

### Request Body
```json
{
  "title": "string (required)",
  "description": "string | null",
  "review_interval_days": 365,
  "due_date": "2025-12-31T00:00:00Z | null",
  "processor_company": "บริษัท A (required)"
}
```

| Field | Required | หมายเหตุ |
|-------|----------|---------|
| `title` | ✅ | ชื่อเอกสาร |
| `processor_company` | ✅ | ชื่อบริษัท DP ที่เลือกจาก dropdown |
| `review_interval_days` | ❌ | default 365 (ทบทวนรายปี) |
| `due_date` | ❌ | วันกำหนดส่งของ DP |
| `description` | ❌ | คำอธิบายเพิ่มเติม |

### Response `201 Created`
```json
{
  "document_id": "uuid",
  "document_number": "DFT-2025-01",
  "assigned_processor_id": 7,
  "assigned_processor_name": "สมชาย ใจดี",
  "message": "สร้างเอกสารสำเร็จ"
}
```

> `assigned_processor_id` และ `assigned_processor_name` คือ DP ที่ถูกสุ่มให้  
> หลังสร้างสำเร็จ → เอกสารปรากฏใน ตาราง 1 (Active) ทันที  
> `document_number` ขึ้นต้นด้วย `DFT-` (ฉบับร่าง) จนกว่าจะส่ง DPO จะเปลี่ยนเป็น `RP-`

### Error Cases
| Status | Detail |
|--------|--------|
| `400` | `ไม่พบ Data Processor ที่ active ในบริษัท '{ชื่อบริษัท}'` |

---

## 2. GET /owner/dashboard — Dashboard

**หน้า UI:** หน้าแดชบอร์ด sidebar  
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
  "overdue_dp_count": 2,
  "annual_reviewed_count": 7,
  "annual_not_reviewed_count": 3,
  "destruction_due_count": 2,
  "deleted_count": 8
}
```

| Field | Card UI | คำอธิบาย | แหล่งข้อมูล |
|-------|---------|---------|------------|
| `total_documents` | รวมทั้งหมด | เอกสารทั้งหมดที่ DO นี้สร้าง | `ropa_documents.created_by` |
| `needs_fix_do_count` | ต้องแก้ไข (DO) | นับ distinct document ที่ cycle = CHANGES_REQUESTED **และ** มี DPO comment กลุ่ม `DO_SEC_*` หรือ `DO_RISK` | `dpo_section_comments` + `review_cycles.status = CHANGES_REQUESTED` |
| `needs_fix_dp_count` | ต้องแก้ไข (DP) | นับ distinct document ที่ DO ส่ง feedback OPEN ให้ DP | `review_feedbacks.to_user_id = DP AND status = OPEN` |
| `risk_low_count` | Donut chart | score < 8 | `ropa_risk_assessments.risk_level = LOW` |
| `risk_medium_count` | Donut chart | score 8–14 | `risk_level = MEDIUM` |
| `risk_high_count` | Donut chart | score ≥ 15 | `risk_level = HIGH` |
| `under_review_storage_count` | รอ DPO (จัดเก็บ) | UNDER_REVIEW ที่ไม่ใช่คำร้องทำลาย | `status = UNDER_REVIEW AND deletion_status IS NULL` |
| `under_review_deletion_count` | รอ DPO (ทำลาย) | รอ DPO อนุมัติการทำลาย | `deletion_status = DELETE_PENDING` |
| `pending_do_count` | รอดำเนินการ (DO) | DO ยังไม่ submit | `IN_PROGRESS AND owner_section.status = DRAFT` |
| `pending_dp_count` | รอดำเนินการ (DP) | DP ยังไม่ submit | `IN_PROGRESS AND processor_section.status = DRAFT` |
| `completed_count` | อนุมัติแล้ว | DPO อนุมัติแล้ว | `status = COMPLETED` |
| `sensitive_document_count` | ข้อมูลอ่อนไหว | DO ติ๊ก is_sensitive = true ใน Section 4 | `owner_data_types.is_sensitive = true` (distinct doc) |
| `overdue_dp_count` | DP ส่งช้า | เอกสาร IN_PROGRESS ที่ DP ยังไม่ submit แต่เลย due_date แล้ว | `processor_assignments.due_date <= now AND status != SUBMITTED` |
| `annual_reviewed_count` | รายปี (ตรวจแล้ว) | COMPLETED ที่ผ่าน annual review cycle แล้ว | `review_cycles.cycle_number > 1 AND status = APPROVED` |
| `annual_not_reviewed_count` | รายปี (ยังไม่ตรวจ) | COMPLETED ที่ครบ review_interval_days แล้วแต่ยังไม่ส่งตรวจ | `next_review_due_at <= now` |
| `destruction_due_count` | ครบกำหนดทำลาย | retention period หมดแล้ว ยังไม่ยื่นขอทำลาย | คำนวณจาก `last_approved_at + retention` |
| `deleted_count` | ถูกทำลายแล้ว | ถูกทำลายแล้ว | `deletion_status = DELETED` |

---

## 3. GET /owner/tables/active — ตาราง 1 Active

**หน้า UI:** ตาราง 1 — เอกสาร Active (IN_PROGRESS) — แสดงทุกเอกสารที่ DO สร้าง ยกเว้น DELETED  
**เรียกเมื่อ:** เข้าหน้าตาราง

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

**`owner_status.code` (2 ค่า):**
| code | label | เงื่อนไข |
|------|-------|---------|
| `WAITING_DO` | รอส่วนของ Data Owner | `owner_section.status = DRAFT` หรือไม่มี section |
| `DO_DONE` | Data Owner ดำเนินการเสร็จสิ้น | `owner_section.status = SUBMITTED` |

**`processor_status.code` (2 ค่า):**
| code | label | เงื่อนไข |
|------|-------|---------|
| `WAITING_DP` | รอส่วนของ Data Processor | `processor_section.status = DRAFT` หรือไม่มี section |
| `DP_DONE` | Data Processor ดำเนินการเสร็จสิ้น | `processor_section.status = SUBMITTED` |

**Actions ในแถว:**
| ปุ่ม | Endpoint | เงื่อนไขแสดง |
|------|----------|------------|
| 👁️ ดูฟอร์ม | `GET /owner/documents/{id}/section` | แสดงทุกแถว |
| ✈️ ส่ง DPO | `POST /owner/documents/{id}/send-to-dpo` | `owner_section_status = SUBMITTED` AND `processor_section_status = SUBMITTED` AND มี Risk Assessment |
| ✈️❌ ยื่นขอทำลาย | `POST /owner/documents/{id}/deletion` | แสดงทุกแถว |

---

## 4. GET /owner/tables/sent-to-dpo — ตาราง 2 Sent-to-DPO

**หน้า UI:** ตาราง 2 — เอกสารที่ส่ง DPO แล้ว (UNDER_REVIEW)

### Response `200` — Array
```json
[
  {
    "document_id": "uuid",
    "document_number": "RP-2025-01",
    "title": "string",
    "dpo_name": "string | null",
    "ui_status": "WAITING_REVIEW",
    "ui_status_label": "รอตรวจสอบ",
    "sent_at": "datetime | null",
    "reviewed_at": "datetime | null",
    "due_date": "datetime | null"
  }
]
```

**`ui_status` (5 ค่า):**
| ui_status | ui_status_label | ความหมาย | เงื่อนไข backend |
|-----------|----------------|---------|----------------|
| `WAITING_REVIEW` | รอตรวจสอบ | DO ส่งให้ DPO แล้ว ยังไม่มี comment | `cycle.status = IN_REVIEW` ไม่มี DPO comment |
| `WAITING_DO_FIX` | รอ DO แก้ไข | DPO ส่ง comment มาถึง DO | มี `dpo_section_comments` กลุ่ม `DO_SEC_*` หรือ `DO_RISK` |
| `WAITING_DP_FIX` | รอ DP แก้ไข | DPO ส่ง comment มาถึง DP | มี `dpo_section_comments` กลุ่ม `DP_SEC_*` |
| `DO_DONE` | DO ดำเนินการเสร็จสิ้น | DO กด send-back-to-dpo แล้ว | `ReviewAssignment(OWNER).status = FIX_SUBMITTED` |
| `DP_DONE` | DP ดำเนินการเสร็จสิ้น | DP ส่งแก้ไขคืน DPO แล้ว | `ReviewAssignment(PROCESSOR).status = FIX_SUBMITTED` |

**Actions ในแถว:**
| ปุ่ม | Endpoint | เงื่อนไขแสดง |
|------|----------|------------|
| 👁️ ดูฟอร์ม | `GET /owner/documents/{id}/section` | แสดงทุกแถว |
| ✈️ ส่งแก้ไขคืน DPO | `POST /owner/documents/{id}/send-back-to-dpo` | `ui_status = "WAITING_DO_FIX"` |
| ✈️❌ ยื่นขอทำลาย | `POST /owner/documents/{id}/deletion` | แสดงทุกแถว |

---

## 5. GET /owner/tables/approved — ตาราง 3 Approved

**หน้า UI:** ตาราง 3 — เอกสารที่ DPO อนุมัติแล้วทั้งหมด (`doc.status = COMPLETED`)  
**แสดงทุกเอกสาร COMPLETED** ไม่จำกัดว่าครบรอบปีหรือยัง โดยแยก badge สถานะ

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
    "annual_review_status": "REVIEWED | NOT_REVIEWED | PENDING_DESTRUCTION",
    "annual_review_status_label": "ตรวจสอบเสร็จสิ้น | ยังไม่ได้ตรวจสอบ | รอทำลายเอกสาร"
  }
]
```

**`annual_review_status` (3 ค่า) — ตรวจตามลำดับความสำคัญ:**
| annual_review_status | label | เงื่อนไข |
|---------------------|-------|---------|
| `PENDING_DESTRUCTION` | รอทำลายเอกสาร | `destruction_date <= now` (ถึงวันทำลายแล้ว) |
| `NOT_REVIEWED` | ยังไม่ได้ตรวจสอบ | `next_review_due_at <= now` (ครบรอบปีแล้ว ยังไม่ส่งตรวจ) |
| `REVIEWED` | ตรวจสอบเสร็จสิ้น | ยังไม่ถึงรอบตรวจหรือเพิ่ง approved มา |

> Priority: `PENDING_DESTRUCTION` > `NOT_REVIEWED` > `REVIEWED`  
> `destruction_date` คำนวณจาก `last_approved_at + retention_value/unit` ที่ DO กรอกในฟอร์ม Section 4  
> `next_review_due_at` คำนวณจาก `last_approved_at + review_interval_days` (default 365)

**Actions ในแถว:**
| ปุ่ม | Endpoint | เงื่อนไขแสดง |
|------|----------|------------|
| 👁️ ดูฟอร์ม | `GET /owner/documents/{id}/section` | แสดงทุกแถว |
| ✈️ ส่งตรวจสอบรายปี | `POST /owner/documents/{id}/annual-review` | `annual_review_status = "NOT_REVIEWED"` |
| ✈️❌ ยื่นขอทำลาย | `POST /owner/documents/{id}/deletion` | แสดงทุกแถว |

---

## 6. GET /owner/tables/destroyed — ตาราง 4 Destroyed

**หน้า UI:** ตาราง 4 — เอกสารที่ถูกทำลายแล้ว (`deletion_status = DELETED`)

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

**หน้า UI:** กดรูปตา 👁️ → เปิดฟอร์ม Tab 1  
**เรียกเมื่อ:** โหลดฟอร์มเพื่อแสดงข้อมูลที่บันทึกไว้

> ถ้า DO เคยลบฉบับร่างไปแล้ว → API จะสร้าง owner section เปล่าใหม่อัตโนมัติ ไม่คืน 404

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
  "data_categories": [{ "id": "uuid", "category": "string" }],
  "data_types": [{ "id": "uuid", "type": "string", "is_sensitive": false }],
  "collection_methods": [{ "id": "uuid", "method": "string" }],
  "data_sources": [{ "id": "uuid", "source": "string", "other_description": "string | null" }],

  "storage_types": [{ "id": "uuid", "type": "string" }],
  "storage_methods": [{ "id": "uuid", "method": "string", "other_description": "string | null" }],
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
**ผล:** บันทึกข้อมูล, `status` ยังเป็น `DRAFT`

### Request Body
> ส่งเฉพาะ field ที่ต้องการบันทึก ทุก field เป็น optional

> ⚠️ **Sub-tables** (personal_data_items, data_categories, data_types, collection_methods, data_sources, storage_types, storage_methods, minor_consent_types):  
> ถ้าส่ง array มา → **ลบของเก่าทั้งหมดแล้ว insert ใหม่** (replace-all)  
> ถ้าไม่ส่ง key นั้น → ของเดิมยังคงอยู่

### Response `200`
> คืน `OwnerSectionFullRead` เหมือน GET (ข้อ 7)

---

## 9. POST /owner/documents/{document_id}/section/submit — บันทึก (Submit)

**หน้า UI:** ปุ่ม "บันทึก" (ปุ่มหลัก)  
**ผล:** บันทึกข้อมูล + เปลี่ยน `status` เป็น `SUBMITTED`  
**หลัง submit:** badge ใน ตาราง 1 เปลี่ยนเป็น `DO_DONE`

### Request Body
> เหมือน PATCH (ข้อ 8) ทุกอย่าง

### Response `200`
> คืน `OwnerSectionFullRead` ที่มี `status: "SUBMITTED"`

---

## 10. DELETE /owner/documents/{document_id}/section/draft — ลบฉบับร่าง

**หน้า UI:** ปุ่ม "ลบ" ในตารางฉบับร่าง  
**ผล:** ลบข้อมูล owner section พร้อม sub-tables ทั้งหมด — เอกสารยังอยู่ใน ตาราง 1

**เงื่อนไข:** `owner_section.status = DRAFT` เท่านั้น (ถ้า SUBMITTED จะ error)

### Response `204 No Content`

### Error Cases
| Status | Detail |
|--------|--------|
| `400` | `ลบได้เฉพาะ owner section ที่ยังเป็น DRAFT เท่านั้น` |
| `404` | `ไม่พบข้อมูลฉบับร่าง` |

> หลังลบ → GET section จะสร้าง section เปล่าใหม่ให้อัตโนมัติ ไม่ได้ 404

---

## 11. POST /owner/documents/{document_id}/send-to-dpo — ส่งให้ DPO

**หน้า UI:** ปุ่ม ✈️ ในตาราง 1  
**เงื่อนไขก่อนกด (frontend ควร validate):**
- `owner_section_status === "SUBMITTED"`
- `processor_section_status === "SUBMITTED"`
- มี Risk Assessment แล้ว (GET /risk ไม่คืน 404)

### Request Body
```json
{ "dpo_id": 3 }
```

### Response `200`
```json
{
  "message": "ส่งให้ DPO สำเร็จ",
  "document_number": "RP-2025-01",
  "review_cycle_id": "uuid"
}
```

> `document_number` เปลี่ยนจาก `DFT-` เป็น `RP-`  
> เอกสารย้ายจาก ตาราง 1 ไป ตาราง 2  
> `doc.status` = `UNDER_REVIEW`, `cycle.status` = `IN_REVIEW`

### Error Cases
| Status | Detail |
|--------|--------|
| `400` | `dpo_id ไม่ถูกต้องหรือ user ที่เลือกไม่ใช่ DPO` |
| `400` | `Owner Section ยังไม่ได้บันทึกให้สมบูรณ์` |
| `400` | `Processor Section ยังไม่ได้บันทึกให้สมบูรณ์` |
| `400` | `ยังไม่ได้ยืนยันการประเมินความเสี่ยง` |
| `400` | `เอกสารต้องอยู่ในสถานะ IN_PROGRESS` |

---

## 12. POST /owner/documents/{document_id}/send-back-to-dpo — ส่งแก้ไขคืน DPO

**หน้า UI:** ปุ่ม ✈️ ในตาราง 2  
**เรียกเมื่อ:** DO แก้ไขตาม feedback ของ DPO เสร็จแล้ว  
**เงื่อนไขแสดงปุ่ม:** `ui_status === "WAITING_DO_FIX"`

### Request Body
> ไม่มี body

### Response `200`
```json
{ "message": "ส่งการแก้ไขคืนให้ DPO สำเร็จ" }
```

### สิ่งที่เกิดขึ้นใน backend
1. `ReviewAssignment(OWNER).status` → `FIX_SUBMITTED`
2. `cycle.status` → reset กลับเป็น `IN_REVIEW` (เพื่อให้ DPO ตรวจรอบใหม่ได้)
3. ลบ `DpoSectionComments` เก่าทั้งหมดของเอกสารนี้ออก (เพื่อให้ DPO เริ่มตรวจใหม่สะอาด)

> หลังกด → `ui_status` ของแถวนั้นเปลี่ยนเป็น `DO_DONE`

---

## 13. POST /owner/documents/{document_id}/annual-review — ส่งตรวจสอบรายปี

**หน้า UI:** ปุ่ม ✈️ ในตาราง 3  
**เรียกเมื่อ:** เอกสาร COMPLETED ครบรอบปีแล้ว (`annual_review_status = "NOT_REVIEWED"`)  
**เงื่อนไขแสดงปุ่ม:** `annual_review_status === "NOT_REVIEWED"`

### Request Body
```json
{ "dpo_id": 3 }
```

### Response `200`
```json
{
  "message": "ส่งเอกสารตรวจสอบรายปีสำเร็จ",
  "review_cycle_id": "uuid"
}
```

### สิ่งที่เกิดขึ้นใน backend
1. สร้าง `DocumentReviewCycle` ใหม่ (`cycle_number` +1)
2. `doc.status` → `UNDER_REVIEW`
3. ลบ `DpoSectionComments` เก่าออก (เริ่มรอบตรวจใหม่สะอาด)
4. เอกสารย้ายจาก ตาราง 3 ไป ตาราง 2

### Error Cases
| Status | Detail |
|--------|--------|
| `400` | `dpo_id ไม่ถูกต้องหรือ user ที่เลือกไม่ใช่ DPO` |
| `400` | `เอกสารต้องอยู่ในสถานะ COMPLETED` |

---

## 14. GET /owner/documents/{document_id}/processor-section — ดู Processor Section (Tab 2)

**หน้า UI:** Tab 2 "ส่วนของผู้ประมวลผลข้อมูลส่วนบุคคล" (DO ดู read-only)

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

  "personal_data_items": [],
  "data_categories": [],
  "data_types": [],
  "collection_methods": [],
  "data_sources": [],
  "storage_types": [],
  "storage_methods": [],
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

> `do_suggestion` = คำแนะนำจาก DO ถึง DP แสดงด้านบนสุดของ Tab 2

---

## 15. PATCH /owner/documents/{document_id}/processor-section/suggestion — แก้ไขคำแนะนำถึง DP

**หน้า UI:** กล่องข้อความ "ระบุข้อเสนอแนะสำหรับผู้ประมวลผลข้อมูลส่วนบุคคล" บน Tab 2  
**เรียกได้:** ตลอดเวลา ไม่จำกัดสถานะเอกสาร

### Request Body
```json
{ "suggestion": "โปรดกรอกให้ครบทุก section..." }
```

### Response `200`
```json
{
  "message": "บันทึกคำแนะนำสำเร็จ",
  "do_suggestion": "โปรดกรอกให้ครบทุก section..."
}
```

---

## 16. POST /owner/documents/{document_id}/processor-section/feedback — ส่ง Feedback ให้ DP

**หน้า UI:** ปุ่ม "ส่งคำร้องขอเปลี่ยนแปลง" ล่างขวาของ Tab 2  
**เรียกเมื่อ:** DO เขียน feedback ทุกรายการแล้วกดส่งพร้อมกันทีเดียว

### Request Body
```json
{
  "items": [
    {
      "section_number": 2,
      "field_name": "processor_name",
      "comment": "ชื่อ processor ไม่ถูกต้อง"
    },
    {
      "section_number": 4,
      "field_name": null,
      "comment": "กรุณาระบุระยะเวลาการจัดเก็บข้อมูล"
    }
  ]
}
```

| Field | Required | หมายเหตุ |
|-------|----------|---------|
| `section_number` | ✅ | section ที่ต้องแก้ (1–6 สำหรับ DP) |
| `field_name` | ❌ | ชื่อ field ที่ต้องแก้ (เพื่อ highlight ใน UI) |
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

> `review_cycle_id` เป็น null ได้ ถ้า DO ส่ง feedback ก่อนที่จะมี review cycle  
> feedback เหล่านี้จะถูก auto-resolved เมื่อ DP กด submit section

---

## 17. GET /owner/documents/{document_id}/risk — ดู Risk Assessment

**หน้า UI:** Tab 3 "การประเมินความเสี่ยงของเอกสาร"

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
- `404` — ยังไม่มี (แสดงฟอร์มกรอกครั้งแรก)

---

## 18. POST /owner/documents/{document_id}/risk — บันทึก Risk Assessment

**หน้า UI:** Tab 3 — ปุ่ม "ยืนยันการประเมิน"  
**ผล:** สร้างหรืออัปเดต Risk Assessment (upsert)

### Request Body
```json
{ "likelihood": 3, "impact": 4 }
```

| Field | Required | Range |
|-------|----------|-------|
| `likelihood` | ✅ | 1–5 |
| `impact` | ✅ | 1–5 |

> `risk_score = likelihood × impact` คำนวณโดย backend

### Response `200`
> คืน `RiskAssessmentRead` เหมือน GET (ข้อ 17)

---

## 19. GET /owner/documents/{document_id}/deletion — ดู Deletion Request

**หน้า UI:** Tab 4 "ยื่นคำร้องขอทำลาย"

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
- `404` — ยังไม่มีคำร้อง (แสดงฟอร์มสำหรับยื่นครั้งแรก)

---

## 20. POST /owner/documents/{document_id}/deletion — ยื่นคำร้องขอทำลาย

**หน้า UI:** ปุ่ม ✈️❌ "ยื่นคำร้องขอทำลาย" (เข้าถึงได้จากทุกตาราง)

### Request Body
```json
{ "owner_reason": "เอกสารครบกำหนดการจัดเก็บแล้ว 5 ปี" }
```

### Response `201`
> คืน `DeletionRequestRead` เหมือน GET (ข้อ 19)

> หลัง submit → `deletion_status = DELETE_PENDING`, dashboard Card "รอ DPO (ทำลาย)" +1

### Error Cases
| Status | Detail |
|--------|--------|
| `400` | `มีคำร้องขอทำลายที่รอการอนุมัติอยู่แล้ว` |

---

## ข้อมูลอ้างอิง — Enum Values

### `minor_consent_types`
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

### Document `status`
| ค่า | ตาราง | ความหมาย |
|-----|-------|---------|
| `IN_PROGRESS` | ตาราง 1 | กำลังดำเนินการ |
| `UNDER_REVIEW` | ตาราง 2 | ส่ง DPO แล้ว |
| `COMPLETED` | ตาราง 3 (ทุกเอกสาร) | DPO อนุมัติแล้ว |

### Document `deletion_status`
| ค่า | ความหมาย |
|-----|---------|
| `NULL` | ปกติ |
| `DELETE_PENDING` | ยื่นขอทำลาย รอ DPO |
| `DELETED` | ถูกทำลายแล้ว (ตาราง 4) |

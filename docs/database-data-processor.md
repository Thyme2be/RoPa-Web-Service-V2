# Database Schema — Data Processor

เอกสารนี้อธิบาย table ทั้งหมดที่ Data Processor ใช้งาน รวมถึงความสัมพันธ์ระหว่าง table
และสิ่งที่เพิ่ม/แก้ไขจาก schema เดิมเพื่อรองรับ feature Data Processor

---

## สรุป: ไม่ต้องสร้าง Table ใหม่

Data Processor **ไม่มี migration ใหม่** ทุก table ที่ใช้ถูกสร้างไว้แล้วตั้งแต่ตอนทำ Data Owner
สิ่งที่ต้องทำมีเพียงการเพิ่ม column `do_suggestion` ใน `ropa_processor_sections`
ซึ่งอยู่ใน migration ของ Data Owner แล้ว

---

## Table ที่ Data Processor ใช้งาน

### 1. `processor_assignments`

ตาราง assignment ที่เชื่อม DP กับเอกสาร DO สร้างตอน `POST /owner/documents`

| Column | Type | Nullable | หมายเหตุ |
|--------|------|----------|---------|
| `id` | `uuid` | NO | Primary key |
| `document_id` | `uuid` | NO | FK → `ropa_documents.id` (CASCADE DELETE) |
| `processor_id` | `int` | NO | FK → `users.id` — DP ที่ถูก assign |
| `assigned_by` | `int` | NO | FK → `users.id` — DO ที่สร้างเอกสาร |
| `due_date` | `timestamptz` | YES | วันกำหนดส่งที่ DO ตั้งไว้ |
| `status` | `enum` | NO | `IN_PROGRESS` / `SUBMITTED` — default `IN_PROGRESS` |
| `created_at` | `timestamptz` | NO | วันที่ assign |

**Enum `assignment_status`:** `IN_PROGRESS`, `SUBMITTED`, `OVERDUE`

**ใช้ใน:** ตรวจสอบสิทธิ์ว่า DP คนนี้มีสิทธิ์เข้าถึงเอกสารนี้หรือไม่ (`check_document_access`)
และแสดงรายการเอกสารที่ DP ถูก assign ทั้งหมด

---

### 2. `ropa_processor_sections`

ตาราง section หลักที่ DP กรอกฟอร์ม มี 1 row ต่อเอกสาร ต่อ DP
(unique constraint: `document_id` + `processor_id`)

| Column | Type | Nullable | หมายเหตุ |
|--------|------|----------|---------|
| `id` | `uuid` | NO | Primary key |
| `document_id` | `uuid` | NO | FK → `ropa_documents.id` (CASCADE DELETE) |
| `processor_id` | `int` | NO | FK → `users.id` — เจ้าของ section นี้ |
| `updated_by` | `int` | YES | FK → `users.id` — ผู้แก้ไขล่าสุด |
| `do_suggestion` | `text` | YES | **[เพิ่มใหม่]** คำแนะนำจาก DO ถึง DP |
| `status` | `enum` | NO | `DRAFT` / `SUBMITTED` — default `DRAFT` |
| `updated_at` | `timestamptz` | NO | auto-update ทุกครั้งที่แก้ไข |
| *(fields section 1-6)* | | | ดูรายละเอียดด้านล่าง |

**Field ทั้งหมดใน section:**

**Section 1 — ผู้บันทึก:**
`title_prefix`, `first_name`, `last_name`, `address`, `email`, `phone`

**Section 2 — รายละเอียดกิจกรรม:**
`processor_name`, `controller_address`, `processing_activity`, `purpose_of_processing`

**Section 3 — ข้อมูลส่วนบุคคล:** เก็บใน sub-tables (ดูหัวข้อถัดไป)

**Section 4 — การจัดเก็บ:**
`data_source_other`, `retention_value`, `retention_unit`, `access_policy`, `deletion_method`

**Section 5 — ฐานทางกฎหมาย:**
`legal_basis`, `has_cross_border_transfer`, `transfer_country`, `transfer_in_group`,
`transfer_method`, `transfer_protection_standard`, `transfer_exception`

**Section 6 — TOMs:**
`org_measures`, `access_control_measures`, `technical_measures`,
`responsibility_measures`, `physical_measures`, `audit_measures`

---

### 3. Sub-tables ของ Processor Section (Section 3)

แต่ละ table เก็บรายการ list ของ section 3 มี FK → `ropa_processor_sections.id` (CASCADE DELETE)

| Table | Column หลัก | หมายเหตุ |
|-------|------------|---------|
| `processor_personal_data_items` | `type`, `other_description` | ประเภทข้อมูลส่วนบุคคล |
| `processor_data_categories` | `category` | หมวดหมู่ข้อมูล |
| `processor_data_types` | `type`, `is_sensitive` | ประเภทข้อมูล (ธรรมดา/อ่อนไหว) |
| `processor_collection_methods` | `method` | วิธีเก็บรวบรวม |
| `processor_data_sources` | `source`, `other_description` | แหล่งที่มา |
| `processor_storage_types` | `type` | ประเภทการจัดเก็บ |
| `processor_storage_methods` | `method`, `other_description` | วิธีการจัดเก็บ |

**Pattern การ update:** ลบทั้งหมดแล้ว insert ใหม่ทุกครั้ง (replace-all)
ไม่ได้ update รายแถว เพราะ frontend ส่ง list ทั้งก้อนมาพร้อมกัน

---

### 4. `ropa_documents`

DP อ่านข้อมูลจาก table นี้ แต่ **ไม่สามารถแก้ไขได้**

| Column | DP ใช้ทำอะไร |
|--------|------------|
| `id` | ระบุเอกสาร |
| `document_number` | แสดงในตาราง |
| `title` | แสดงในตาราง |
| `created_by` | หา DO name |
| `status` | ตรวจสอบว่าเอกสารถูกลบหรือไม่ |
| `deletion_status` | กรองเอกสารที่ถูกลบออกจากตาราง DP |
| `created_at` | แสดงในตาราง |

---

### 5. `review_feedbacks`

DP รับ feedback จาก DO หรือ DPO ผ่าน table นี้ DP ไม่ได้สร้าง feedback เอง

| Column | Type | Nullable | หมายเหตุ |
|--------|------|----------|---------|
| `id` | `uuid` | NO | Primary key |
| `review_cycle_id` | `uuid` | YES | FK → `document_review_cycles.id` — nullable เพราะ DO อาจส่งก่อนมี cycle |
| `section_number` | `int` | YES | section ที่ต้องแก้ไข (1-6) |
| `from_user_id` | `int` | NO | FK → `users.id` — ผู้ส่ง (DO หรือ DPO) |
| `to_user_id` | `int` | NO | FK → `users.id` — ผู้รับ (DP) |
| `target_type` | `enum` | NO | `PROCESSOR_SECTION` สำหรับ feedback ถึง DP |
| `target_id` | `uuid` | NO | `ropa_processor_sections.id` |
| `field_name` | `varchar` | YES | ชื่อ field ที่ต้องแก้ไข (optional) |
| `comment` | `text` | YES | คำอธิบายการแก้ไข |
| `status` | `enum` | NO | `OPEN` / `RESOLVED` |
| `created_at` | `timestamptz` | NO | วันที่ส่ง feedback |
| `resolved_at` | `timestamptz` | YES | วันที่ DP submit ฟอร์มใหม่ (auto-set) |

**สำคัญ:** เมื่อ DP กด "บันทึก" (`POST /processor/documents/{id}/section/submit`)
ระบบจะ auto-resolve feedback ทั้งหมดที่ `status = OPEN` และ `to_user_id = DP`
โดยเปลี่ยนเป็น `status = RESOLVED` พร้อม set `resolved_at`

**ใช้ใน badge NEEDS_FIX:** ถ้ามี feedback `status = OPEN` อยู่ → badge = NEEDS_FIX

---

### 6. `review_assignments`

DP ถูก track ใน table นี้เมื่อ DO ส่งเอกสารให้ DPO review

| Column | หมายเหตุ |
|--------|---------|
| `review_cycle_id` | FK → `document_review_cycles.id` |
| `user_id` | `processor_id` ของ DP ที่ถูก assign |
| `role` | `PROCESSOR` |
| `status` | `FIX_IN_PROGRESS` / `FIX_SUBMITTED` / `COMPLETED` |

DP อ่านข้อมูลนี้ผ่าน badge ในตาราง — backend ใช้คำนวณ `has_open_feedback` ทางอ้อม

---

### 7. `users`

DP ใช้ดูชื่อ DO ที่สร้างเอกสาร (`created_by` → `users.id`)

---

## ความสัมพันธ์ระหว่าง Table (DP มุมมอง)

```
users (DP)
  └── processor_assignments (1:N)
        └── ropa_documents (N:1)
              └── ropa_processor_sections (1:1 ต่อ DP)
                    ├── processor_personal_data_items (1:N)
                    ├── processor_data_categories (1:N)
                    ├── processor_data_types (1:N)
                    ├── processor_collection_methods (1:N)
                    ├── processor_data_sources (1:N)
                    ├── processor_storage_types (1:N)
                    └── processor_storage_methods (1:N)

review_feedbacks
  ├── to_user_id → users (DP)
  └── target_id → ropa_processor_sections.id
```

---

## สิ่งที่เพิ่ม/แก้ไขจาก Schema เดิม

| สิ่งที่เปลี่ยน | Table | รายละเอียด |
|--------------|-------|-----------|
| เพิ่ม column | `ropa_processor_sections` | `do_suggestion text NULL` — คำแนะนำจาก DO |
| ลบ column | `ropa_processor_sections` | `exemption_usage`, `refusal_handling` — เป็น field เฉพาะ DO form |
| เพิ่ม column | `review_feedbacks` | `section_number int NULL` — ระบุ section ที่ต้องแก้ |
| แก้ constraint | `review_feedbacks` | `review_cycle_id` เปลี่ยนเป็น nullable — ส่ง feedback ได้ก่อนมี review cycle |

```sql
-- ropa_processor_sections
ALTER TABLE ropa_processor_sections
    ADD COLUMN IF NOT EXISTS do_suggestion text,
    DROP COLUMN IF EXISTS exemption_usage,
    DROP COLUMN IF EXISTS refusal_handling;

-- review_feedbacks
ALTER TABLE review_feedbacks
    ADD COLUMN IF NOT EXISTS section_number integer,
    ALTER COLUMN review_cycle_id DROP NOT NULL;
```

> Migration เหล่านี้อยู่ใน database-data-owner.md แล้ว เขียนซ้ำที่นี่เพื่ออ้างอิง

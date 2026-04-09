# 🗄️ DATABASE SCHEMA — Data Processor

**วันที่อัพเดท**: 9 เมษายน 2569
**สำหรับ**: Database Developer
**ขอบเขต**: ตารางและ column ทั้งหมดที่เกี่ยวกับ Data Processor

---

## 📌 สารบัญ

1. [ภาพรวมตาราง](#ภาพรวมตาราง)
2. [ตาราง processor_records](#ตาราง-processor_records)
3. [ตาราง ropa_documents (ส่วนที่เกี่ยวกับ Processor)](#ตาราง-ropa_documents)
4. [Enum Values](#enum-values)
5. [Relationships & Foreign Keys](#relationships--foreign-keys)
6. [SQL Migration Script](#sql-migration-script)
7. [Index ที่แนะนำ](#index-ที่แนะนำ)
8. [Business Logic Notes](#business-logic-notes)

---

## ภาพรวมตาราง

```
users
 └── processor_records (assigned_to → users.id)
       └── ropa_documents (ropa_doc_id → ropa_documents.id)
             └── auditor_audits (processor_review_status, processor_feedback, processor_expires_at)
```

| ตาราง | บทบาท |
|---|---|
| `processor_records` | เก็บข้อมูลฟอร์ม 6 ส่วนที่ Data Processor กรอก + สถานะ workflow |
| `ropa_documents` | เอกสารหลัก — เก็บสถานะภาพรวม ชื่อ รหัสเอกสาร |
| `auditor_audits` | เก็บผลการตรวจของ Auditor ต่อเอกสารนั้น (processor ดูผ่านตารางนี้) |

---

## ตาราง processor_records

**ชื่อตารางใน DB**: `processor_records`
**Primary Key**: `id` (UUID)

### Schema ทั้งหมด

| Column | Type | Nullable | Default | คำอธิบาย |
|---|---|---|---|---|
| `id` | UUID | NOT NULL | uuid4() | Primary key ของ record นี้ — ใช้ใน URL `/assignments/{id}` |
| `ropa_doc_id` | UUID | NOT NULL | — | FK → `ropa_documents.id` (CASCADE) |
| `assigned_to` | UUID | NULL | — | FK → `users.id` (SET NULL) — Data Processor ที่ถูก assign |
| `processor_status` | VARCHAR/ENUM | NOT NULL | `'pending'` | สถานะปัจจุบัน ดู Enum ด้านล่าง |
| `file_code` | VARCHAR | NULL | — | **[ใหม่]** รหัสไฟล์เฉพาะตัว เช่น `RP-2026-0002` — unique ทั้งระบบ |
| `draft_code` | VARCHAR | NULL | — | รหัสฉบับร่าง เช่น `DFT-5525` — สร้างตอนกด save draft ครั้งแรก |
| `confirmed_at` | TIMESTAMP | NULL | — | วันเวลาที่กดยืนยัน (CONFIRMED) |
| `sent_to_owner_at` | TIMESTAMP | NULL | — | วันเวลาที่กดส่ง (SUBMITTED) |
| `submitted_at` | TIMESTAMP | NULL | — | backward compat — ใช้ค่าเดียวกับ sent_to_owner_at |
| `title_prefix` | VARCHAR | NULL | — | Section 1: คำนำหน้า (นาย/นาง/นางสาว) |
| `first_name` | VARCHAR | NULL | — | Section 1: ชื่อจริง |
| `last_name` | VARCHAR | NULL | — | Section 1: นามสกุล |
| `address` | TEXT | NULL | — | Section 1: ที่อยู่สำนักงาน |
| `email` | VARCHAR | NULL | — | Section 1: อีเมล |
| `phone` | VARCHAR | NULL | — | Section 1: เบอร์โทร |
| `processor_name` | VARCHAR | NULL | — | Section 2: ชื่อผู้ประมวลผลข้อมูล |
| `data_controller_address` | TEXT | NULL | — | Section 2: ที่อยู่ผู้ควบคุมข้อมูล |
| `processing_activity` | VARCHAR | NULL | — | Section 2: กิจกรรมประมวลผล |
| `purpose` | TEXT | NULL | — | Section 2: วัตถุประสงค์ |
| `personal_data` | TEXT | NULL | — | Section 3: JSON array เช่น `'["ชื่อ-นามสกุล","เบอร์โทร"]'` |
| `data_category` | TEXT | NULL | — | Section 3: JSON array เช่น `'["ลูกค้า","พนักงาน"]'` |
| `data_type` | VARCHAR | NULL | — | Section 3: `"general"` หรือ `"sensitive"` |
| `collection_method` | VARCHAR | NULL | — | Section 4: `"electronic"` หรือ `"document"` |
| `data_source` | VARCHAR | NULL | — | Section 4: `"from_owner"` หรือ `"from_other"` |
| `retention_storage_type` | TEXT | NULL | — | Section 4: JSON array เช่น `'["electronic","document"]'` |
| `retention_method` | TEXT | NULL | — | Section 4: JSON array วิธีเก็บรักษา |
| `retention_duration` | VARCHAR | NULL | — | Section 4: ระยะเวลาเก็บรักษา เช่น `"5"` (string ไม่ใช่ int) |
| `retention_duration_unit` | VARCHAR | NULL | — | Section 4: หน่วย — `"year"` / `"month"` / `"day"` / `"days"` |
| `retention_access_condition` | TEXT | NULL | — | Section 4: สิทธิ์การเข้าถึง |
| `retention_deletion_method` | TEXT | NULL | — | Section 4: วิธีลบทำลาย |
| `legal_basis` | TEXT | NULL | — | Section 5: ฐานทางกฎหมาย |
| `transfer_is_transfer` | BOOLEAN | NULL | — | Section 5: ส่งต่างประเทศไหม |
| `transfer_country` | VARCHAR | NULL | — | Section 5: ประเทศปลายทาง |
| `transfer_is_in_group` | BOOLEAN | NULL | — | Section 5: อยู่ในกลุ่มบริษัทเครือไหม |
| `transfer_company_name` | VARCHAR | NULL | — | Section 5: ชื่อบริษัทปลายทาง |
| `transfer_method` | VARCHAR | NULL | — | Section 5: วิธีการโอนข้อมูล |
| `transfer_protection_std` | VARCHAR | NULL | — | Section 5: มาตรฐานคุ้มครอง |
| `transfer_exception` | TEXT | NULL | — | Section 5: ข้อยกเว้นมาตรา 28 |
| `security_organizational` | TEXT | NULL | — | Section 6: มาตรการเชิงองค์กร |
| `security_access_control` | TEXT | NULL | — | Section 6: การควบคุมการเข้าถึง |
| `security_technical` | TEXT | NULL | — | Section 6: มาตรการเชิงเทคนิค |
| `security_responsibility` | TEXT | NULL | — | Section 6: การกำหนดหน้าที่รับผิดชอบ |
| `security_physical` | TEXT | NULL | — | Section 6: มาตรการทางกายภาพ |
| `security_audit` | TEXT | NULL | — | Section 6: มาตรการตรวจสอบย้อนหลัง |
| `created_at` | TIMESTAMP | NOT NULL | NOW() | วันที่ Data Owner assign งานมา |
| `updated_at` | TIMESTAMP | NOT NULL | NOW() | วันที่บันทึกล่าสุด (auto-update) |

### คอลัมน์ที่เพิ่งเพิ่มใหม่

| Column | ประเภท | คำอธิบาย |
|---|---|---|
| `file_code` | VARCHAR UNIQUE | รหัสไฟล์เฉพาะตัวของ Processor record เช่น `RP-2026-0002` — สร้างตอน record ถูก INSERT ครั้งแรก นับร่วมกับ `owner_records.file_code` ห้ามซ้ำกันข้ามตาราง |

---

## ตาราง ropa_documents

**ใช้ร่วมกับ Data Owner** — เฉพาะ column ที่ Data Processor เกี่ยวข้อง:

| Column | Type | คำอธิบาย |
|---|---|---|
| `id` | UUID | เชื่อม `processor_records.ropa_doc_id` |
| `title` | VARCHAR | ชื่อรายการ — แสดงในตาราง Sidebar 1, 2, 3 |
| `doc_code` | VARCHAR | รหัสเอกสารหลัก เช่น `RP-2026-0900` — ใช้เป็น parent reference |
| `status` | ENUM | สถานะภาพรวม — Processor ดูเพื่อรู้ว่าเอกสารอยู่ขั้นตอนไหน |
| `sent_to_auditor_at` | TIMESTAMP | วันที่ Data Owner ส่งให้ Auditor |

---

## Enum Values

### ProcessorStatus (ใน `processor_records.processor_status`)

| ค่าใน DB | แสดงบนหน้าจอ | ความหมาย |
|---|---|---|
| `pending` | กำลังดำเนินการ | ได้รับมอบหมายแล้ว ยังไม่เปิดฟอร์ม |
| `in_progress` | กำลังดำเนินการ | บันทึกฉบับร่างแล้ว กำลังกรอก |
| `confirmed` | กำลังดำเนินการ | กรอกครบ กดยืนยันแล้ว รอส่ง |
| `submitted` | ส่งงานแล้ว | ส่งให้ Data Owner เรียบร้อย |
| `needs_revision` | รอแก้ไข | Auditor ตีกลับ ต้องแก้ไข |

### DocumentStatus (ใน `ropa_documents.status`) — เฉพาะที่ Processor เห็น

| ค่าใน DB | ความหมาย |
|---|---|
| `pending_processor` | Data Owner assign ให้ Processor แล้ว |
| `pending_auditor` | Data Owner ส่งให้ Auditor แล้ว |
| `approved` | Auditor อนุมัติทั้ง 2 ฟอร์มแล้ว |
| `rejected_processor` | Auditor ตีกลับฟอร์ม Processor |
| `rejected_owner` | Auditor ตีกลับฟอร์ม Owner |

### processor_review_status (ใน `auditor_audits.processor_review_status`)

| ค่า | แสดงบนหน้าจอ | ความหมาย |
|---|---|---|
| `pending_review` | รอตรวจสอบ | Auditor ยังไม่ได้ตรวจฟอร์ม Processor |
| `approved` | อนุมัติ | Auditor อนุมัติฟอร์ม Processor แล้ว |
| `needs_revision` | ต้องแก้ไข | Auditor ตีกลับฟอร์ม Processor |

> ⚠️ **สำคัญ**: Data Processor ดูสถานะจาก `auditor_audits.processor_review_status` เท่านั้น ไม่ใช่ `auditor_audits.audit_status` (overall)

---

## Relationships & Foreign Keys

```sql
processor_records.ropa_doc_id  → ropa_documents.id   (ON DELETE CASCADE)
processor_records.assigned_to  → users.id             (ON DELETE SET NULL)
```

- `ON DELETE CASCADE`: ถ้าลบ `ropa_documents` → ลบ `processor_records` ทั้งหมดที่เชื่อมอยู่ด้วย
- `ON DELETE SET NULL`: ถ้าลบ `users` → `assigned_to` กลายเป็น NULL (ไม่ลบ record)

---

## SQL Migration Script

```sql
-- ════════════════════════════════════════════════════════
-- Migration: Data Processor Schema Changes
-- วันที่: 2026-04-09
-- ════════════════════════════════════════════════════════

-- 1. เพิ่ม file_code ใน processor_records
ALTER TABLE processor_records
    ADD COLUMN IF NOT EXISTS file_code VARCHAR UNIQUE;

-- 2. เพิ่ม file_code ใน owner_records (ต้องทำพร้อมกัน เพราะ sequential นับร่วมกัน)
ALTER TABLE owner_records
    ADD COLUMN IF NOT EXISTS file_code VARCHAR UNIQUE;

-- 3. ตรวจสอบ column retention_duration เป็น VARCHAR (ไม่ใช่ INTEGER)
-- ถ้า column นี้เป็น INTEGER ให้เปลี่ยนเป็น VARCHAR
-- ALTER TABLE processor_records ALTER COLUMN retention_duration TYPE VARCHAR;

-- 4. Backfill file_code สำหรับ records เก่าที่ยังไม่มี
-- *** ควร run ผ่าน Python script เพื่อให้ sequential counter ถูกต้อง ***
-- ตัวอย่างการ generate ด้วย SQL (approximate):
-- UPDATE processor_records SET file_code = 'RP-' || EXTRACT(YEAR FROM created_at) || '-' || LPAD(ROW_NUMBER() OVER (ORDER BY created_at)::TEXT, 4, '0')
-- WHERE file_code IS NULL;
```

---

## Index ที่แนะนำ

```sql
-- Index สำหรับ query หลัก (assigned_to ใช้บ่อยที่สุด)
CREATE INDEX IF NOT EXISTS idx_processor_records_assigned_to
    ON processor_records(assigned_to);

-- Index สำหรับ join กับ ropa_documents
CREATE INDEX IF NOT EXISTS idx_processor_records_ropa_doc_id
    ON processor_records(ropa_doc_id);

-- Index สำหรับ filter ตาม processor_status
CREATE INDEX IF NOT EXISTS idx_processor_records_status
    ON processor_records(processor_status);

-- Index สำหรับ draft list (IN_PROGRESS + draft_code)
CREATE INDEX IF NOT EXISTS idx_processor_records_draft_code
    ON processor_records(draft_code)
    WHERE draft_code IS NOT NULL;

-- Index สำหรับ file_code lookup
CREATE INDEX IF NOT EXISTS idx_processor_records_file_code
    ON processor_records(file_code)
    WHERE file_code IS NOT NULL;
```

---

## Business Logic Notes

### file_code vs draft_code vs doc_code

| รหัส | ตาราง | รูปแบบ | สร้างตอนไหน | ลบได้ไหม |
|---|---|---|---|---|
| `file_code` | `processor_records` | `RP-2026-0002` | ตอน record ถูก INSERT ครั้งแรก | ไม่ได้ — ถาวร |
| `draft_code` | `processor_records` | `DFT-5525` | ตอนกด "บันทึกฉบับร่าง" ครั้งแรก | ได้ — reset เป็น NULL เมื่อลบร่าง |
| `doc_code` | `ropa_documents` | `RP-2026-0900` | Data Owner ตั้ง | ไม่ได้ |

### sequential counter ของ file_code

- นับร่วมกันระหว่าง `owner_records.file_code` และ `processor_records.file_code`
- Backend หาเลขสูงสุดจากทั้ง 2 ตาราง แล้ว +1
- รูปแบบ: `RP-{ปีปัจจุบัน}-{เลข 4 หลัก zero-padded}` เช่น `RP-2026-0001`
- ตัวอย่าง: owner ได้ `RP-2026-0900`, processor ของเอกสารเดียวกันได้ `RP-2026-0901`

### workflow สถานะ processor_status

```
PENDING → (กดแก้ไข + save draft) → IN_PROGRESS
IN_PROGRESS → (กดยืนยัน) → CONFIRMED
CONFIRMED → (กดส่ง) → SUBMITTED
SUBMITTED → (Auditor ตีกลับ) → NEEDS_REVISION
NEEDS_REVISION → (กดแก้ไข + save draft) → IN_PROGRESS
```

### column ไหนถูก set ตอนไหน

| column | set ตอนไหน |
|---|---|
| `file_code` | ตอน record ถูก INSERT (auto-generate) |
| `draft_code` | ตอนกด save draft ครั้งแรก (`DFT-XXXX` sequential) |
| `confirmed_at` | ตอนกด confirm (status → CONFIRMED) |
| `sent_to_owner_at` | ตอนกดส่ง (status → SUBMITTED) |
| `retention_duration` + `retention_duration_unit` | Processor กรอกในฟอร์ม Section 4 — **Auditor ใช้คำนวณ expires_at** |

### JSON fields — ต้องเก็บเป็น JSON string

fields เหล่านี้ใน DB เป็น TEXT เก็บ JSON array:
- `personal_data` → `'["ชื่อ-นามสกุล","เบอร์โทร"]'`
- `data_category` → `'["ลูกค้า","พนักงาน"]'`
- `retention_storage_type` → `'["electronic","document"]'`
- `retention_method` → `'["วิธีที่1","วิธีที่2"]'`

Frontend ส่งมาเป็น array → Backend แปลงเป็น JSON string ก่อนเก็บ → Backend แปลงกลับเป็น array ตอน response

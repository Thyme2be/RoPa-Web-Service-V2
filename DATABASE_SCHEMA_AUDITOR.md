# DATABASE SCHEMA — AUDITOR

> เอกสารนี้อธิบาย schema ของตารางทั้งหมดที่ระบบ Auditor ใช้งาน
> ครอบคลุม: `auditor_profiles`, `auditor_audits`, `deleted_document_logs`
> และคอลัมน์ที่เกี่ยวข้องจาก `owner_records`, `processor_records`, `ropa_documents`

---

## 1. ตาราง `auditor_profiles`

โปรไฟล์เพิ่มเติมของ Auditor (แยกจาก `users` เพราะมีข้อมูลเฉพาะทาง)

| คอลัมน์ | Type | Nullable | ค่า Default | คำอธิบาย |
|---|---|---|---|---|
| `id` | UUID | NOT NULL | `uuid4()` | Primary key |
| `user_id` | UUID | NOT NULL | — | FK → `users.id` ON DELETE CASCADE |
| `auditor_type` | Enum | NOT NULL | — | ประเภท: `internal` / `outsource` |
| `outsource_company` | VARCHAR | NULL | — | ชื่อบริษัทภายนอก (เฉพาะ outsource) |
| `public_email` | VARCHAR | NOT NULL | — | อีเมลที่แสดงต่อสาธารณะ |
| `public_phone` | VARCHAR | NULL | — | เบอร์โทรที่แสดงต่อสาธารณะ |
| `certification` | VARCHAR | NULL | — | ใบรับรอง/คุณวุฒิ |
| `appointed_at` | DATE | NOT NULL | — | วันที่ได้รับการแต่งตั้ง |
| `expired_at` | DATE | NULL | — | วันหมดอายุการแต่งตั้ง (ถ้ามี) |
| `is_active` | BOOLEAN | NOT NULL | `true` | ยังใช้งานอยู่ไหม |

**Enum `AuditorType`**

```sql
CREATE TYPE auditortype AS ENUM ('internal', 'outsource');
```

**Foreign Keys**

```sql
ALTER TABLE auditor_profiles
  ADD CONSTRAINT fk_auditor_profiles_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
```

**Index แนะนำ**

```sql
CREATE INDEX idx_auditor_profiles_user_id ON auditor_profiles(user_id);
CREATE INDEX idx_auditor_profiles_is_active ON auditor_profiles(is_active);
```

---

## 2. ตาราง `auditor_audits`

บันทึกผลการตรวจสอบของ Auditor — 1 record ต่อ 1 เอกสาร (`ropa_doc_id`)
ข้อสำคัญ: 1 record มี **2 สถานะอิสระ** คือ `owner_review_status` และ `processor_review_status`

| คอลัมน์ | Type | Nullable | ค่า Default | คำอธิบาย |
|---|---|---|---|---|
| `id` | UUID | NOT NULL | `uuid4()` | Primary key |
| `ropa_doc_id` | UUID | NOT NULL | — | FK → `ropa_documents.id` ON DELETE CASCADE |
| `assigned_auditor_id` | UUID | NOT NULL | — | FK → `auditor_profiles.id` ON DELETE CASCADE |
| `status` | Enum(DocumentStatus) | NULL | — | **เก่า** — เก็บไว้ backward compat (ไม่ได้ใช้ใน logic ใหม่) |
| `audit_status` | Enum(AuditStatus) | NULL | — | สถานะรวม: `pending_review` / `approved` / `needs_revision` — set เป็น APPROVED เฉพาะเมื่อ **ทั้ง 2 ฟอร์ม** อนุมัติแล้ว |
| `feedback_comment` | TEXT | NULL | — | **เก่า** — comment รวม เก็บไว้ backward compat |
| `owner_feedback` | TEXT | NULL | — | feedback ฟอร์ม Owner เก็บเป็น **JSON array** `[{"section","section_label","comment"}]` |
| `processor_feedback` | TEXT | NULL | — | feedback ฟอร์ม Processor เก็บเป็น **JSON array** เช่นเดียวกัน |
| `owner_received_at` | TIMESTAMP | NULL | — | วันเวลาที่ owner form ถูกส่งมาให้ตรวจ — ใช้นับ monthly trend |
| `processor_received_at` | TIMESTAMP | NULL | — | วันเวลาที่ processor form ถูกส่งมาให้ตรวจ — update ทุกครั้งที่ processor resubmit |
| `owner_review_status` | VARCHAR | NULL | `'pending_review'` | สถานะฟอร์ม Owner: `pending_review` / `approved` / `needs_revision` |
| `owner_feedback_sent_at` | TIMESTAMP | NULL | — | วันเวลาที่ Auditor ส่ง feedback ให้ Owner |
| `processor_review_status` | VARCHAR | NULL | `'pending_review'` | สถานะฟอร์ม Processor: `pending_review` / `approved` / `needs_revision` |
| `processor_feedback_sent_at` | TIMESTAMP | NULL | — | วันเวลาที่ Auditor ส่ง feedback ให้ Processor |
| `owner_expires_at` | TIMESTAMP | NULL | — | **วันหมดอายุไฟล์ Owner** — คำนวณอัตโนมัติจาก `owner_records.retention_duration` (หน่วย: ปี) ตอนอนุมัติ |
| `processor_expires_at` | TIMESTAMP | NULL | — | **วันหมดอายุไฟล์ Processor** — คำนวณจาก `processor_records.retention_duration` + `retention_duration_unit` ตอนอนุมัติ |
| `version` | INTEGER | NULL | — | เวอร์ชันการตรวจ (เพิ่มทุกรอบที่ส่งแก้ไข) |
| `approved_at` | TIMESTAMP | NULL | — | วันเวลาที่ audit_status เปลี่ยนเป็น APPROVED (ทั้ง 2 ฟอร์มผ่านแล้ว) |
| `request_change_at` | TIMESTAMP | NULL | — | วันเวลาล่าสุดที่ Auditor ส่ง feedback กลับ (ตีกลับ) |
| `updated_at` | TIMESTAMP | NULL | auto-update | วันเวลาแก้ไขล่าสุด |

### 2.1 Enum ที่ใช้

**AuditStatus** (ใช้ใน `audit_status`)

```sql
CREATE TYPE auditstatus AS ENUM ('pending_review', 'approved', 'needs_revision');
```

**DocumentStatus** (ใช้ใน `status` — backward compat, ดู ropa_documents)

```sql
CREATE TYPE documentstatus AS ENUM (
  'draft', 'pending_processor', 'pending_auditor',
  'approved', 'rejected_processor', 'rejected_owner'
);
```

### 2.2 รูปแบบ JSON ใน feedback fields

**`owner_feedback`** และ **`processor_feedback`** เก็บเป็น JSON array ของ objects:

```json
[
  {
    "section": "section_2",
    "section_label": "ส่วนที่ 2 : รายละเอียดกิจกรรม",
    "comment": "กรุณาระบุวัตถุประสงค์ให้ชัดเจนยิ่งขึ้น"
  },
  {
    "section": "section_5",
    "section_label": "ส่วนที่ 5 : ฐานทางกฎหมายและการส่งต่อ",
    "comment": "กรุณายืนยัน SCCs สำหรับการส่งข้อมูลต่างประเทศ"
  }
]
```

Section keys ที่ใช้ได้: `section_1` ถึง `section_6`

### 2.3 Logic วันหมดอายุ (expires_at)

**Backend คำนวณอัตโนมัติ** ตอน Auditor กด "อนุมัติ" — Auditor ไม่ได้กรอกเอง

| form_type | ดึงข้อมูลจาก | หน่วย | สูตรคำนวณ |
|---|---|---|---|
| `owner` | `owner_records.retention_duration` | **ปี** เท่านั้น | `approved_date + N ปี` |
| `processor` | `processor_records.retention_duration` + `retention_duration_unit` | `year` / `month` / `day` | ตาม unit ที่ระบุ |

ตัวอย่าง: Processor กรอก `retention_duration = "3"`, `retention_duration_unit = "year"` → อนุมัติวันที่ 2026-04-09 → `processor_expires_at = 2029-04-09`

### 2.4 Foreign Keys

```sql
ALTER TABLE auditor_audits
  ADD CONSTRAINT fk_auditor_audits_doc
    FOREIGN KEY (ropa_doc_id) REFERENCES ropa_documents(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_auditor_audits_auditor
    FOREIGN KEY (assigned_auditor_id) REFERENCES auditor_profiles(id) ON DELETE CASCADE;
```

### 2.5 Index แนะนำ

```sql
CREATE INDEX idx_auditor_audits_doc_id ON auditor_audits(ropa_doc_id);
CREATE INDEX idx_auditor_audits_auditor_id ON auditor_audits(assigned_auditor_id);
CREATE INDEX idx_auditor_audits_owner_expires ON auditor_audits(owner_expires_at);
CREATE INDEX idx_auditor_audits_processor_expires ON auditor_audits(processor_expires_at);
CREATE INDEX idx_auditor_audits_owner_status ON auditor_audits(owner_review_status);
CREATE INDEX idx_auditor_audits_processor_status ON auditor_audits(processor_review_status);
```

---

## 3. ตาราง `deleted_document_logs`

Log การลบเอกสาร — เก็บหลักฐานว่า Auditor ลบเอกสารไปกี่ฉบับ
ใช้เพราะ `ropa_documents` ใช้ **hard delete** (ตัวเอกสารหายออกจาก DB จริงๆ)
**ต้อง INSERT log นี้ก่อน แล้วค่อย `db.delete(doc)`**

| คอลัมน์ | Type | Nullable | ค่า Default | คำอธิบาย |
|---|---|---|---|---|
| `id` | UUID | NOT NULL | `uuid4()` | Primary key |
| `ropa_doc_id` | UUID | NOT NULL | — | อดีต FK → `ropa_documents` — เอกสารถูกลบแล้ว เก็บไว้เป็น reference เท่านั้น (ไม่มี FK constraint) |
| `doc_code` | VARCHAR | NULL | — | รหัสเอกสาร — คัดลอกมาก่อนลบ เพื่อ reference ในอนาคต |
| `title` | VARCHAR | NULL | — | ชื่อเอกสาร — คัดลอกมาก่อนลบ |
| `auditor_profile_id` | UUID | NULL | — | FK → `auditor_profiles.id` ON DELETE SET NULL — Auditor ที่ลบ |
| `deleted_at` | TIMESTAMP | NOT NULL | `datetime.now(UTC)` | วันเวลาที่ลบ |

**Foreign Keys**

```sql
ALTER TABLE deleted_document_logs
  ADD CONSTRAINT fk_deleted_logs_auditor
    FOREIGN KEY (auditor_profile_id) REFERENCES auditor_profiles(id) ON DELETE SET NULL;
```

**Index แนะนำ**

```sql
CREATE INDEX idx_deleted_logs_auditor ON deleted_document_logs(auditor_profile_id);
CREATE INDEX idx_deleted_logs_deleted_at ON deleted_document_logs(deleted_at);
```

---

## 4. คอลัมน์ที่ Auditor ต้องการจาก `owner_records`

ตาราง `owner_records` เป็นของ Data Owner แต่ Auditor ต้องอ่านเพื่อ:
- **แสดงฟอร์ม 6 ส่วน** ในหน้าตรวจ
- **คำนวณ `owner_expires_at`** จาก `retention_duration`

| คอลัมน์ที่ Auditor ใช้ | Type | คำอธิบาย |
|---|---|---|
| `file_code` | VARCHAR, UNIQUE, NULL | รหัสไฟล์เฉพาะตัว เช่น `RP-2026-0001` — แสดงใน Sidebar 2, 3 |
| `retention_duration` | INTEGER, NULL | ระยะเวลาเก็บรักษา (หน่วย: **ปี** เท่านั้น) — ใช้คำนวณ `owner_expires_at` |
| `ropa_doc_id` | UUID, FK | เชื่อมกลับไป `ropa_documents` |

ทุก field อื่นของ `owner_records` ถูก include ในหน้าฟอร์ม 6 ส่วนด้วย ดูตาราง full schema ใน `DATABASE_SCHEMA_CHANGES.md`

---

## 5. คอลัมน์ที่ Auditor ต้องการจาก `processor_records`

| คอลัมน์ที่ Auditor ใช้ | Type | คำอธิบาย |
|---|---|---|
| `file_code` | VARCHAR, UNIQUE, NULL | รหัสไฟล์เฉพาะตัว เช่น `RP-2026-0002` — แสดงใน Sidebar 2, 3 |
| `retention_duration` | VARCHAR, NULL | ระยะเวลาเก็บรักษา (เป็น string เช่น `"5"`) |
| `retention_duration_unit` | VARCHAR, NULL | หน่วย: `year` / `month` / `day` — ใช้คำนวณ `processor_expires_at` |
| `ropa_doc_id` | UUID, FK | เชื่อมกลับไป `ropa_documents` |
| `processor_status` | Enum(ProcessorStatus) | backend update เป็น `NEEDS_REVISION` เมื่อ Auditor ตีกลับ |

ทุก field อื่นของ `processor_records` ถูก include ในหน้าฟอร์ม 6 ส่วนด้วย ดูตาราง full schema ใน `DATABASE_SCHEMA_CHANGES.md`

---

## 6. คอลัมน์ที่ Auditor ต้องการจาก `ropa_documents`

| คอลัมน์ | Type | คำอธิบาย |
|---|---|---|
| `id` | UUID, PK | Primary key |
| `doc_code` | VARCHAR, UNIQUE, NULL | รหัสเอกสาร เช่น `RP-2026-1000` (ระดับเอกสาร ไม่ใช่ระดับไฟล์) |
| `title` | VARCHAR, NOT NULL | ชื่อเอกสาร |
| `status` | Enum(DocumentStatus) | สถานะ — Auditor update ตอนอนุมัติ/ตีกลับ |
| `deleted_at` | TIMESTAMP, NULL | ถ้าไม่ใช่ NULL = ถูกลบแล้ว (Auditor ต้อง filter `IS NULL`) |
| `sent_to_auditor_at` | TIMESTAMP, NULL | วันที่ส่งให้ Auditor ตรวจ |
| `owner_id` | UUID, FK | เชื่อม owner (Data Owner) |

---

## 7. SQL Migration Script

รัน script นี้เพื่อเพิ่มคอลัมน์ใหม่ที่ยังไม่มีใน DB:

```sql
-- ── auditor_audits: เพิ่มคอลัมน์ใหม่ ──

-- วันหมดอายุแยกต่อไฟล์
ALTER TABLE auditor_audits
  ADD COLUMN IF NOT EXISTS owner_expires_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS processor_expires_at TIMESTAMP;

-- สถานะการตรวจแยกต่อฟอร์ม
ALTER TABLE auditor_audits
  ADD COLUMN IF NOT EXISTS owner_review_status VARCHAR DEFAULT 'pending_review',
  ADD COLUMN IF NOT EXISTS processor_review_status VARCHAR DEFAULT 'pending_review';

-- วันที่รับและส่ง feedback แยกต่อฟอร์ม
ALTER TABLE auditor_audits
  ADD COLUMN IF NOT EXISTS owner_received_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS processor_received_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS owner_feedback_sent_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS processor_feedback_sent_at TIMESTAMP;

-- feedback แยกต่อฟอร์ม
ALTER TABLE auditor_audits
  ADD COLUMN IF NOT EXISTS owner_feedback TEXT,
  ADD COLUMN IF NOT EXISTS processor_feedback TEXT;

-- ── owner_records: เพิ่ม file_code ──
ALTER TABLE owner_records
  ADD COLUMN IF NOT EXISTS file_code VARCHAR UNIQUE;

-- ── processor_records: เพิ่ม file_code ──
ALTER TABLE processor_records
  ADD COLUMN IF NOT EXISTS file_code VARCHAR UNIQUE;

-- ── สร้าง index ──
CREATE INDEX IF NOT EXISTS idx_auditor_audits_owner_expires ON auditor_audits(owner_expires_at);
CREATE INDEX IF NOT EXISTS idx_auditor_audits_processor_expires ON auditor_audits(processor_expires_at);
CREATE INDEX IF NOT EXISTS idx_auditor_audits_owner_status ON auditor_audits(owner_review_status);
CREATE INDEX IF NOT EXISTS idx_auditor_audits_processor_status ON auditor_audits(processor_review_status);
CREATE INDEX IF NOT EXISTS idx_owner_records_file_code ON owner_records(file_code);
CREATE INDEX IF NOT EXISTS idx_processor_records_file_code ON processor_records(file_code);
```

---

## 8. Relationship Diagram

```
users
  └─── auditor_profiles (user_id FK)
         ├─── auditor_audits (assigned_auditor_id FK)
         │      ├─── ropa_documents (ropa_doc_id FK)  ← CASCADE DELETE
         │      │      ├─── owner_records (ropa_doc_id FK)
         │      │      └─── processor_records (ropa_doc_id FK)
         │      │
         │      └─── [owner_expires_at, processor_expires_at: คำนวณจาก retention fields]
         │
         └─── deleted_document_logs (auditor_profile_id FK, SET NULL on delete)
```

---

## 9. Business Logic สำคัญ

### 9.1 การอนุมัติแบบอิสระ (Independent Approval)

- Owner form และ Processor form อนุมัติ **แยกกันอิสระ**
- ไม่ต้องรอทั้ง 2 ฟอร์มพร้อมกัน
- เมื่อทั้ง 2 ฟอร์มอนุมัติแล้ว → `audit_status = APPROVED`, `doc.status = APPROVED`

```
owner_review_status = approved  ─┐
                                  ├─ ทั้งคู่ approved → audit_status = APPROVED
processor_review_status = approved ─┘
```

### 9.2 การตีกลับ (Rejection)

- ตีกลับ owner → `doc.status = REJECTED_OWNER`
- ตีกลับ processor → `doc.status = REJECTED_PROCESSOR` + `ProcessorRecord.processor_status = NEEDS_REVISION`
- **ไม่แตะ expires_at เลย** เมื่อตีกลับ

### 9.3 Sidebar 3 — แสดงแถวต่อ "ไฟล์" (ไม่ใช่ต่อ "เอกสาร")

- 1 `auditor_audit` สามารถสร้างได้ **2 แถว** ใน Sidebar 3
- เงื่อนไข: `owner_expires_at <= now` → แถว owner, `processor_expires_at <= now` → แถว processor
- แต่ละแถวมี `form_type` และ `form_label` บอกว่าเป็นไฟล์ไหน

### 9.4 Hard Delete Pattern

1. INSERT ลง `deleted_document_logs` ก่อน (คัดลอก `ropa_doc_id`, `doc_code`, `title`)
2. `db.delete(doc)` → CASCADE ลบ `owner_records`, `processor_records`, `auditor_audits` ทั้งหมด
3. `deleted_document_logs` ยังอยู่ → ใช้นับ `deleted_count` ใน stats

### 9.5 file_code vs doc_code

| | รูปแบบ | ระดับ | ตาราง |
|---|---|---|---|
| `doc_code` | `RP-2026-1000` | เอกสาร (1 ต่อเอกสาร) | `ropa_documents` |
| `file_code` (owner) | `RP-2026-0001` | ไฟล์ (owner form) | `owner_records` |
| `file_code` (processor) | `RP-2026-0002` | ไฟล์ (processor form) | `processor_records` |

- Counter ของ `file_code` เป็น **global** — นับรวมทั้ง `owner_records` และ `processor_records`
- ดังนั้น owner และ processor ของเอกสารเดียวกันจะได้เลขต่างกัน (ไม่ซ้ำกันเลย)

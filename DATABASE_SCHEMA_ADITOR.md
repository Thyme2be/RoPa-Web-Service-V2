# Database Schema Changes

**Branch**: feat/backend-data-auditor
**วันที่อัพเดท**: 8 เมษายน 2569

เอกสารนี้บันทึกการเปลี่ยนแปลง schema ของ database ทั้งหมดที่เพิ่มในรอบนี้ (เทียบกับ branch main)

---

## ภาพรวมการเปลี่ยนแปลง

| ตาราง | การเปลี่ยนแปลง |
|---|---|
| `ropa_documents` | เพิ่ม 2 คอลัมน์: `expires_at`, `deleted_at` |
| `auditor_audits` | เพิ่ม 5 คอลัมน์: `owner_feedback`, `owner_review_status`, `owner_feedback_sent_at`, `processor_review_status`, `processor_feedback_sent_at` |
| `deleted_document_logs` | **ตารางใหม่** — บันทึกประวัติการลบเอกสาร (HARD DELETE) |

---

## 1. ตาราง `ropa_documents` — คอลัมน์ที่เพิ่ม

| คอลัมน์ | ชนิด | Nullable | Default | คำอธิบาย |
|---|---|---|---|---|
| `expires_at` | `DateTime` | YES | `NULL` | วันหมดอายุของเอกสาร — Auditor กำหนดตอนอนุมัติ (ส่งมาใน `expires_at` ของ submit-feedback) เอกสารที่มีค่านี้และวันผ่านแล้วจะปรากฏใน Auditor Sidebar 3 |
| `deleted_at` | `DateTime` | YES | `NULL` | คอลัมน์เดิม (soft delete) — **ไม่ได้ใช้งานแล้ว** ระบบเปลี่ยนเป็น hard delete แทน ค่าที่มีอยู่แล้วยังคงอยู่แต่ไม่ถูกอ่านในโค้ดใหม่ |

**SQL Migration (ถ้ายังไม่มีคอลัมน์):**
```sql
ALTER TABLE ropa_documents
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
```

---

## 2. ตาราง `auditor_audits` — คอลัมน์ที่เพิ่ม

คอลัมน์ใหม่ทั้ง 7 ตัวนี้แยก received_at, feedback และ review status ของ owner form กับ processor form ออกจากกันอย่างอิสระ

| คอลัมน์ | ชนิด | Nullable | Default | คำอธิบาย |
|---|---|---|---|---|
| `owner_received_at` | `DateTime` | YES | `NULL` | วันที่ owner form ถูกส่งมาให้ Auditor ตรวจ — set ตอน `doc.status = PENDING_AUDITOR` เฉพาะถ้า owner ยังไม่ `approved` จะ update ใหม่ทุกครั้งที่ owner resubmit |
| `processor_received_at` | `DateTime` | YES | `NULL` | วันที่ processor form ถูกส่งมาให้ Auditor ตรวจ — set ตอน `doc.status = PENDING_AUDITOR` เฉพาะถ้า processor ยังไม่ `approved` จะ update ใหม่ทุกครั้งที่ processor resubmit |
| `owner_feedback` | `Text` | YES | `NULL` | Feedback ที่ Auditor ส่งให้ฟอร์ม Owner โดยเฉพาะ — เก็บเป็น JSON list: `[{"section":"section_2","section_label":"...","comment":"..."}]` |
| `owner_review_status` | `String` | YES | `'pending_review'` | สถานะการตรวจฟอร์ม Owner: `"pending_review"` / `"approved"` / `"needs_revision"` |
| `owner_feedback_sent_at` | `DateTime` | YES | `NULL` | วันเวลาที่ Auditor กด "ส่งข้อเสนอแนะ" สำหรับฟอร์ม Owner (แสดงเป็น "วันที่ส่ง" ในตาราง Sidebar 2) |
| `processor_review_status` | `String` | YES | `'pending_review'` | สถานะการตรวจฟอร์ม Processor: `"pending_review"` / `"approved"` / `"needs_revision"` |
| `processor_feedback_sent_at` | `DateTime` | YES | `NULL` | วันเวลาที่ Auditor กด "ส่งข้อเสนอแนะ" สำหรับฟอร์ม Processor (แสดงเป็น "วันที่ส่ง" ในตาราง Sidebar 2) |

**ทำไม `owner_received_at` / `processor_received_at` จึงจำเป็น:**

`ropa_documents.sent_to_auditor_at` เป็น field ระดับ document — update ใหม่ทุกครั้งที่ส่งให้ Auditor (ทั้ง first time และ resubmit) ทำให้ monthly_trend และ pending_since_yesterday นับผิด ถ้า processor ถูกตีกลับและ resubmit ในเดือนถัดไป → ไม่ควร count +2 (owner form ไม่ได้ส่งมาใหม่)

ด้วย `owner_received_at` และ `processor_received_at` แยกกัน:
- **Resubmit processor only** → `processor_received_at = now()`, `owner_received_at` ไม่เปลี่ยน ✅
- **Monthly trend**: นับแยก 1 file ต่อ timestamp ✅
- **pending_since_yesterday**: เช็ค timestamp ของแต่ละ form แยกกัน ✅

**ความสัมพันธ์กับ `processor_feedback` (คอลัมน์เดิม):**

| คอลัมน์ | ใช้กับ | รูปแบบ JSON |
|---|---|---|
| `processor_feedback` (เดิม) | ฟอร์ม Processor (backward compat) | Object: `{"section_5": "comment...", "section_6": "comment..."}` |
| `owner_feedback` (ใหม่) | ฟอร์ม Owner | List: `[{"section":"section_2","section_label":"...","comment":"..."}]` |

> **หมายเหตุ**: `processor_feedback` ยังใช้งานอยู่ใน GET /processor/feedback (backward compat) แต่คอลัมน์ใหม่ใช้รูปแบบ List เหมือนกัน ถ้าอ่านข้อมูลเก่าที่เป็น Object รูปแบบเก่า จะถูก parse ด้วย backward compat code

**SQL Migration:**
```sql
ALTER TABLE auditor_audits
  ADD COLUMN IF NOT EXISTS owner_received_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS processor_received_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS owner_feedback TEXT,
  ADD COLUMN IF NOT EXISTS owner_review_status VARCHAR DEFAULT 'pending_review',
  ADD COLUMN IF NOT EXISTS owner_feedback_sent_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS processor_review_status VARCHAR DEFAULT 'pending_review',
  ADD COLUMN IF NOT EXISTS processor_feedback_sent_at TIMESTAMP WITH TIME ZONE;
```

---

## 3. ตาราง `deleted_document_logs` — ตารางใหม่

ตารางนี้ **เพิ่มใหม่ทั้งหมด** — ใช้บันทึกประวัติเอกสารที่ถูก hard delete เพื่อให้ Auditor Sidebar 3 นับ `deleted_count` ได้ (เอกสารจริงหายออกจาก DB แล้ว จึงต้องมี log แยก)

### โครงสร้างตาราง

| คอลัมน์ | ชนิด | Nullable | Default | คำอธิบาย |
|---|---|---|---|---|
| `id` | `UUID` | NO | `uuid4()` | Primary key |
| `ropa_doc_id` | `UUID` | NO | — | UUID ของเอกสารที่ถูกลบ (ไม่ใช่ FK เพราะเอกสารถูกลบแล้ว — เก็บไว้เป็น reference เท่านั้น) |
| `doc_code` | `String` | YES | `NULL` | รหัสเอกสาร เช่น `"RP-2026-0900"` — เก็บก่อนลบเพื่อ reference |
| `title` | `String` | YES | `NULL` | ชื่อเอกสาร — เก็บก่อนลบเพื่อ reference |
| `auditor_profile_id` | `UUID` | YES | `NULL` | FK → `auditor_profiles.id` (ON DELETE SET NULL) — Auditor ที่เป็นคนลบ |
| `deleted_at` | `DateTime` | NO | `now()` (UTC) | วันเวลาที่ลบ — auto-set ตอนสร้าง log |

### SQL Create Table

```sql
CREATE TABLE IF NOT EXISTS deleted_document_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ropa_doc_id UUID NOT NULL,
  doc_code VARCHAR,
  title VARCHAR,
  auditor_profile_id UUID REFERENCES auditor_profiles(id) ON DELETE SET NULL,
  deleted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
```

### เหตุผลที่ `ropa_doc_id` ไม่ใช่ FK

เอกสารถูก hard delete ออกจาก `ropa_documents` แล้ว ถ้า `ropa_doc_id` เป็น FK → จะ error ตอน INSERT log เพราะ parent ไม่มีแล้ว ดังนั้นเก็บเป็น plain UUID แทน

### ลำดับการทำงานในโค้ด (DELETE endpoint)

```python
# 1. สร้าง log ก่อน (ขณะที่ doc ยังอยู่)
log = DeletedDocumentLog(
    ropa_doc_id=doc.id,
    doc_code=doc.doc_code,
    title=doc.title,
    auditor_profile_id=auditor_profile.id,
)
db.add(log)

# 2. ลบ doc (CASCADE ลบ owner_record, processor_records, auditor_audits ด้วย)
db.delete(doc)
db.commit()
```

---

## ตาราง Schema ที่มีอยู่แล้ว (ไม่เปลี่ยนแปลงในรอบนี้)

| ตาราง | ความสัมพันธ์ |
|---|---|
| `ropa_documents` | Parent ของ `owner_records`, `processor_records`, `auditor_audits` (CASCADE DELETE) |
| `owner_records` | 1:1 กับ `ropa_documents` (via `ropa_doc_id`) |
| `processor_records` | N:1 กับ `ropa_documents` (via `ropa_doc_id`) |
| `auditor_audits` | N:1 กับ `ropa_documents` (via `ropa_doc_id`) |
| `auditor_profiles` | 1:1 กับ `users` (via `user_id`) |
| `users` | ตารางหลักของระบบ authentication |

---

## สรุป Enum ค่า status ที่ใช้ในระบบ

### `ropa_documents.status` (DocumentStatus)

| ค่า | ความหมาย | เกิดจาก |
|---|---|---|
| `draft` | Data Owner สร้างแล้ว ยังไม่ส่งใคร | default เมื่อสร้าง |
| `pending_processor` | ส่งให้ Data Processor กรอกแล้ว | Data Owner assign งาน |
| `pending_auditor` | Data Owner ส่งให้ Auditor ตรวจแล้ว | Data Owner ส่ง |
| `approved` | Auditor อนุมัติทั้ง 2 ฟอร์มแล้ว | Auditor อนุมัติครบ |
| `rejected_processor` | Auditor ตีกลับฝั่ง Processor | Auditor ส่ง feedback processor form |
| `rejected_owner` | Auditor ตีกลับฝั่ง Owner | Auditor ส่ง feedback owner form |

### `processor_records.processor_status` (ProcessorStatus)

| ค่า | ความหมาย |
|---|---|
| `pending` | ได้รับ assign แล้ว ยังไม่เปิดฟอร์ม |
| `in_progress` | กำลังกรอก / บันทึก draft แล้ว |
| `confirmed` | กรอกครบ กดยืนยันแล้ว รอส่ง |
| `submitted` | ส่งให้ Data Owner แล้ว |
| `needs_revision` | Auditor สั่งให้กลับมาแก้ไข |

### `auditor_audits.owner_review_status` / `processor_review_status` (String)

| ค่า | ความหมาย |
|---|---|
| `pending_review` | ยังไม่ได้ตรวจ (default) |
| `approved` | Auditor อนุมัติแล้ว |
| `needs_revision` | Auditor ส่ง feedback กลับ |

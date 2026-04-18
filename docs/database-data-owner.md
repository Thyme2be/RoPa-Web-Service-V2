# Database Schema — Data Owner

เอกสารนี้อธิบาย table ทั้งหมดที่เกี่ยวข้องกับ Feature Data Owner backend  
รวมถึงจุดที่รอ role อื่น (DPO) มาเชื่อมต่อ

---

## สิ่งที่ต้องแก้ไขจาก Schema เดิม (Migration)

### 1. `ropa_documents` — เพิ่ม column

| Column | Type | Default | หมายเหตุ |
|--------|------|---------|---------|
| `document_number` | `varchar` | `NULL` | เลขเอกสาร เช่น `DFT-2025-01` (draft) หรือ `RP-2025-01` (ส่ง DPO แล้ว) |

```sql
ALTER TABLE ropa_documents
    ADD COLUMN IF NOT EXISTS document_number varchar;
```

---

### 2. `ropa_processor_sections` — เพิ่ม + ลบ column

**เพิ่ม:**

| Column | Type | Default | หมายเหตุ |
|--------|------|---------|---------|
| `do_suggestion` | `text` | `NULL` | คำแนะนำจาก Data Owner ถึง DP (แก้ไขได้ตลอดเวลา) |

**ลบ** (ไม่มีใน DP form):

| Column | เหตุผล |
|--------|--------|
| `exemption_usage` | เป็น field เฉพาะ DO form |
| `refusal_handling` | เป็น field เฉพาะ DO form |

```sql
ALTER TABLE ropa_processor_sections
    ADD COLUMN IF NOT EXISTS do_suggestion text;

ALTER TABLE ropa_processor_sections
    DROP COLUMN IF EXISTS exemption_usage,
    DROP COLUMN IF EXISTS refusal_handling;
```

---

### 3. `review_feedbacks` — เพิ่ม column + แก้ constraint

| Column | Type | Default | หมายเหตุ |
|--------|------|---------|---------|
| `section_number` | `integer` | `NULL` | section ที่ feedback อ้างถึง (1–6 สำหรับ DP, 1–7 สำหรับ DO) |

ทำให้ `review_cycle_id` เป็น nullable (DO ส่ง feedback ก่อนมี review cycle ได้)

```sql
ALTER TABLE review_feedbacks
    ADD COLUMN IF NOT EXISTS section_number integer;

ALTER TABLE review_feedbacks
    ALTER COLUMN review_cycle_id DROP NOT NULL;
```

---

### 4. `owner_data_types` — เพิ่ม column

| Column | Type | Default | หมายเหตุ |
|--------|------|---------|---------|
| `is_sensitive` | `boolean` | `false` | false = ข้อมูลทั่วไป, true = ข้อมูลอ่อนไหว |

```sql
ALTER TABLE owner_data_types
    ADD COLUMN IF NOT EXISTS is_sensitive boolean NOT NULL DEFAULT false;
```

---

### 5. `processor_data_types` — เพิ่ม column

| Column | Type | Default | หมายเหตุ |
|--------|------|---------|---------|
| `is_sensitive` | `boolean` | `false` | false = ข้อมูลทั่วไป, true = ข้อมูลอ่อนไหว |

```sql
ALTER TABLE processor_data_types
    ADD COLUMN IF NOT EXISTS is_sensitive boolean NOT NULL DEFAULT false;
```

---

### 6. `owner_minor_consent_types` — สร้างใหม่ทั้งหมด

```sql
DROP TABLE IF EXISTS owner_minor_consent_types;
DROP TABLE IF EXISTS owner_minor_consents;

CREATE TABLE owner_minor_consent_types (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_section_id UUID NOT NULL REFERENCES ropa_owner_sections(id) ON DELETE CASCADE,
    type             VARCHAR NOT NULL
    -- ค่าที่ใส่ได้: 'UNDER_10' | '10_TO_20' | 'NONE'
);
```

---

## Table ที่สร้างใหม่ทั้งหมด

### Owner Section Sub-tables

#### `owner_personal_data_items`
| Column | Type | หมายเหตุ |
|--------|------|---------|
| `id` | `UUID PK` | |
| `owner_section_id` | `UUID FK → ropa_owner_sections` | CASCADE DELETE |
| `type` | `varchar` | ประเภทเจ้าของข้อมูล |
| `other_description` | `text` | กรณีเลือก "อื่นๆ" |

#### `owner_data_categories`
| Column | Type | หมายเหตุ |
|--------|------|---------|
| `id` | `UUID PK` | |
| `owner_section_id` | `UUID FK → ropa_owner_sections` | CASCADE DELETE |
| `category` | `varchar` | |

#### `owner_data_types`
| Column | Type | หมายเหตุ |
|--------|------|---------|
| `id` | `UUID PK` | |
| `owner_section_id` | `UUID FK → ropa_owner_sections` | CASCADE DELETE |
| `type` | `varchar` | string จาก frontend |
| `is_sensitive` | `boolean NOT NULL DEFAULT false` | **ตัวหลักที่ใช้ classify** |

#### `owner_collection_methods`
| Column | Type | หมายเหตุ |
|--------|------|---------|
| `id` | `UUID PK` | |
| `owner_section_id` | `UUID FK → ropa_owner_sections` | CASCADE DELETE |
| `method` | `varchar` | |

#### `owner_data_sources`
| Column | Type | หมายเหตุ |
|--------|------|---------|
| `id` | `UUID PK` | |
| `owner_section_id` | `UUID FK → ropa_owner_sections` | CASCADE DELETE |
| `source` | `varchar` | |
| `other_description` | `text` | |

#### `owner_storage_types`
| Column | Type | หมายเหตุ |
|--------|------|---------|
| `id` | `UUID PK` | |
| `owner_section_id` | `UUID FK → ropa_owner_sections` | CASCADE DELETE |
| `type` | `varchar` | |

#### `owner_storage_methods`
| Column | Type | หมายเหตุ |
|--------|------|---------|
| `id` | `UUID PK` | |
| `owner_section_id` | `UUID FK → ropa_owner_sections` | CASCADE DELETE |
| `method` | `varchar` | |
| `other_description` | `text` | |

#### `owner_minor_consent_types`
| Column | Type | หมายเหตุ |
|--------|------|---------|
| `id` | `UUID PK` | |
| `owner_section_id` | `UUID FK → ropa_owner_sections` | CASCADE DELETE |
| `type` | `varchar NOT NULL` | `UNDER_10` / `10_TO_20` / `NONE` |

---

### Processor Section Sub-tables

#### `processor_personal_data_items`
| Column | Type | หมายเหตุ |
|--------|------|---------|
| `id` | `UUID PK` | |
| `processor_section_id` | `UUID FK → ropa_processor_sections` | CASCADE DELETE |
| `type` | `varchar` | |
| `other_description` | `text` | |

#### `processor_data_categories`
| Column | Type | หมายเหตุ |
|--------|------|---------|
| `id` | `UUID PK` | |
| `processor_section_id` | `UUID FK → ropa_processor_sections` | CASCADE DELETE |
| `category` | `varchar` | |

#### `processor_data_types`
| Column | Type | หมายเหตุ |
|--------|------|---------|
| `id` | `UUID PK` | |
| `processor_section_id` | `UUID FK → ropa_processor_sections` | CASCADE DELETE |
| `type` | `varchar` | |
| `is_sensitive` | `boolean NOT NULL DEFAULT false` | |

#### `processor_collection_methods`
| Column | Type | หมายเหตุ |
|--------|------|---------|
| `id` | `UUID PK` | |
| `processor_section_id` | `UUID FK → ropa_processor_sections` | CASCADE DELETE |
| `method` | `varchar` | |

#### `processor_data_sources`
| Column | Type | หมายเหตุ |
|--------|------|---------|
| `id` | `UUID PK` | |
| `processor_section_id` | `UUID FK → ropa_processor_sections` | CASCADE DELETE |
| `source` | `varchar` | |
| `other_description` | `text` | |

#### `processor_storage_types`
| Column | Type | หมายเหตุ |
|--------|------|---------|
| `id` | `UUID PK` | |
| `processor_section_id` | `UUID FK → ropa_processor_sections` | CASCADE DELETE |
| `type` | `varchar` | |

#### `processor_storage_methods`
| Column | Type | หมายเหตุ |
|--------|------|---------|
| `id` | `UUID PK` | |
| `processor_section_id` | `UUID FK → ropa_processor_sections` | CASCADE DELETE |
| `method` | `varchar` | |
| `other_description` | `text` | |

---

## จุดที่รอ Role อื่นมาเชื่อม

### ❌ DPO — Approve Endpoint (สำคัญที่สุด)

**ปัญหา:** ไม่มี endpoint ไหนในระบบที่เปลี่ยน `doc.status = COMPLETED`

ฟีเจอร์ที่จะพังจนกว่า DPO team จะทำ:

| ฟีเจอร์ | ผลกระทบ |
|---------|---------|
| Dashboard Card `completed_count` | แสดง 0 เสมอ |
| Dashboard Card `annual_not_reviewed_count` | แสดง 0 เสมอ |
| Dashboard Card `destruction_due_count` | แสดง 0 เสมอ |
| ตาราง 3 (Approved) | ว่างเสมอ |

**สิ่งที่ DPO team ต้องเพิ่มใน approve endpoint:**
```python
doc.status = "COMPLETED"
doc.last_approved_at = datetime.now(timezone.utc)
doc.next_review_due_at = datetime.now(timezone.utc) + timedelta(days=365)
db.commit()
```

> `next_review_due_at` กำหนดว่าเอกสารจะขึ้นใน ตาราง 3 เมื่อครบ 1 ปี  
> ถ้าไม่เซต → ตาราง 3 จะว่างตลอด

---

### ❌ DPO — `cycle_number` ใน DocumentReviewCycleModel

**ปัญหา:** Dashboard Card `annual_reviewed_count` ใช้ `cycle_number > 1` เพื่อนับว่าเอกสารผ่าน annual review แล้ว

ถ้า DPO team สร้าง `DocumentReviewCycleModel` โดยไม่เซต `cycle_number` → `annual_reviewed_count` จะเป็น 0 เสมอ

**สิ่งที่ DPO team ต้องทำ:** เซต `cycle_number` ทุกครั้งที่สร้าง review cycle

ฝั่ง DO ทำให้แล้ว (`send-to-dpo` และ `annual-review` นับจำนวน cycle ที่มีอยู่แล้ว +1):
```python
existing_cycles = db.query(func.count(DocumentReviewCycleModel.id))
                    .filter(DocumentReviewCycleModel.document_id == document_id)
                    .scalar() or 0

cycle = DocumentReviewCycleModel(
    cycle_number=existing_cycles + 1,  # 1 = initial, 2+ = annual review
    ...
)
```

---

### ❌ DPO — Feedback ถึง DO/DP

**ปัญหา:** Dashboard Card `needs_fix_do_count` และ `needs_fix_dp_count` นับจาก `review_feedbacks.status = OPEN`  
ถ้า DPO ไม่ได้สร้าง `review_feedbacks` ตอน request changes → Card 2 จะแสดง 0 เสมอ

ตาราง 2 `ui_status` ก็ใช้ `review_feedbacks.status = OPEN` เช่นกัน:
- `WAITING_DO_FIX` → มี OPEN feedback ถึง DO
- `WAITING_DP_FIX` → มี OPEN feedback ถึง DP

**สิ่งที่ DPO team ต้องทำ:** เมื่อ DPO request changes ต้องสร้าง `ReviewFeedbackModel` โดยระบุ `to_user_id` เป็น DO หรือ DP ที่ต้องแก้ไข

---

### ⚠️ การลบ owner_section กับ processor_section

`ropa_owner_sections` มี `document_id UNIQUE` → 1 document มีได้ 1 owner section  
เมื่อ DO ลบฉบับร่าง (`DELETE /section/draft`) → owner_section ถูกลบออก

ถ้า DPO หรือ role อื่นมี logic ที่ JOIN กับ `ropa_owner_sections` โดยสมมติว่า section มีอยู่เสมอ → อาจพัง  
ฝั่ง DO แก้แล้วด้วยการ auto-create section เปล่าเมื่อ GET (ถ้าไม่มี section จะสร้างใหม่ให้)

---

## Flow การเปลี่ยน `doc.status`

```
DO สร้างเอกสาร
      │
      ▼  doc.status = IN_PROGRESS (default) — แสดงใน ตาราง 1
      
DO กรอก owner_section → SUBMITTED
DP กรอก processor_section → SUBMITTED
DO ยืนยัน Risk Assessment
      │
      ▼
DO กด "ส่ง DPO" → doc.status = UNDER_REVIEW  ✅ DO ทำแล้ว
doc.document_number เปลี่ยนจาก DFT- → RP-
      │
      ▼  แสดงใน ตาราง 2

DPO ตรวจสอบ
      │  (กรณี request changes → สร้าง review_feedbacks → DO/DP แก้ไข → send-back-to-dpo)
      │
      ▼  doc.status = COMPLETED  ❌ DPO ต้องทำ
         doc.last_approved_at = now()  ❌ DPO ต้องทำ
         doc.next_review_due_at = now() + 365 days  ❌ DPO ต้องทำ
      │
      ▼  แสดงใน ตาราง 3 เมื่อครบ 1 ปี (next_review_due_at <= now)

DO กด "ส่งตรวจสอบรายปี" → doc.status = UNDER_REVIEW  ✅ DO ทำแล้ว
      │
      ▼  กลับไป ตาราง 2 (annual review cycle)

DPO อนุมัติรายปี → doc.status = COMPLETED (ใหม่)  ❌ DPO ต้องทำ
                    doc.next_review_due_at อัปเดตไปอีก 1 ปี  ❌ DPO ต้องทำ
```

---

## สรุปสิ่งที่รอ DPO Team

| งาน | ผลต่อ DO |
|-----|---------|
| Approve endpoint เซต `doc.status = COMPLETED` | ตาราง 3 จะมีข้อมูล, Card `completed_count` จะมีค่า |
| Approve endpoint เซต `last_approved_at = now()` | คำนวณ `destruction_date` ได้ |
| Approve endpoint เซต `next_review_due_at = now() + 365d` | ตาราง 3 จะ filter ถูกต้อง, Card `annual_not_reviewed_count` จะมีค่า |
| สร้าง `review_feedbacks` ตอน request changes | Card `needs_fix_do/dp_count` และ `ui_status` ตาราง 2 จะทำงาน |
| เซต `cycle_number` ใน DocumentReviewCycleModel | Card `annual_reviewed_count` จะมีค่า |

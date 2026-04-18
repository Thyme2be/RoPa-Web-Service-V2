# Database Schema — Data Owner & Data Processor

เอกสารนี้อธิบาย table ทั้งหมดที่เกี่ยวข้องกับ Feature Data Owner backend
รวมถึง column ที่ต้องเพิ่ม/แก้ไขจาก schema เดิม (migration ที่ยังไม่ได้รัน)

---

## สิ่งที่ต้องแก้ไขจาก Schema เดิม

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
| `do_suggestion` | `text` | `NULL` | คำแนะนำจาก Data Owner ถึง DP (กรอกได้ตลอดเวลา) |

**ลบ** (ไม่มีใน DP form):

| Column | เหตุผล |
|--------|--------|
| `exemption_usage` | เป็น field เฉพาะ DO form ไม่มีใน DP form |
| `refusal_handling` | เป็น field เฉพาะ DO form ไม่มีใน DP form |

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
| `section_number` | `integer` | `NULL` | section ที่ feedback อ้างถึง (1-6 สำหรับ DP, 1-7 สำหรับ DO) |

และทำให้ `review_cycle_id` เป็น nullable (DO อาจส่ง feedback ก่อนที่จะมี review cycle)

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
| `is_sensitive` | `boolean` | `false` | false = ข้อมูลทั่วไป, true = ข้อมูลอ่อนไหว (checkbox ใน Section 4 ของ DO form) |

```sql
ALTER TABLE owner_data_types
    ADD COLUMN IF NOT EXISTS is_sensitive boolean NOT NULL DEFAULT false;
```

---

### 5. `processor_data_types` — เพิ่ม column

| Column | Type | Default | หมายเหตุ |
|--------|------|---------|---------|
| `is_sensitive` | `boolean` | `false` | false = ข้อมูลทั่วไป, true = ข้อมูลอ่อนไหว (checkbox ใน Section 3 ของ DP form) |

```sql
ALTER TABLE processor_data_types
    ADD COLUMN IF NOT EXISTS is_sensitive boolean NOT NULL DEFAULT false;
```

---

### 6. `owner_minor_consent_types` — สร้างใหม่ทั้งหมด

ลบ 2 ตารางเก่า (โครงสร้าง 2 ชั้นที่ซับซ้อนเกิน) แล้วสร้างใหม่เป็น flat table:

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

## Table ที่สร้างใหม่ทั้งหมด (Feature Data Owner)

ตาราง sub-table ทั้งหมดด้านล่างถูกสร้างใหม่ ไม่ได้มีใน schema เดิม

### Owner Section Sub-tables

#### `owner_personal_data_items`
| Column | Type | หมายเหตุ |
|--------|------|---------|
| `id` | `UUID PK` | |
| `owner_section_id` | `UUID FK → ropa_owner_sections` | CASCADE DELETE |
| `type` | `varchar` | ประเภทเจ้าของข้อมูล เช่น `ลูกค้า`, `พนักงาน` (dropdown ใน Section 4) |
| `other_description` | `text` | กรณีเลือก "อื่นๆ" |

#### `owner_data_categories`
| Column | Type | หมายเหตุ |
|--------|------|---------|
| `id` | `UUID PK` | |
| `owner_section_id` | `UUID FK → ropa_owner_sections` | CASCADE DELETE |
| `category` | `varchar` | หมวดหมู่ข้อมูล checkbox: `ข้อมูลลูกค้า` / `คู่ค้า` / `ผู้ติดต่อ` / `พนักงาน` |

#### `owner_data_types`
| Column | Type | หมายเหตุ |
|--------|------|---------|
| `id` | `UUID PK` | |
| `owner_section_id` | `UUID FK → ropa_owner_sections` | CASCADE DELETE |
| `type` | `varchar` | string ที่ frontend ส่งมา แนะนำใช้ค่า `GENERAL` หรือ `SENSITIVE` ให้ตรงกัน |
| `is_sensitive` | `boolean NOT NULL DEFAULT false` | **ตัวหลักที่ใช้ classify**: false = ข้อมูลทั่วไป, true = ข้อมูลอ่อนไหว |

#### `owner_collection_methods`
| Column | Type | หมายเหตุ |
|--------|------|---------|
| `id` | `UUID PK` | |
| `owner_section_id` | `UUID FK → ropa_owner_sections` | CASCADE DELETE |
| `method` | `varchar` | checkbox: `ข้อมูลอิเล็กทรอนิกส์` / `เอกสาร` |

#### `owner_data_sources`
| Column | Type | หมายเหตุ |
|--------|------|---------|
| `id` | `UUID PK` | |
| `owner_section_id` | `UUID FK → ropa_owner_sections` | CASCADE DELETE |
| `source` | `varchar` | checkbox: `จากเจ้าของข้อมูลโดยตรง` / `จากแหล่งอื่น` |
| `other_description` | `text` | ใช้เมื่อ source = "จากแหล่งอื่น" |

#### `owner_storage_types`
| Column | Type | หมายเหตุ |
|--------|------|---------|
| `id` | `UUID PK` | |
| `owner_section_id` | `UUID FK → ropa_owner_sections` | CASCADE DELETE |
| `type` | `varchar` | checkbox: `ข้อมูลอิเล็กทรอนิกส์` / `เอกสาร` |

#### `owner_storage_methods`
| Column | Type | หมายเหตุ |
|--------|------|---------|
| `id` | `UUID PK` | |
| `owner_section_id` | `UUID FK → ropa_owner_sections` | CASCADE DELETE |
| `method` | `varchar` | วิธีจัดเก็บ (dropdown multi-select) |
| `other_description` | `text` | กรณีเลือก "อื่นๆ" |

#### `owner_minor_consent_types`
| Column | Type | หมายเหตุ |
|--------|------|---------|
| `id` | `UUID PK` | |
| `owner_section_id` | `UUID FK → ropa_owner_sections` | CASCADE DELETE |
| `type` | `varchar NOT NULL` | ค่า: `UNDER_10` / `10_TO_20` / `NONE` |

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
| `type` | `varchar` | ค่า: `GENERAL` หรือ `SENSITIVE` |
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

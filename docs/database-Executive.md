# Database Schema — Executive Dashboard

เอกสารนี้อธิบาย table ที่ Executive Dashboard ใช้งาน รวมถึงจุดที่ **ไม่ซิงค์กัน**
ระหว่าง role ต่างๆ และ column ที่ยังขาดหายหรือยังไม่มีใครเขียนค่า

---

## สรุปด่วน: Executive ไม่ต้องสร้าง Table ใหม่

Executive Dashboard **อ่านข้อมูลอย่างเดียว** จาก table ที่มีอยู่แล้วทั้งหมด  
ไม่มี migration ใหม่ที่ต้องทำเพื่อให้ Executive ทำงานได้

---

## Table ที่ Executive Dashboard ใช้

### 1. `ropa_documents`

Table หลักของระบบ เก็บสถานะเอกสาร ROPA ทุกฉบับ

| Column | Type | Nullable | ใช้ใน Executive | หมายเหตุ |
|--------|------|----------|----------------|---------|
| `id` | `uuid` | NO | ใช่ — ค้นหาเอกสารทั้งหมด | Primary key |
| `status` | `enum` | NO | ใช่ — กรอง `UNDER_REVIEW`, `COMPLETED` | `IN_PROGRESS`, `UNDER_REVIEW`, `COMPLETED`, `EXPIRED` |
| `deletion_status` | `enum` | YES | ใช่ — กรอง `DELETE_PENDING` | `DELETE_PENDING`, `DELETED` |
| `created_at` | `timestamptz` | NO | ใช่ — period filter ทุก card | |
| `last_approved_at` | `timestamptz` | YES | ใช่ — period filter สำหรับ approved card | **ยังไม่มีใครเขียนค่านี้ (ดูส่วน Missing)** |

---

### 2. `ropa_owner_sections`

| Column | Type | ใช้ใน Executive | หมายเหตุ |
|--------|------|----------------|---------|
| `document_id` | `uuid` | ใช่ — join กับ documents | FK → `ropa_documents.id` |
| `status` | `enum` | ใช่ — ตรวจว่า `DRAFT` หรือ `SUBMITTED` | `DRAFT`, `SUBMITTED` |

---

### 3. `ropa_processor_sections`

| Column | Type | ใช้ใน Executive | หมายเหตุ |
|--------|------|----------------|---------|
| `document_id` | `uuid` | ใช่ — join กับ documents | FK → `ropa_documents.id` |
| `status` | `enum` | ใช่ — ตรวจว่า `DRAFT` หรือ `SUBMITTED` | `DRAFT`, `SUBMITTED` |

---

### 4. `review_feedbacks`

| Column | Type | ใช้ใน Executive | หมายเหตุ |
|--------|------|----------------|---------|
| `target_id` | `uuid` | ใช่ — ชี้ไปที่ owner_section.id หรือ processor_section.id | ไม่ใช่ FK จริง (UUID อ้างถึง section แบบ loose) |
| `status` | `enum` | ใช่ — ตรวจว่า `OPEN` | `OPEN`, `RESOLVED` |

---

### 5. `processor_assignments`

| Column | Type | ใช้ใน Executive | หมายเหตุ |
|--------|------|----------------|---------|
| `document_id` | `uuid` | ใช่ — join หา DP ที่ถูก assign | FK → `ropa_documents.id` |
| `status` | `enum` | ใช่ — ตรวจว่า `SUBMITTED` | `IN_PROGRESS`, `SUBMITTED`, `OVERDUE` |

---

### 6. `auditor_assignments`

Table นี้สำคัญมากสำหรับ Executive เพราะเป็น **แหล่งเดียวของข้อมูลแผนก**

| Column | Type | Nullable | ใช้ใน Executive | หมายเหตุ |
|--------|------|----------|----------------|---------|
| `document_id` | `uuid` | NO | ใช่ — join กับ documents | FK → `ropa_documents.id` |
| `department` | `varchar` | YES | ใช่ — ชื่อแผนกสำหรับ risk chart | DPO ตั้งตอน assign auditor, อาจเป็น NULL |

> ถ้า `department = NULL` → เอกสารนั้นจะ**ไม่ปรากฏ**ใน risk_by_department และ sensitive_docs_by_department

---

### 7. `ropa_risk_assessments`

| Column | Type | Nullable | ใช้ใน Executive | หมายเหตุ |
|--------|------|----------|----------------|---------|
| `document_id` | `uuid` | NO | ใช่ — join กับ documents | FK → `ropa_documents.id`, unique 1:1 |
| `risk_level` | `enum` | YES | ใช่ — `LOW`, `MEDIUM`, `HIGH` | ถ้า NULL จะไม่ถูกนับ |

---

### 8. `owner_data_types`

| Column | Type | ใช้ใน Executive | หมายเหตุ |
|--------|------|----------------|---------|
| `owner_section_id` | `uuid` | ใช่ — join ผ่าน owner_section | FK → `ropa_owner_sections.id` |
| `is_sensitive` | `boolean` | ใช่ — กรองเฉพาะ `true` สำหรับ sensitive card | `false` = ข้อมูลทั่วไป, `true` = ข้อมูลอ่อนไหว |

---

## Column ที่ขาดหายหรือยังไม่มีใครเขียนค่า

### ปัญหาที่ 1: `ropa_documents.status` ไม่เคยเป็น `COMPLETED`

**Column มีอยู่จริงในฐานข้อมูล** แต่ตลอด flow ของระบบปัจจุบัน **ไม่มี endpoint ไหนเลย** ที่เซตค่านี้

| role | endpoint | action | สถานะ |
|------|----------|--------|-------|
| Data Owner | `POST /owner/documents/{id}/send-to-dpo` | เซต `status = UNDER_REVIEW` | ✅ มี |
| Data Owner | `POST /owner/documents/{id}/send-back-to-dpo` | เซต `status = UNDER_REVIEW` | ✅ มี |
| **DPO** | **ยังไม่มี** | **เซต `status = COMPLETED`** | **❌ ขาด** |

**ผลกระทบ:**

| ใครได้รับผลกระทบ | card / query | ค่าที่จะได้ |
|-----------------|-------------|-----------|
| Executive | `ropa_status_overview.completed` | 0 เสมอ |
| Executive | `approved_documents.total` | 0 เสมอ |
| Data Owner | ตาราง 3 "เอกสารที่ DPO อนุมัติแล้ว" | ว่างเสมอ |
| Admin Dashboard | `completed` count | 0 เสมอ |

**สิ่งที่ DPO team ต้องเพิ่ม:**
```python
# ใน DPO approve endpoint
doc.status = "COMPLETED"
doc.last_approved_at = datetime.now(timezone.utc)
db.commit()
```

---

### ปัญหาที่ 2: `ropa_documents.last_approved_at` ไม่เคยถูกเซต

**Column มีอยู่จริงในฐานข้อมูล** (สร้างไว้ใน migration) แต่ไม่มีใครเขียนค่า

**ผลกระทบ:**

| ใครได้รับผลกระทบ | การใช้งาน |
|-----------------|---------|
| Executive | period filter สำหรับ `approved_documents` จะไม่ทำงาน |
| Data Owner | ตาราง 3 column `last_approved_at` จะ NULL ทุกแถว |
| Data Owner | คำนวณ destruction date จาก `last_approved_at + retention` ไม่ได้ |

**สิ่งที่ DPO team ต้องเพิ่ม (เหมือนข้อ 1 — เซตพร้อมกัน):**
```python
doc.last_approved_at = datetime.now(timezone.utc)
```

---

## จุดที่ไม่ซิงค์กันระหว่าง Role

### 1. Flow การเปลี่ยน document.status

```
DO creates doc
      │
      ▼  doc.status = IN_PROGRESS (default)
DO fills owner_section
      │
      ▼  owner_section.status = DRAFT → SUBMITTED (DO กด submit)
DO assigns DP → processor_assignment.status = IN_PROGRESS
      │
      ▼
DP fills processor_section
      │
      ▼  processor_section.status = DRAFT → SUBMITTED
         processor_assignment.status = IN_PROGRESS → SUBMITTED
      │
      ▼
DO reviews DP submission
      │
      ▼
DO sends to DPO → doc.status = UNDER_REVIEW  ✅ (ทำงานได้)
      │
      ▼
DPO reviews
      │
      ▼  doc.status = COMPLETED  ❌ (endpoint ยังไม่มี)
         doc.last_approved_at = now()  ❌ (ไม่เคยเซต)
```

**จุดขาด:** ระหว่าง DPO review กับ COMPLETED ไม่มี endpoint เชื่อม

---

### 2. ข้อมูลแผนก (department) มีแหล่งเดียว

Executive ใช้ `auditor_assignments.department` เป็นแหล่งข้อมูลแผนกสำหรับ:
- `risk_by_department`
- `sensitive_docs_by_department`

**ปัญหา:** DPO ต้อง assign auditor ก่อน ถึงจะมีข้อมูลแผนก  
เอกสารที่ยังไม่มี auditor จะ**ไม่ปรากฏ**ในกราฟ risk และ sensitive

**แผนก** ถูกตั้งใน `auditor_assignments` ตอนที่ DPO ทำ assign auditor เท่านั้น  
ไม่ได้ดึงมาจาก `users.department` ของ DO หรือ DP

| field | มาจากไหน | ใครเป็นคนตั้ง |
|-------|---------|-------------|
| `auditor_assignments.department` | DPO กรอกตอน assign | DPO |
| `users.department` | admin ตั้งตอนสร้าง user | Admin |

> ทั้งสองไม่ได้ sync กัน: DPO อาจตั้ง department ชื่อต่างจาก `users.department` ก็ได้

---

### 3. Risk Assessment กับ Executive Dashboard

`ropa_risk_assessments` มี `unique=True` บน `document_id` → 1 เอกสารมีได้แค่ 1 risk assessment

**ปัญหา:** ถ้า DPO ยังไม่ได้ประเมินความเสี่ยงเอกสารนั้น → `risk_level = NULL` → ไม่ถูกนับในกราฟ Executive

ผลคือ Executive อาจเห็นตัวเลขความเสี่ยงน้อยกว่าจริง เพราะเอกสารที่ยังไม่ผ่าน DPO จะไม่มี risk level

---

### 4. Feedback loop ระหว่าง DPO ↔ DO/DP

`review_feedbacks` ใช้ `target_id` ชี้ไปที่ `owner_section.id` หรือ `processor_section.id`  
แต่ column `target_id` ใน `review_feedbacks` เป็น UUID ธรรมดา **ไม่ใช่ FK จริง**

```sql
-- ใน review_feedbacks
target_id UUID  -- ไม่มี FOREIGN KEY constraint
target_type feedback_target_enum  -- 'OWNER_SECTION', 'PROCESSOR_SECTION', 'RISK_ASSESSMENT'
```

**ความเสี่ยง:** ถ้า section ถูกลบ แต่ feedback ไม่ถูกลบตาม อาจทำให้ Executive นับ pending ผิด  
ตอนนี้ section มี `CASCADE DELETE` จาก document แต่ feedback ไม่มี FK → ไม่มี CASCADE

---

### 5. สถานะ "เสร็จสมบูรณ์" ใน Executive vs ที่อื่น

Executive นับ "เสร็จสมบูรณ์" จาก `doc.status = COMPLETED`  
แต่ DPO dashboard (ของเพื่อน) นับ "approved" จาก `review_dpo_assignments` + `document_review_cycles`

```
Executive นิยาม "สำเร็จ" = documents.status = COMPLETED
DPO นิยาม "อนุมัติ" = review_dpo_assignments + cycles ที่ DPO ดำเนินการแล้ว
```

ถ้า DPO เพิ่ม approve endpoint โดยไม่เซต `doc.status = COMPLETED` → ตัวเลขของ Executive และ DPO จะไม่ตรงกัน  
**ต้องประสานงานให้ DPO team เซตทั้ง `doc.status` และ `doc.last_approved_at` พร้อมกันในครั้งเดียว**

---

## สรุปสิ่งที่ต้องทำเพิ่ม (ไม่ใช่งานของ Executive)

| งาน | ใครทำ | ผลกระทบเมื่อทำแล้ว |
|-----|-------|------------------|
| เพิ่ม DPO Approve endpoint ที่เซต `doc.status = COMPLETED` | DPO team | Executive: `completed` และ `approved_documents` จะมีค่า |
| เซต `doc.last_approved_at = now()` ใน approve endpoint | DPO team | Executive: period filter ของ `approved_documents` จะทำงาน |
| ตรวจสอบว่า DPO ตั้ง `auditor_assignments.department` ถูกต้อง | DPO team / QA | Executive: risk chart และ sensitive chart จะมีข้อมูล |

---

## ER Diagram ของ Table ที่ Executive ใช้

```
ropa_documents
    │
    ├──1:1── ropa_owner_sections
    │             └──1:N── owner_data_types (is_sensitive)
    │
    ├──1:1── ropa_processor_sections
    │
    ├──1:1── ropa_risk_assessments (risk_level)
    │
    ├──1:N── processor_assignments (status: SUBMITTED?)
    │
    ├──1:N── auditor_assignments (department) ← แหล่งข้อมูลแผนก
    │
    └── review_feedbacks (ผ่าน target_id → owner/processor section)
              status: OPEN / RESOLVED
```

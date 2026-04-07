# Database Schema Changes Comparison

**Generated**: April 6, 2026  
**Branch**: feat/backend-data-processor  
**File Modified**: `server/app/models/document.py`

---

## สรุปสำคัญ

ตามการแก้ไขล่าสุด schema database ได้รับการ **ปรับโครงสร้างและปรับปรุงอย่างมีนัยสำคัญ** เพื่อรองรับระบบการจัดการเวิร์กโฟลว์ที่ครอบคลุมมากขึ้น Total schema ขยายไปเป็น **380 บรรทัด** (เพิ่มขึ้นจาก **167 บรรทัด**) พร้อมเอกสารประกอบอย่างละเอียดและฟิลด์ logic ทางธุรกิจใหม่

---

## 📊 การเปลี่ยนแปลง ENUMS

### ✅ ENUMS ใหม่ที่เพิ่มเข้ามา

#### 1. **ProcessorStatus** (ใหม่)
```python
class ProcessorStatus(str, enum.Enum):
    PENDING = "pending"                # รอการประมวลผล
    IN_PROGRESS = "in_progress"        # กำลังดำเนินการ
    CONFIRMED = "confirmed"            # ยืนยันแล้ว
    SUBMITTED = "submitted"            # ส่งแล้ว
    NEEDS_REVISION = "needs_revision"  # ต้องแก้ไข
```
**วัตถุประสงค์**: ติดตามสถานะของเวิร์กโฟลว์ของ Data Processor แต่ละราย  
**ใช้งานใน**: `ProcessorRecord.processor_status`

#### 2. **AuditStatus** (ใหม่)
```python
class AuditStatus(str, enum.Enum):
    PENDING_REVIEW = "pending_review"  # รอการตรวจสอบ
    APPROVED = "approved"              # อนุมัติแล้ว
    NEEDS_REVISION = "needs_revision"  # ต้องแก้ไข
```
**วัตถุประสงค์**: ติดตามสถานะการตรวจสอบ  
**ใช้งานใน**: `AuditorAudit.audit_status`

### 🔄 ENUMS ที่มีอยู่เดิม
- **DocumentStatus**: ไม่เปลี่ยนแปลง (DRAFT, PENDING_PROCESSOR, PENDING_AUDITOR, APPROVED, REJECTED_PROCESSOR, REJECTED_OWNER)
- **AuditorType**: ไม่เปลี่ยนแปลง (INTERNAL, OUTSOURCE)

---

## 📋 การเปลี่ยนแปลง SCHEMA ของตาราง

### 1. **ropa_documents** (ปรับปรุง)

#### ✨ คอลัมน์ใหม่
| คอลัมน์ | ประเภท | ว่าง | คำอธิบาย |
|--------|------|----------|-------------|
| `doc_code` | String | ใช่ | รหัสอ้างอิงของเอกสาร (เช่น "RP-2026-1000") |
| `updated_at` | DateTime | ไม่ | เวลาแก้ไขล่าสุด - อัปเดตอัตโนมัติ |

#### 📌 คอลัมน์ที่มีอยู่เดิม
- `id`, `owner_id`, `title`, `status`, `version`, `created_at`, `sent_to_auditor_at`

---

### 2. **processor_records** (ปรับโครงสร้างใหม่ทั้งหมด)

#### ❌ คอลัมน์ที่ลบออก
| คอลัมน์ | เหตุผลที่ลบ |
|--------|------------|
| `record_name` | แทนที่ด้วยฟิลด์ชื่อแต่ละหมวด |
| `address` | แทนที่ด้วย `data_controller_address` |
| `email` | ไม่จำเป็นแล้ว (ใช้จาก User relationship) |
| `phone` | ไม่จำเป็นแล้ว (ใช้จาก User relationship) |
| `owner_name` | ข้อมูลมาจาก relationship ไม่ต้องเก็บ |
| `submitted_at` | แทนที่ด้วย `sent_to_owner_at` |

#### ✨ คอลัมน์ใหม่

**ฟิลด์สถานะและการติดตาม** (7 ใหม่)
| คอลัมน์ | ประเภท | คำอธิบาย |
|--------|------|-------------|
| `processor_status` | Enum(ProcessorStatus) | สถานะเวิร์กโฟลว์ (PENDING → CONFIRMED → SUBMITTED) |
| `draft_code` | String (unique) | รหัสอ้างอิงฉบับร่าง (เช่น "DFT-5525") |
| `confirmed_at` | DateTime | เมื่อ processor ยืนยันข้อมูล |
| `sent_to_owner_at` | DateTime | เมื่อ processor ส่งให้ Data Owner |

**Section 1: รายละเอียด Processor** (3 ใหม่)
| คอลัมน์ | ประเภท | คำอธิบาย |
|--------|------|-------------|
| `title_prefix` | String | คำนำหน้า (นาย/นาง/นางสาว) |
| `first_name` | String | ชื่อจริง |
| `last_name` | String | นามสกุล |

**Section 2: รายละเอียดกิจกรรม** (1 ใหม่)
| คอลัมน์ | ประเภท | คำอธิบาย |
|--------|------|-------------|
| `data_controller_address` | Text | ที่อยู่ผู้ควบคุมข้อมูล |

**Section 3: การจัดเก็บข้อมูล** (1 เปลี่ยน)
| คอลัมน์ | ประเภท | การเปลี่ยนแปลง |
|--------|------|--------|
| `data_category` | **Text** (อยู่ String) | เปลี่ยนเพื่อเก็บ JSON array |

**Section 4: การเก็บรวบรวมและการเก็บรักษาข้อมูล** (6 ใหม่)
| คอลัมน์ | ประเภท | คำอธิบาย |
|--------|------|-------------|
| `data_source` | String | "from_owner" หรือ "from_other" (แทน source_from_owner/source_from_other) |
| `retention_storage_type` | **Text** (อยู่ String) | เปลี่ยนเพื่อเก็บ JSON array |
| `retention_duration` | **String** (อยู่ Integer) | เปลี่ยนรูปแบบเป็น string |
| `retention_duration_unit` | String | หน่วย: "year" หรือ "month" |
| `retention_access_condition` | Text | สิทธิและเงื่อนไขการเข้าถึง |

**Section 5: ฐานทางกฎหมายและการโอน** (0 ใหม่, 1 เปลี่ยน)
| คอลัมน์ | การเปลี่ยนแปลง | คำอธิบาย |
|--------|--------|-------------|
| `transfer_exception` | เพิ่มหมายเหตุประกอบ | รวมเอกสารส่วนต่างๆ |

**Section 6: มาตรการรักษาความปลอดภัย** (0 ใหม่, จัดเรียงใหม่)
- คอลัมน์จัดเรียงใหม่พร้อมหมายเหตุรายละเอียดสำหรับ TOMs (มาตรการด้านเทคนิคและองค์กร)

#### 🔄 คอลัมน์ที่ไม่เปลี่ยน
- `id`, `ropa_doc_id`, `assigned_to`, `processing_activity`, `purpose`, `personal_data`, `data_type`, `collection_method`, `legal_basis`, `transfer_is_transfer`, `transfer_country`, `transfer_is_in_group`, `transfer_company_name`, `transfer_method`, `transfer_protection_std`, `security_organizational`, `security_technical`, `security_physical`, `security_access_control`, `security_responsibility`, `security_audit`, `created_at`, `updated_at`

---

### 3. **AuditorAudit** (ปรับปรุง)

#### ✨ คอลัมน์ใหม่
| คอลัมน์ | ประเภท | ว่าง | คำอธิบาย |
|--------|------|----------|-------------|
| `audit_status` | Enum(AuditStatus) | ใช่ | สถานะเวิร์กโฟลว์การตรวจใหม่ |
| `processor_feedback` | Text | ใช่ | ข้อเสนอแนะ JSON ตามส่วนสำหรับ processor |
| `updated_at` | DateTime | ใช่ | เวลาแก้ไขล่าสุด |

#### 🔄 คอลัมน์ที่แก้ไข
| คอลัมน์ | ข้อมูลเดิม | ข้อมูลใหม่ | การเปลี่ยนแปลง |
|--------|----------|----------|--------|
| `status` | Enum(DocumentStatus) | Enum(DocumentStatus), nullable=True | ทำให้ว่างเพื่อความเข้ากันได้ |
| `feedback_comment` | Text | Text, nullable=True | ทำให้ว่างเพื่อความเข้ากันได้ |
| `version` | Integer | Integer, nullable=True | ทำให้ว่างเพื่อความเข้ากันได้ |

#### 📌 คอลัมน์ที่ไม่เปลี่ยน
- `id`, `ropa_doc_id`, `assigned_auditor_id`, `approved_at`, `request_change_at`

---

### 4. **OwnerRecord** (ปรับปรุงด้วยเอกสาร)

#### 📝 ไม่มีการเปลี่ยนแปลง SCHEMA
คอลัมน์ทั้งหมดยังคงเหมือนเดิม แต่ทุกคอลัมน์มีหมายเหตุแบบ inline ที่อธิบายวัตถุประสงค์และรูปแบบเนื้อหา

#### 🔄 คอลัมน์ที่มีอยู่เดิม
- 46 คอลัมน์ไม่เปลี่ยนโครงสร้าง
- เพิ่มเอกสารประกอบแบบ inline ที่ครอบคลุม

---

### 5. **AuditorProfile** (ปรับปรุงเอกสาร)

#### 📝 ไม่มีการเปลี่ยนแปลง SCHEMA
คอลัมน์ทั้งหมดยังคงเหมือนเดิม แต่มีหมายเหตุแบบ inline เพิ่มเติม

#### 🔄 คอลัมน์ที่มีอยู่เดิม
- 9 คอลัมน์มีเอกสารประกอบที่ปรับปรุง

---

### 6. **Users** (ไม่มีการเปลี่ยนแปลง)

ไม่มีการเปลี่ยนแปลงโครงสร้างตาราง users

---

## 🔑 สรุปการเปลี่ยนแปลงโครงสร้างสำคัญ

### การเปลี่ยนแปลงประเภทฟิลด์
| ฟิลด์ | ประเภทเดิม | ประเภทใหม่ | เหตุผล |
|-------|----------|----------|--------|
| `processor_records.data_category` | String | Text | รองรับการเก็บ JSON array |
| `processor_records.retention_storage_type` | String | Text | รองรับการเก็บ JSON array |
| `processor_records.retention_duration` | Integer | String | รองรับรูปแบบที่ยืดหยุ่น |

### ฟิลด์ Boolean ที่ลบ (รวมกัน)
| ฟิลด์เดิม | ฟิลด์ใหม่ | รูปแบบ |
|-----------|-----------|--------|
| `source_from_owner`, `source_from_other` | `data_source` | String: "from_owner" \| "from_other" |

### การจัดการสถานะใหม่
- **ติดตาม `ProcessorStatus`**: เปิดใช้งานการติดตามเวิร์กโฟลว์ที่แม่นยำสำหรับแต่ละ processor
- **`audit_status` ใน AuditorAudit**: ขนานกับ DocumentStatus เพื่อความเข้ากันได้ย้อนหลัง
- **`processor_feedback` ใน AuditorAudit**: ข้อเสนอแนะตามส่วนในรูปแบบ JSON

---

## 📈 ผลกระทบต่อเวิร์กโฟลว์

### เวิร์กโฟลว์เดิม (อย่างง่าย)
```
RopaDocument (1 record) 
  ├── OwnerRecord (1 record)
  ├── ProcessorRecord (1+ records)
  └── AuditorAudit (1+ records)
```

### เวิร์กโฟลว์ใหม่ (ติดตามที่ปรับปรุง)
```
RopaDocument (with doc_code tracking)
  ├── OwnerRecord (with detailed sections)
  ├── ProcessorRecord (with status transitions)
  │   ├── processor_status: PENDING → IN_PROGRESS → CONFIRMED → SUBMITTED
    ├── draft_code: อ้างอิงฉบับร่างเฉพาะตัว
    ├── Timestamps: confirmed_at, sent_to_owner_at
    └── ฟิลด์ที่ปรับปรุง: title_prefix, first_name, last_name
  └── AuditorAudit (with detailed feedback)
      ├── audit_status: PENDING_REVIEW → APPROVED/NEEDS_REVISION
      ├── processor_feedback: JSON ตามส่วน
      └── updated_at: ติดตามเวลา
```

---

## 💾 ข้อพิจารณาในการอัปเดตข้อมูล

### สำหรับข้อมูลที่มีอยู่
1. **คอลัมน์ใหม่สามารถว่างได้** - บันทึกที่มีอยู่จะมีค่า NULL
2. **การรวม Boolean** - ข้อมูลใน `source_from_owner`/`source_from_other` ต้องอัปเดตเป็น `data_source`
3. **การแปลงประเภท**:
   - `Integer` → `String` สำหรับ `retention_duration` (อาจต้องแปลง)
   - `String` → `Text` สำหรับฟิลด์ array

### ขั้นตอนการอัปเดตข้อมูลที่จำเป็น
```sql
-- รวม boolean เป็น string
UPDATE processor_records 
SET data_source = CASE 
  WHEN source_from_owner = true THEN 'from_owner'
  WHEN source_from_other = true THEN 'from_other'
  ELSE NULL 
END;

-- แปลง integer duration เป็น string
UPDATE processor_records 
SET retention_duration = CAST(retention_duration AS VARCHAR);
```

---

## 📊 สถิติ

| เมตริก | จำนวน |
|--------|-------|
| ตารางทั้งหมด | 7 |
| ตารางที่แก้ไข | 4 |
| ตารางที่ไม่เปลี่ยน | 3 (users, owner_records*, auditor_profiles*) |
| คอลัมน์ใหม่ที่เพิ่ม | 15+ |
| คอลัมน์ที่ลบ | 4 |
| การเปลี่ยนประเภทคอลัมน์ | 3 |
| Enum ใหม่ | 2 |
| จำนวนบรรทัดโค้ด | 167 → 380 (เพิ่มขึ้น 127%) |
| ความครอบคลุมของเอกสาร | เพิ่มหมายเหตุ inline ลงในทุกคอลัมน์ |

---

## 🎯 คำแนะนำ

1. **สร้างสคริปต์การอัปเดต** สำหรับข้อมูลที่มีอยู่
2. **เพิ่มข้อจำกัดของฐานข้อมูล**:
   - ข้อจำกัด Unique บน `doc_code` (มีอยู่แล้ว)
   - ข้อจำกัด Unique บน `draft_code` (มีอยู่แล้ว)
   - ข้อจำกัด Foreign key ยังคงอยู่
3. **ปรับปรุง Index** - พิจารณาเพิ่ม indexes บน:
   - `processor_records.processor_status`
   - `auditor_audits.audit_status`
   - `processor_records.draft_code`
4. **การตรวจสอบ JSON** - เพิ่มการตรวจสอบระดับแอปพลิเคชันสำหรับฟิลด์ JSON
5. **ความเข้ากันได้ย้อนหลัง** - เก็บฟิลด์ที่สามารถว่างได้เพื่อการเปลี่ยนผ่านที่ราบรื่น

---

## 📋 ไฟล์ที่ได้รับผลกระทบ

### แก้ไขแล้ว
- ✏️ `server/app/models/document.py` (167 → 380 บรรทัด)
- ✏️ `server/app/models/__init__.py`
- ✏️ `server/app/main.py`
- ✏️ `server/app/api/routers/admin.py`
- ✏️ `server/app/api/routers/documents.py`
- ✏️ `server/app/api/routers/users.py`

### ไฟล์ใหม่
- ✨ `server/app/api/routers/processor.py`
- ✨ `server/app/schemas/processor.py`

---

**อัปเดตล่าสุด**: 6 เมษายน 2569  
**สถานะ**: ปรับปรุงเพื่อรองรับเวิร์กโฟลว์ Data Processor
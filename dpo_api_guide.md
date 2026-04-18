# 🧐 DPO API Specification (Deep Dive)
**ระบบตรวจสอบและบริหารจัดการการคุ้มครองข้อมูล (Data Protection Review & Management)**

เอกสารฉบับนี้ให้รายละเอียดเชิงลึกของ API สำหรับบทบาท **DPO (เจ้าหน้าที่คุ้มครองข้อมูล)** ครอบคลุมตั้งแต่ระบบ Dashboard สถิติ จนถึงการตรวจคอมเมนต์รายส่วน 14 หัวข้อครับ

---

## 🔑 1. พื้นฐานและสิทธิ์การเข้าถึง (Foundation & Access)

- **Role Requirement**: ทุก Endpoint ในส่วนนี้ต้องใช้ `role: DPO`
- **Security Context**: DPO จะเห็นและจัดการได้เฉพาะเอกสารที่ถูกมอบหมาย (Assigned) ให้ตนเองเท่านั้น หากพยายามเข้าถึงเอกสารอื่นระบบจะคืนค่า `403 Forbidden` หรือ `404 Not Found`

---

## 📊 2. แดชบอร์ดสถิติ (DPO Dashboard Metrics)

ใช้สำหรับแสดงภาพรวมภาระงานที่ต้องจัดการ

- **Endpoint**: `GET /dashboard/dpo`
- **Response Payload (Example)**:
```json
{
  "total_reviewed": { "count": 120 },
  "revision_needed": { "owner_count": 5, "processor_count": 3 },
  "risk_overview": { "total": 10, "low": 5, "medium": 3, "high": 2 },
  "pending_dpo_review": { "for_archiving": 8, "for_destruction": 2 },
  "auditor_review_status": { "pending": 4, "completed": 10 },
  "approved_documents": { "total": 85 },
  "auditor_delayed": { "count": 1 }
}
```

---

## 📑 3. ระบบรายการตรวจสอบ (Review Tables)

สำหรับการแสดงรายการเอกสารที่อยู่ในความรับผิดชอบ

### 🔍 3.1 ตารางรายการเอกสาร (Active Review Table)
- **Endpoint**: `GET /dashboard/dpo/documents`
- **Query Params**: `status_filter`, `days_filter`, `page`, `limit`
- **Response Item Payload**:
```json
{
  "document_id": "RP-2024-01",
  "title": "RP-2024-01 นโยบายความเป็นส่วนตัว HR",
  "data_owner_name": "นายสมชาย ใจดี",
  "assigned_at": "2024-04-18T10:00:00Z",
  "reviewed_at": null,
  "status_flags": {
    "owner_completed": true,
    "processor_completed": false
  },
  "review_status": "IN_REVIEW"
}
```

---

## 📝 4. ระบบคอมเมนต์ 14 ส่วน (Structured Commenting)

หัวใจหลักของการตรวจ RoPa โดย DPO สามารถใส่ความเห็นได้รายส่วน

### 📥 4.1 บันทึกคอมเมนต์รายส่วน (POST)
- **Endpoint**: `POST /dashboard/dpo/documents/{document_id}/comments`
- **Request Structure**:
| Variable | Type | Description |
| :--- | :--- | :--- |
| `group` | String | ระบุกลุ่มที่ต้องการบันทึก (`DO` หรือ `DP`) |
| `comments` | Array | รายการคอมเมนต์ (ระบุ `section_key` และ `comment`) |

**Request Example**:
```json
{
  "group": "DO",
  "comments": [
    { "section_key": "DO_SEC_1", "comment": "เนื้อหาวัตถุประสงค์ไม่ชัดเจนในส่วนที่ 1" },
    { "section_key": "DO_RISK", "comment": "ระดับความเสี่ยงที่ระบุมาต่ำเกินไป" }
  ]
}
```

### 🗝️ 4.2 รายชื่อคีย์อ้างอิง (Section Keys Reference)
ผู้พัฒนาฝั่ง Frontend ต้องใช้คีย์เหล่านี้ในการส่งข้อมูลและดึงข้อมูลมาแสดงผล:

| กลุ่ม (Group) | รายชื่อคีย์ (Section Keys) |
| :--- | :--- |
| **Data Owner (DO)** | `DO_SEC_1`, `DO_SEC_2`, ... ถึง `DO_SEC_7`, และ `DO_RISK` |
| **Data Processor (DP)** | `DP_SEC_1`, `DP_SEC_2`, ... ถึง `DP_SEC_6` |

---

## 🤝 5. การส่งต่อผู้ตรวจสอบ (Auditor Assignment)

เมื่อ DPO ตรวจเบื้องต้นเสร็จแล้ว สามารถส่งต่อให้ Auditor ตรวจสอบขั้นสุดท้าย

- **Endpoint**: `POST /documents/{document_id}/assign-auditor`
- **Request Payload**:
```json
{
  "auditor_id": 5,
  "auditor_type": "INTERNAL",
  "department": "IT Audit",
  "preferred_first_name": "สายใจ",
  "preferred_last_name": "ตรวจสอบ",
  "due_date": "2024-05-15T17:00:00Z"
}
```

---

## ⚠️ 6. การจัดการข้อผิดพลาด (Error Scenarios)

| รหัสสถานะ (Code) | ข้อมูลใน Detail | สาเหตุ (Cause) |
| :--- | :--- | :--- |
| `403` | You are not assigned as the DPO for this document | พยายามเข้าไปตรวจเอกสารที่ไม่ได้ถูกมอบหมายให้ตนเอง |
| `400` | Invalid comment group type | ส่งค่า `group` ที่ไม่ใช่ "DO" หรือ "DP" |
| `404` | Document not found | ไม่พบ ID เอกสารที่ระบุในฐานข้อมูล |

---
> [!IMPORTANT]
> **ระบบ Label**: ปัจจุบัน Backend ได้นำ `ui_status_label` ออกแล้ว เพื่อให้ Frontend จัดการการแสดงผลภาษาไทยเองตามค่า `review_status` ที่ได้รับครับ

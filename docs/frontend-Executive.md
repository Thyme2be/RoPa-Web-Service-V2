# Frontend Integration Guide — Executive Dashboard API

Base URL: `/api/v1`  
Authentication: ทุก request ต้องใส่ Header `Authorization: Bearer <access_token>`  
Role ที่ใช้ได้: `EXECUTIVE` เท่านั้น

---

## สารบัญ

1. [Overview — Executive มีหน้าเดียว](#overview)
2. [GET /dashboard/executive — ข้อมูลทั้งหมด](#get-dashboardexecutive)
3. [Response Schema อย่างละเอียด](#response-schema)
4. [การ Map Response ไปยัง UI แต่ละ Card](#ui-card-mapping)
5. [Query Parameters — Period Filter](#period-filter)
6. [ข้อควรระวัง: Card ที่ยังรอ DPO Approve Endpoint](#known-limitations)

---

## Overview

Executive มีหน้าเดียวคือ **Dashboard** ไม่มี sidebar อื่น  
เรียก API เดียวแล้วได้ข้อมูลทั้งหมดในหน้าเดียวกัน

```
[Executive เข้าหน้า Dashboard]
        |
        v
GET /dashboard/executive?period=all
        |
        └── ได้ ExecutiveDashboardResponse ครบทุก card
```

---

## GET /dashboard/executive

```
GET /api/v1/dashboard/executive
```

### Query Parameters

| Parameter | Type | Default | ค่าที่รับได้ | คำอธิบาย |
|-----------|------|---------|------------|---------|
| `period` | string | `all` | `7_days`, `30_days`, `this_month`, `this_year`, `all` | กรองช่วงเวลาสร้างเอกสาร |
| `department` | string | `null` | ชื่อแผนก เช่น `"IT"` | กรองกราฟ Risk เฉพาะแผนกนั้น (optional) |

### Request ตัวอย่าง

```http
GET /api/v1/dashboard/executive?period=this_month
Authorization: Bearer eyJhbGci...
```

```http
GET /api/v1/dashboard/executive?period=this_year&department=IT
Authorization: Bearer eyJhbGci...
```

### Response — 200 OK

```json
{
  "selected_period": "this_month",
  "ropa_status_overview": {
    "draft": 12,
    "pending": 5,
    "under_review": 8,
    "completed": 3,
    "total": 28
  },
  "risk_by_department": [
    {
      "department": "IT",
      "low": 4,
      "medium": 2,
      "high": 1,
      "total": 7
    },
    {
      "department": "HR",
      "low": 2,
      "medium": 3,
      "high": 0,
      "total": 5
    }
  ],
  "sensitive_docs_by_department": [
    { "department": "IT", "count": 3 },
    { "department": "HR", "count": 5 }
  ],
  "pending_documents": {
    "data_owner_count": 10,
    "data_processor_count": 4
  },
  "approved_documents": {
    "total": 3
  },
  "pending_dpo_review": {
    "for_archiving": 6,
    "for_destruction": 2
  }
}
```

### Error Responses

| HTTP Status | เหตุ |
|-------------|------|
| `401 Unauthorized` | ไม่มี token หรือ token หมดอายุ |
| `403 Forbidden` | token ถูกต้องแต่ role ไม่ใช่ `EXECUTIVE` |

---

## Response Schema

### Root Object: `ExecutiveDashboardResponse`

| Field | Type | คำอธิบาย |
|-------|------|---------|
| `selected_period` | `string` | period ที่ส่งไป เช่น `"this_month"` |
| `ropa_status_overview` | `RopaStatusOverview` | สถานะเอกสาร ROPA แบ่ง 4 ค่า |
| `risk_by_department` | `List[RiskByDepartment]` | ความเสี่ยงแยกแผนก (อาจเป็น `[]` ถ้ายังไม่มี auditor assign) |
| `sensitive_docs_by_department` | `List[SensitiveDocByDepartment]` | เอกสารข้อมูลอ่อนไหวแยกแผนก (อาจเป็น `[]`) |
| `pending_documents` | `PendingDocuments` | เอกสารที่ยัง DRAFT อยู่ |
| `approved_documents` | `ApprovedDocumentsSummary` | เอกสารที่ DPO อนุมัติแล้ว |
| `pending_dpo_review` | `PendingDpoReviewSummary` | เอกสารรอ DPO ตรวจสอบ |

---

### `RopaStatusOverview`

| Field | Type | ที่มาของข้อมูล | คำอธิบาย |
|-------|------|--------------|---------|
| `draft` | `int` | `owner_sections.status = DRAFT` หรือ `processor_sections.status = DRAFT` | เอกสารที่ยังอยู่ในขั้นตอนกรอกข้อมูล |
| `pending` | `int` | `review_feedbacks.status = OPEN` | เอกสารที่มี feedback จาก DPO ค้างอยู่ รอ DO/DP แก้ไข |
| `under_review` | `int` | `documents.status = UNDER_REVIEW` หรือ `processor_assignments.status = SUBMITTED` | เอกสารที่ส่ง DPO แล้ว หรือ DP ส่งให้ DO แล้วรอ DO ตรวจ |
| `completed` | `int` | `documents.status = COMPLETED` | เอกสารที่ DPO อนุมัติแล้วสมบูรณ์ (**ต้องรอ DPO approve endpoint**) |
| `total` | `int` | จำนวนเอกสารทั้งหมดในระบบ (กรองตาม period) | รวมทุกสถานะ |

> **หมายเหตุ `completed`:** ค่านี้จะเป็น 0 จนกว่า DPO team จะเพิ่ม endpoint สำหรับอนุมัติเอกสาร ดูรายละเอียดใน [Known Limitations](#known-limitations)

---

### `RiskByDepartment`

| Field | Type | คำอธิบาย |
|-------|------|---------|
| `department` | `string` | ชื่อแผนก (มาจาก `auditor_assignments.department` ที่ DPO ตั้งตอน assign auditor) |
| `low` | `int` | จำนวนเอกสารความเสี่ยงต่ำในแผนกนั้น |
| `medium` | `int` | จำนวนเอกสารความเสี่ยงปานกลาง |
| `high` | `int` | จำนวนเอกสารความเสี่ยงสูง |
| `total` | `int` | รวม low + medium + high |

> **หมายเหตุ:** List นี้จะเป็น `[]` ถ้า DPO ยังไม่ได้ assign auditor ให้เอกสารไหนเลย เพราะข้อมูลแผนกมาจาก `auditor_assignments` เท่านั้น

---

### `SensitiveDocByDepartment`

| Field | Type | คำอธิบาย |
|-------|------|---------|
| `department` | `string` | ชื่อแผนก (มาจาก `auditor_assignments.department` เช่นกัน) |
| `count` | `int` | จำนวนเอกสาร (distinct) ที่มี data type ที่ `is_sensitive = true` |

> นับจาก `owner_data_types.is_sensitive = true` ในส่วนของ Data Owner

---

### `PendingDocuments`

| Field | Type | ที่มาของข้อมูล | คำอธิบาย |
|-------|------|--------------|---------|
| `data_owner_count` | `int` | `ropa_owner_sections.status = DRAFT` | จำนวน owner section ที่ยังไม่ submit |
| `data_processor_count` | `int` | `ropa_processor_sections.status = DRAFT` | จำนวน processor section ที่ยังไม่ submit |

---

### `ApprovedDocumentsSummary`

| Field | Type | ที่มาของข้อมูล | คำอธิบาย |
|-------|------|--------------|---------|
| `total` | `int` | `documents.status = COMPLETED` | เอกสารที่ DPO อนุมัติแล้วทั้งหมด |

> **พิเศษเรื่อง period filter:**
> - ถ้า `period = all` → กรองจาก `documents.status = COMPLETED` ปกติ
> - ถ้ามี period อื่น → กรองจาก `documents.last_approved_at >= cutoff` แทน เพราะต้องการรู้ว่า DPO อนุมัติ **ในช่วงนั้น** ไม่ใช่เอกสารที่ **สร้าง** ในช่วงนั้น
> - **ค่านี้จะเป็น 0 จนกว่า DPO approve endpoint จะถูกสร้าง**

---

### `PendingDpoReviewSummary`

| Field | Type | ที่มาของข้อมูล | คำอธิบาย |
|-------|------|--------------|---------|
| `for_archiving` | `int` | `documents.status = UNDER_REVIEW` AND `documents.deletion_status IS NULL` | เอกสารที่ DO ส่งให้ DPO แล้ว รอ DPO ตรวจสอบ (ไม่ใช่คำขอทำลาย) |
| `for_destruction` | `int` | `documents.deletion_status = DELETE_PENDING` | เอกสารที่ DO ขอทำลาย รอ DPO อนุมัติการทำลาย |

---

## UI Card Mapping

ด้านล่างคือการ map response field → UI card ที่แสดงบนหน้า Executive Dashboard

### Card กลุ่ม 1: สถานะ ROPA Overview (4 ช่อง)

```
┌─────────────┐  ┌──────────────┐  ┌───────────────┐  ┌────────────────┐
│  ฉบับร่าง   │  │ รอดำเนินการ │  │  รอตรวจสอบ   │  │ เสร็จสมบูรณ์  │
│             │  │              │  │               │  │                │
│  ropa_status │  │ ropa_status  │  │  ropa_status  │  │  ropa_status   │
│  _overview  │  │  _overview   │  │   _overview   │  │   _overview    │
│  .draft     │  │  .pending    │  │  .under_review│  │  .completed    │
└─────────────┘  └──────────────┘  └───────────────┘  └────────────────┘
```

ยอดรวมทั้งหมด: `ropa_status_overview.total`

---

### Card กลุ่ม 2: ความเสี่ยงแยกแผนก (Bar Chart / Table)

Data source: `risk_by_department[]`

```javascript
// ตัวอย่างการ map ไปใช้กับ Chart Library
const chartData = response.risk_by_department.map(item => ({
  department: item.department,
  low:        item.low,
  medium:     item.medium,
  high:       item.high,
  total:      item.total,
}))
```

กรองแผนกได้โดยส่ง query param `?department=ชื่อแผนก`

> ถ้า `risk_by_department` เป็น `[]` ให้แสดง empty state: "ยังไม่มีการ assign Auditor ในระบบ"

---

### Card กลุ่ม 3: เอกสารข้อมูลอ่อนไหวแยกแผนก

Data source: `sensitive_docs_by_department[]`

```javascript
const sensitiveData = response.sensitive_docs_by_department.map(item => ({
  department: item.department,
  count:      item.count,
}))
```

> ถ้าเป็น `[]` แสดง empty state: "ยังไม่มีข้อมูล"

---

### Card กลุ่ม 4: เอกสารที่รอดำเนินการ (2 ช่อง)

```
┌──────────────────────────┐  ┌──────────────────────────┐
│  Data Owner ที่ยัง DRAFT │  │  Data Processor ยัง DRAFT│
│                          │  │                          │
│  pending_documents       │  │  pending_documents       │
│  .data_owner_count       │  │  .data_processor_count   │
└──────────────────────────┘  └──────────────────────────┘
```

---

### Card กลุ่ม 5: เอกสาร DPO + สรุป

```
┌──────────────────┐  ┌──────────────────┐  ┌────────────────────┐
│  DPO อนุมัติแล้ว│  │  รอ DPO จัดเก็บ │  │  รอ DPO ทำลาย     │
│                  │  │                  │  │                    │
│  approved_       │  │  pending_dpo_    │  │  pending_dpo_      │
│  documents.total │  │  review          │  │  review            │
│                  │  │  .for_archiving  │  │  .for_destruction  │
└──────────────────┘  └──────────────────┘  └────────────────────┘
```

---

## Period Filter

### วิธีส่ง Period

```javascript
// ตัวอย่าง: สร้าง dropdown แล้ว map ค่า
const periodOptions = [
  { label: "7 วันล่าสุด",   value: "7_days"     },
  { label: "30 วันล่าสุด",  value: "30_days"    },
  { label: "เดือนนี้",      value: "this_month" },
  { label: "ปีนี้",         value: "this_year"  },
  { label: "ทั้งหมด",       value: "all"        },
]

// fetch
const fetchDashboard = async (period = "all", department = null) => {
  const params = new URLSearchParams({ period })
  if (department) params.append("department", department)

  const res = await fetch(`/api/v1/dashboard/executive?${params}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return res.json()
}
```

### ผลของ Period Filter ต่อแต่ละ Card

| Card | กรองด้วย column ไหน |
|------|-------------------|
| ropa_status_overview | `ropa_documents.created_at >= cutoff` |
| risk_by_department | `ropa_documents.created_at >= cutoff` |
| sensitive_docs_by_department | `ropa_documents.created_at >= cutoff` |
| pending_documents | `ropa_documents.created_at >= cutoff` |
| approved_documents | `ropa_documents.last_approved_at >= cutoff` (ต่างจากตัวอื่น!) |
| pending_dpo_review | `ropa_documents.created_at >= cutoff` |

> `approved_documents` ใช้ `last_approved_at` ไม่ใช่ `created_at` เพราะต้องการรู้ว่า DPO อนุมัติ **ในช่วงนั้น** ไม่ใช่เอกสารที่ **สร้าง** ในช่วงนั้น

---

## Known Limitations

### 2 Card ที่ยังได้ค่า 0 เสมอ

ปัจจุบัน **ยังไม่มี DPO "Approve Document" endpoint** ในระบบ  
ผลคือ `ropa_documents.status` ไม่เคยเปลี่ยนเป็น `COMPLETED` และ `last_approved_at` ไม่เคยถูกเซต

| Card | Field | สถานะ |
|------|-------|-------|
| เสร็จสมบูรณ์ | `ropa_status_overview.completed` | จะเป็น 0 จนกว่า DPO team จะเพิ่ม approve endpoint |
| DPO อนุมัติแล้ว | `approved_documents.total` | จะเป็น 0 จนกว่า DPO team จะเพิ่ม approve endpoint |

**วิธีแนะนำสำหรับ frontend ช่วงนี้:**  
แสดงค่าตามปกติ (จะเป็น 0) ไม่ต้อง hardcode อะไร พอ DPO team ทำ endpoint เสร็จค่าจะอัปเดตเองทันที

### ข้อจำกัดของ risk_by_department และ sensitive_docs_by_department

ข้อมูลแผนก (`department`) มาจาก `auditor_assignments.department` เท่านั้น  
ถ้า DPO ยังไม่ได้ assign auditor ให้เอกสารไหน → List จะเป็น `[]`  
Frontend ควร handle กรณี empty array ด้วย

---

## ตัวอย่าง Full Response ที่ระบบทำงานครบ

```json
{
  "selected_period": "all",
  "ropa_status_overview": {
    "draft": 15,
    "pending": 3,
    "under_review": 7,
    "completed": 5,
    "total": 30
  },
  "risk_by_department": [
    { "department": "IT",       "low": 3, "medium": 2, "high": 1, "total": 6 },
    { "department": "HR",       "low": 2, "medium": 1, "high": 0, "total": 3 },
    { "department": "Finance",  "low": 1, "medium": 3, "high": 2, "total": 6 }
  ],
  "sensitive_docs_by_department": [
    { "department": "IT",      "count": 4 },
    { "department": "HR",      "count": 6 },
    { "department": "Finance", "count": 2 }
  ],
  "pending_documents": {
    "data_owner_count": 10,
    "data_processor_count": 5
  },
  "approved_documents": {
    "total": 5
  },
  "pending_dpo_review": {
    "for_archiving": 5,
    "for_destruction": 2
  }
}
```

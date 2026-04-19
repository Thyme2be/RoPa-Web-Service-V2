# Frontend Integration Guide — Executive Dashboard API

Base URL: `/api/v1`  
Authentication: ทุก request ต้องใส่ Header `Authorization: Bearer <access_token>`  
Role ที่ใช้ได้: `EXECUTIVE` เท่านั้น

---

## Overview

Executive มีหน้าเดียวคือ **Dashboard** ไม่มี sidebar อื่น  
เรียก API เดียวแล้วได้ข้อมูลทั้งหมดในหน้าเดียว

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
| `period` | string | `all` | `7_days`, `30_days`, `this_month`, `this_year`, `all` | กรองช่วงเวลาสร้างเอกสาร (ยกเว้น `approved_documents` ใช้ `last_approved_at`) |
| `department` | string | `null` | ชื่อแผนก เช่น `"IT"` | กรองเฉพาะ `risk_by_department` ของแผนกนั้น (optional) |

### Response `200`

```json
{
  "selected_period": "all",
  "ropa_status_overview": {
    "pending": 5,
    "draft": 8,
    "completed": 4,
    "under_review": 7,
    "total": 30
  },
  "risk_by_department": [
    { "department": "IT",      "low": 3, "medium": 2, "high": 1, "total": 6 },
    { "department": "HR",      "low": 2, "medium": 1, "high": 0, "total": 3 },
    { "department": "Finance", "low": 1, "medium": 3, "high": 2, "total": 6 }
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

### Error Responses

| HTTP Status | เหตุ |
|-------------|------|
| `401 Unauthorized` | ไม่มี token หรือ token หมดอายุ |
| `403 Forbidden` | role ไม่ใช่ `EXECUTIVE` |

---

## Response Schema — อธิบายทีละ field

---

### `ropa_status_overview` — สถานะเอกสารในระบบ

> **หมายเหตุ:** 4 สถานะนี้แยกกันชัดเจน ไม่ซ้อนทับกัน นับแบบ priority ตามลำดับ

| Field | ที่มา | ความหมาย |
|-------|-------|---------|
| `pending` | IN_PROGRESS + **ไม่มี** owner_section และ processor_section เลย | เพิ่งสร้างเอกสารมา ยังไม่มีใครกดดูหรือกรอกอะไรเลย |
| `draft` | IN_PROGRESS + อย่างน้อย 1 section เป็น DRAFT | DO หรือ DP กำลังกรอกฟอร์มอยู่ |
| `completed` | IN_PROGRESS + owner_section = SUBMITTED **และ** processor_section = SUBMITTED | ทั้ง DO และ DP กดบันทึกฟอร์มเสร็จแล้วทั้งคู่ รอ DO ส่งให้ DPO |
| `under_review` | `doc.status = UNDER_REVIEW` | DO ส่งให้ DPO แล้ว รอ DPO ตรวจสอบ |
| `total` | COUNT ทั้งหมด (กรองตาม period) | เอกสารทั้งหมดที่นับในช่วงนั้น |

---

### `risk_by_department` — ความเสี่ยงแยกตามแผนก

**แผนกมาจากไหน:** `users.department` ของ **Data Owner** ที่สร้างเอกสาร — ดึงอัตโนมัติจาก account ที่ Admin ตั้งค่าไว้ ไม่ต้องกรอกเอง

**ข้อมูลความเสี่ยงมาจากไหน:** Tab 3 ของ DO (ปุ่ม "ยืนยันการประเมิน") คำนวณจาก `likelihood × impact`

| risk_level | เงื่อนไข |
|------------|---------|
| `LOW` | score < 8 |
| `MEDIUM` | score 8–14 |
| `HIGH` | score ≥ 15 |

```json
[
  {
    "department": "IT",
    "low": 3,
    "medium": 2,
    "high": 1,
    "total": 6
  }
]
```

> ถ้า `[]` → Admin ยังไม่ได้ตั้ง department ให้ Data Owner หรือยังไม่มี DO กรอก Risk Assessment

กรองเฉพาะแผนกโดยส่ง `?department=IT`

---

### `sensitive_docs_by_department` — เอกสารข้อมูลอ่อนไหวแยกแผนก

**แผนกมาจากไหน:** เหมือนกัน — `users.department` ของ Data Owner

**ข้อมูลมาจากไหน:** DO ติ๊ก `is_sensitive = true` ใน Section 3 ของฟอร์ม DO (ประเภทข้อมูล)

```json
[
  { "department": "IT", "count": 4 }
]
```

> `count` = จำนวน **distinct document** ที่มีข้อมูล sensitive อย่างน้อย 1 ประเภท  
> ถ้า `[]` → ยังไม่มี DO กรอก Section 3 เลย หรือไม่มี department ในระบบ

---

### `pending_documents` — เอกสารที่ฝ่ายใดฝ่ายหนึ่งยังค้างอยู่

| Field | ที่มา | ความหมาย |
|-------|-------|---------|
| `data_owner_count` | `owner_section.status = DRAFT` | DO ยังกรอกฟอร์มค้างอยู่ |
| `data_processor_count` | `processor_section.status = DRAFT` | DP ยังกรอกฟอร์มค้างอยู่ |

> นับจากทุกเอกสารในระบบ (ไม่ใช่แค่ IN_PROGRESS)

---

### `approved_documents` — เอกสารที่ DPO อนุมัติแล้ว

| Field | ที่มา |
|-------|-------|
| `total` | `doc.status = COMPLETED` |

> **พิเศษ:** เมื่อมี `period` filter → ใช้ `last_approved_at >= cutoff` แทน `created_at`  
> เพราะต้องการรู้ว่า DPO อนุมัติ **ในช่วงนั้น** ไม่ใช่เอกสารที่ **สร้าง** ในช่วงนั้น

---

### `pending_dpo_review` — รอ DPO ดำเนินการ

| Field | ที่มา | ความหมาย |
|-------|-------|---------|
| `for_archiving` | `doc.status = UNDER_REVIEW AND deletion_status IS NULL` | DO ส่งให้ DPO ตรวจเอกสารปกติ |
| `for_destruction` | `deletion_status = DELETE_PENDING` | DO ยื่นขอทำลายเอกสาร รอ DPO อนุมัติ |

---

## UI Card Mapping

### Card กลุ่ม 1: สถานะเอกสาร ROPA

```
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│  Pending │  │  Draft   │  │Completed │  │Reviewing │
│          │  │          │  │          │  │          │
│ ropa_    │  │ ropa_    │  │ ropa_    │  │ ropa_    │
│ status_  │  │ status_  │  │ status_  │  │ status_  │
│ overview │  │ overview │  │ overview │  │ overview │
│ .pending │  │ .draft   │  │.completed│  │.under_   │
│          │  │          │  │          │  │ review   │
└──────────┘  └──────────┘  └──────────┘  └──────────┘

ยอดรวม: ropa_status_overview.total
```

---

### Card กลุ่ม 2: ความเสี่ยงแยกแผนก (Bar Chart)

```javascript
const chartData = response.risk_by_department.map(item => ({
  department: item.department,
  low:    item.low,
  medium: item.medium,
  high:   item.high,
  total:  item.total,
}))
// กรองแผนก: GET /dashboard/executive?department=IT
```

---

### Card กลุ่ม 3: เอกสาร Sensitive แยกแผนก

```javascript
const sensitiveData = response.sensitive_docs_by_department.map(item => ({
  department: item.department,
  count: item.count,
}))
```

---

### Card กลุ่ม 4: เอกสารค้างอยู่ (2 ช่อง)

```
┌──────────────────────┐  ┌──────────────────────┐
│  DO ยังค้างอยู่      │  │  DP ยังค้างอยู่      │
│                      │  │                      │
│ pending_documents    │  │ pending_documents    │
│ .data_owner_count    │  │ .data_processor_count│
└──────────────────────┘  └──────────────────────┘
```

---

### Card กลุ่ม 5: DPO สรุป (3 ช่อง)

```
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  DPO อนุมัติแล้ว│  │  รอ DPO ตรวจ    │  │  รอ DPO ทำลาย   │
│                  │  │                  │  │                  │
│ approved_        │  │ pending_dpo_     │  │ pending_dpo_     │
│ documents.total  │  │ review           │  │ review           │
│                  │  │ .for_archiving   │  │ .for_destruction │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

---

## Period Filter

### ผลของ Period ต่อแต่ละ field

| Field | กรองด้วย column ไหน |
|-------|-------------------|
| `ropa_status_overview` | `ropa_documents.created_at >= cutoff` |
| `risk_by_department` | `ropa_documents.created_at >= cutoff` |
| `sensitive_docs_by_department` | `ropa_documents.created_at >= cutoff` |
| `pending_documents` | `ropa_documents.created_at >= cutoff` |
| `approved_documents` | `ropa_documents.last_approved_at >= cutoff` ← ต่างจากตัวอื่น |
| `pending_dpo_review` | `ropa_documents.created_at >= cutoff` |

```javascript
// ตัวอย่าง fetch
const fetchDashboard = async (period = "all", department = null) => {
  const params = new URLSearchParams({ period })
  if (department) params.append("department", department)
  const res = await fetch(`/api/v1/dashboard/executive?${params}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return res.json()
}
```

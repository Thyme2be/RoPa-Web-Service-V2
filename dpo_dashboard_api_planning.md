# 🎯 Planning: ข้อมูลที่ API `/dashboard/dpo` ต้องส่งไปให้ Frontend

อ้างอิงจากรูปภาพหน้าจอของ DPO แดชบอร์ด ข้อมูล API ที่ Backend จะต้องปั้นเป็น JSON ส่งไปให้ Frontend วาดผล จะมีท้งหมด 7 ก้อนใหญ่ ดังนี้ครับ:

## รูปแบบ JSON (Response Payload) ที่คาดหวัง

```json
{
  "total_reviewed": {
    "count": 100
  },
  "revision_needed": {
    "owner_count": 10,
    "processor_count": 5
  },
  "risk_overview": {
    "total": 100,
    "low": 70,
    "medium": 20,
    "high": 10
  },
  "pending_dpo_review": {
    "for_archiving": 20,
    "for_destruction": 30
  },
  "auditor_review_status": {
    "pending": 20,
    "completed": 30
  },
  "approved_documents": {
    "total": 20
  },
  "auditor_delayed": {
    "count": 5
  }
}
```

---

## 🛠️ แผนการจับคู่ (Mapping) ข้อมูลจากฐานข้อมูล

### ก้อนที่ 1: แดชบอร์ดสรุปข้อมูลภาพรวม (Total Reviewed)
* **หน้าจอ**: `100` รูปกล่องเอกสาร 
* **ตัวแปรส่งหน้าบ้าน**: `total_reviewed.count`
* **ที่มาหลังบ้าน**: นับจำนวน (Count) ทั้งหมดจากตาราง `ReviewDpoAssignmentModel` 

### ก้อนที่ 2: เอกสารที่ต้องแก้ไข (Revision Needed)
* **หน้าจอ**: ผู้รับผิดชอบข้อมูล `10` / ผู้ประมวลผลฯ `05`
* **ตัวแปรส่งหน้าบ้าน**: `revision_needed.owner_count` / `revision_needed.processor_count`
* **ที่มาหลังบ้าน**: 
    1. Filter หา `status = 'CHANGES_REQUESTED'`
    2. เช็คตาราง `ReviewFeedbackModel` แยกนับตามประเภทว่าตีกลับไปให้ใคร (`OWNER_SECTION` หรือ `PROCESSOR_SECTION`)

### ก้อนที่ 3: โดนัทชาร์ต ความเสี่ยงของเอกสาร (Risk Overview)
* **หน้าจอ**: รวม 100 ฉบับ (เสี่ยงต่ำ 70, กลาง 20, สูง 10)
* **ตัวแปรส่งหน้าบ้าน**: `risk_overview.total`, `.low`, `.medium`, `.high`
* **ที่มาหลังบ้าน**: ชนตารางประเมินความเสี่ยง (`RopaRiskAssessmentModel`) แล้วจัดกลุ่มนับยอด Group By `risk_level`

### ก้อนที่ 4: เอกสารที่รอ DPO ตรวจสอบ (Pending DPO Review)
* **หน้าจอ**: ตรวจเพื่อจัดเก็บ `20` / ตรวจเพื่อทำลาย `30`
* **ตัวแปรส่งหน้าบ้าน**: `pending_dpo_review.for_archiving` / `pending_dpo_review.for_destruction`
* **ที่มาหลังบ้าน**: 
    * `for_archiving`: แงะยอดเอกสารสถานะ `IN_REVIEW` ในบอร์ด Cycle
    * `for_destruction`: นับยอดคำขอทุบทิ้งจาก `DocumentDeletionRequestModel.status == PENDING`

### ก้อนที่ 5: การทำงานของ Auditor (Auditor Review Status)
* **หน้าจอ**: รอการตรวจสอบ `20` / เสร็จสิ้น `30`
* **ตัวแปรส่งหน้าบ้าน**: `auditor_review_status.pending` / `auditor_review_status.completed`
* **ที่มาหลังบ้าน**: ดูผลงานของ Auditor จากตาราง `AuditorAssignmentModel` แยกนับตามสถานะ `ASSIGNED` และ `COMPLETED`

### ก้อนที่ 6: เอกสารที่อนุมัติแล้ว (Approved Documents)
* **หน้าจอ**: ได้รับจากผู้รับผิดชอบข้อมูล `20`
* **ตัวแปรส่งหน้าบ้าน**: `approved_documents.total`
* **ที่มาหลังบ้าน**: เอกสารของ DPO ที่เดินทางมาถึงสถานะ `APPROVED`

### ก้อนที่ 7: Auditor สายลม (Auditor Delayed)
* **หน้าจอ**: ล่าช้าเกินกำหนด `05` 
* **ตัวแปรส่งหน้าบ้าน**: `auditor_delayed.count`
* **ที่มาหลังบ้าน**: กรองหา `AuditorAssignmentModel` ที่ขี้เกียจ (`status != COMPLETED`) และหมดเวลาแล้ว (`due_date < วันนี้`)

---
**หมายเหตุสำหรับ Frontend:** หากข้อมูล Schema ก้อนใหญ่นี้ตรงตามที่ตกลงกัน รบกวนกด Approve ได้เลยครับ Backend จะพร้อมบรรจุข้อมูลลงตารางให้ทันทีครับ 🚀

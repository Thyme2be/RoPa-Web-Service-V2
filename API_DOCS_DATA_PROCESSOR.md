# 📖 คู่มือการเชื่อมต่อ API สำหรับ Data Processor (ผู้ประมวลผลข้อมูลส่วนบุคคล)

เอกสารฉบับนี้จัดทำขึ้นเพื่ออธิบายชุด API สำหรับหน้ากระดานทำงานของ **Data Processor (DP)** ซึ่งถูกจัดจำแนกออกเป็น 3 Sidebar (สอดคล้องกับหน้ากราฟิก UI) ให้ผู้พัฒนา Frontend สามารถเชื่อมโยงการแสดงผลและปรับปรุงข้อมูลได้อย่างถูกต้อง 

---

## 1. ภาพรวมสถานะการทำงาน (Lifecycle Status)

ในฐานะ Data Processor ระบบจะอ้างอิงสถานะผ่านตารางแยก (ProcessorRecord) ด้วยสถานะเหล่านี้:
- `pending`: รอดำเนินการ (ได้รับมอบหมายมาแต่ยังไม่เปิดแก้ไข)
- `in_progress`: กำลังทำแบบร่าง หรืออยู่ในระหว่างพิมพ์แก้ไขข้อมูล
- `confirmed`: ยืนยันข้อมูลผ่านการคัดกรองแล้ว (รอจัดส่งให้ Owner)
- `submitted`: กดปุ่มส่งถึง Owner แล้ว (แผงฟอร์มจะถูกล็อก `is_read_only = true`)
- `needs_revision`: กรอกข้อมูลไม่ผ่านและถูกตีกลับจากผู้ตรวจสอบ

---

## 2. API สำหรับ Sidebar 1: รายการ RoPA (งานในความรับผิดชอบ)

### 2.1 ดึงรายการและสถิติมอบหมายงาน
**Endpoint:** `GET /api/processor/assignments`
**หน้าที่:** ขอรายการตารางและชุดข้อมูลตัวเลขในแต่ละสถานะ เพื่อใช้วาดกราฟสรุปและแสดงแถวข้อมูล
**ตัวอย่างการส่ง Parameters (Query):** 
`?page=1&page_size=10&status=ส่งงานแล้ว`

### 2.2 ดึงรายละเอียดฟอร์มเพื่อกรอกข้อมูล
**Endpoint:** `GET /api/processor/assignments/{id}`
**หน้าที่:** ดึงโครงสร้างข้อมูลเก่า (ถ้ามี) มาถมลงบน Input ช่องต่างๆ โดย Frontend ต้องสังเกตตัวแปร `is_read_only` หากรับเป็น `true` จะต้องทำการทำการปิดช่อง Input และซ่อนปุ่มบันทึกทั้งหมด

### 2.3 การบันทึกฉบับร่าง (Save Draft)
**Endpoint:** `PUT /api/processor/assignments/{id}/save-draft`
**หน้าที่:** บันทึกข้อมูลขึ้นคลาวด์โดยข้ามขั้นตอนการตรวจจับความผิดพลาด (No Strict Validation) สามารถส่งบางฟิลด์ที่กรอกแล้วมาได้เลย 
**ตัวอย่าง Payload รูปแบบ JSON (ส่งจาก Frontend):**
```json
{
  "processor_name": "บริษัท รับจัดการเซิร์ฟเวอร์ จำกัด",
  "processing_activity": "จัดทำฐานข้อมูล Backup ให้แก่การตลาด",
  "personal_data": "[\"ที่อยู่ IP\", \"ประวัติการค้นหา\"]"
}
```

### 2.4 ยืนยันข้อมูล (Confirm and Lock)
**Endpoint:** `PUT /api/processor/assignments/{id}/confirm`
**หน้าที่:** สั่งรันตรวจสอบว่าผู้ประมวลผลข้อมูลได้กรอกฟิลด์เนื้อหาภาคบังคับครบถ้วนหรือไม่ หากไม่ครบจะติดตอบกลับ Error รหัส 422
**ตัวอย่าง Payload (ต้องระบุโครงข่ายให้ครบถ้วนตามแบบฟอร์ม 6 ส่วน):**
```json
{
  "processor_record": {
    "first_name": "สมชาย",
    ... ครบทุกฟิลด์ที่หน้าบ้านจัดเก็บ ...
    "transfer_is_transfer": true,
    "transfer_country": "ญี่ปุ่น",
    "transfer_method": "ส่งผ่าน API Secure Connection",
    "transfer_protection_std": "ISO 27001",
    "transfer_exception": "ไม่มีข้อยกเว้น"
  }
}
```

### 2.5 ส่งเอกสารพร้อมใช้งานกลับให้ Data Owner (Send to Owner)
**Endpoint:** `POST /api/processor/send-to-owner/{id}`
**หน้าที่:** จัดส่งเอกสารที่มีสถานะเป็น `confirmed` แล้วเท่านั้น ส่งกลับคืนไปหาหัวหน้า (Owner) หน้าบ้านไม่ต้องแนบ Body Data ยิงรับตอบเพียงเท่านี้พอ

---

## 3. API สำหรับ Sidebar 2: ลานเก็บระบบเอกสาร

### 3.1 ดึงตารางภาพรวมทวิภาค
**Endpoint:** `GET /api/processor/documents`
**หน้าที่:** เนื่องจากหน้าบ้านมีการแสดงผลก้อนตารางแยก 2 ก้อนในหน้าเดียว (รายการ Active และฉบับร่าง Drafts) API เส้นนี้จึงส่งชุดข้อมูล Pagination คืนกลับมาให้สองชุด 
**ตัวอย่าง Response:**
```json
{
  "stats": { "total": 10, "complete": 5 },
  "active_records": [ { ...ข้อมูล... } ],
  "active_total": 4,
  "active_page": 1,
  "drafts": [ { ...ข้อมูลฉบับร่าง... } ],
  "drafts_total": 6,
  "drafts_page": 1,
  "page_size": 10
}
```

### 3.2 สั่งทิ้งร่างเอกสาร (Delete Draft)
**Endpoint:** `DELETE /api/processor/drafts/{id}`
**หน้าที่:** ทำความสะอาดข้อมูลช่อง Input ที่เขียนค้างไว้ในฉบับร่าง และคืนค่าสถานะเป็น `pending` อย่างสมบูรณ์

---

## 4. API สำหรับ Sidebar 3: ข้อเสนอแนะ (Feedback from Auditor)

### 4.1 ดูภาพรวมเอกสารที่ร่วงกลับมาแก้ไข
**Endpoint:** `GET /api/processor/feedback`
**หน้าที่:** สลึงตารางงานที่มีการ Comment ยิงเข้าส่วน Data Processor โดยเฉพาะ

### 4.2 ถอดรหัสข้อเสนอแนะรายจุด
**Endpoint:** `GET /api/processor/feedback/{audit_id}`
**หน้าที่:** แกะห่อโครงสร้าง Comment จาก Auditor (JSON payload) และทำการ Mapping เป็นข้อๆ พร้อมชื่อ Label ภาษาไทย (เช่น "ส่วนที่ 1 : ...") โยนกลับไปให้หน้าบ้าน Loop วาดตารางอย่างง่ายดาย
**ตัวอย่าง Response ส่วนของ Feedback:**
```json
"section_feedbacks": [
  {
    "section": "section_5",
    "section_label": "ส่วนที่ 5 : ฐานทางกฎหมายและการส่งต่อ",
    "comment": "กรุณายืนยันว่ามาตรการเทียบเท่า SCCs สมบูรณ์ครับ"
  }
]
```

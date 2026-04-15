# 📖 คู่มือการเชื่อมต่อ API สำหรับ Data Owner (ผู้ควบคุมข้อมูลส่วนบุคคล)

เอกสารฉบับนี้จัดทำขึ้นเพื่ออธิบายเส้นทาง API (Endpoints) ตัวแปร (Variables) และตัวอย่างการรับส่งข้อมูลระหว่าง Frontend และ Backend สำหรับบทบาท **Data Owner (DO)** เพื่อให้ทีมพัฒนา Frontend สามารถต่อเชื่อมระบบได้อย่างถูกต้องและมีประสิทธิภาพ

---

## 1. ภาพรวมของระบบ (System Overview)

Data Owner มีหน้าที่หลักในการสร้างหน้าเอกสาร RoPA ต้นทาง, กรอกข้อมูลของตนเอง, มอบหมายงานส่วนที่เหลือให้แก่ Data Processor และส่งเอกสารที่สมบูรณ์ให้แก่ Auditor เพื่อทำการตรวจสอบ

**สถานะของเอกสาร (DocumentStatus):**
- `DRAFT`: เอกสารฉบับร่าง (ยังไม่ส่งตรวจ)
- `PENDING_PROCESSOR`: รอการกรอกข้อมูลจากผู้ประมวลผลข้อมูล (Data Processor)
- `PENDING_AUDITOR`: รอการตรวจจากผู้ตรวจสอบ (Auditor)
- `APPROVED`: ผ่านการอนุมัติ (สมบูรณ์)
- `REJECTED_OWNER` / `REJECTED_PROCESSOR`: ถูกตีกลับเพื่อแก้ไข (Revision Required)
- `COMPLETED`: **(ใหม่!)** ข้อมูลกรอกครบทั้ง 2 ฝ่ายแล้ว (DO & DP) พร้อมสำหรับส่งให้ Auditor ตรวจสอบแล้ว

---

## 2. การสร้างและจัดการเอกสารหลัก (Core Documents API)

### 2.1 สร้างเอกสารใหม่ (Create Document)
**Endpoint:** `POST /api/owner/documents`
**หน้าที่:** สั่งสร้างบรรทัดเอกสารแรกในระบบ โดยอาจแนบข้อมูลเบื้องต้นมาด้วย

**ตัวอย่าง Payload รูปแบบ JSON (ส่งจาก Frontend):**
```json
{
  "title": "ระบบบันทึกประวัติการสั่งซื้อลูกค้าออนไลน์",
  "owner_record": {
    "title_prefix": "นาย",
    "first_name": "สมมติ",
    ...
  }
}
```
**การตอบกลับ (Response):** ระบบจะทำการ Generate รหัส **`doc_code`** ในรูปแบบ **`RP-[ปี ค.ศ.]-[ลำดับ 4 หลัก]`** เช่น `RP-2026-0001` คืนกลับมาให้ทันที เพื่อใช้แสดงผลบนหน้าจอรายการครับ

### 2.2 บันทึกฉบับร่าง (Save Draft)
**Endpoint:** `PUT /api/owner/documents/{id}/draft`
**หน้าที่:** บันทึกข้อมูลที่กรอกค้างไว้ โดย **ไม่มีการตรวจสอบความครบถ้วน (No Validation)** หากฟิลด์ใดไม่ถูกส่งมา หรือส่งมาเป็นค่าว่าง (`null` หรือ `""`) ระบบฐานข้อมูลจะปรับบันทึกเป็นค่าว่างตามนั้น เพื่อให้การกลับมาแก้ไขมีความสะอาดตา

**ตัวอย่าง Payload รูปแบบ JSON:**
```json
{
  "title": "ปรับชื่อระบบใหม่นิดหน่อย",
  "owner_record": {
    "processing_activity": "จัดเก็บเพื่อการวิเคราะห์ทางการตลาด",
    "personal_data": "[\"ชื่อ\", \"เบอร์โทรศัพท์\"]",  // หมายเหตุ: ส่งเป็น JSON String Array
    "transfer_is_transfer": false
  }
}
```

### 2.3 ยืนยันข้อมูลแบบฟอร์ม (Confirm)
**Endpoint:** `PUT /api/owner/documents/{id}/confirm`
**หน้าที่:** บันทึกข้อมูลขั้นสุดท้าย โดยระบบจะทำการตรวจสอบข้อมูลที่จำเป็น (Validation) หากข้อมูลที่บังคับกรอกมีความไม่ครบถ้วน ระบบจะตอบกลับด้วยรหัสข้อผิดพลาด `422 Unprocessable Entity` พร้อมแจ้งรายชื่อฟิลด์ที่ตกหล่น

*พิเศษ:* หากผ่านด่านตรวจสอบความครบถ้วนแล้ว ระบบฐานข้อมูลจะทำการเปลี่ยนกรอบข้อมูลทางเลือก (Optional fields) ที่เว้นว่างไว้ ให้เป็นข้อความว่า `"ไม่มี"` อัตโนมัติ เพื่อส่งร่างสมบูรณ์ให้ผู้ตรวจ
**ตัวอย่างกรณีส่งข้อมูลไม่ครบถ้วน (Response 422 จาก Backend):**
```json
{
  "detail": {
    "message": "กรอกข้อมูลไม่ครบถ้วน ไม่สามารถยืนยันข้อมูลได้",
    "missing_fields": ["address", "collection_method", "retention_duration"]
  }
}
```

---

## 3. การโอนถ่ายแบบฟอร์มข้ามบทบาท (Cross-Role API)

### 3.1 มอบหมายงานให้ Data Processor (Assign)
**Endpoint:** `POST /api/owner/processors/assignments`
**หน้าที่:** มอบหมายแบบฟอร์มเอกสารใบใหม่ให้แก่ Data Processor เพื่อจัดการในรูปแบบแยกส่วน
**ตัวอย่าง Payload รูปแบบ JSON:**
```json
{
  "first_name": "สมชาย",
  "last_name": "ใจดี",
  "record_name": "ฟอร์มสำหรับแผนกประมวลผลเซิร์ฟเวอร์ A"
}
```

### 3.2 ส่งมอบเอกสารที่สมบูรณ์เข้าสู่ส่วนตรวจสอบ (Submit to Auditor)
**Endpoint:** `POST /api/owner/auditors/submissions`
**หน้าที่:** นำส่งเอกสารที่กรอกเสร็จสมบูรณ์เข้าด่านตรวจของ Auditor สถานะจะถูกเปลี่ยนเป็น `PENDING_AUDITOR`
**เงื่อนไขสำคัญ:** เอกสารที่จะส่งได้ต้องอยู่ในสถานะ **`COMPLETED`** เท่านั้น (ตรวจสอบได้จากเส้น `/api/owner/{owner_id}/auditors/ready`)
**ตัวอย่าง Payload รูปแบบ JSON:**
```json
{
  "auditor_first_name": "ผู้ตรวจ",
  "auditor_last_name": "มาตรฐาน",
  "document_titles": ["ระบบบันทึกประวัติลูกค้าร้านกาแฟ"]
}
```

---

## 4. ระบบแจ้งเตือน และ ข้อเสนอแนะ (Notification & Feedback)

### 4.1 ดึงกล่องแจ้งเตือน (Get Notifications)
**Endpoint:** `GET /api/owner/{owner_id}/notifications`
**หน้าที่:** ดึงข้อความแจ้งเตือนเมื่อมีการกระทำข้ามบทบาทมาถึงตัว Owner
**ตัวอย่าง Response:**
```json
[
  {
    "id": "fe12-32...",
    "document_id": "4544-ad...",
    "title": "เอกสารถูกตีกลับและมีข้อเสนอแนะใหม่",
    "message": "ผู้ตรวจสอบได้ส่งมอบข้อเสนอแนะให้แก่คุณ โปรดตรวจสอบและแก้ไขข้อมูล",
    "is_read": 0,
    "created_at": "2026-04-08T10:30:00Z"
  }
]
```

### 4.2 ดึงรายละเอียดข้อเสนอแนะ (Get Document Feedback Detail)
**Endpoint:** `GET /api/owner/documents/{doc_id}/feedbacks`
**หน้าที่:** ดึงข้อความรีวิวจาก Auditor ของเอกสารฉบับนั้น โดยระบบจะคัดกรองแปลง JSON ออกมาเป็นรายออบเจ็กต์แยกตาม Section เพื่อให้นำไปแสดงใต้ช่อง Input ได้ทันที
**ตัวอย่าง Response:**
```json
{
  "document": { ... },
  "owner_feedbacks": [
    {
      "section_name": "section_3",
      "comment": "กรุณาจัดแจงรายละเอียดข้อมูลอ่อนไหวให้ชัดเจนยิ่งขึ้น",
      "status": "needs_revision"
    }
  ],
  "processor_feedbacks": []
}
```

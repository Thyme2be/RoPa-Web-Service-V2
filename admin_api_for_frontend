# คู่มือเอกสาร API อย่างละเอียดสำหรับ Frontend (Admin Subsystem)

เอกสารฉบับนี้เป็นการขยายรายละเอียดระดับตัวแปร (Variables Specification) ชนิดของข้อมูล (Data Types) และเงื่อนไขต่างๆ สำหรับใช้ประกอบการพัฒนาระบบฝั่ง Frontend

> [!WARNING]
> **Authentication & Authorization**
> - **Header:** `Authorization: Bearer <Access_Token>`
> - **Role requirement:** ผู้ใช้งานต้องมีบทบาทเป็น `Admin` จึงจะสามารถเรียก API เหล่านี้ได้

---

## 1. 📊 สถิติแผงควบคุมหลัก (Admin Dashboard)
ใช้สำหรับวาดภาพรวมสถิติในหน้าแรกสุด

*   **Endpoint:** `GET /admin/dashboard`
*   **Response Model:**
```json
{
  "users": {
    "data_owners": {
      "count": 12,                  // (int) จำนวนผู้ใช้งานที่มีสิทธิ์ Data Owner ปัจจุบัน
      "trends": { 
        "direction": "up",          // (str) ชนิดแนวโน้ม ("up", "down", "neutral") สำหรับทำไอคอนลูกศร
        "value": "+2",              // (str) ตัวเลขความต่างเทียบกับเดือนก่อนหน้า
        "text_label": "เดือนนี้"         // (str) สตริงแสดงผลเพิ่มเติม
      }
    },
    "data_processors": { /* โครงสร้างเดียวกับ data_owners */ },
    "auditors": { /* โครงสร้างเดียวกับ data_owners */ }
  },
  "documents": {
    "total": 1284,                  // (int) จำนวนเอกสารทั้งหมดในระบบ
    "trends": {
      "direction": "up",            // (str) ชนิดแนวโน้ม ("up", "down", "neutral")
      "value": "+12%",              // (str) เปอร์เซ็นต์การเติบโตเทียบกับเดือนก่อน
      "text_label": "เดือนนี้"
    }
  },
  "document_status_chart": {
    "this_week": {                  // ข้อมูลสำหรับแท็บ "สัปดาห์นี้"
      "draft": 5,                   // (int) ยอดเอกสารในสถานะ ร่าง/กำลังกรอก
      "in_progress": 10,            // (int) ยอดเอกสารระหว่างประมวลผล
      "completed": 20,              // (int) ยอดเอกสารที่ตรวจผ่านแล้ว
      "rejected": 2                 // (int) ยอดเอกสารที่สอบตก/ตีกลับ
    },
    "this_month": { /* โครงสร้างเดียวกับ this_week แต่นับยอดของเดือนนี้ */ },
    "all_time": { /* โครงสร้างเดียวกับ this_week แต่นับยอดรวมตลอดกาล */ }
  }
}
```

---

## 2. 👥 การจัดการพนักงาน (Users Management)

### 2.1 ดึงตารางรายชื่อพนักงาน
*   **Endpoint:** `GET /admin/users`
*   **Response Model:**
```json
{
  "total_users": 50,                // (int) ทรัพยากรบุคคลทั้งหมดในบริษัท
  "active_users": 35,               // (int) พนักงานที่กำลังล็อกอิน (Session Active)
  "users_list": [                   // (Array) รายชื่อพนักงานทั้งหมด
    {
      "id": "123e4567-e89b-...",     // (str) UUID ของบัญชีพนักงาน (จำเป็นสำหรับส่งกลับเพื่อแก้ไข/ลบ)
      "first_name": "สมชาย",          // (str) ชื่อจริง
      "last_name": "ใจดี",           // (str) นามสกุล
      "email": "somchai@...",       // (str) อีเมลพนักงาน
      "role": "Data Owner",         // (str | null) บทบาท ("Data Owner", "Data Processor", "Auditor", "Admin" หรือ null)
      "status": "active"            // (str) "active" หรือ "inactive" เท่านั้น
    }
  ]
}
```

### 2.2 โหมดพระเจ้า: ยัดพนักงานเข้าระบบทันที
*   **Endpoint:** `POST /admin/members`
*   **Request Body (JSON):**
```json
{
  "username": "somchai123",         // (str) Username 
  "first_name": "สมชาย",              // (str) ชื่อจริง
  "last_name": "ใจดี",               // (str) นามสกุล
  "email": "somchai@company.com",   // (str) อีเมลรูปแบบถูกต้อง
  "password": "securepassword",     // (str) รหัสผ่าน (Backend จะจัดการ Hash ให้)
  "role": "Data Owner"              // (str | null) บทบาท หรือ ส่ง null ได้
}
```
*   **Response Model:** (คืนค่าโครงสร้าง User ที่สมัครสำเร็จ พร้อมรหัส `200 OK` หรือ `400 Bad Request` ถ้าผู้ใช้ซ้ำกัน)

### 2.3 เปลี่ยน/ถอดถอน บทบาท (Role)
*   **Endpoint:** `PUT /admin/users/{user_id}/role`
*   **Path Parameters:**
    *   `user_id`: (str UUID) ไอดีพนักงานที่กำลังจะแก้ไข
*   **Query Parameters:**
    *   `role`: (str | empty) ใช้คำว่า `Data Owner`, `Data Processor`, `Auditor`, `Admin` หากต้องการ **ถอดบทบาทเป็นไม่มีบทบาท** ให้ทำการส่งเป็น Null (หรือละเว้นพารามิเตอร์นี้ไปเลย)
*   **Response Model:** `{"message": "Successfully assigned role..." }`

### 2.4 ลบพนักงานถาวร
*   **Endpoint:** `DELETE /admin/users/{user_id}`
*   **Path Parameters:**
    *   `user_id`: (str UUID) ไอดีพนักงานที่จะถูกระเบิดทิ้งจากฐานข้อมูล
*   **Response Model:** `{"message": "Successfully deleted user..." }`

---

## 3. 🗂️ ศูนย์ควบคุมเอกสารและประเมินเปอร์เซ็นต์ (Document Center)
ตารางหลักที่แสดงรายการแคมเปญ พร้อมตรรกะเปอร์เซ็นต์เดินหน้าทางเดียว (Monotonic Validation)

*   **Endpoint:** `GET /admin/documents`
*   **Response Model:**
```json
{
  "summary": {
    "total_documents": {
      "count": 1284,                // (int) จำนวนแคมเปญทั้งหมด 
      "trend": "+12% เดือนนี้"        // (str) คำนวณสตริงแนวโน้มพร้อมข้อความให้เลย
    },
    "pending_audit": {
      "count": 42,                  // (int) จำนวนเอกสารที่รอตรายาง Auditor เคาะผ่าน
      "trend": "-5% เดือนนี้"         // (str) คำนวณเทรนด์ให้พร้อมข้อความ
    }
  },
  "documents_list": [
    {
      "id": "123e4567-e89b-...",     // (str UUID) ระบุ Reference เอกสาร
      "title": "ชื่อเอกสารหลัก (แคมเปญ)", // (str) ชื่องาน
      "data_type": "ประเภทข้อมูล",      // (str) ประเภทการประมวลผลข้อมูล
      "company": "สมปอง พึ่งธรรม",      // (str) จะถูก Mapping เข้ากับ "ชื่อ นามสกุล" ของคนรับผิดชอบหลัก 
      "completeness_percent": 50,   // (int) เลขเปอร์เซ็นต์ล้วน (25 | 50 | 75 | 100) นำไปปั้นวงกลม Loading UI ได้เลย 
      "status": "รอการตรวจสอบ"         // (str) สถานะภาษาไทย ("กำลังกรอกข้อมูล", "รอการตรวจสอบ", "รอการแก้ไข", "เสร็จสมบูรณ์")
    }
  ]
}
```
*(เปอร์เซ็นต์นี้จะไม่มีการลดลงไปเป็น 25% แม้ถูก Auditor ตีกลับ เพื่อตอบโจทย์ Milestone Base Timeline Tracking)*

---

## 4. ⏱️ กระดานติดตามการติดขัด (Work-Tracking System)
API ตัวท็อปที่มาพร้อม Logic การสับเปลี่ยนกระดูกสันหลัง หาคนกุมบังเหียนเอกสารปัจจุบันระดับวินาที! 

*   **Endpoint:** `GET /admin/work-tracking/summary`
*   **Response Model:**
```json
{
  "role_summary": {                 // ข้อมูลสำหรับวาดการ์ด 3 ใบด้านบน
    "data_owner": {
      "count": 12,                  // (int) เอกสารที่ดองตกค้างที่ฝั่ง DC 
      "label": "รอยืนยันความถูกต้อง",   // (str) ชื่อหัวข้อ
      "progress_percent": 30        // (int) เปอร์เซ็นต์ (คำนวณจาก count เทียบสัดส่วนทั้งหมด) 
    },
    "data_processor": { /* โครงสร้างเดียวกับ data_owner แต่อิงคอขวดที่ DP ปัจจุบัน */ },
    "auditor": { /* โครงสร้างเดียวกับ data_owner แต่อิงคอขวดที่รอตรวจ Auditor */ }
  },
  "tracking_list": [
    {
      "id": "123e4567-e89b-...",
      "title": "สิทธิพนักงาน",        // (str) 🔴 ระบบจะสลับแสดงชื่อเป็น "ชื่อไฟล์ Data Processor" หากงานกองอยู่ที่ฝั่ง DP !
      "responsible_person": "สมชาย",    // (str) 🔴 ระบบเปลี่ยนให้อัตโนมัติ: ถ้าตกที่ DC ภาระจะเป็นชื่อ DC, ถ้าตกที่ DP ภาระจะเป็นชื่อ DP 
      "auditor_name": "ยังไม่มีผู้ตรวจสอบ",// (str) แยกผู้ตรวจสอบออกมา (กันสับสนกับ responsible_person)
      "last_updated": "28/03/2026, 14:30", // (str) เจาะตรวจหาวันที่มี "การกดบันทึกหรือทำกิจกรรมล่าสุด" ลึกไปถึง Record ย่อย ล้วงวันเวลามาให้เป๊ะๆ
      "status": "pending_auditor"   // (str) สถานะ raw_enum 
    }
  ]
}
```

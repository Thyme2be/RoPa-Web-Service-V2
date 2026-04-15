# สถาปัตยกรรมเชิงลึกของระบบผู้ดูแลระบบ (Admin Subsystem Deep-Dive Architecture)

เอกสารฉบับนี้ เป็นคู่มืออ้างอิงเชิงเทคนิคอย่างละเอียด (Technical Reference Manual) ที่เจาะลึกทุกไฟล์ โครงสร้างคลาส และเมธอดของระบบปฏิบัติการผู้ดูแลระบบ (Admin) บนสถาปัตยกรรม FastAPI โดยใช้คำศัพท์และมาตรฐานอธิบายวิศวกรรมซอฟต์แวร์อย่างเป็นทางการ

---

## 1. ฟังก์ชันตัวควบคุมและจุดเชื่อมต่อ (Controllers & Routing Layer)
**พิกัดไฟล์:** `app/api/routers/admin.py`

ไฟล์นี้ทำหน้าที่เป็น **Router Module** หลักที่คอยรับคำร้องขอ (HTTP Requests) จาก Client โดยมี Route และการประมวลผลภายในดังนี้:

### 1.1 `get_admin_dashboard` (`GET /admin/dashboard`)
*   **หน้าที่:** ประมวลผลและนำส่งข้อมูลสถิติภาพรวมองค์กรแบบบูรณาการ
*   **การสืบค้นข้อมูล (Database Querying):** สกัดฐานข้อมูลด้วย `sqlalchemy.func.count` โดยแยกเงื่อนไขจำแนกตาม `UserRoleEnum` (Data Owner, Data Processor, Auditor)
*   **ตรรกะประมวลผลความแปรผัน (Trend Calculation Logic):** ดำเนินการเปรียบเทียบอัตราส่วนเปอร์เซ็นต์ (Percentage Ratio) ของพนักงานและเอกสารที่ถูกสร้างใน "เดือนปัจจุบัน" (อ้างอิงจาก `datetime.now(timezone.utc)`) เทียบกับ "โครงสร้างฐานสะสมก่อนหน้า" (Cumulative Base Growth) ซึ่งคำนวณผ่านสมการ: `(Entity_Current_Month / Entity_Cumulated_Before_Current_Month) * 100` เพื่อหาเปอร์เซ็นต์อัตราการขยายตัวที่แม่นยำ
*   **ตรรกะกราฟประวัติศาสตร์ (Time-Series Aggregation):** ใช้งานคำสั่งแปลงวันที่เพื่อแบ่งกรอบการดึงข้อมูล `RopaDocument` ย้อนหลังตามจุดตัดเวลา: 
    *   `this_week_start`: จุดเริ่มต้นสัปดาห์ (วันจันทร์) 
    *   `current_month_start`: จุดเริ่มต้นของเดือนปัจจุบัน
*   **โครงสร้างส่งกลับ:** นำข้อมูลประมวลผลห่อหุ้มในโมเดล `AdminDashboardStats`

### 1.2 `get_user_management_list` (`GET /admin/users`)
*   **หน้าที่:** นำส่งตารางรายชื่อบุคลากรทั้งหมด พร้อมสถิติองค์ประกอบ
*   **การประมวลผล:** นำร่องดึงข้อมูลตาราง `User` ทั้งหมดขึ้นมา (Eager Execution) ก่อนทำงานในลักษณะ In-variable Iteration เพื่อจัดแยกปริมาณบัญชีที่มีสถานะ `UserStatus.ACTIVE` (นับจำนวน Live Session)
*   **โครงสร้างส่วนควบ:** ผนวกมาตรวัด `total_users_trend` ที่อ้างอิงตรรกะ Cumulative Base Growth ในลักษณะโครงสร้างเดียวกับ Dashboard

### 1.3 `create_user_admin` (`POST /admin/members`)
*   **หน้าที่:** อินเตอร์เฟสสำหรับผู้ดูแลระบบในการจัดตั้งบุคลากรใหม่ (Administrative User Provisioning)
*   **ระบบรักษาความปลอดภัย:** เมื่อรับคำสั่ง `AdminCreateUserRequest` ระบบจะส่งพารามิเตอร์ `password` เข้าสู่ฟังก์ชันการแฮช `auth.get_password_hash()` ก่อนดำเนินการ `db.add()` เพื่อรับรองมาตรฐานความปลอดภัยทางสถาปัตยกรรม
*   **การดักจับข้อผิดพลาด (Exception Handling):** หากตาราง `User` ระบุบัญชีหรืออีเมลที่ซ้อนทับ ระบบจะปฏิเสธคำร้องพร้อมโยนข้อผิดพลาด `HTTPException 400` ทันที

### 1.4 `update_user_role` (`PUT /admin/users/{user_id}/role`)
*   **หน้าที่:** แปรผันระดับการเข้าถึงข้อมูล (Role Re-assignment)
*   **กลไกทำงาน:** รองรับ Query Parameter แบบ Optional โดยระบบสามารถจับคู่เป็นชนิด `UserRoleEnum` หรือบังคับให้เป็นตรรกะค่าว่างเปล่า (Nullification) ผ่านการผูกกับข้อกำหนดเงื่อนไขของ SQLAlchemy `target_user.role = role`

### 1.5 `get_admin_documents` (`GET /admin/documents`)
*   **หน้าที่:** นำส่งตารางแคมเปญเอกสารพร้อมอัตราประเมินเชิงตัวเลข (Monotonic Evaluation)
*   **ตรรกะหัวใจหลักของการคำนวณ Completeness Percent:**
    *   **25%:** ข้อกำหนดเริ่มต้น
    *   **50%:** เมื่อสถานะทะลุเข้าสู่ `PENDING_PROCESSOR` (รอกระบวนการฝ่ายผู้ประมวลผล)
    *   **100%:** เมื่อสถานะไปถึงจุด `APPROVED` 
    *   **75% (กรณีพิเศษ/บังคับถาวร):** ระบบจะสืบค้นประวัติใน `doc.audits` เช็คกรณีที่เคยถูกผู้ตรวจสอบตีโจทย์กลับ (`request_change_at` Is Not None) ทันทีที่พบหลักฐาน ระบบจะล็อคอัตราความคืบหน้าไว้ที่ `75` ทับเงื่อนไขในอดีต (เช่น 25% หรือ 50%) โดยไม่สามารถย้อนกลับได้ ซึ่งสอดคล้องกับหลักวิศวกรรมการติดตามแบบ Time-Series Event-Driven Tracker

### 1.6 `get_work_tracking_summary` (`GET /admin/work-tracking/summary`)
*   **หน้าที่:** แจกแจงภาระงานเพื่อติดตามคอขวดระหว่างบุคลากร (Cross-functional Bottleneck Analytics)
*   **กระบวนทัศน์การปะติดปะต่อชื่อสายงาน (Dynamic Object Mapping):** ดำเนินการปรับตัวแปร `display_title` และ `resp_person` แบบอัตโนมัติ กล่าวคือ:
    *   กรณีมาตรฐาน: ยึดชื่อและตำแหน่งจาก `doc.owner`
    *   กรณีข้ามสาย (`PENDING_PROCESSOR`, `REJECTED_PROCESSOR`): ระบบจะเจาะโครงสร้างย่อยค้นหาใบงานของ DP ใบสุดท้าย (`doc.processor_records[-1]`) เพื่อดึงชื่อ `record_name` ที่ถูกลงนามและแสดงพนักงานผู้ถือครองใบนั้นๆ ในช่องรับผิดชอบแทน
*   **กลไก Timestamp ล่าสุด (Aggregated Timestamp Extraction):** ระบบจะนำเวลาดั้งเดิมใน `doc.created_at` ออกมาวิ่งข้ามผ่าน Entity อื่นๆ เช่น `owner_record.updated_at` หรือ `user_form.updated_at` โดยจดจำและแทนที่เฉพาะค่าเวลาที่ "มีอายุความใหม่ที่สุด (Most Recent Threshold)" ถือเป็นการดึง Activity Time ที่แท้จริง

---

## 2. พิมพ์เขียวควบคุมโครงสร้างมิติข้อมูล (Data Schema & Validation Layer)
**พิกัดไฟล์:** `app/schemas/admin.py`

ทำหน้าที่ควบคุมสัญญาของพารามิเตอร์ Input และ Output (API Contract Definition) อย่างเคร่งครัดตามกลไกไลบรารี Pydantic

*   **`TrendInfo`**: มาตรฐานอ็อบเจ็กต์ระบุข้อมูลทิศทาง (ประกอบด้วย `direction` รูปแบบคงที่แบบ Literal, ค่าของสตริงเปอร์เซ็นต์ `value`, และ `text_label`) เพื่อให้สถาปัตยกรรมมีความสม่ำเสมอ
*   **กลุ่ม Data Wrapping Object (เช่น `AdminDashboardStats`, `AdminUsersPageResponse`, `WorkTrackingSummaryResponse`)**: ใช้กลยุทธ์การห่อหุ้มโครงสร้าง (Payload Structuring) เพื่อนำส่งคุณลักษณะหลายประเภทใน Response เดียว ป้องกันปัญหา N+1 Request ของฝั่ง Client
*   **กลุ่ม `ListItem`**: อ็อบเจ็กต์จำเพาะอย่าง `AdminDocumentListItem` และ `WorkTrackingListItem` จัดทำขึ้นเพื่อควบคุมฟิลด์ฐานข้อมูลที่ถูกอนุญาตให้นำส่งต่อตารางอินเทอร์เฟส โดยคั่นกลางเพื่อหลีกเลี่ยงการเปิดเผย Schema ของตัว SQLAlchemy Models ฐานข้อมูลโดยตรง

---

## 3. ระบบควบคุมการเข้าถึงอินสแตนซ์ (Dependency Injection Layer)
**พิกัดไฟล์:** `app/api/deps.py`

*   **`get_current_user`**: โมดูลวิเคราะห์และตรวจจับโทเคน (Token Lifecycle Dependency) ซึ่งมีการยิง Query เพื่อยืนยันสถานะแบบผูกมัด (Stateful Auth Check) กล่าวคือ `user.status == UserStatus.ACTIVE` จึงจะยอมรับ หากไม่ตรงตามเงื่อนไข จะยุติกระแส HTTP ทันที
*   **`RoleChecker`**: เป็น Dependency Class Method ที่ออกแบบด้วยหลักการแพทเทิร์นแบบ Constructor Injection ยอมรับรูปแบบพารามิเตอร์เป็นอาร์เรย์ (`allowed_roles`) เมื่อผู้ใช้ผ่านด่านแรกเข้ามาได้ ระบบจะดำเนินการเปรียบเทียบตรรกะว่าด้วยพารามิเตอร์ `user.role` นั้นตรงกันกับสิทธิ์ที่กำกับของ Route หรือไม่

---

## 4. โครงสร้างความสัมพันธ์ฐานข้อมูล (ORM Models Architecture)
**พิกัดไฟล์:** `app/models/enums.py`, `app/models/user.py`, `app/models/document.py`

*   **`app/models/enums.py`**: พื้นที่เก็บข้อกำหนดคงที่ (Enclosed Constants) เช่น `UserStatus`, `UserRoleEnum`, `DocumentStatus` ใช้สำหรับยึดโครงสร้างฐานข้อมูลในระดับ Column Enforcement จำกัดการขยายตัวของความผิดพลาดในแง่ข้อมูล (Data Integrity)
*   **`app/models/user.py`**: ประกอบด้วยสคีมาหลักของพนักงาน มีความสัมพันธ์กับตำแหน่งการลงนามผ่าน `back_populates` กับเอกสารสารพัดประเภท
*   **`app/models/document.py`**: บรรจุตารางแกนกลางอย่าง `RopaDocument` ที่เชื่อมโยงในรูปแบบ `1-to-Maybe`, `1-to-Many` ไปยังฟอร์มข้อมูลย่อย เช่นตาราง `OwnerRecord` และ `ProcessorRecord` โดยรองรับการประมวลผล Cascade และ Eager Loading เพื่อใช้สนับสนุนสถาปัตยกรรมด้านบนในการวิเคราะห์ความคืบหน้าของเอกสารได้อย่างทรงประสิทธิภาพมากที่สุด

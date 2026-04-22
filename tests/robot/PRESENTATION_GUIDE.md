# บทพูดนำเสนอการพัฒนาและทดสอบระบบ Backend (Robot Framework)

## 1. บทนำ (Introduction)
"สวัสดีครับอาจารย์และคณะกรรมการทุกท่าน วันนี้ผมจะขอนำเสนอส่วนของการพัฒนาและตรวจสอบคุณภาพของระบบ Backend API สำหรับ RoPa Web Service ครับ โดยในฟีเจอร์นี้เราได้เน้นความสำคัญไปที่ 'ความถูกต้องของข้อมูล' และ 'ความสามารถในการตรวจสอบซ้ำได้อัตโนมัติ' ครับ"

## 2. สถาปัตยกรรมและการพัฒนา (Architecture)
"ในส่วนของ Backendเรารูปแบบการเขียนเน้นความทันสมัย โดยใช้ **FastAPI** เป็น Framework หลัก เนื่องจากมีความเร็วสูงและรองรับการทำ Type Hinting ที่ชัดเจน โดยทำงานคู่กับ **SQLAlchemy** ในการจัดการฐานข้อมูล และใช้ระบบ **Database Migrations** (SQL Scripts) เพื่อควบคุมโครงสร้างตารางให้เป็นมาตรฐานเดียวกันทั้งในเครื่อง Developer และระบบ Production ครับ"

## 3. ยุทธศาสตร์การทดสอบ (Testing Strategy)
"ไฮไลท์สำคัญของโปรเจกต์นี้คือชุดทดสอบ **Robot Framework** ครับ เราตั้งเป้าหมายไปที่การทดสอบแบบ **100% Spec Compliance** โดยเฉพาะในส่วนของ Admin User CRUD:
*   เราไม่ได้ตรวจสอบเพียงแค่ HTTP Status Code (เช่น 200 หรือ 201) เท่านั้น
*   แต่เราลงลึกไปถึงการใช้ **JSON Schema Validation** เพื่อการันตีว่า Key ทุกตัวที่ได้รับกลับมา และชนิดของข้อมูล (Data Type) ต้องถูกต้องตามข้อกำหนดในฐานข้อมูล 100% ครับ"

## 4. การจัดการสภาพแวดล้อม (Infrastructure as Code)
"เพื่อให้การทดสอบมีความเสถียรและแม่นยำที่สุด เราได้นำเทคโนโลยีคอนเทนเนอร์อย่าง **Docker Compose** มาใช้ในการสร้างระบบจำลองขึ้นมาใหม่ทั้งหมด (ฐานข้อมูลสะอาด, Backend ตัวล่าสุด) ทำให้เราสามารถรันเทสทั้งหมดจบในคำสั่งเดียว ซึ่งช่วยลดปัญหา 'รันที่เครื่องผมผ่านแต่ทำไมที่อื่นไม่ผ่าน' (It works on my machine) ไปได้อย่างยั่งยืนครับ"

## 5. ระบบตรวจสอบอัตโนมัติ (CI/CD)
"สุดท้ายเราได้ติดตั้งระบบ **Continuous Integration** บน **GitHub Actions** ซึ่งจะทำหน้าที่ Build และรันชุดทดสอบ Robot โดยอัตโนมัติทุกครั้งที่มีการอัปเดตโค้ด พร้อมทั้งจัดเก็บรายงานผลในรูปแบบ HTML Report เพื่อใช้เป็นหลักฐานยืนยันคุณภาพของซอฟต์แวร์ในทุกเวอร์ชันครับ"

---

## ตัวอย่างโค้ดต้นแบบที่เกี่ยวข้อง (Code Prototypes)

### 1. ตัวอย่างการตรวจสอบข้อมูล (Robot Framework + Schema)
```robot
# ตัวอย่างการเช็คความถูกต้องของข้อมูลระดับ Schema
Verify User Details Schema
    [Arguments]    ${json_response}
    Dictionary Should Contain Key    ${json_response}    id
    Dictionary Should Contain Key    ${json_response}    email
    Dictionary Should Contain Key    ${json_response}    role
    # ตรวจสอบค่าที่ได้รับว่าถูกต้องตรงตามที่ส่งไป
    Should Be Equal As Strings    ${json_response}[email]    ${EXPECTED_EMAIL}
```

### 2. ระบบรันเทสอัตโนมัติ (Docker Compose Configuration)
```yaml
# docker-compose.test.yml
services:
  robot-runner:
    build: 
      context: ../../
      dockerfile: tests/robot/Dockerfile.test
    command: >
      sh -c "python server/run_migration.py && robot tests/robot/api_user_crud.robot"
    depends_on:
      test-backend: { condition: service_healthy }
```

### 3. ระบบ CI/CD (GitHub Workflow)
```yaml
# .github/workflows/robot-api-tests.yml
jobs:
  run-tests:
    runs-on: ubuntu-latest
    steps:
      - name: Run Robot Tests via Docker
        run: docker compose -f tests/robot/docker-compose.test.yml up --abort-on-container-exit
```

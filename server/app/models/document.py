import uuid                          # ใช้สร้าง UUID แบบสุ่ม สำหรับ primary key
import enum                          # ใช้สร้าง Enum (ชุดค่าคงที่ที่กำหนดไว้)
from sqlalchemy import Column, String, Integer, Boolean, DateTime, Date, ForeignKey, Enum, Text
# Column     = บอกว่านี่คือคอลัมน์ใน DB
from sqlalchemy.dialects.postgresql import UUID  # UUID type สำหรับ PostgreSQL โดยเฉพาะ
from datetime import datetime, timezone          # ใช้จัดการวันที่และ timezone
from sqlalchemy.orm import relationship          # ใช้เชื่อมความสัมพันธ์ระหว่าง model
from app.database import Base                    # Base class ที่ทุก model ต้อง inherit มา


# ─────────────────────────────────────────────
# ENUMS — ชุดค่าคงที่ที่ใช้ในระบบ
# ─────────────────────────────────────────────

class DocumentStatus(str, enum.Enum):
    # สถานะของ RopaDocument (เอกสารหลัก) — ใช้ติดตาม workflow ของทั้งเอกสาร
    DRAFT = "draft"                          # Data Owner สร้างเอกสารแล้ว ยังไม่ส่งใคร
    PENDING_PROCESSOR = "pending_processor"  # ส่งให้ Data Processor กรอกแล้ว
    PENDING_AUDITOR = "pending_auditor"      # Data Owner ส่งให้ Auditor ตรวจแล้ว
    APPROVED = "approved"                    # Auditor อนุมัติแล้ว
    REJECTED_PROCESSOR = "rejected_processor"# Auditor ส่งกลับให้ Processor แก้ไข
    REJECTED_OWNER = "rejected_owner"        # Auditor ส่งกลับให้ Owner แก้ไข


class ProcessorStatus(str, enum.Enum):
    # สถานะของ ProcessorRecord — ติดตาม workflow ของ Data Processor คนเดียว
    PENDING = "pending"                  # ได้รับมอบหมายแล้ว แต่ยังไม่เปิดฟอร์มเลย
    IN_PROGRESS = "in_progress"          # กำลังกรอก หรือบันทึกฉบับร่างแล้ว
    CONFIRMED = "confirmed"              # กรอกครบ กดยืนยันแล้ว รอเลือกส่งให้ Data Owner
    SUBMITTED = "submitted"              # ส่งให้ Data Owner เรียบร้อยแล้ว
    NEEDS_REVISION = "needs_revision"    # Auditor สั่งให้กลับมาแก้ไข


class AuditStatus(str, enum.Enum):
    # สถานะของ AuditorAudit — ผลการตรวจของ Auditor
    PENDING_REVIEW = "pending_review"    # ยังไม่ได้ตรวจ (รอตรวจสอบ)
    APPROVED = "approved"               # ตรวจแล้ว ผ่าน (อนุมัติ)
    NEEDS_REVISION = "needs_revision"   # ตรวจแล้ว ไม่ผ่าน (ต้องแก้ไข)


class AuditorType(str, enum.Enum):
    # ประเภทของ Auditor
    INTERNAL = "internal"    # Auditor ภายในองค์กร
    OUTSOURCE = "outsource"  # Auditor จากภายนอก (จ้าง)


# ─────────────────────────────────────────────
# MODELS — พิมพ์เขียวของตารางใน Database
# ─────────────────────────────────────────────

class RopaDocument(Base):
    # ตารางหลัก — เอกสาร RoPA 1 ฉบับ สร้างโดย Data Owner
    __tablename__ = 'ropa_documents'  # ชื่อตารางใน PostgreSQL

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # UUID คือ id หลักของเอกสาร, auto-generate ทุกครั้งที่สร้างใหม่

    owner_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    # FK → ตาราง users — เจ้าของเอกสาร (Data Owner)
    # ondelete='CASCADE' = ถ้าลบ user → ลบเอกสารนี้ด้วย

    doc_code = Column(String, nullable=True, unique=True)
    # รหัสที่แสดงบนหน้าจอ เช่น "RP-2026-1000"
    # nullable=True เพราะ Data Owner อาจยังไม่ได้กำหนด
    # unique=True = ห้ามซ้ำกัน

    title = Column(String, nullable=False)
    # ชื่อรายการ เช่น "ข้อมูลลูกค้าและประวัติการสั่งซื้อ"

    status = Column(Enum(DocumentStatus), nullable=False, default=DocumentStatus.DRAFT)
    # สถานะปัจจุบันของเอกสาร ค่าเริ่มต้น = DRAFT

    version = Column(Integer, nullable=False, default=1)
    # เวอร์ชันของเอกสาร เพิ่มขึ้นทุกครั้งที่ Auditor ส่งกลับให้แก้ไข

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    # วันเวลาที่สร้างเอกสาร (UTC) — auto-set ตอนสร้าง

    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)
    # วันเวลาที่แก้ไขล่าสุด — auto-update ทุกครั้งที่ save

    sent_to_auditor_at = Column(DateTime, nullable=True)
    # วันเวลาที่ Data Owner ส่งให้ Auditor — null ถ้ายังไม่ส่ง

    # ── Relationships (SQLAlchemy จัดการ JOIN ให้อัตโนมัติ) ──
    owner = relationship("User", foreign_keys=[owner_id])
    # ดึงข้อมูล User ที่เป็นเจ้าของเอกสาร → ใช้ตอนต้องการชื่อ Data Owner

    owner_record = relationship("OwnerRecord", back_populates="document", uselist=False, cascade="all, delete-orphan")
    # ส่วนที่ Data Owner กรอก (1 เอกสาร มี 1 owner_record)
    # uselist=False = เป็น object เดียว ไม่ใช่ list
    # cascade="all, delete-orphan" = ลบเอกสาร → ลบ owner_record ด้วย

    processor_records = relationship("ProcessorRecord", back_populates="document", cascade="all, delete-orphan")
    # ส่วนที่ Data Processor กรอก (1 เอกสาร มีได้หลาย processor)

    audits = relationship("AuditorAudit", back_populates="document", cascade="all, delete-orphan")
    # ประวัติการตรวจจาก Auditor


class AuditorProfile(Base):
    # ข้อมูลโปรไฟล์ของ Auditor (แยกจาก User เพราะมีข้อมูลเพิ่มเติม)
    __tablename__ = 'auditor_profiles'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    # FK → ตาราง users — Auditor คนนี้คือ User คนไหน

    auditor_type = Column(Enum(AuditorType), nullable=False)
    # ประเภท: ภายใน (internal) หรือ จ้างภายนอก (outsource)

    outsource_company = Column(String, nullable=True)
    # ชื่อบริษัทที่จ้าง (ถ้าเป็น outsource)

    public_email = Column(String, nullable=False)
    # อีเมลที่แสดงต่อสาธารณะ

    public_phone = Column(String, nullable=True)
    # เบอร์โทรที่แสดงต่อสาธารณะ

    certification = Column(String, nullable=True)
    # ใบรับรอง/คุณวุฒิของ Auditor

    appointed_at = Column(Date, nullable=False)
    # วันที่ได้รับการแต่งตั้ง

    expired_at = Column(Date, nullable=True)
    # วันหมดอายุ (ถ้ามี)

    is_active = Column(Boolean, nullable=False, default=True)
    # ยังใช้งานอยู่ไหม

    user = relationship("User", foreign_keys=[user_id])
    # ดึงข้อมูล User → ใช้ตอนต้องการชื่อ Auditor

    audits = relationship("AuditorAudit", back_populates="auditor")
    # ประวัติการตรวจทั้งหมดที่ Auditor คนนี้ทำ


class OwnerRecord(Base):
    # ส่วนที่ Data Owner กรอก (ข้อมูลฝั่งเจ้าของข้อมูล)
    __tablename__ = 'owner_records'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    ropa_doc_id = Column(UUID(as_uuid=True), ForeignKey('ropa_documents.id', ondelete='CASCADE'), nullable=False)
    # FK → เอกสารหลัก — record นี้เป็นของเอกสารไหน

    # ── ข้อมูลผู้บันทึก ──
    record_name = Column(String, nullable=True)   # ชื่อผู้บันทึก
    address = Column(Text, nullable=True)         # ที่อยู่
    email = Column(String, nullable=True)         # อีเมล
    phone = Column(String, nullable=True)         # เบอร์โทร

    # ── ข้อมูลกิจกรรม ──
    data_subject_name = Column(String, nullable=True)   # ชื่อเจ้าของข้อมูล
    processing_activity = Column(String, nullable=True) # กิจกรรมประมวลผล
    purpose = Column(Text, nullable=True)               # วัตถุประสงค์
    personal_data = Column(Text, nullable=True)         # ข้อมูลส่วนบุคคลที่เก็บ
    data_category = Column(String, nullable=True)       # หมวดหมู่ข้อมูล
    data_type = Column(String, nullable=True)           # ประเภทข้อมูล (ทั่วไป/อ่อนไหว)
    collection_method = Column(String, nullable=True)   # วิธีเก็บข้อมูล
    source_direct = Column(Boolean, nullable=True)      # เก็บจากเจ้าของโดยตรงไหม
    source_indirect = Column(Boolean, nullable=True)    # เก็บจากแหล่งอื่นไหม
    legal_basis = Column(Text, nullable=True)           # ฐานทางกฎหมาย
    minor_under10 = Column(Boolean, nullable=True)      # มีข้อมูลเด็กอายุต่ำกว่า 10 ปีไหม
    minor_10to20 = Column(Boolean, nullable=True)       # มีข้อมูลเด็ก 10-20 ปีไหม

    # ── การโอนข้อมูลต่างประเทศ ──
    transfer_is_transfer = Column(Boolean, nullable=True)       # ส่งต่างประเทศไหม
    transfer_country = Column(String, nullable=True)            # ประเทศปลายทาง
    transfer_company_name = Column(String, nullable=True)       # ชื่อบริษัทปลายทาง
    transfer_method = Column(String, nullable=True)             # วิธีโอน
    transfer_protection_std = Column(String, nullable=True)     # มาตรฐานคุ้มครอง
    transfer_exception = Column(Text, nullable=True)            # ข้อยกเว้น

    # ── การจัดเก็บ ──
    retention_storage_type = Column(String, nullable=True)      # ประเภทการจัดเก็บ
    retention_method = Column(Text, nullable=True)              # วิธีเก็บรักษา
    retention_duration = Column(Integer, nullable=True)         # ระยะเวลาเก็บ (ตัวเลข)
    retention_access_control = Column(Text, nullable=True)      # การควบคุมการเข้าถึง
    retention_deletion_method = Column(Text, nullable=True)     # วิธีลบทำลาย

    # ── อื่นๆ ──
    exemption_disclosure = Column(Text, nullable=True)  # การยกเว้นการเปิดเผย
    rejection_note = Column(Text, nullable=True)        # หมายเหตุเมื่อถูกปฏิเสธ

    # ── มาตรการรักษาความปลอดภัย (TOMs) ──
    security_organizational = Column(Text, nullable=True)   # มาตรการเชิงองค์กร
    security_technical = Column(Text, nullable=True)        # มาตรการเชิงเทคนิค
    security_physical = Column(Text, nullable=True)         # มาตรการทางกายภาพ
    security_access_control = Column(Text, nullable=True)   # การควบคุมการเข้าถึง
    security_responsibility = Column(Text, nullable=True)   # การกำหนดหน้าที่รับผิดชอบ
    security_audit = Column(Text, nullable=True)            # มาตรการตรวจสอบย้อนหลัง

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    document = relationship("RopaDocument", back_populates="owner_record")
    # เชื่อมกลับไปหาเอกสารหลัก


class ProcessorRecord(Base):
    # ส่วนที่ Data Processor กรอก — 1 record ต่อ 1 Processor ที่ถูก assign
    __tablename__ = 'processor_records'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # UUID หลักของ record นี้ — ใช้ใน URL เช่น /assignments/{id}

    ropa_doc_id = Column(UUID(as_uuid=True), ForeignKey('ropa_documents.id', ondelete='CASCADE'), nullable=False)
    # FK → เอกสารหลักที่ record นี้เป็นส่วนหนึ่ง

    assigned_to = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    # FK → User ที่ถูก assign ให้กรอก (Data Processor)
    # ondelete='SET NULL' = ถ้าลบ user → ไม่ลบ record แค่เปลี่ยนเป็น null

    # ── สถานะและ tracking ──
    processor_status = Column(Enum(ProcessorStatus), nullable=False, default=ProcessorStatus.PENDING)
    # สถานะปัจจุบัน: PENDING → IN_PROGRESS → CONFIRMED → SUBMITTED
    # หรือ NEEDS_REVISION ถ้า Auditor ส่งกลับ

    draft_code = Column(String, nullable=True, unique=True)
    # รหัสฉบับร่าง เช่น "DFT-5525" — สร้างครั้งแรกที่กด "บันทึกฉบับร่าง"
    # nullable=True = null จนกว่าจะกด save draft ครั้งแรก
    # unique=True = ห้ามซ้ำกัน

    confirmed_at = Column(DateTime, nullable=True)
    # วันเวลาที่กด "ยืนยันข้อมูล RoPA" — null ถ้ายังไม่ได้กด

    sent_to_owner_at = Column(DateTime, nullable=True)
    # วันเวลาที่กด "ส่ง RoPA ให้ผู้รับผิดชอบข้อมูล" — null ถ้ายังไม่ส่ง

    submitted_at = Column(DateTime, nullable=True)
    # วันเวลาที่ส่งแบบฟอร์ม (ยื่นยัน/ส่งต่อ) — ใช้เพื่อความเข้ากันได้กับ main

    # ── Section 1: รายละเอียดของผู้บันทึก RoPA ──
    title_prefix = Column(String, nullable=True)        # คำนำหน้า เช่น นาย/นาง/นางสาว
    first_name = Column(String, nullable=True)          # ชื่อจริง
    last_name = Column(String, nullable=True)           # นามสกุล
    address = Column(Text, nullable=True)               # ที่อยู่สำนักงาน/หน่วยงาน
    email = Column(String, nullable=True)               # อีเมล
    phone = Column(String, nullable=True)               # เบอร์โทรศัพท์

    # ── Section 2: รายละเอียดกิจกรรม ──
    processor_name = Column(String, nullable=True)          # ชื่อผู้ประมวลผลข้อมูลส่วนบุคคล
    data_controller_address = Column(Text, nullable=True)   # ที่อยู่ผู้ควบคุมข้อมูลส่วนบุคคล
    processing_activity = Column(String, nullable=True)     # กิจกรรมประมวลผล
    purpose = Column(Text, nullable=True)                   # วัตถุประสงค์ของการประมวลผล

    # ── Section 3: ข้อมูลที่จัดเก็บ ──
    personal_data = Column(Text, nullable=True)
    # เก็บเป็น JSON string เช่น '["ชื่อ-นามสกุล", "เบอร์โทร"]'
    # (multi-select dropdown ในฟอร์ม สามารถเลือกได้มากกว่า 1)

    data_category = Column(Text, nullable=True)
    # เก็บเป็น JSON string เช่น '["ลูกค้า", "พนักงาน"]'
    # (checkboxes ในฟอร์ม: ลูกค้า/คู่ค้า/ผู้ติดต่อ/พนักงาน)

    data_type = Column(String, nullable=True)
    # ประเภทข้อมูล: "general" (ทั่วไป) หรือ "sensitive" (อ่อนไหว)
    # (radio button ในฟอร์ม)

    # ── Section 4: การได้มาและการเก็บรักษา ──
    collection_method = Column(String, nullable=True)
    # วิธีได้มาซึ่งข้อมูล: "electronic" หรือ "document"
    # (radio button ในฟอร์ม)

    data_source = Column(String, nullable=True)
    # แหล่งที่ได้ข้อมูล: "from_owner" (จากเจ้าของโดยตรง) หรือ "from_other"
    # (radio button ในฟอร์ม)

    retention_storage_type = Column(Text, nullable=True)
    # ประเภทการจัดเก็บ เก็บเป็น JSON string เช่น '["electronic", "document"]'
    # (checkboxes ในฟอร์ม)

    retention_method = Column(Text, nullable=True)
    # วิธีเก็บรักษา เก็บเป็น JSON string (multi-select dropdown)

    retention_duration = Column(String, nullable=True)
    # ระยะเวลาเก็บรักษา เช่น "5" (ตัวเลขเป็น string)

    retention_duration_unit = Column(String, nullable=True)
    # หน่วยระยะเวลา: "year" (ปี) หรือ "month" (เดือน)

    retention_access_condition = Column(Text, nullable=True)
    # สิทธิและวิธีการเข้าถึงข้อมูลส่วนบุคคล

    retention_deletion_method = Column(Text, nullable=True)
    # วิธีการลบหรือทำลายข้อมูลเมื่อสิ้นสุดระยะเวลาจัดเก็บ

    # ── Section 5: ฐานทางกฎหมายและการส่งต่อ ──
    legal_basis = Column(Text, nullable=True)
    # ฐานในการประมวลผล เช่น "ฐานปฏิบัติตามสัญญา"

    transfer_is_transfer = Column(Boolean, nullable=True)
    # ส่งหรือโอนข้อมูลไปต่างประเทศไหม (มี/ไม่มี)

    transfer_country = Column(String, nullable=True)
    # ประเทศปลายทาง เช่น "จีน" (แสดงเฉพาะเมื่อ transfer_is_transfer = true)

    transfer_is_in_group = Column(Boolean, nullable=True)
    # ส่งไปยังบริษัทในกลุ่มเครือไหม

    transfer_company_name = Column(String, nullable=True)
    # ชื่อบริษัทปลายทาง (ถ้าเป็นในกลุ่มเครือ)

    transfer_method = Column(String, nullable=True)
    # วิธีการโอนข้อมูล เช่น "โอนทางอิเล็กทรอนิกส์"

    transfer_protection_std = Column(String, nullable=True)
    # มาตรฐานการคุ้มครองข้อมูลของประเทศปลายทาง

    transfer_exception = Column(Text, nullable=True)
    # ข้อยกเว้นตามมาตรา 28

    # ── Section 6: มาตรการรักษาความมั่นคงปลอดภัย (TOMs) ──
    security_organizational = Column(Text, nullable=True)   # มาตรการเชิงองค์กร
    security_access_control = Column(Text, nullable=True)   # การควบคุมการเข้าถึงข้อมูล
    security_technical = Column(Text, nullable=True)        # มาตรการเชิงเทคนิค
    security_responsibility = Column(Text, nullable=True)   # การกำหนดหน้าที่ความรับผิดชอบของผู้ใช้งาน
    security_physical = Column(Text, nullable=True)         # มาตรการทางกายภาพ
    security_audit = Column(Text, nullable=True)            # มาตรการตรวจสอบย้อนหลัง

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    # วันเวลาที่ Data Owner assign งานมาให้ (สร้าง record นี้)

    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)
    # วันเวลาที่บันทึกล่าสุด — auto-update ทุกครั้งที่ save

    document = relationship("RopaDocument", back_populates="processor_records")
    # เชื่อมกลับหาเอกสารหลัก → ใช้ดึง title, doc_code, owner

    assignee = relationship("User", foreign_keys=[assigned_to])
    # เชื่อมหา User ที่ถูก assign → ใช้ดึงชื่อ Data Processor


class AuditorAudit(Base):
    # บันทึกการตรวจของ Auditor — 1 record ต่อการตรวจ 1 ครั้ง
    __tablename__ = 'auditor_audits'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    ropa_doc_id = Column(UUID(as_uuid=True), ForeignKey('ropa_documents.id', ondelete='CASCADE'), nullable=False)
    # FK → เอกสารที่ถูกตรวจ

    assigned_auditor_id = Column(UUID(as_uuid=True), ForeignKey('auditor_profiles.id', ondelete='CASCADE'), nullable=False)
    # FK → AuditorProfile (ไม่ใช่ users.id โดยตรง ต้อง join ผ่าน AuditorProfile)

    status = Column(Enum(DocumentStatus), nullable=True)
    # สถานะเดิม (ของ codebase เก่า) — เก็บไว้เพื่อ backward compatibility

    audit_status = Column(Enum(AuditStatus), nullable=True)
    # สถานะการตรวจใหม่: PENDING_REVIEW / APPROVED / NEEDS_REVISION
    # ใช้แสดงใน sidebar 2 (อนุมัติ/รอตรวจสอบ/ต้องแก้ไข)

    feedback_comment = Column(Text, nullable=True)
    # comment รวมของ Auditor (เดิม) — เก็บไว้เพื่อ backward compatibility

    processor_feedback = Column(Text, nullable=True)
    # comment แยกตามส่วน สำหรับ Data Processor โดยเฉพาะ
    # เก็บเป็น JSON string เช่น:
    # '{"section_5": "กรุณายืนยัน SCCs...", "section_6": "ระบุ encryption..."}'
    # ใช้แสดงใน sidebar 3 (ข้อเสนอแนะ)

    version = Column(Integer, nullable=True)
    # เวอร์ชันของการตรวจ (เพิ่มขึ้นทุกรอบที่ส่งแก้ไข)

    approved_at = Column(DateTime, nullable=True)
    # วันเวลาที่ Auditor อนุมัติ

    request_change_at = Column(DateTime, nullable=True)
    # วันเวลาที่ Auditor ส่ง feedback กลับ — ใช้เป็น "วันที่ส่ง" ใน sidebar 3

    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=True)
    # วันเวลาที่แก้ไขล่าสุด — ใช้เป็น "วันที่แก้ไขล่าสุด" ใน feedback detail

    document = relationship("RopaDocument", back_populates="audits")
    # เชื่อมหาเอกสารหลัก → ใช้ดึง title, doc_code

    auditor = relationship("AuditorProfile", back_populates="audits")
    # เชื่อมหา AuditorProfile → ใช้ดึงชื่อ Auditor (AuditorProfile → User)

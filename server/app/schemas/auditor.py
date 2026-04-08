from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from uuid import UUID


# ── Shared ──

class SectionFeedback(BaseModel):
    # 1 card ข้อเสนอแนะ = ระบุส่วนที่ต้องแก้ + ข้อความ
    section: str          # "section_1" ... "section_6"
    section_label: str    # "ส่วนที่ 1 : รายละเอียดของผู้บันทึก RoPA"
    comment: str          # เนื้อหาข้อเสนอแนะ


class SubmitFeedbackRequest(BaseModel):
    form_type: str                          # "owner" หรือ "processor"
    feedbacks: List[SectionFeedback] = []   # [] = อนุมัติ, มีข้อมูล = ตีกลับ
    expires_at: Optional[datetime] = None   # required เมื่อ feedbacks=[] (approve)


class SubmitFeedbackResponse(BaseModel):
    message: str
    ropa_doc_id: UUID
    action: str    # "approved" | "needs_revision"


# ── Sidebar 1: Dashboard ──

class MonthlyTrend(BaseModel):
    month: int        # 1-12
    this_year: int    # จำนวนเอกสารปีนี้
    last_year: int    # จำนวนเอกสารปีที่แล้ว


class DashboardResponse(BaseModel):
    total_documents: int    # เอกสารทั้งหมด (filter ตาม time_range)
    pending_review: int     # รอตรวจสอบ (filter ตาม time_range)
    monthly_trend: List[MonthlyTrend]   # กราฟ (ทั้งปี ไม่ filter)


# ── Sidebar 2: เอกสาร ──

class DocumentStats(BaseModel):
    pending_feedback: int    # รายการที่รอตอบกลับ (ยังไม่ได้กรอก feedback)


class DocumentListItem(BaseModel):
    ropa_doc_id: UUID
    doc_code: Optional[str]
    title: str
    form_type: str      # "owner" | "processor"
    form_label: str     # "ผู้รับผิดชอบข้อมูล" | "ผู้ประมวลผลข้อมูลส่วนบุคคล"
    received_at: Optional[datetime]   # วันที่ Data Owner ส่งมา
    sent_at: Optional[datetime]       # วันที่ Auditor ส่ง feedback
    action: str           # "fill" (กรอกข้อเสนอแนะ) | "view" (ดูข้อเสนอแนะ)
    review_status: str    # "pending_review" | "approved" | "needs_revision"


class DocumentListResponse(BaseModel):
    stats: DocumentStats
    records: List[DocumentListItem]
    total: int
    page: int
    page_size: int


# ── Form View (ดูฟอร์ม 6 ส่วน) ──

class FormResponse(BaseModel):
    ropa_doc_id: UUID
    doc_code: Optional[str]
    title: str
    last_modified: Optional[datetime]   # updated_at ของ owner_record หรือ processor_record
    auditor_name: Optional[str]         # ชื่อ Auditor ที่ตรวจเอกสารนี้
    form_type: str      # "owner" | "processor"
    form_label: str     # ชื่อแสดง
    review_status: str  # สถานะการตรวจฟอร์มนี้
    form_data: dict     # ข้อมูลฟอร์ม 6 ส่วน (ทุก field)
    feedbacks: List[SectionFeedback] = []   # feedback ที่เคยส่งไว้ (ถ้ามี)


# ── Sidebar 3: เอกสารครบกำหนด ──

class ExpiredDocStats(BaseModel):
    expired_count: int    # รายการที่ครบกำหนด (ยังไม่ลบ)
    deleted_count: int    # รายการที่ดำเนินการลบเสร็จสิ้น


class ExpiredDocItem(BaseModel):
    ropa_doc_id: UUID
    doc_code: Optional[str]
    title: str
    expires_at: Optional[datetime]   # วันครบกำหนด


class ExpiredDocListResponse(BaseModel):
    stats: ExpiredDocStats
    records: List[ExpiredDocItem]
    total: int
    page: int
    page_size: int

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
import calendar
from datetime import datetime, timezone
from sqlalchemy import func

from app.database import get_db
from app.models.user import User, UserRoleEnum
from app.models.enums import UserStatus
from app.models.document import RopaDocument, DocumentStatus, ProcessorRecord
from app.schemas.user import UserResponse
from app.schemas.document import DocumentResponse
from app.schemas.admin import (
    AdminDashboardStats, UsersCount, UserRoleStat, TrendInfo, 
    DocumentsStats, DocumentStatusChart, ChartData,
    AdminCreateUserRequest, AdminUserListResponse, AdminDocumentsResponse,
    AdminDocumentsSummary, DocumentSummaryStat, AdminDocumentListItem,
    WorkTrackingRoleCard, WorkTrackingRoleSummary, WorkTrackingListItem, WorkTrackingSummaryResponse,
    AdminUsersPageResponse
)
from app.core.security import get_password_hash
from app.api.deps import RoleChecker

router = APIRouter()

@router.get("/dashboard", response_model=AdminDashboardStats)
def get_admin_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["Admin"]))
):
    # 1. User Counts & Base Stats
    owners = db.query(func.count(User.id)).filter(User.role == UserRoleEnum.DATA_OWNER).scalar() or 0
    processors = db.query(func.count(User.id)).filter(User.role == UserRoleEnum.DATA_PROCESSOR).scalar() or 0
    auditors = db.query(func.count(User.id)).filter(User.role == UserRoleEnum.AUDITOR).scalar() or 0
    
    # 2. Time-Based Trends Helper
    now = datetime.now(timezone.utc)
    current_month_start = datetime(now.year, now.month, 1, tzinfo=timezone.utc)
        
    def get_role_trend(role: UserRoleEnum):
        added_this_month = db.query(func.count(User.id)).filter(
            User.role == role,
            User.created_at >= current_month_start
        ).scalar() or 0
        if added_this_month > 0:
            return TrendInfo(direction="up", value=f"+{added_this_month}", text_label="เดือนนี้")
        return TrendInfo(direction="neutral", value="", text_label="ไม่มีการเปลี่ยนแปลง")

    owner_trend = get_role_trend(UserRoleEnum.DATA_OWNER)
    processor_trend = get_role_trend(UserRoleEnum.DATA_PROCESSOR)
    auditor_trend = get_role_trend(UserRoleEnum.AUDITOR)
    
    # 3. Document Status Charts
    from datetime import timedelta
    days_since_monday = now.weekday()
    this_week_start = now.replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=days_since_monday)
    
    def get_chart_data(start_date=None):
        query = db.query(RopaDocument.status, func.count(RopaDocument.id)).group_by(RopaDocument.status)
        if start_date:
            query = query.filter(RopaDocument.created_at >= start_date)
        
        counts_dict = dict(query.all())
        
        return ChartData(
            draft=counts_dict.get(DocumentStatus.DRAFT, 0),
            in_progress=counts_dict.get(DocumentStatus.PENDING_PROCESSOR, 0) + counts_dict.get(DocumentStatus.PENDING_AUDITOR, 0),
            completed=counts_dict.get(DocumentStatus.APPROVED, 0),
            rejected=counts_dict.get(DocumentStatus.REJECTED_OWNER, 0) + counts_dict.get(DocumentStatus.REJECTED_PROCESSOR, 0)
        )

    this_week_data = get_chart_data(this_week_start)
    this_month_data = get_chart_data(current_month_start)
    all_time_data = get_chart_data()
    
    total_docs = all_time_data.draft + all_time_data.in_progress + all_time_data.completed + all_time_data.rejected

    # 4. Total Documents Trends Calculation
    current_month_docs = db.query(func.count(RopaDocument.id)).filter(RopaDocument.created_at >= current_month_start).scalar() or 0
    total_docs_now = all_time_data.draft + all_time_data.in_progress + all_time_data.completed + all_time_data.rejected
    docs_before_this_month = total_docs_now - current_month_docs
    
    if docs_before_this_month == 0:
        percentage = 100 if current_month_docs > 0 else 0
        direction = "up" if current_month_docs > 0 else "neutral"
    else:
        percentage = int((current_month_docs / docs_before_this_month) * 100)
        direction = "up" if current_month_docs > 0 else "neutral"
        
    doc_val_str = f"+{percentage}%" if percentage > 0 else (f"{percentage}%" if percentage < 0 else "0%")
    doc_direction_override = direction if percentage != 0 else "neutral"
        
    return AdminDashboardStats(
        users=UsersCount(
            data_owners=UserRoleStat(count=owners, trends=owner_trend),
            data_processors=UserRoleStat(count=processors, trends=processor_trend),
            auditors=UserRoleStat(count=auditors, trends=auditor_trend)
        ),
        documents=DocumentsStats(
            total=total_docs,
            trends=TrendInfo(
                direction=doc_direction_override,
                value=doc_val_str,
                text_label="จากเดือนก่อน" if doc_direction_override != "neutral" else "ไม่มีการเปลี่ยนแปลง"
            )
        ),
        document_status_chart=DocumentStatusChart(
            this_week=this_week_data,
            this_month=this_month_data,
            all_time=all_time_data
        )
    )

@router.get("/users", response_model=AdminUsersPageResponse)
def get_user_management_list(
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["Admin"]))
):
    users = db.query(User).all()
    user_list = []
    active_count = 0
    for u in users:
        if u.status == UserStatus.ACTIVE:
            active_count += 1
        user_list.append(AdminUserListResponse(
            id=str(u.id),
            first_name=u.first_name,
            last_name=u.last_name,
            email=u.email,
            role=u.role,
            status=u.status
        ))
        
    now = datetime.now(timezone.utc)
    current_month_start = datetime(now.year, now.month, 1, tzinfo=timezone.utc)
    current_month_users = db.query(func.count(User.id)).filter(User.created_at >= current_month_start).scalar() or 0
    total_users_now = len(users)
    users_before_this_month = total_users_now - current_month_users
    
    if users_before_this_month <= 0:
        percentage = 100 if current_month_users > 0 else 0
        direction = "up" if current_month_users > 0 else "neutral"
        value_str = f"+{percentage}%" if percentage > 0 else f"{percentage}%"
    else:
        percentage = int((current_month_users / users_before_this_month) * 100)
        direction = "up" if current_month_users > 0 else "neutral"
        value_str = f"+{percentage}%" if percentage > 0 else "0%"

    trend_info = TrendInfo(direction=direction, value=value_str, text_label="จากเดือนที่แล้ว")
        
    return AdminUsersPageResponse(
        total_users=len(users),
        total_users_trend=trend_info,
        active_users=active_count,
        users_list=user_list
    )

@router.delete("/users/{user_id}")
def delete_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["Admin"]))
):
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    db.delete(target_user)
    db.commit()
    return {"message": f"Successfully deleted user {target_user.email}"}

@router.get("/users/{user_id}/dashboard", response_model=List[DocumentResponse])
def get_user_dashboard(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["Admin"]))
):
    """Admin inspects what a specific user sees on their personal dashboard."""
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    role_val = target_user.role
    if role_val == UserRoleEnum.DATA_OWNER:
        return db.query(RopaDocument).filter(RopaDocument.owner_id == target_user.id).all()
    elif role_val == UserRoleEnum.DATA_PROCESSOR:
        # Use relationship to find documents through ProcessorRecord
        return db.query(RopaDocument).join(ProcessorRecord).filter(ProcessorRecord.assigned_to == target_user.id).all()
    elif role_val == UserRoleEnum.AUDITOR:
        return db.query(RopaDocument).filter(
            RopaDocument.status.in_([
                DocumentStatus.PENDING_AUDITOR, 
                DocumentStatus.APPROVED
            ])
        ).all()
    else:
        return []

@router.post("/members", response_model=UserResponse)
def create_member(
    request: AdminCreateUserRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["Admin"]))
):
    if db.query(User).filter(User.username == request.username).first():
        raise HTTPException(status_code=400, detail="Username already registered")
    if db.query(User).filter(User.email == request.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    if db.query(User).filter(User.first_name == request.first_name, User.last_name == request.last_name).first():
        raise HTTPException(status_code=400, detail="User with this exact first and last name already exists")
        
    new_user = User(
        username=request.username,
        first_name=request.first_name,
        last_name=request.last_name,
        email=request.email,
        password_hash=get_password_hash(request.password),
        role=request.role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.put("/users/{user_id}/role")
def assign_role_to_user(
    user_id: UUID,
    role: Optional[UserRoleEnum] = Query(None, description="เลือกบทบาทที่จะกำหนดให้ผู้ใช้ หรือปล่อยว่าง (None) เพื่อปลดสิทธิ์"),
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["Admin"]))
):
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    target_user.role = role
    db.commit()
    return {"message": f"Successfully assigned role {role.value if role else 'None'} to user {target_user.email}"}

@router.get("/documents", response_model=AdminDocumentsResponse)
def get_admin_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["Admin"]))
):
    docs = db.query(RopaDocument).all()
    
    now = datetime.now(timezone.utc)
    current_month_start = datetime(now.year, now.month, 1, tzinfo=timezone.utc)
    
    total_count = len(docs)
    pending_count = sum(1 for d in docs if d.status == DocumentStatus.PENDING_AUDITOR)
    
    current_month_docs = sum(1 for d in docs if d.created_at.replace(tzinfo=timezone.utc) >= current_month_start)
    # Simplified trend logic for brevity
    trend_str = "ไม่มีการเปลี่ยนแปลง" if current_month_docs == 0 else f"+{current_month_docs} เดือนนี้"
    
    summary = AdminDocumentsSummary(
        total_documents=DocumentSummaryStat(count=total_count, trend=trend_str),
        pending_audit=DocumentSummaryStat(count=pending_count, trend="ไม่มีการเปลี่ยนแปลง")
    )
    
    doc_list = []
    for doc in docs:
        dtype = None
        if hasattr(doc, 'owner_record') and doc.owner_record and doc.owner_record.data_category:
            dtype = doc.owner_record.data_category
             
        base_percent = 25
        th_status = "กำลังกรอกข้อมูล"
        
        if doc.status == DocumentStatus.APPROVED:
            base_percent = 100
            th_status = "เสร็จสมบูรณ์"
        elif doc.status == DocumentStatus.PENDING_AUDITOR:
            base_percent = 50
            th_status = "รอการตรวจสอบ"
        elif doc.status in [DocumentStatus.REJECTED_OWNER, DocumentStatus.REJECTED_PROCESSOR]:
            base_percent = 75
            th_status = "รอการแก้ไข"
        
        doc_list.append(AdminDocumentListItem(
            id=doc.id,
            title=doc.title,
            data_type=dtype or "ข้อมูลทั่วไป",
            company=f"{doc.owner.first_name} {doc.owner.last_name}" if doc.owner else "Unknown",
            completeness_percent=base_percent,
            status=th_status
        ))
        
    return AdminDocumentsResponse(summary=summary, documents_list=doc_list)

@router.get("/work-tracking/summary", response_model=WorkTrackingSummaryResponse)
def get_work_tracking_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["Admin"]))
):
    docs = db.query(RopaDocument).all()
    total_docs = len(docs)
    
    owner_count = sum(1 for d in docs if d.status in [DocumentStatus.DRAFT, DocumentStatus.REJECTED_OWNER])
    processor_count = sum(1 for d in docs if d.status in [DocumentStatus.PENDING_PROCESSOR, DocumentStatus.REJECTED_PROCESSOR])
    auditor_count = sum(1 for d in docs if d.status == DocumentStatus.PENDING_AUDITOR)
    
    role_summary = WorkTrackingRoleSummary(
        data_owner=WorkTrackingRoleCard(
            count=owner_count,
            progress_percent=int((owner_count / total_docs) * 100) if total_docs > 0 else 0
        ),
        data_processor=WorkTrackingRoleCard(
            count=processor_count,
            progress_percent=int((processor_count / total_docs) * 100) if total_docs > 0 else 0
        ),
        auditor=WorkTrackingRoleCard(
            count=auditor_count,
            progress_percent=int((auditor_count / total_docs) * 100) if total_docs > 0 else 0
        )
    )
    
    tracking_list = []
    
    for doc in docs:
        resp_person = "ไม่ทราบชื่อ"
        display_title = doc.title
        auditor_name = "ยังไม่มีผู้ตรวจสอบ"
        
        if hasattr(doc, 'audits') and doc.audits and len(doc.audits) > 0:
            aud = doc.audits[-1]
            if aud.auditor and aud.auditor.user:
                auditor_name = f"{aud.auditor.user.first_name} {aud.auditor.user.last_name}"
                
        if doc.status in [DocumentStatus.DRAFT, DocumentStatus.REJECTED_OWNER, DocumentStatus.APPROVED, DocumentStatus.PENDING_AUDITOR]:
            if doc.owner:
                resp_person = f"{doc.owner.first_name} {doc.owner.last_name}"
        elif doc.status in [DocumentStatus.PENDING_PROCESSOR, DocumentStatus.REJECTED_PROCESSOR]:
            if hasattr(doc, 'processor_records') and doc.processor_records:
                proc_rec = doc.processor_records[-1]
                if proc_rec.first_name and proc_rec.last_name:
                    resp_person = f"{proc_rec.first_name} {proc_rec.last_name}"
                elif proc_rec.assignee:
                    resp_person = f"{proc_rec.assignee.first_name} {proc_rec.assignee.last_name}"
                    
        update_time = doc.created_at
        formatted_date = update_time.strftime("%d/%m/%Y, %H:%M") if update_time else ""
        
        tracking_list.append(WorkTrackingListItem(
            id=doc.id,
            title=display_title,
            responsible_person=resp_person,
            auditor_name=auditor_name,
            last_updated=formatted_date,
            status=doc.status
        ))
        
    return WorkTrackingSummaryResponse(role_summary=role_summary, tracking_list=tracking_list)

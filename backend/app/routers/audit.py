from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.audit_log import AuditLog
from app.models.user import UserRole
from app.routers.auth_deps import require_role
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(
    prefix="/audit",
    tags=["audit"],
    dependencies=[Depends(require_role([UserRole.HR_ADMIN]))]
)

class AuditLogResponse(BaseModel):
    id: int
    action: str
    entity_type: str
    entity_id: Optional[int]
    user_id: Optional[int]
    user_role: Optional[str]
    details: dict
    ai_recommended: bool
    timestamp: datetime

    class Config:
        from_attributes = True

@router.get("", response_model=List[AuditLogResponse])
def get_audit_logs(
    entity_type: Optional[str] = None,
    action: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Get all audit logs with optional filtering. Restricted to admins.
    """
    query = db.query(AuditLog)
    
    if entity_type:
        query = query.filter(AuditLog.entity_type == entity_type)
    if action:
        query = query.filter(AuditLog.action == action)
        
    return query.order_by(AuditLog.timestamp.desc()).all()

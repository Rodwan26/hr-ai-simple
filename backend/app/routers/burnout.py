from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List, Optional, Any
from datetime import date, datetime
from pydantic import BaseModel

from app.database import get_db
from app.models.performance_metric import PerformanceMetric
from app.models.burnout_assessment import BurnoutAssessment
from app.services.burnout_ai import calculate_burnout_risk, generate_performance_summary

from app.models.employee import Employee
from app.models.user import User, UserRole
from app.routers.auth_deps import require_role, get_current_user, get_current_org
from app.services.audit import AuditService
from app.services.ai_trust_service import AITrustService
from app.schemas.trust import TrustedAIResponse
from app.core.limiter import limiter


# Pydantic schemas
class MetricCreate(BaseModel):
    employee_id: int
    metric_type: str
    value: float
    date: date


router = APIRouter(
    prefix="/burnout",
    tags=["burnout"],
    dependencies=[Depends(require_role([UserRole.HR_ADMIN, UserRole.HR_STAFF]))]
)

# ... (schemas remain same)

@router.post("/track-metric")
def track_metric(
    metric: MetricCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user),
    org_id: int = Depends(get_current_org)
):
    # Security Check
    employee = db.query(Employee).filter(
        Employee.id == metric.employee_id,
        Employee.organization_id == org_id
    ).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    db_metric = PerformanceMetric(
        employee_id=metric.employee_id,
        metric_type=metric.metric_type,
        value=metric.value,
        date=metric.date,
        organization_id=org_id
    )
    db.add(db_metric)
    db.commit()
    db.refresh(db_metric)
    return db_metric

@router.get("/metrics/{employee_id}")
def get_metrics(
    employee_id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user),
    org_id: int = Depends(get_current_org)
):
    employee = db.query(Employee).filter(
        Employee.id == employee_id,
        Employee.organization_id == org_id
    ).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    return db.query(PerformanceMetric).filter(
        PerformanceMetric.employee_id == employee_id,
        PerformanceMetric.organization_id == org_id
    ).order_by(PerformanceMetric.date.desc()).all()


@router.post("/analyze/{employee_id}", response_model=TrustedAIResponse)
@limiter.limit("5/minute")
def analyze_burnout(
    request: Request,
    employee_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    org_id: int = Depends(get_current_org)
):
    employee = db.query(Employee).filter(
        Employee.id == employee_id,
        Employee.organization_id == org_id
    ).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    result = calculate_burnout_risk(employee_id, db)
    
    # Save assessment
    assessment = BurnoutAssessment(
        employee_id=employee_id,
        risk_level=result.get("support_priority", "low"),
        indicators=result.get("indicators", []),
        recommendations=result.get("recommendations", []),
        ai_analysis=result.get("analysis", ""),
        organization_id=org_id
    )
    db.add(assessment)
    db.commit()
    db.refresh(assessment)
    
    # Prepare details using the result
    details_data = {
        "assessment_id": assessment.id,
        "risk_level": assessment.risk_level,
        "indicators": assessment.indicators,
        "recommendations": assessment.recommendations,
        "analysis": assessment.ai_analysis
    }

    trust_service = AITrustService(db, org_id, current_user.id, current_user.role)
    return trust_service.wrap_and_log(
        content=assessment.ai_analysis,
        action_type="analyze_burnout_risk",
        entity_type="burnout_assessment",
        entity_id=assessment.id,
        confidence_score=result.get("trust_metadata", {}).get("confidence_score", 0.9),
        model_name="Wellbeing-GPT-4",
        requires_human_confirmation=True,
        details={"risk_level": assessment.risk_level},
        data=details_data
    )

@router.get("/assessments/{employee_id}")
def get_assessments(
    employee_id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user),
    org_id: int = Depends(get_current_org)
):
    employee = db.query(Employee).filter(
        Employee.id == employee_id,
        Employee.organization_id == org_id
    ).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    return db.query(BurnoutAssessment).filter(
        BurnoutAssessment.employee_id == employee_id,
        BurnoutAssessment.organization_id == org_id
    ).order_by(BurnoutAssessment.assessed_at.desc()).all()


@router.get("/dashboard/{employee_id}")
def get_dashboard(
    employee_id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user),
    org_id: int = Depends(get_current_org)
):
    employee = db.query(Employee).filter(
        Employee.id == employee_id,
        Employee.organization_id == org_id
    ).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    latest_assessment = db.query(BurnoutAssessment).filter(
        BurnoutAssessment.employee_id == employee_id,
        BurnoutAssessment.organization_id == org_id
    ).order_by(BurnoutAssessment.assessed_at.desc()).first()
    
    metrics = db.query(PerformanceMetric).filter(
        PerformanceMetric.employee_id == employee_id,
        PerformanceMetric.organization_id == org_id
    ).order_by(PerformanceMetric.date.desc()).limit(30).all()
    
    return {
        "assessment": latest_assessment,
        "metrics": metrics
    }

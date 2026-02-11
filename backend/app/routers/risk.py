from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app.models.employee import Employee
from app.models.activity import Activity
from app.models.activity import Activity
from app.services.risk_ai import analyze_wellbeing_support, analyze_friction_indicators
from app.services.audit import AuditService
from app.services.ai_trust_service import AITrustService
from app.schemas.trust import TrustedAIResponse
from app.models.user import UserRole
from app.routers.auth_deps import get_current_user, require_role, get_current_org

router = APIRouter(
    prefix="/risk", 
    tags=["risk"],
    dependencies=[Depends(require_role([UserRole.HR_ADMIN, UserRole.HR_STAFF]))]
)

# ... (schemas remain same)

@router.post("/analyze/{employee_id}", response_model=TrustedAIResponse)
def analyze_employee_risk(
    employee_id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user),
    org_id: int = Depends(get_current_org)
):
    """
    Analyze an employee's activities for potential risks.
    """
    # Security Check
    employee = db.query(Employee).filter(
        Employee.id == employee_id,
        Employee.organization_id == org_id
    ).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    try:
        result = analyze_wellbeing_support(employee_id, db)
        
        trust_service = AITrustService(db, org_id, current_user.id, current_user.role)
        return trust_service.wrap_and_log(
            content=result.get("details", "Analysis completed."),
            action_type="analyze_employee_risk",
            entity_type="risk_assessment",
            entity_id=employee_id,
            confidence_score=result.get("trust_metadata", {}).get("confidence_score", 0.9),
            model_name="Wellbeing-GPT-4",
            requires_human_confirmation=True,
            details={},
            data=result
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")

@router.post("/check-text", response_model=TrustedAIResponse)
def check_text_toxicity(
    request: ToxicityCheckRequest, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    org_id: int = Depends(get_current_org)
):
    """
    Check if text contains toxic language.
    """
    try:
        result = analyze_friction_indicators(request.text)
        
        trust_service = AITrustService(db, org_id, current_user.id, current_user.role)
        return trust_service.wrap_and_log(
            content=result.get("explanation", ""),
            action_type="check_text_friction",
            entity_type="text_check",
            confidence_score=result.get("trust_metadata", {}).get("confidence_score", 0.88),
            model_name="Friction-Sentry-v1",
            details={},
            data=result
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")

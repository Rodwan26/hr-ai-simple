from sqlalchemy.orm import Session
from app.models.leave_request import LeaveRequest, LeaveStatus

def detect_conflicts(db: Session, employee_id: int, start_date, end_date) -> bool:
    """
    Check if the employee has any APPROVED leave that overlaps with the requested dates.
    Overlap logic: (StartA <= EndB) and (EndA >= StartB)
    """
    conflicts = db.query(LeaveRequest).filter(
        LeaveRequest.employee_id == employee_id,
        LeaveRequest.status == LeaveStatus.APPROVED,
        LeaveRequest.end_date >= start_date,
        LeaveRequest.start_date <= end_date
    ).first()
    return conflicts is not None

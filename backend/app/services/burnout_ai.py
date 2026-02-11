from app.services.wellbeing_service import WellbeingService
from sqlalchemy.orm import Session

def analyze_work_patterns(employee_id: int, db: Session) -> dict:
    service = WellbeingService(db)
    return service.analyze_patterns(employee_id)

def calculate_burnout_risk(employee_id: int, db: Session) -> dict:
    service = WellbeingService(db)
    return service.calculate_risk(employee_id)

def check_friction(text: str) -> dict:
    service = WellbeingService()
    return service.check_friction(text)

def generate_performance_summary(employee_id: int, db: Session) -> str:
    # Legacy performance summary
    from app.services.ai_orchestrator import AIOrchestrator, AIDomain
    from app.models.employee import Employee
    from app.models.performance_metric import PerformanceMetric
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    metrics = db.query(PerformanceMetric).filter(PerformanceMetric.employee_id == employee_id).limit(20).all()
    metrics_str = "\n".join([f"{m.date}: {m.metric_type}={m.value}" for m in metrics])
    messages = [
        {"role": "system", "content": "Summarize performance trends."},
        {"role": "user", "content": f"Employee: {employee.name if employee else '??'}\nData: {metrics_str}"}
    ]
    return AIOrchestrator.call_model(messages, json_output=False, domain=AIDomain.WELLBEING)

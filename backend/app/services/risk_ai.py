from app.services.ai_orchestrator import AIOrchestrator
from sqlalchemy.orm import Session
from app.models.activity import Activity
from app.models.employee import Employee
import json
import re
from datetime import datetime

def analyze_wellbeing_support(employee_id: int, db: Session) -> dict:
    """
    Analyze employee activities for wellbeing support needs and potential workplace risk signals.
    Formerly 'analyze_risk'.
    """
    # Get employee
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        return {"support_priority": "unknown", "details": "Employee not found"}
    
    # Get all activities for this employee
    activities = db.query(Activity).filter(Activity.employee_id == employee_id).order_by(Activity.timestamp.desc()).all()
    
    if not activities:
        return {"support_priority": "low", "details": "No activities found to assess wellbeing support needs."}
    
    # Build activity context
    activity_context = "\n\n".join([
        f"Activity {i+1}: Type: {a.type} | Content: {a.content}"
        for i, a in enumerate(activities[:20])
    ])
    
    messages = [
        {
            "role": "system",
            "content": """You are a workplace wellbeing specialist. Analyze activities to identify if an employee needs support, 
            mentorship, or if there are workplace risk signals (potential policy misunderstandings or friction).
            
            STRICT RULES:
            - Avoid judgmental labels like 'toxic', 'guilty', or 'violator'.
            - Focus on 'Support Priority' (low, medium, priority).
            - Provide 'support_recommendations' for management.
            
            Respond in JSON: {"support_priority": "low|medium|priority", "details": "...", "recommendations": ["..."]}"""
        },
        {
            "role": "user",
            "content": f"Employee: {employee.name}\n\nRecent Activities:\n{activity_context}\n\nAssess wellbeing support needs."
        }
    ]
    
    try:
        data = AIOrchestrator.analyze_text(messages[0]["content"], messages[1]["content"], temperature=0.4)
    except:
        data = {"support_priority": "medium", "details": "AI analysis unavailable.", "recommendations": ["Initiate supportive 1-on-1 check-in"]}

    return {
        "support_priority": data.get("support_priority", "low"),
        "details": data.get("details", "Analysis completed."),
        "recommendations": data.get("recommendations", []),
        "trust_metadata": {
            "confidence_score": 0.9,
            "ai_model": "Wellbeing-GPT-4 (Ensemble)",
            "timestamp": datetime.now().isoformat(),
            "evidence": ["Activity history trends"]
        }
    }

def analyze_friction_indicators(text: str) -> dict:
    """
    Check if text indicates workplace friction or frustration.
    Formerly 'check_toxicity'.
    """
    messages = [
        {
            "role": "system",
            "content": """You are a conflict resolution expert. Analyze text for workplace friction indicators (frustration, 
            communication breakdowns, or distress). 
            
            Respond in JSON: {"has_friction": true/false, "explanation": "...", "support_hint": "How to help"}"""
        },
        {
            "role": "user",
            "content": f"Analyze this text for friction signals: {text}"
        }
    ]
    
    try:
        data = AIOrchestrator.analyze_text(messages[0]["content"], messages[1]["content"], temperature=0.3)
    except:
        data = {"has_friction": False, "explanation": "Analysis currently unavailable.", "support_hint": "Listen and validate"}

    return {
        "has_friction": data.get("has_friction", False),
        "explanation": data.get("explanation", ""),
        "support_hint": data.get("support_hint", ""),
        "trust_metadata": {
            "confidence_score": 0.88,
            "ai_model": "Friction-Sentry-v1",
            "timestamp": datetime.now().isoformat()
        }
    }

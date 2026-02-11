from pydantic import BaseModel, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime, date

# --- Templates ---

class OnboardingTaskTemplate(BaseModel):
    task_name: str
    description: Optional[str] = None
    category: Optional[str] = "other"
    owner: str = "Employee" # Employee, Manager, IT, HR
    due_offset_days: int = 0
    priority: str = "Medium"

class OnboardingTemplateCreate(BaseModel):
    name: str
    department_id: Optional[int] = None
    tasks: List[OnboardingTaskTemplate]
    is_active: bool = True

class OnboardingTemplateResponse(BaseModel):
    id: int
    organization_id: int
    name: str
    department_id: Optional[int]
    tasks: List[Dict[str, Any]]
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)

# --- Reminders ---

class OnboardingReminderResponse(BaseModel):
    id: int
    task_id: int
    reminder_type: str
    scheduled_at: datetime
    sent_at: Optional[datetime]
    status: str

    model_config = ConfigDict(from_attributes=True)

# --- Progress ---

class OnboardingProgress(BaseModel):
    employee_id: int
    total_tasks: int
    completed_tasks: int
    completion_percentage: float
    estimated_completion_date: Optional[date]
    overdue_tasks: int
    status: str

# Resolve forward references for Pydantic V2
OnboardingTemplateResponse.model_rebuild()
OnboardingReminderResponse.model_rebuild()
OnboardingProgress.model_rebuild()

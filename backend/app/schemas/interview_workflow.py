"""
Interview Workflow Schemas
Includes Slots, Scorecards, Kits, and Actions.
"""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from app.models.interview import InterviewStatus, InterviewSlotStatus, ScorecardRecommendation

# --- Slots ---
class InterviewSlotCreate(BaseModel):
    interviewer_id: int
    scheduled_at: datetime
    duration_minutes: int = 60
    meeting_link: Optional[str] = None

class InterviewSlotResponse(BaseModel):
    id: int
    interview_id: int
    interviewer_id: int
    scheduled_at: datetime
    duration_minutes: int
    meeting_link: Optional[str]
    status: InterviewSlotStatus
    candidate_confirmed: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# --- Invite ---
class InterviewInviteRequest(BaseModel):
    slot_ids: List[int] # Allow multiple slots to be proposed
    message: Optional[str] = None

# --- Kit ---
class Question(BaseModel):
    id: str
    text: str
    type: str = "text" # text, code, multiple_choice
    criteria: Optional[str] = None

class InterviewKitStructure(BaseModel):
    questions: List[Question]
    evaluation_guide: Optional[str] = None

class InterviewKitResponse(BaseModel):
    id: int
    interview_id: int
    questions: List[Question]
    evaluation_guide: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True

# --- Scorecard ---
class InterviewScorecardCreate(BaseModel):
    overall_rating: int = Field(..., ge=1, le=5)
    technical_score: Optional[int] = Field(None, ge=1, le=10)
    communication_score: Optional[int] = Field(None, ge=1, le=10)
    cultural_fit_score: Optional[int] = Field(None, ge=1, le=10)
    strengths: Optional[List[str]] = []
    concerns: Optional[List[str]] = []
    feedback_text: Optional[str] = None
    recommendation: ScorecardRecommendation

class InterviewScorecardResponse(InterviewScorecardCreate):
    id: int
    interview_id: int
    interviewer_id: int
    ai_consistency_check: Optional[Dict[str, Any]] = None
    submitted_at: datetime
    
    class Config:
        from_attributes = True

# --- Consistency Check ---
class ConsistencyAnalysis(BaseModel):
    score_variance: float
    consensus_recommendation: str
    flags: List[str] # e.g., "Interviewer A rated Technical 2 while B rated 9"
    trust_score: float

# --- Decision ---
class InterviewDecisionRequest(BaseModel):
    status: InterviewStatus # HIRED, REJECTED
    reason: Optional[str] = None
    feedback_to_candidate: Optional[str] = None

# Resolve forward references for Pydantic V2
InterviewSlotResponse.model_rebuild()
InterviewKitResponse.model_rebuild()
InterviewScorecardResponse.model_rebuild()
ConsistencyAnalysis.model_rebuild()

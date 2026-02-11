import json
from typing import List, Dict, Any, Tuple
from app.services.base import BaseService
from app.services.ai_orchestrator import AIOrchestrator, AIDomain
from app.core.cache import cache_ai_response

class InterviewService(BaseService):
    """Domain service for handling interview-related business logic and AI coordination."""
    
    @cache_ai_response(AIDomain.INTERVIEW)
    def suggest_slots(self, candidate_preferences: str, interviewer_availability: str) -> List[Dict[str, Any]]:
        self.log_info(f"Suggesting slots for candidate preferences: {candidate_preferences[:50]}...")
        
        system_prompt = (
            "You are an intelligent interview scheduling assistant. "
            "Analyze candidate preferences and interviewer availability to suggest the best 3 time slots. "
            "Always respond in JSON format: {\"suggestions\": [{\"date\": \"YYYY-MM-DD\", \"time\": \"HH:MM\", \"reasoning\": \"explanation\"}, ...]}"
        )
        user_content = (
            f"Candidate Preferences:\n{candidate_preferences}\n\n"
            f"Interviewer Availability:\n{interviewer_availability}\n\n"
            "Suggest the best 3 interview time slots that match both preferences."
        )
        
        try:
            result = AIOrchestrator.analyze_text(system_prompt, user_content, temperature=0.7, domain=AIDomain.INTERVIEW)
            return result.get("suggestions", [])[:3]
        except Exception as e:
            self.log_error(f"Failed to suggest slots: {e}")
            return []

    @cache_ai_response(AIDomain.INTERVIEW)
    def generate_questions(self, job_title: str, candidate_resume: str) -> List[str]:
        system_prompt = (
            "You are an expert interviewer. Generate relevant interview questions based on the job title and candidate's background. "
            "Always respond in JSON format: {\"questions\": [\"question1\", \"question2\", ...]}"
        )
        user_content = f"Job Title: {job_title}\n\nCandidate Resume:\n{candidate_resume[:2000]}\n\nGenerate 5-7 questions."
        
        try:
            result = AIOrchestrator.analyze_text(system_prompt, user_content, temperature=0.7, domain=AIDomain.INTERVIEW)
            return result.get("questions", [])
        except Exception as e:
            self.log_error(f"Failed to generate questions: {e}")
            return ["Tell me about your experience.", "Why are you interested in this role?"]

    @cache_ai_response(AIDomain.INTERVIEW)
    def analyze_fit(self, job_requirements: str, candidate_background: str) -> Tuple[float, str]:
        system_prompt = (
            "You are an expert recruiter. Analyze how well a candidate fits the job requirements. "
            "Provide a fit score (0-100) and detailed reasoning. "
            "Always respond in JSON format: {\"fit_score\": <number>, \"reasoning\": \"<explanation>\"}"
        )
        user_content = f"Requirements:\n{job_requirements}\n\nBackground:\n{candidate_background[:2000]}"
        
        try:
            result = AIOrchestrator.analyze_text(system_prompt, user_content, temperature=0.5, domain=AIDomain.INTERVIEW)
            return float(result.get("fit_score", 50)), result.get("reasoning", "No reasoning provided.")
        except Exception as e:
            self.log_error(f"Failed to analyze fit: {e}")
            return 50.0, "Analysis unavailable."

    def generate_interview_kit(self, job_title: str, candidate_resume: str) -> Dict[str, Any]:
        system_prompt = """You are an Enterprise HR Strategist. Generate a structured interview kit.
        Respond in JSON format:
        {
            "questions": [{"id": 1, "text": "...", "criteria": "...", "category": "..."}],
            "evaluation_criteria": [{"category": "...", "weight": 0.5, "description": "..."}]
        }"""
        user_content = f"Kit for: {job_title}\nResume: {candidate_resume[:2000]}"
        
        try:
            return AIOrchestrator.analyze_text(system_prompt, user_content, domain=AIDomain.INTERVIEW)
        except Exception as e:
            self.log_error(f"Failed to generate kit: {e}")
            return {"questions": [], "evaluation_criteria": []}

    @cache_ai_response(AIDomain.INTERVIEW)
    def analyze_consistency(self, feedbacks: List[Dict], job_title: str) -> Dict[str, Any]:
        system_prompt = "Analyze interviewer feedback for potential bias. Respond in JSON."
        user_content = f"Title: {job_title}\nFeedbacks: {json.dumps(feedbacks)}"
        try:
            return AIOrchestrator.analyze_text(system_prompt, user_content, domain=AIDomain.INTERVIEW)
        except Exception as e:
            self.log_error(f"Consistency check failed: {e}")
            return {"consistency_score": 0.5, "summary": "Error analyzing consistency."}

    @cache_ai_response(AIDomain.INTERVIEW)
    def summarize_feedback(self, scores: Dict, comments: str, job_title: str) -> Dict[str, Any]:
        system_prompt = f"Summarize strengths/weaknesses for {job_title} candidate."
        user_content = f"Scores: {json.dumps(scores)}\nComments: {comments}"
        try:
            return AIOrchestrator.analyze_text(system_prompt, user_content, domain=AIDomain.INTERVIEW)
        except Exception as e:
            self.log_error(f"Feedback summary failed: {e}")
            return {"strengths": "N/A", "weaknesses": "N/A"}

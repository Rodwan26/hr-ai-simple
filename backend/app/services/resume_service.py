from app.services.base import BaseService
from app.services.ai_orchestrator import AIOrchestrator, AIDomain
from app.core.cache import cache_ai_response

class ResumeService(BaseService):
    """Domain service for resume processing and matching logic."""
    
    @cache_ai_response(AIDomain.RESUME)
    def anonymize(self, text: str) -> str:
        self.log_info("Anonymizing resume text.")
        # 1. Basic Regex Scrubbing
        text = re.sub(r'[\w\.-]+@[\w\.-]+\.\w+', '[EMAIL]', text)
        text = re.sub(r'\+?\d[\d\-\(\) ]{8,}\d', '[PHONE]', text)
        text = re.sub(r'https?://[^\s<>"]+|www\.[^\s<>"]+', '[LINK]', text)
        
        # 2. LLM-based Contextual Scrubbing
        messages = [
            {
                "role": "system",
                "content": "You are a PII scrubbing assistant. Remove personal identifiers (Names, Locations, IDs) from resume text. Replace with [NAME], [STREET]. Return ONLY scrubbed text."
            },
            {"role": "user", "content": text}
        ]
        
        try:
            return AIOrchestrator.call_model(
                messages, 
                temperature=0.0, 
                json_output=False, 
                domain=AIDomain.RESUME,
                organization_id=self.org_id,
                db_session=self.db
            ).strip()
        except Exception as e:
            self.log_warning(f"AI Anonymization failed, using regex-only: {e}")
            return text

    @cache_ai_response(AIDomain.RESUME)
    def analyze(self, resume_text: str, job_requirements: str) -> Dict[str, Any]:
        self.log_info("Analyzing resume against requirements.")
        system_prompt = """You are an expert recruitment AI. Analyze the resume against job requirements.
        Return JSON object:
        - "score": (0-100)
        - "feedback": Concise summary.
        - "evidence": [{"signal": "...", "proof": "...", "assessment": "..."}]
        """
        user_content = f"JOB REQUIREMENTS:\n{job_requirements}\n\nRESUME TEXT:\n{resume_text[:4000]}"
        
        try:
            data = AIOrchestrator.analyze_text(
                system_prompt, 
                user_content, 
                temperature=0.3, 
                domain=AIDomain.RESUME,
                organization_id=self.org_id,
                db_session=self.db
            )
        except Exception as e:
            self.log_error(f"Analysis failed: {e}")
            data = {"score": 0.0, "feedback": "Error during analysis.", "evidence": []}

        score = max(0, min(100, float(data.get("score", 0))))
        return {
            "score": score,
            "feedback": data.get("feedback", "No feedback."),
            "evidence": data.get("evidence", []),
            "trust_metadata": {
                "confidence_score": 0.85 if score > 0 else 0.0,
                "ai_model": "Enterprise Ensemble",
                "timestamp": datetime.now().isoformat()
            }
        }

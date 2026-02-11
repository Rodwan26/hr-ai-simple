from app.services.interview_service import InterviewService

def suggest_interview_slot(candidate_preferences: str, interviewer_availability: str) -> list[dict]:
    service = InterviewService()
    return service.suggest_slots(candidate_preferences, interviewer_availability)

def generate_interview_questions(job_title: str, candidate_resume: str) -> list[str]:
    service = InterviewService()
    return service.generate_questions(job_title, candidate_resume)

def analyze_interview_fit(job_requirements: str, candidate_background: str) -> tuple[float, str]:
    service = InterviewService()
    return service.analyze_fit(job_requirements, candidate_background)

def generate_structured_interview_kit(job_title: str, candidate_resume: str) -> dict:
    service = InterviewService()
    return service.generate_interview_kit(job_title, candidate_resume)

def analyze_feedback_consistency(feedbacks: list[dict], job_requirements: str) -> dict:
    # This was a specialized one, for now keeping it or moving it to service
    from app.services.ai_orchestrator import AIOrchestrator, AIDomain
    import json
    messages = [
        {"role": "system", "content": "Analyze interviewer feedback for potential bias. Respond in JSON: {\"consistency_score\": 0.0-1.0, \"risks\": [], \"summary\": \"\", \"recommendation\": \"\"}"},
        {"role": "user", "content": f"Requirements: {job_requirements}\nFeedbacks: {json.dumps(feedbacks)}"}
    ]
    try:
        return AIOrchestrator.analyze_text(messages[0]["content"], messages[1]["content"], domain=AIDomain.INTERVIEW)
    except:
        return {"consistency_score": 0.5, "risks": ["Manual review required"], "summary": "Error", "recommendation": "Manual Review"}

def generate_feedback_summary(scores: dict, comments: str, job_title: str) -> dict:
    from app.services.ai_orchestrator import AIOrchestrator, AIDomain
    import json
    system_prompt = f"You are a professional HR analyst for {job_title}. Summarize strengths/weaknesses in JSON."
    user_content = f"Scores: {json.dumps(scores)}\nComments: {comments}"
    try:
        return AIOrchestrator.analyze_text(system_prompt, user_content, domain=AIDomain.INTERVIEW)
    except:
        return {"strengths": "N/A", "weaknesses": "N/A"}

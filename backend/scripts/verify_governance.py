from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.services.ai_orchestrator import AIOrchestrator, AIDomain
from app.models.governance import EthicalAuditLog, AIModelRegistry
import json

def test_ai_governance_provenance():
    print("Testing AI Governance Provenance Tracking...")
    db = SessionLocal()
    try:
        # 1. Ensure a model is registered
        model = db.query(AIModelRegistry).filter(AIModelRegistry.domain == "general").first()
        if not model:
            print("  Seeding default model for 'general' domain...")
            model = AIModelRegistry(
                domain="general",
                version="1.0.0",
                model_name="gpt-4",
                is_active=True
            )
            db.add(model)
            db.commit()
            db.refresh(model)

        # 2. Trigger an AI call with DB session
        messages = [{"role": "user", "content": "Just a test"}]
        print("  Triggering AI call with governance logging...")
        AIOrchestrator.call_model(
            messages, 
            domain="general", 
            organization_id=1, 
            db_session=db
        )

        # 3. Verify EthicalAuditLog entry
        log = db.query(EthicalAuditLog).order_by(EthicalAuditLog.timestamp.desc()).first()
        assert log is not None
        assert log.domain == "general"
        assert log.organization_id == 1
        assert log.model_version_id == model.id
        print(f"  Provenance log verified: Request ID {log.request_id}")

        # 4. Test Ethical Flagging (Simulated spike)
        print("\nTesting Ethical Flagging Logic...")
        # Simulate a high bias response trigger
        AIOrchestrator._log_governance(db, "general", messages, "I reject and deny this application due to bias.", "gpt-4", 1)
        
        flagged_log = db.query(EthicalAuditLog).filter(EthicalAuditLog.bias_score > 0).order_by(EthicalAuditLog.timestamp.desc()).first()
        assert flagged_log is not None
        print(f"  Flagged decision detected. Bias Score: {flagged_log.bias_score}")

        print("\nAI Governance Verification: PASS")

    except Exception as e:
        print(f"\nAI Governance Verification: FAILED: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    test_ai_governance_provenance()

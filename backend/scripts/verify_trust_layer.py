
import sys
import os
import json
from datetime import datetime

# Add parent directory to path to allow importing app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import Base, SessionLocal
from app.services.ai_trust_service import AITrustService
from app.models.audit_log import AuditLog
from app.models.user import UserRole
from app.schemas.trust import SourceCitation

def verify_trust_layer():
    print("Locked & Loaded: Verifying AI Trust Layer...")
    
    # 1. Setup DB Connection
    db = SessionLocal()
    
    try:
        # 2. Mock Context
        org_id = 1
        user_id = 999 # Test User
        user_role = UserRole.HR_ADMIN
        
        service = AITrustService(db, org_id, user_id, user_role)
        
        # 3. Simulate AI Action
        action_type = "verify_trust_script"
        content = "This is a verified AI response."
        sources = [SourceCitation(
            document_id=101,
            filename="test_doc.pdf", 
            chunk_index=1, 
            snippet="Test text",
            similarity_score=0.88
        )]
        
        print(f"[-] Simulating AI Action: {action_type}")
        
        response = service.wrap_and_log(
            content=content,
            action_type=action_type,
            entity_type="test_entity",
            entity_id=123,
            confidence_score=0.95,
            sources=sources,
            model_name="Test-Model-v1",
            reasoning="Because tests must pass."
        )
        
        # 4. Verify Response
        print("[-] Verifying Response Structure...")
        assert response.content == content
        assert response.trust.confidence_score == 0.95
        assert response.trust.sources[0].filename == "test_doc.pdf"
        print("[+] Response Structure OK")
        
        # 5. Verify Audit Log
        print("[-] Verifying Audit Log...")
        log = db.query(AuditLog).filter(
            AuditLog.action == action_type,
            AuditLog.user_id == user_id
        ).order_by(AuditLog.timestamp.desc()).first()
        
        assert log is not None, "Audit log entry not found!"
        assert log.ai_recommended == True
        
        # Check Trust Metadata in details/after_state
        trust_data = log.after_state.get("trust_metadata")
        if not trust_data:
             trust_data = log.details.get("trust_metadata")
             
        assert trust_data is not None, "Trust metadata missing from audit log!"
        assert trust_data["confidence_score"] == 0.95
        assert trust_data["ai_model"] == "Test-Model-v1"
        
        print(f"[+] Audit Log Verified: ID {log.id}")
        print("\n\u2705 SUCCESS: Trust Layer is fully operational and audited.")
        
    except Exception as e:
        print(f"\n\u274C FAILED: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    verify_trust_layer()

from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app.models.governance import AIModelRegistry
from datetime import datetime

def seed_model_registry():
    db = SessionLocal()
    try:
        domains = ["resume", "interview", "wellbeing", "audit", "documents"]
        for domain in domains:
            # Check if exists
            exists = db.query(AIModelRegistry).filter(AIModelRegistry.domain == domain, AIModelRegistry.is_active == True).first()
            if not exists:
                model = AIModelRegistry(
                    domain=domain,
                    version="1.0.0",
                    model_name="gpt-4",
                    prompt_template=f"Default enterprise prompt for {domain}",
                    parameters={"temperature": 0.7},
                    is_active=True,
                    created_at=datetime.utcnow()
                )
                db.add(model)
        db.commit()
        print("AI Model Registry seeded successfully.")
    except Exception as e:
        print(f"Error seeding model registry: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_model_registry()

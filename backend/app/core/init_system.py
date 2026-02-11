import logging
from app.database import SessionLocal
from app.models.user import User, UserRole
from app.models.organization import Organization
from app.services import auth as auth_service

logger = logging.getLogger(__name__)

def init_system_data():
    """
    Checks if the system needs initialization.
    Safe to call on every startup.
    """
    db = SessionLocal()
    try:
        # Check if any organization exists
        org_count = db.query(Organization).count()
        if org_count == 0:
            logger.info("Running startup initialization...")
            logger.info("System in setup mode: No organization found. Bootstrap required via /api/setup/initialize")
        else:
            logger.info(f"System initialization check: {org_count} organization(s) found.")
            
    except Exception as e:
        logger.error(f"Error during system initialization check: {str(e)}", exc_info=True)
    finally:
        db.close()

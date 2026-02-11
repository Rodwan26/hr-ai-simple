import logging
from typing import Optional
from sqlalchemy.orm import Session
from app.core.config import settings

class BaseService:
    """Base class for all domain services to ensure consistent logging and context."""
    
    def __init__(self, db: Optional[Session] = None, organization_id: Optional[int] = None):
        self._db = db
        self._organization_id = organization_id
        self._logger = logging.getLogger(f"app.services.{self.__class__.__name__}")

    @property
    def db(self) -> Session:
        if self._db is None:
            raise RuntimeError("Database session not initialized for this service.")
        return self._db

    @property
    def org_id(self) -> Optional[int]:
        return self._organization_id

    def scoped_query(self, model):
        """Returns a query scoped to the current organization if organization_id is set."""
        query = self.db.query(model)
        if self._organization_id and hasattr(model, 'organization_id'):
            return query.filter(model.organization_id == self._organization_id)
        return query

    def log_info(self, message: str, extra: Optional[dict] = None):
        self._logger.info(message, extra=extra)

    def log_error(self, message: str, extra: Optional[dict] = None):
        self._logger.error(message, extra=extra)

    def log_warning(self, message: str, extra: Optional[dict] = None):
        self._logger.warning(message, extra=extra)

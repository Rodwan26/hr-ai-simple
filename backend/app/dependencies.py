from typing import List, Optional, Annotated
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, UserRole
from app.services import auth as auth_service
from app.schemas.auth import TokenData
from app.services.audit import AuditService

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token")

def get_current_user(token: Annotated[str, Depends(oauth2_scheme)], db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    payload = auth_service.decode_access_token(token)
    if payload is None:
        raise credentials_exception
        
    if payload.get("type") != "access":
        raise credentials_exception
    
    email: str = payload.get("sub")
    role: str = payload.get("role")
    if email is None:
        raise credentials_exception
    
    token_data = TokenData(email=email, role=role)
    user = db.query(User).filter(User.email == token_data.email).first()
    if user is None:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is inactive"
        )
    return user

def require_role(allowed_roles: List[str]):
    def role_checker(current_user: User = Depends(get_current_user)):
        # Enum string comparison or direct enum comparison
        # User.role is Enum(UserRole), so comparison with string "HR_ADMIN" might fail if not careful.
        # But UserRole is str based enum.
        if current_user.role not in allowed_roles and current_user.role.value not in allowed_roles:
             raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have enough permissions to perform this action"
            )
        return current_user
    return role_checker

def require_any_role():
    """
    Dependency that allows any authenticated user.
    """
    return get_current_user

def require_department(allowed_departments: List[str]):
    """
    Enforce department-level access.
    HR_ADMIN can access all.
    """
    def department_checker(current_user: User = Depends(get_current_user)):
        if current_user.role == UserRole.HR_ADMIN:
            return current_user
            
        if current_user.department not in allowed_departments:
             raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access restricted to {', '.join(allowed_departments)} department(s)"
            )
        return current_user
    return department_checker

def validate_organization_access(user: User, entity_org_id: Optional[int]):
    """
    Ensure user can only access entities within their organization.
    """
    if entity_org_id is None or user.organization_id is None:
        return # Skip if data is global or system-wide (use caution)
        
    if user.organization_id != entity_org_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Entity belongs to a different organization."
        )

# Re-export for cleaner imports in routers
__all__ = [
    "get_current_user", 
    "require_role", 
    "require_any_role", 
    "require_department",
    "validate_organization_access",
    "User", 
    "UserRole"
]

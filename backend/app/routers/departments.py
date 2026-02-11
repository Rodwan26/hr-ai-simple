"""
Department Router - CRUD operations for organizational departments.
Supports hierarchy with parent-child relationships.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional

from app.database import get_db
from app.models.department import Department
from app.models.user import User, UserRole
from app.routers.auth_deps import get_current_user, require_role, require_org_context, require_admin, get_current_org
from app.schemas.department import (
    DepartmentCreate,
    DepartmentUpdate,
    DepartmentResponse,
    DepartmentListResponse,
    DepartmentWithChildren,
)
from app.services.audit import AuditService

router = APIRouter(
    prefix="/departments",
    tags=["departments"]
)


def build_department_response(dept: Department, db: Session) -> DepartmentResponse:
    """Helper to build department response with computed fields."""
    employee_count = db.query(User).filter(User.department_id == dept.id).count()
    
    return DepartmentResponse(
        id=dept.id,
        organization_id=dept.organization_id,
        name=dept.name,
        code=dept.code,
        description=dept.description,
        parent_id=dept.parent_id,
        manager_user_id=dept.manager_user_id,
        is_active=dept.is_active,
        created_at=dept.created_at,
        updated_at=dept.updated_at,
        full_path=dept.full_path,
        employee_count=employee_count,
    )


@router.get("", response_model=DepartmentListResponse)
def list_departments(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    include_inactive: bool = Query(False),
    parent_id: Optional[int] = Query(None, description="Filter by parent department"),
    db: Session = Depends(get_db),
    org_id: int = Depends(get_current_org),
    current_user: User = Depends(require_org_context),
):
    """
    List all departments in the user's organization.
    HR_ADMIN sees all, others see based on their access level.
    """
    query = db.query(Department).filter(
        Department.organization_id == org_id
    )
    
    if not include_inactive:
        query = query.filter(Department.is_active == True)
    
    if parent_id is not None:
        query = query.filter(Department.parent_id == parent_id)
    
    # For non-admin users, filter to their department tree
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.HR_ADMIN]:
        if current_user.department_id:
            # Get their department and children
            dept_ids = [current_user.department_id]
            children = db.query(Department.id).filter(
                Department.parent_id == current_user.department_id
            ).all()
            dept_ids.extend([c.id for c in children])
            query = query.filter(Department.id.in_(dept_ids))
    
    total = query.count()
    departments = query.offset((page - 1) * page_size).limit(page_size).all()
    
    return DepartmentListResponse(
        items=[build_department_response(d, db) for d in departments],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/tree", response_model=List[DepartmentWithChildren])
def get_department_tree(
    db: Session = Depends(get_db),
    org_id: int = Depends(get_current_org)
):
    """
    Get the full department hierarchy as a tree structure.
    """
    # Get all root departments (no parent)
    roots = db.query(Department).filter(
        Department.organization_id == org_id,
        Department.parent_id == None,
        Department.is_active == True,
    ).all()
    
    def build_tree(dept: Department) -> DepartmentWithChildren:
        children = db.query(Department).filter(
            Department.parent_id == dept.id,
            Department.is_active == True,
        ).all()
        
        return DepartmentWithChildren(
            id=dept.id,
            organization_id=dept.organization_id,
            name=dept.name,
            code=dept.code,
            description=dept.description,
            parent_id=dept.parent_id,
            manager_user_id=dept.manager_user_id,
            is_active=dept.is_active,
            created_at=dept.created_at,
            updated_at=dept.updated_at,
            full_path=dept.full_path,
            children=[build_tree(c) for c in children],
        )
    
    return [build_tree(root) for root in roots]


@router.get("/{department_id}", response_model=DepartmentResponse)
def get_department(
    department_id: int,
    db: Session = Depends(get_db),
    org_id: int = Depends(get_current_org)
):
    """
    Get a specific department by ID.
    """
    dept = db.query(Department).filter(
        Department.id == department_id,
        Department.organization_id == org_id,
    ).first()
    
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    
    return build_department_response(dept, db)


@router.post("", response_model=DepartmentResponse, status_code=status.HTTP_201_CREATED)
def create_department(
    department: DepartmentCreate,
    db: Session = Depends(get_db),
    org_id: int = Depends(get_current_org),
    current_user: User = Depends(require_admin()),
):
    """
    Create a new department. HR_ADMIN only.
    """
    # Check for duplicate code within organization
    existing = db.query(Department).filter(
        Department.organization_id == org_id,
        Department.code == department.code,
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Department with code '{department.code}' already exists"
        )
    
    # Validate parent exists if provided
    if department.parent_id:
        parent = db.query(Department).filter(
            Department.id == department.parent_id,
            Department.organization_id == org_id,
        ).first()
        if not parent:
            raise HTTPException(status_code=400, detail="Parent department not found")
    
    # Validate manager exists if provided
    if department.manager_user_id:
        manager = db.query(User).filter(
            User.id == department.manager_user_id,
            User.organization_id == org_id,
        ).first()
        if not manager:
            raise HTTPException(status_code=400, detail="Manager user not found")
    
    new_dept = Department(
        organization_id=org_id,
        name=department.name,
        code=department.code.upper(),
        description=department.description,
        parent_id=department.parent_id,
        manager_user_id=department.manager_user_id,
    )
    
    db.add(new_dept)
    db.flush()
    
    # Audit log
    AuditService.log(
        db,
        action="create_department",
        entity_type="department",
        entity_id=new_dept.id,
        user_id=current_user.id,
        user_role=current_user.role.value,
        details={"name": new_dept.name, "code": new_dept.code},
        organization_id=org_id,
        after_state={"id": new_dept.id, "name": new_dept.name, "code": new_dept.code},
    )
    
    db.commit()
    db.refresh(new_dept)
    
    return build_department_response(new_dept, db)


@router.patch("/{department_id}", response_model=DepartmentResponse)
def update_department(
    department_id: int,
    update: DepartmentUpdate,
    db: Session = Depends(get_db),
    org_id: int = Depends(get_current_org),
    current_user: User = Depends(require_admin()),
):
    """
    Update a department. HR_ADMIN only.
    """
    dept = db.query(Department).filter(
        Department.id == department_id,
        Department.organization_id == org_id,
    ).first()
    
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    
    before_state = {"name": dept.name, "code": dept.code, "is_active": dept.is_active}
    
    # Update fields
    update_data = update.model_dump(exclude_unset=True)
    
    if "code" in update_data:
        # Check for duplicate code
        existing = db.query(Department).filter(
            Department.organization_id == org_id,
            Department.code == update_data["code"],
            Department.id != department_id,
        ).first()
        if existing:
            raise HTTPException(
                status_code=400,
                detail=f"Department with code '{update_data['code']}' already exists"
            )
        update_data["code"] = update_data["code"].upper()
    
    for field, value in update_data.items():
        setattr(dept, field, value)
    
    # Audit log
    after_state = {"name": dept.name, "code": dept.code, "is_active": dept.is_active}
    AuditService.log(
        db,
        action="update_department",
        entity_type="department",
        entity_id=dept.id,
        user_id=current_user.id,
        user_role=current_user.role.value,
        details={"updated_fields": list(update_data.keys())},
        organization_id=org_id,
        before_state=before_state,
        after_state=after_state,
    )
    
    db.commit()
    db.refresh(dept)
    
    return build_department_response(dept, db)


@router.delete("/{department_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_department(
    department_id: int,
    db: Session = Depends(get_db),
    org_id: int = Depends(get_current_org),
    current_user: User = Depends(require_admin()),
):
    """
    Soft-delete a department (sets is_active=False). HR_ADMIN only.
    Prevents deletion if department has active employees.
    """
    dept = db.query(Department).filter(
        Department.id == department_id,
        Department.organization_id == org_id,
    ).first()
    
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    
    # Check for active employees
    employee_count = db.query(User).filter(
        User.department_id == department_id,
        User.is_active == True,
    ).count()
    
    if employee_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete department with {employee_count} active employees. Reassign them first."
        )
    
    # Check for child departments
    children = db.query(Department).filter(
        Department.parent_id == department_id,
        Department.is_active == True,
    ).count()
    
    if children > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete department with {children} child departments. Delete or reassign them first."
        )
    
    # Soft delete
    dept.is_active = False
    
    # Audit log
    AuditService.log(
        db,
        action="delete_department",
        entity_type="department",
        entity_id=dept.id,
        user_id=current_user.id,
        user_role=current_user.role.value,
        details={"name": dept.name, "code": dept.code},
        organization_id=org_id,
        before_state={"is_active": True},
        after_state={"is_active": False},
    )
    
    db.commit()
    return None


@router.get("/{department_id}/employees", response_model=List[dict])
def list_department_employees(
    department_id: int,
    include_subteams: bool = Query(False, description="Include employees from child departments"),
    db: Session = Depends(get_db),
    org_id: int = Depends(get_current_org),
    current_user: User = Depends(require_org_context),
):
    """
    List employees in a department.
    HR_ADMIN sees all, managers see their department only.
    """
    dept = db.query(Department).filter(
        Department.id == department_id,
        Department.organization_id == org_id,
    ).first()
    
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    
    # Access check for non-admins
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.HR_ADMIN]:
        if current_user.department_id != department_id:
            # Check if it's a child of user's department
            if dept.parent_id != current_user.department_id:
                raise HTTPException(
                    status_code=403,
                    detail="Access denied. You can only view employees in your department."
                )
    
    dept_ids = [department_id]
    if include_subteams:
        children = db.query(Department.id).filter(
            Department.parent_id == department_id,
            Department.is_active == True,
        ).all()
        dept_ids.extend([c.id for c in children])
    
    employees = db.query(User).filter(
        User.department_id.in_(dept_ids),
        User.is_active == True,
    ).all()
    
    return [
        {
            "id": emp.id,
            "email": emp.email,
            "full_name": emp.full_name,
            "role": emp.role.value,
            "department_id": emp.department_id,
        }
        for emp in employees
    ]

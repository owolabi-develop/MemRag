from fastapi import APIRouter,status
from fastapi import Depends, HTTPException
from app.dependencies import sessionCreator
from app.models import User, DepartmentCreate,DepartmentPublic,Department,UserRole
from app.security import get_password_hash,get_current_active_user
from sqlmodel import select
from typing import Annotated


router = APIRouter(prefix="/departments",
                   tags=["departments"],
                   responses={404: {"description": "Not found"}},)

@router.post("/create",response_model=DepartmentPublic)
async def create_department(dpt: DepartmentCreate, session:sessionCreator,current_user: Annotated[User, Depends(get_current_active_user)]):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only organization administrators can perform this action.")
    existing_department = await session.exec(select(Department).where(Department.name == dpt.name))
    if existing_department.first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Department already created")
    dpt_obj = Department.model_validate(dpt)
    
    dpt_obj.tenant_id = current_user.tenant_id
    
    session.add(dpt_obj)
    await session.commit()
    await session.refresh( dpt_obj)
    return dpt_obj

@router.get("/all",response_model=list[DepartmentPublic])
async def get_department(session:sessionCreator,current_user: Annotated[User,Depends(get_current_active_user)]):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,detail="Only organization administrators can perform this action.")
    
    existing_department = await session.exec(select(Department).where(Department.tenant_id==current_user.tenant_id))
    if not existing_department:
        return []
               
    return existing_department.all()

from src.utils.helper import get_current_user_dpt
@router.get("/per-user",response_model=list[DepartmentPublic])
async def get_departments(session:sessionCreator,current_user: Annotated[User,Depends(get_current_active_user)]):
    
    department = current_user.departments
    dpt = await get_current_user_dpt(department)
    print("departments",dpt)
               
    return department


@router.post("/add/user/{department_id}/{user_id}",response_model=DepartmentPublic)
async def add_user(user_id:str, session:sessionCreator,current_user: Annotated[User,Depends(get_current_active_user)],department_id:str):
    existing_user = await session.get(User,user_id)
    
    if existing_user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    existing_dpt_org = await session.get(Department,department_id)
    if existing_dpt_org is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Department not found")
    user_obj = existing_user
    existing_dpt_obj = existing_dpt_org
    existing_dpt_obj.users.append(user_obj)
    
    session.add(existing_dpt_obj)
    await session.commit()
    await session.refresh(existing_dpt_obj)
    
    ## get tenant org
    
    
    return existing_dpt_obj

   




from fastapi import APIRouter
from fastapi import Depends, HTTPException
from app.dependencies import sessionCreator
from app.models import User,UserCreate,UserPublic,Tenant
from app.security import get_password_hash,get_current_active_user
from sqlmodel import select
from typing import Annotated


router = APIRouter(prefix="/users",
                   tags=["users"],
                   responses={404: {"description": "Not found"}},)

@router.post("/register",response_model=UserPublic)
async def create_user(user: UserCreate, session:sessionCreator):
    existing_user = await session.exec(select(User).where(User.email == user.email))
    if existing_user.first():
        raise HTTPException(status_code=400, detail="Username already registered")
    user_obj = User.model_validate(user,update={"hashed_password": get_password_hash(user.password)})
    
    session.add(user_obj)
    await session.commit()
    await session.refresh(user_obj)
    return user_obj

@router.post("/add/{tenant_id}",response_model=UserPublic)
async def add_user(user: UserCreate, session:sessionCreator,current_user: Annotated[User,Depends(get_current_active_user)],tenant_id:str):
    existing_user = await session.exec(select(User).where(User.email == user.email))
    
    if existing_user.first():
        raise HTTPException(status_code=400, detail="Username already registered")
    
    existing_tenant_org = await session.get(Tenant,tenant_id)
    if existing_tenant_org is None:
        raise HTTPException(status_code=404, detail="Organization not found")
        
    user_obj = User.model_validate(user,update={"hashed_password": get_password_hash(user.password)})
    
    user_obj.tenant_id = existing_tenant_org.id
    
    session.add(user_obj)
    await session.commit()
    await session.refresh(user_obj)
    
    ## get tenant org
    
    
    return user_obj

@router.get("/", response_model=UserPublic)
async def get_current_user(current_user: Annotated[User, Depends(get_current_active_user)]):
    return current_user
   




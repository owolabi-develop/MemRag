from fastapi import APIRouter,status
from fastapi import Depends, HTTPException
from app.dependencies import sessionCreator
from app.models import User, Tenant, TenantCreate, TenantPublic,UserRole,TenantPublicWithDept,UserPublic
from typing import Annotated
from sqlmodel import select
from app.security import get_current_active_user

router = APIRouter(prefix="/tenants",
                   tags=["tenants"],
                   responses={404: {"description": "Not found"}},)

@router.post("/create",response_model=TenantPublic)
async def create_tenant(current_user: Annotated[User,Depends(get_current_active_user)],tenant: TenantCreate, session:sessionCreator):
    #get current user id
    user_id = current_user.id
    
    ## check user role to create tenant
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only organization administrators can perform this action.")
    
    
    existing_tenant = await session.exec(select(Tenant).where(Tenant.name == tenant.name))
    if existing_tenant.first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Organization already exist with that name")
     ## create new org tenant
    new_org_obj =  Tenant.model_validate(tenant)
    
    session.add(new_org_obj)
    await session.commit()
    await session.refresh(new_org_obj)
    
    ## add user org
    user_obj = await session.get(User,user_id)
    
    user_obj.tenant_id = new_org_obj.id
    
    session.add(user_obj)
    await session.commit()
    await session.refresh(user_obj)
    
    return new_org_obj


@router.get("/current/user/",response_model=list[UserPublic])
async def get_tenant_user(session:sessionCreator,current_user: Annotated[User,Depends(get_current_active_user)]):
    
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,detail="Only organization administrators can perform this action.")
    
    existing_user = await session.exec(select(User).where(User.tenant_id == current_user.tenant_id))
    
    return existing_user 

@router.get("/invited/users/",response_model=list[UserPublic])
async def get_tenant_user(session:sessionCreator,current_user: Annotated[User,Depends(get_current_active_user)]):
    
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,detail="Only organization administrators can perform this action.")
    if current_user.tenant_id is None:
        return []
    existing_tenant_user = await session.get(Tenant,current_user.tenant_id)
    users = list(filter(lambda x:x.status=="pending" or x.status=="accepted",existing_tenant_user.users))
    return users

@router.get("/",response_model=TenantPublicWithDept)
async def get_tenant(current_user: Annotated[User,Depends(get_current_active_user)], session:sessionCreator):
    tenant_id = current_user.tenant_id
    tenant = await session.get(Tenant,tenant_id)
    if tenant is None:
        raise HTTPException(status_code=404, detail="Your haven't been added to any Organization yet ask your admin or create one")
    return tenant
    
    





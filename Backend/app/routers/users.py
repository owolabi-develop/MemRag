from fastapi import APIRouter,status
from fastapi import Depends, HTTPException
from app.dependencies import sessionCreator
from app.models import User,UserCreate,UserPublic,Tenant,UserRole,UserInvite
from app.security import get_password_hash,get_current_active_user
from sqlmodel import select
from typing import Annotated
from app.security import get_password_hash, generate_temp_password
from app.utils.email import generate_invite_email, send_templated_email,generate_welcome_email
from fastapi import BackgroundTasks


router = APIRouter(prefix="/users",
                   tags=["users"],
                   responses={404: {"description": "Not found"}},)

@router.post("/register",response_model=UserPublic)
async def create_user(user: UserCreate, session:sessionCreator, background_tasks: BackgroundTasks):
    
    existing_user = await session.exec(select(User).where(User.email == user.email))
    if existing_user.first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This email is already registered.")
    user_obj = User.model_validate(user,update={"hashed_password": get_password_hash(user.password)})
    
    session.add(user_obj)
    await session.commit()
    await session.refresh(user_obj)
    
    
    email_data = generate_welcome_email(
        email_to=user_obj.email, first_name=user_obj.first_name)
    background_tasks.add_task(send_templated_email, email_data, user_obj.email)
    return user_obj

@router.post("/add/{tenant_id}", response_model=UserPublic)
async def add_user(user: UserInvite, session: sessionCreator,current_user: Annotated[User, Depends(get_current_active_user)],
    tenant_id: str,
    background_tasks: BackgroundTasks,
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only organization administrators can perform this action.",
        )

    existing_user = await session.exec(select(User).where(User.email == user.email))
    if existing_user.first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User already invited")

    existing_tnt_org = await session.get(Tenant, tenant_id)
    if existing_tnt_org is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tenant not found")

    temp_password = generate_temp_password()

    user_obj = User.model_validate(
        user,
        update={
            "hashed_password": get_password_hash(temp_password),
            "must_change_password": True,
        },
    )
    existing_tnt_org.users.append(user_obj)

    session.add(user_obj)
    await session.commit()
    await session.refresh(user_obj)

    email_data = generate_invite_email(
        email_to=user_obj.email,
        first_name=user_obj.first_name,
        temp_password=temp_password,
    )
    background_tasks.add_task(send_templated_email, email_data, user_obj.email)

    return user_obj



@router.get("/", response_model=UserPublic)
async def get_current_user(current_user: Annotated[User, Depends(get_current_active_user)]):
    return current_user
   




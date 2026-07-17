from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from pydantic import BaseModel
from app.dependencies import sessionCreator
from app.models import (
    Message,
    PasswordResetRequest,
    ResetPasswordRequest,
    UpdatePasswordRequest,
    User,
)
from app.security import (
    create_password_reset_token,
    get_current_active_user,
    get_password_hash,
    get_user,
    verify_password,
    verify_password_reset_token,
)
from app.utils.email import (
    generate_password_changed_email,
    generate_password_reset_email,
    send_templated_email,
)

router = APIRouter(prefix="/password", tags=["password"])


@router.post("/forgot-password", response_model=Message)
async def forgot_password(
    body: PasswordResetRequest,
    background_tasks: BackgroundTasks,
    session: sessionCreator,
):
    user = await get_user(session, body.email)
    if user and user.is_active:
        token = create_password_reset_token(email=user.email)
        email_data = generate_password_reset_email(
            email_to=user.email, token=token, first_name=user.first_name
        )
        background_tasks.add_task(send_templated_email, email_data, user.email)
    return Message(message="If that email is registered, a reset link has been sent.")


@router.post("/reset-password", response_model=Message)
async def reset_password(
    body: ResetPasswordRequest,
    background_tasks: BackgroundTasks,
    session: sessionCreator,
):
    email = verify_password_reset_token(token=body.token)
    if not email:
        raise HTTPException(status_code=400, detail="Invalid or expired token")

    user = await get_user(session, email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")

    user.hashed_password = get_password_hash(body.new_password)
    session.add(user)
    await session.commit()

    email_data = generate_password_changed_email(
        email_to=user.email, first_name=user.first_name
    )
    background_tasks.add_task(send_templated_email, email_data, user.email)
    return Message(message="Password updated successfully")


@router.post("/update-password", response_model=Message)
async def update_password(
    body: UpdatePasswordRequest,
    background_tasks: BackgroundTasks,
    session: sessionCreator,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    if not verify_password(body.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect current password")
    if body.current_password == body.new_password:
        raise HTTPException(
            status_code=400, detail="New password must differ from current password"
        )

    current_user.hashed_password = get_password_hash(body.new_password)
    session.add(current_user)
    await session.commit()

    email_data = generate_password_changed_email(
        email_to=current_user.email, first_name=current_user.first_name
    )
    background_tasks.add_task(send_templated_email, email_data, current_user.email)
    return Message(message="Password updated successfully")




class SetInitialPasswordRequest(BaseModel):
    new_password: str

@router.post("/set-initial-password", response_model=Message)
async def set_initial_password(
    body: SetInitialPasswordRequest,
    session: sessionCreator,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    if not current_user.must_change_password:
        raise HTTPException(status_code=400, detail="Password change not required")

    current_user.hashed_password = get_password_hash(body.new_password)
    current_user.must_change_password = False
    current_user.status = "accepted"
    current_user.invited = True
    session.add(current_user)
    await session.commit()

    return Message(message="Password set successfully")
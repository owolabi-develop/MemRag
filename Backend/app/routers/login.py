from fastapi import APIRouter,Depends,HTTPException,status
from typing import Annotated
from app.models import Token
from app.security import authenticate_user,create_access_token
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta
from app.dependencies import sessionCreator
from dotenv import load_dotenv
import os
load_dotenv(override=True)


router = APIRouter(
    prefix="/token",
    tags=['login']
)

@router.post("/")
async def login_for_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()], session:sessionCreator
) -> Token:
    user = await authenticate_user(session,form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES")))
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return Token(access_token=access_token, token_type="bearer")
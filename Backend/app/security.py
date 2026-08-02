from pwdlib import PasswordHash, exceptions
from app.dependencies import sessionCreator
from sqlmodel import select,Session
from fastapi import Depends,HTTPException, status
from datetime import datetime, timedelta, timezone
from app.models import User,UserPublic,Token,TokenData
from jwt.exceptions import InvalidTokenError
from typing import Annotated
from fastapi.security import OAuth2PasswordBearer
import os
import jwt
import secrets
import string

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

password_hash = PasswordHash.recommended()

DUMMY_HASH = password_hash.hash("dummypassword")

def verify_password(plain_password, hashed_password):
    return password_hash.verify(plain_password, hashed_password)


def get_password_hash(password):
    return password_hash.hash(password)


async def get_user(session,email:str):
    existing_user = await session.exec(select(User).where(User.email == email))
    user = existing_user.first()
    return user
    

async def authenticate_user(session,email:str,password:str):
    user = await get_user(session,email)
    if not user:
        verify_password(password,DUMMY_HASH)
        return False
    if not verify_password(password,user.hashed_password):
        return False
    return user


def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(hours=48)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, os.getenv("SECRET_KEY"), algorithm=os.getenv("ALGORITHM"))
    return encoded_jwt


async def get_current_user(token: Annotated[str, Depends(oauth2_scheme)],session:sessionCreator):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, os.getenv("SECRET_KEY"), algorithms=[os.getenv("ALGORITHM")])
        email = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email)
    except InvalidTokenError:
        raise credentials_exception
    user = await get_user(session,email=token_data.email)
    if user is None:
        raise credentials_exception
    return user


async def get_current_active_user(
    current_user: Annotated[User, Depends(get_current_user)],
):
    user = current_user
    if user.is_active == False:
        raise HTTPException(status_code=400, detail="Inactive user")
    return user


PASSWORD_RESET_TOKEN_EXPIRE_MINUTES = int(os.getenv("PASSWORD_RESET_TOKEN_EXPIRE_MINUTES", 30))

def create_password_reset_token(email: str) -> str:
    now = datetime.now(timezone.utc)
    expires = now + timedelta(minutes=PASSWORD_RESET_TOKEN_EXPIRE_MINUTES)
    to_encode = {"sub": email, "exp": expires, "nbf": now, "type": "password_reset"}
    return jwt.encode(to_encode, os.getenv("SECRET_KEY"), algorithm=os.getenv("ALGORITHM"))


def verify_password_reset_token(token: str) -> str | None:
    try:
        decoded = jwt.decode(token, os.getenv("SECRET_KEY"), algorithms=[os.getenv("ALGORITHM")])
        if decoded.get("type") != "password_reset":
            return None
        return decoded.get("sub")
    except InvalidTokenError:
        return None
    

def generate_temp_password(length: int = 16) -> str:
    alphabet = string.ascii_letters + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


def generate_unusable_password() -> str:
    """
    Placeholder hash for invited users who haven't set a password yet.
    Long random string, never given to the user, so login attempts
    against it will always fail even if is_active were somehow True.
    """
    return get_password_hash(secrets.token_urlsafe(32))

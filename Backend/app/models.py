import uuid
from datetime import UTC, datetime
from pgvector.sqlalchemy import VECTOR
from enum import Enum
from pydantic import EmailStr
from sqlalchemy import DateTime
from sqlmodel import Field, Relationship, SQLModel
from typing import Optional,Any
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy import Column
from sqlmodel import Index,func,text
def get_datetime_utc() -> datetime:
    return datetime.now(UTC)


class UserRole(str,Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    USER = "employee"



## tenant company model
class TenantBase(SQLModel):
    name: str = Field(unique=True, index=True, max_length=255)
    description: str | None = Field(default=None, max_length=255)
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True), 
    )


    
class Tenant(TenantBase,table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True) 
    departments: list["Department"] = Relationship(back_populates="tenant",sa_relationship_kwargs={"lazy": "selectin"})
    
class TenantCreate(TenantBase):
    pass

class TenantPublic(TenantBase):
    id: uuid.UUID 
    created_at: datetime | None = None 
    
class TenantPublicWithDept(TenantPublic):
    departments: list[DepartmentPublicWithUsers] = []
## department user link
class DepartmentUserLink(SQLModel, table=True):
    department_id: uuid.UUID = Field(default=None,foreign_key="department.id", primary_key=True)
    user_id: uuid.UUID = Field(default=None,foreign_key="user.id", primary_key=True)
    
## department model
class DepartmentBase(SQLModel):
    name: str = Field(unique=True, index=True, max_length=255)
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True), 
    )


class Department(DepartmentBase,table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    tenant_id: uuid.UUID | None = Field(default=None,foreign_key="tenant.id")
    tenant: Tenant | None = Relationship(back_populates="departments")
    users: list["User"] = Relationship(back_populates="departments", sa_relationship_kwargs={"lazy": "selectin"},link_model=DepartmentUserLink)

class DepartmentPublic(DepartmentBase):
    id: uuid.UUID
    created_at: datetime | None = None
class DepartmentPublicWithUsers(DepartmentBase):
    id: uuid.UUID
    created_at: datetime | None = None
    users: list["UserPublic"] = []
class DepartmentCreate(DepartmentBase):
    pass



#user model
class UserBase(SQLModel):
    email: EmailStr = Field(unique=True, index=True, max_length=255)
    is_active: bool = True
    is_superuser: bool = False
    role: UserRole = Field(default=UserRole.USER)
    first_name: str | None = Field(default=None, max_length=255)
    last_name: str | None = Field(default=None, max_length=255)
    


class User(UserBase,table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    hashed_password: str
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    tenant_id: uuid.UUID | None = Field(default=None,foreign_key="tenant.id")
    departments: list[Department] = Relationship(back_populates="users",sa_relationship_kwargs={"lazy": "selectin"},link_model=DepartmentUserLink)

class UserPublic(UserBase):
    id: uuid.UUID
    created_at: datetime | None = None  
    
class UserCreate(UserBase):
    password: str = Field(max_length=255)











# conversation model
class ConversationBase(SQLModel):
    thread_id: str = Field(unique=True, index=True, max_length=255)
    summary_id: str | None = Field(default=None, max_length=255)
    role: str | None = Field(default=None, max_length=255)
    content: str | None = Field(default=None, max_length=1000)
    tenant_id: uuid.UUID = Field(index=True, max_length=255)
    department_id: uuid.UUID = Field(index=True, max_length=255)
    con_timestamp: datetime | None = Field(index=True,
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    con_metadata: Optional[dict] = Field(default_factory=dict, sa_column=Column(JSONB))

class ConversationPublic(ConversationBase):
    id: uuid.UUID
    
    
class Conversation(ConversationBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    owner_id: uuid.UUID = Field(
        foreign_key="user.id", nullable=False, ondelete="CASCADE"
    )
            
        
# token model

class Token(SQLModel):
    access_token: str
    token_type: str
    
class TokenData(SQLModel):
    email: str | None = None

        
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
    

# vector database models

#knowledge base model
class Semantic_Memory(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    department_id: uuid.UUID = Field(index=True, max_length=255)
    department_name: str | None = Field(default=None, max_length=1000)
    tenant_id: uuid.UUID = Field(index=True, max_length=255)
    content: str | None = Field(default=None, max_length=1000)
    embedding: Any = Field(sa_type=VECTOR(768))
    kb_metadata: Optional[dict] = Field(default_factory=dict, sa_column=Column(JSONB))
   
    __table_args__ = (
        Index(
        'semantic_emory_index_embedding',
        "embedding",
        postgresql_using='hnsw',
        postgresql_with={'m': 16, 'ef_construction': 64},
        postgresql_ops={'embedding': 'vector_cosine_ops'}
        ),
    )
    
class Workflow_Memory(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    content: str | None = Field(default=None, max_length=1000)
    embedding: Any = Field(sa_type=VECTOR(768))
    department_id: uuid.UUID = Field(index=True, max_length=255)
    tenant_id: uuid.UUID = Field(index=True, max_length=255)
    kb_metadata: Optional[dict] = Field(default_factory=dict, sa_column=Column(JSONB))
   
    __table_args__ = (
        Index(
        'workflow_memory_index_embedding',
        "embedding",
        postgresql_using='hnsw',
        postgresql_with={'m': 16, 'ef_construction': 64},
        postgresql_ops={'embedding': 'vector_cosine_ops'}
        ),
    )
    
class Toolbox_Memory(SQLModel, table=True):
        id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
        content: str | None = Field(default=None, max_length=1000)
        embedding: Any = Field(sa_type=VECTOR(768))
        kb_metadata: Optional[dict] = Field(default_factory=dict, sa_column=Column(JSONB))
       
        __table_args__ = (
            Index(
            'toolbox_memory_index_embedding',
            "embedding",
            postgresql_using='hnsw',
            postgresql_with={'m': 16, 'ef_construction': 64},
            postgresql_ops={'embedding': 'vector_cosine_ops'}
            ),
        )


class Entity_Memory(SQLModel, table=True):
        id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
        content: str | None = Field(default=None, max_length=1000)
        embedding: Any = Field(sa_type=VECTOR(768))
        department_id: uuid.UUID = Field(index=True, max_length=255)
        tenant_id: uuid.UUID = Field(index=True, max_length=255)
        kb_metadata: Optional[dict] = Field(default_factory=dict, sa_column=Column(JSONB))
       
        __table_args__ = (
            Index(
            'entity_memory_index_embedding',
            "embedding",
            postgresql_using='hnsw',
            postgresql_with={'m': 16, 'ef_construction': 64},
            postgresql_ops={'embedding': 'vector_cosine_ops'}
            ),
        )
        
class Summary_Memory(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    tenant_id: uuid.UUID = Field(index=True, max_length=255)
    department_id: uuid.UUID = Field(index=True, max_length=255)
    content: str | None = Field(default=None, max_length=1000)
    embedding: Any = Field(sa_type=VECTOR(768))
    kb_metadata: Optional[dict] = Field(default_factory=dict, sa_column=Column(JSONB))
   
    __table_args__ = (
        Index(
        'summary_memory_index_embedding',
        "embedding",
        postgresql_using='hnsw',
        postgresql_with={'m': 16, 'ef_construction': 64},
        postgresql_ops={'embedding': 'vector_cosine_ops'}
        ),
    )
    
    
class ToolLog_Memory(SQLModel, table=True):
        id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
        thread_id: str = Field(index=True, max_length=255)
        tool_call_id: str | None = Field(default=None, max_length=255)
        tool_name: str = Field(index=True, max_length=255)
        tool_args: Optional[dict] = Field(default_factory=dict, sa_column=Column(JSONB))
        result: str | None = Field(default=None, max_length=1000)
        result_review: str | None = Field(default=None, max_length=1000)
        status: str = Field(default="success", max_length=100)
        error_message: str | None = Field(default=None, max_length=1000)
        tool_metadata: Optional[dict] = Field(default_factory=dict, sa_column=Column(JSONB))
        log_timestamp: datetime | None = Field(index=True,
            default_factory=get_datetime_utc,
            sa_type=DateTime(timezone=True),  # type: ignore
        )
        
        
# token model

class Token(SQLModel):
    access_token: str
    token_type: str
    
class TokenData(SQLModel):
    email: str | None = None

        
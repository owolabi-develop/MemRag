import uuid
from datetime import UTC, datetime
from pgvector.sqlalchemy import VECTOR

from pydantic import EmailStr
from sqlalchemy import DateTime
from sqlmodel import Field, Relationship, SQLModel
from typing import Optional,Any
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy import Column
from sqlmodel import Index,func,text
def get_datetime_utc() -> datetime:
    return datetime.now(UTC)



## tenant model
class TenantBase(SQLModel):
    name: str = Field(unique=True, index=True, max_length=255)
    description: str | None = Field(default=None, max_length=255)
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    
    
class Tenant(TenantBase,table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)

class TenantCreate(TenantBase):
    pass

class TenantPublic(TenantBase):
    id: uuid.UUID
    created_at: datetime | None = None
    

#user model
class UserBase(SQLModel):
    email: EmailStr = Field(unique=True, index=True, max_length=255)
    is_active: bool = True
    is_superuser: bool = False
    department: str | None = Field(default="manager", max_length=255)
    full_name: str | None = Field(default=None, max_length=255)
    
    
    
class UserCreate(UserBase):
    password: str = Field(max_length=255)

class User(UserBase,table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    hashed_password: str
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    tenant_id: uuid.UUID | None = Field(default=None,foreign_key="tenant.id")

class UserPublic(UserBase):
    id: uuid.UUID
    created_at: datetime | None = None



# conversation model
class ConversationBase(SQLModel):
    thread_id: str = Field(unique=True, index=True, max_length=255)
    summary_id: str | None = Field(default=None, max_length=255)
    role: str | None = Field(default=None, max_length=255)
    content: str | None = Field(default=None, max_length=1000)
    tenant_id: uuid.UUID = Field(index=True, max_length=255)
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
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    department: str = Field(index=True, max_length=255)
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
        tenant_id: uuid.UUID = Field(index=True, max_length=255)
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

        
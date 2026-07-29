import uuid
from datetime import UTC, datetime
from pgvector.sqlalchemy import VECTOR
from enum import Enum
from pydantic import EmailStr
from sqlalchemy import DateTime
from sqlmodel import Field, Relationship, SQLModel
from typing import Optional
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy import Column,TEXT
from pydantic import BaseModel, EmailStr
def get_datetime_utc() -> datetime:
    return datetime.now(UTC)


class UserRole(str,Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    USER = "employee"
    
class Invite(str,Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    MAIN = "main"



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
    users: list["User"] = Relationship(back_populates="tenant",sa_relationship_kwargs={"lazy": "selectin"})
    
class TenantCreate(TenantBase):
    pass

class TenantPublic(TenantBase):
    id: uuid.UUID 
    created_at: datetime | None = None 
    
class TenantPublicWithDept(TenantPublic):
    departments: list["DepartmentPublicWithUsers"] = []
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
    documents: list["Document"] = Relationship(back_populates="department", sa_relationship_kwargs={"lazy": "selectin"})
   

class DepartmentPublic(DepartmentBase):
    id: uuid.UUID
    created_at: datetime | None = None
class DepartmentPublicWithUsers(DepartmentBase):
    id: uuid.UUID
    created_at: datetime | None = None
    users: list["UserPublic"] = []
    
class DepartmentPublicWithDocuments(DepartmentBase):
    id: uuid.UUID
    created_at: datetime | None = None
    users: list["Document"] = []
class DepartmentCreate(DepartmentBase):
    pass


# department Documents

class DocumentStatus(str, Enum):
    UPLOADING = "uploading"
    QUEUED = "queued"
    PROCESSING = "processing"
    READY = "ready"
    FAILED = "failed"
    DELETED = "deleted"
    
class Document(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    tenant_id: uuid.UUID = Field(foreign_key="tenant.id",  default=None)
    department_id: uuid.UUID | None = Field(foreign_key="department.id", default=None)
    department:Department | None = Relationship(back_populates="documents")
    filename: str
    content_type: str
    size: int
    bucket: str
    object_key: str
    uploaded_by: uuid.UUID = Field(foreign_key="user.id")
    status: DocumentStatus = Field(
        default=DocumentStatus.UPLOADING,
        index=True,
    )
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_type=DateTime(timezone=True),
    )
    

#user model
class UserBase(SQLModel):
    email: EmailStr = Field(unique=True, index=True, max_length=255)
    is_active: bool = True
    is_superuser: bool = False
    role: UserRole = Field(default=UserRole.USER)
    status: Invite = Field(default=Invite.MAIN)
    invited:bool = Field(default=False)
    first_name: str | None = Field(default=None, max_length=255)
    last_name: str | None = Field(default=None, max_length=255)
    must_change_password: bool = Field(default=False)
    


class User(UserBase,table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    hashed_password: str
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    tenant_id: uuid.UUID | None = Field(default=None,foreign_key="tenant.id")
    tenant: Tenant | None = Relationship(back_populates="users")
    departments: list[Department] = Relationship(back_populates="users",sa_relationship_kwargs={"lazy": "selectin"},link_model=DepartmentUserLink)
    
    chat_sessions:  list["ChatSession"] = Relationship(back_populates="user",sa_relationship_kwargs={"lazy": "selectin"})

class UserPublic(UserBase):
    id: uuid.UUID
    created_at: datetime | None = None  
    
class UserCreate(UserBase):
    password: str = Field(max_length=255)





#chat session
class ChatSessionBase(SQLModel):      
    title:str | None = Field(default=None, max_length=255)
   
    
class ChatSession(ChatSessionBase,table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    conversations: list["Conversation"] = Relationship(back_populates="chatsession",sa_relationship_kwargs={"lazy": "selectin"})
    con_timestamp: datetime | None = Field(index=True,
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    owner_id: uuid.UUID | None = Field(
        foreign_key="user.id", default=None
    )
    user: User | None = Relationship(back_populates="chat_sessions")
    

class ChatSessionPublic(ChatSessionBase):
    id:uuid.UUID
    created_at: datetime | None = None  




# conversation model
class ConversationBase(SQLModel):
    thread_id: str = Field(index=True, max_length=255)
    summary_id: str | None = Field(default=None, max_length=255)
    role: str | None = Field(default=None, max_length=255)
    content: str | None =  Field(sa_type=TEXT, default=None)
    tenant_id: uuid.UUID = Field(index=True)
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
    session_id: uuid.UUID | None = Field(
        foreign_key="chatsession.id", default=None
    )
    chatsession: ChatSession | None = Relationship(back_populates="conversations")
 
 
class ChatSessionPublicWithConversation(ChatSessionPublic):
    conversations: list[ConversationPublic] = []

    
# token model

class Token(SQLModel):
    access_token: str
    token_type: str
    role: str
    first_name: str | None = None
    last_name: str | None = None
    status: str
    invited: bool = False
    must_change_password: bool = False
    
class TokenData(SQLModel):
    email: str | None = None
    
    
    
    
## password reset

class PasswordResetRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class UpdatePasswordRequest(BaseModel):
    current_password: str
    new_password: str

class Message(BaseModel):
    message: str
    
    
## user invite
class UserInvite(SQLModel):
    email: EmailStr
    first_name: str | None = None
    last_name: str | None = None
    role: UserRole = UserRole.USER
    status:Invite = Invite.PENDING



class ThumbRating(str, Enum):
    LIKE = "like"
    DISLIKE = "dislike"

class FeedBackBase(SQLModel):
    session_id: str = Field(index=True, description="Ties feedback to a specific chat session")
    user_message: str = Field(description="The exact prompt sent by the user")
    agent_response: str = Field(description="The exact answer generated by the agent")
    thumb: ThumbRating = Field(description="User rating: 'like' or 'dislike'")
    
class FeedBack(FeedBackBase,table=True):
     id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
     user_id: uuid.UUID = Field(foreign_key="user.id", index=True)
     created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
     
class UpdateFeedBack(SQLModel):
    thumb: ThumbRating
     
class CreateFeedBack(FeedBackBase):
    pass
    
class FeedBackPublic(FeedBackBase):
    id:uuid.UUID
    created_at: datetime | None = None  
    
    
    

# connector model
# models/sync_job.py




class SyncStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    SUCCESS = "success"
    FAILED = "failed"


class SyncJob(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    tenant_id: uuid.UUID = Field(index=True)
    department_id: uuid.UUID = Field(index=True)
    connector_id: str
    status: SyncStatus = Field(default=SyncStatus.PENDING)
    total_files: int
    completed_files: int = 0
    failed_files: int = 0
    created_at: datetime | None = Field(default_factory=get_datetime_utc, sa_type=DateTime(timezone=True))  # type: ignore
    finished_at: datetime | None = Field(default=None, sa_type=DateTime(timezone=True))  # type: ignore

    files: list["SyncJobFile"] = Relationship(back_populates="job")


class SyncJobFile(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    job_id: uuid.UUID = Field(foreign_key="syncjob.id", index=True)
    path: str
    name: str | None = None
    status: SyncStatus = Field(default=SyncStatus.PENDING)
    error: str | None = None

    job: SyncJob = Relationship(back_populates="files")


class SyncJobFilePublic(SQLModel):
    path: str
    name: str | None
    status: SyncStatus
    error: str | None


class SyncJobPublic(SQLModel):
    id: uuid.UUID
    status: SyncStatus
    total_files: int
    completed_files: int
    failed_files: int
    files: list[SyncJobFilePublic]
    
    
    


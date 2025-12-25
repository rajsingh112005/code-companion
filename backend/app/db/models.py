import uuid
from sqlalchemy import (
    Column,
    Text,
    ForeignKey,
    CheckConstraint,
    DateTime
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(Text, unique=True, index=True)
    github_id = Column(Text, unique=True, index=True)
    name = Column(Text)
    avatar_url = Column(Text)
    created_at = Column(DateTime, server_default=func.now())

    projects = relationship("Project", back_populates="owner")
    oauth_tokens = relationship("OAuthToken", back_populates="user")

class OAuthToken(Base):
    __tablename__ = "oauth_tokens"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE")
    )
    provider = Column(Text, nullable=False)  # e.g. 'github'
    access_token_encrypted = Column(Text, nullable=False)
    refresh_token_encrypted = Column(Text)
    expires_at = Column(DateTime)
    scopes = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(
        DateTime,
        server_default=func.now(),
        onupdate=func.now()
    )
    user = relationship("User", back_populates="oauth_tokens")

class Project(Base):
    __tablename__ = "projects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))

    name = Column(Text, nullable=False)
    repo_url = Column(Text, nullable=False)
    default_branch = Column(Text, default="main")

    status = Column(
        Text,
        CheckConstraint(
            "status IN ('created' , 'failed')"
        ),
        default="created"
    )

    created_at = Column(DateTime, server_default=func.now())

    owner = relationship("User", back_populates="projects")
    chats = relationship("Chat", back_populates="project")
    indexing_jobs = relationship("IndexingJob", back_populates="project")

class IndexingJob(Base):
    __tablename__ = "indexing_jobs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"))

    status = Column(
        Text,
        CheckConstraint(
            "status IN ('queued', 'running', 'completed', 'failed')"
        ),
        default="queued"
    )

    error = Column(Text)
    started_at = Column(DateTime)
    finished_at = Column(DateTime)

    project = relationship("Project", back_populates="indexing_jobs")

class Chat(Base):
    __tablename__ = "chats"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"))
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))

    created_at = Column(DateTime, server_default=func.now())

    project = relationship("Project", back_populates="chats")
    messages = relationship(
        "Message",
        back_populates="chat",
        cascade="all, delete"
    )

class Message(Base):
    __tablename__ = "messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    chat_id = Column(
        UUID(as_uuid=True),
        ForeignKey("chats.id", ondelete="CASCADE")
    )

    role = Column(
        Text,
        CheckConstraint(
            "role IN ('user', 'assistant', 'system')"
        )
    )

    content = Column(Text, nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    chat = relationship("Chat", back_populates="messages")



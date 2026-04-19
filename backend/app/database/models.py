from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Boolean, JSON, ForeignKey, DateTime, Index, CheckConstraint
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class User(Base):
    __tablename__ = "users"
    
    __table_args__ = (
        Index('idx_user_email', 'email'),
        Index('idx_user_google_id', 'google_id'),
    )

    id = Column(Integer, primary_key=True)
    email = Column(String(255), unique=True, nullable=False)
    name = Column(String(255))
    google_id = Column(String(255), unique=True)
    avatar_url = Column(String(500))
    is_admin = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), 
                        onupdate=lambda: datetime.now(timezone.utc))
    last_login = Column(DateTime, nullable=True)

    favorites = relationship("Favorite", back_populates="user", cascade="all, delete-orphan")
    chats = relationship("Chat", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User(id={self.id}, email={self.email}, name={self.name})>"


class NeuralNet(Base):
    __tablename__ = "neural_nets"
    
    __table_args__ = (
        Index('idx_neural_net_name', 'name'),
        Index('idx_neural_net_price_type', 'price_type'),
        Index('idx_neural_net_complexity', 'complexity'),
    )

    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    url = Column(String(500), nullable=False)
    price_type = Column(String(50))
    price_details = Column(String(500))
    platforms = Column(JSON, default=list)
    has_api = Column(Boolean, default=False)
    complexity = Column(String(20))
    languages = Column(JSON, default=list)
    sanctions = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), 
                        onupdate=lambda: datetime.now(timezone.utc))

    tags = relationship("NeuralNetTag", back_populates="neural_net", cascade="all, delete-orphan")
    favorited_by = relationship("Favorite", back_populates="neural_net", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<NeuralNet(id={self.id}, name={self.name})>"


class Tag(Base):
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True)
    name = Column(String(100), unique=True, nullable=False)
    category = Column(String(50))

    neural_nets = relationship("NeuralNetTag", back_populates="tag", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Tag(id={self.id}, name={self.name}, category={self.category})>"


class NeuralNetTag(Base):
    __tablename__ = "neural_net_tags"

    neural_net_id = Column(Integer, ForeignKey("neural_nets.id", ondelete="CASCADE"), primary_key=True)
    tag_id = Column(Integer, ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True)

    neural_net = relationship("NeuralNet", back_populates="tags")
    tag = relationship("Tag", back_populates="neural_nets")


class Favorite(Base):
    __tablename__ = "favorites"

    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    neural_net_id = Column(Integer, ForeignKey("neural_nets.id", ondelete="CASCADE"), primary_key=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="favorites")
    neural_net = relationship("NeuralNet", back_populates="favorited_by")

    def __repr__(self):
        return f"<Favorite(user_id={self.user_id}, neural_net_id={self.neural_net_id})>"


class Chat(Base):
    __tablename__ = "chats"
    
    __table_args__ = (
        Index('idx_chat_user_id', 'user_id'),
        Index('idx_chat_created_at', 'created_at'),
        Index('idx_chat_user_created', 'user_id', 'created_at'),
        CheckConstraint("mode IN ('search', 'recommend', 'compare', 'fast', 'smart')", name="valid_mode"),
    )

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    mode = Column(String(20), nullable=False)
    query_text = Column(Text, nullable=False)
    filters = Column(JSON, default=list)
    results = Column(JSON, default=list)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="chats")

    def __repr__(self):
        return f"<Chat(id={self.id}, user_id={self.user_id}, mode={self.mode}, created_at={self.created_at})>"
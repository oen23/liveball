from uuid import uuid4, UUID
from typing import Optional
import datetime
from sqlalchemy import String, ForeignKey, Integer, JSON, Boolean, DateTime
from sqlalchemy.orm import mapped_column, Mapped, relationship
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()


class County(Base):
    __tablename__ = "countries"
    
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    code: Mapped[Optional[str]] = mapped_column(String(10))
    flag: Mapped[Optional[str]] = mapped_column(String(500))
    
    leagues: Mapped[list['League']] = relationship(back_populates="country")
    teams: Mapped[list['Teams']] = relationship(back_populates="country")


class League(Base):
    __tablename__ = "leagues"
    
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    country_id: Mapped[UUID] = mapped_column(ForeignKey("countries.id"))
    type: Mapped[Optional[str]] = mapped_column(String(50))
    logo: Mapped[Optional[str]] = mapped_column(String(500))
    season: Mapped[Optional[int]] = mapped_column(Integer)
    structure: Mapped[dict] = mapped_column(JSON, default={})
    
    country: Mapped['County'] = relationship(back_populates="leagues")
    teams: Mapped[list['Teams']] = relationship(back_populates="league")


class Player(Base):
    __tablename__ = "players"
    
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[Optional[str]] = mapped_column(String(100))
    number_in_team: Mapped[Optional[int]] = mapped_column(Integer)
    position: Mapped[Optional[str]] = mapped_column(String(50))
    age: Mapped[Optional[int]] = mapped_column(Integer)
    nationality: Mapped[Optional[str]] = mapped_column(String(100))
    photo: Mapped[Optional[str]] = mapped_column(String(500))
    team_id: Mapped[UUID] = mapped_column(ForeignKey("teams.id"))
    
    team: Mapped['Teams'] = relationship(back_populates="players")


class Teams(Base):
    __tablename__ = "teams"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    country_id: Mapped[UUID] = mapped_column(ForeignKey("countries.id"))
    league_id: Mapped[UUID] = mapped_column(ForeignKey("leagues.id"))
    logo_teams: Mapped[Optional[str]] = mapped_column(String(500))
    founded: Mapped[Optional[int]] = mapped_column(Integer)
    venue_name: Mapped[Optional[str]] = mapped_column(String(200))
    venue_capacity: Mapped[Optional[int]] = mapped_column(Integer)
    structure: Mapped[dict] = mapped_column(JSON, default={})
    
    country: Mapped['County'] = relationship(back_populates="teams")
    league: Mapped['League'] = relationship(back_populates="teams")
    players: Mapped[list['Player']] = relationship(back_populates="team")
    
    home_matches: Mapped[list['Match']] = relationship(
        foreign_keys='Match.home_team_id',
        back_populates='home_team'
    )
    away_matches: Mapped[list['Match']] = relationship(
        foreign_keys='Match.away_team_id',
        back_populates='away_team'
    )


class Match(Base):
    __tablename__ = "matches"
    
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    fixture_id: Mapped[int] = mapped_column(Integer, unique=True, nullable=False)
    league_id: Mapped[UUID] = mapped_column(ForeignKey("leagues.id"))
    home_team_id: Mapped[UUID] = mapped_column(ForeignKey("teams.id"))
    away_team_id: Mapped[UUID] = mapped_column(ForeignKey("teams.id"))
    
    date: Mapped[datetime.datetime] = mapped_column(DateTime, nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="NS")
    home_score: Mapped[Optional[int]] = mapped_column(Integer)
    away_score: Mapped[Optional[int]] = mapped_column(Integer)
    round: Mapped[Optional[str]] = mapped_column(String(50))
    venue: Mapped[Optional[str]] = mapped_column(String(200))
    statistics: Mapped[Optional[dict]] = mapped_column(JSON, default={})
    
    league: Mapped['League'] = relationship()
    home_team: Mapped['Teams'] = relationship(foreign_keys=[home_team_id], back_populates='home_matches')
    away_team: Mapped['Teams'] = relationship(foreign_keys=[away_team_id], back_populates='away_matches')


class Advertisement(Base):
    __tablename__ = "advertisements"
    
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    banner_path: Mapped[str] = mapped_column(String(500))
    position: Mapped[str] = mapped_column(String(50))
    link: Mapped[Optional[str]] = mapped_column(String(500))
    active: Mapped[bool] = mapped_column(default=True)


class User(Base):
    __tablename__ = "users"
    
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    username: Mapped[Optional[str]] = mapped_column(String(100), unique=True, nullable=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)
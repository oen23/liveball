from uuid import uuid4, UUID
from typing import Optional
import datetime
from sqlalchemy import String, ForeignKey, Integer, JSON
from sqlalchemy.orm import mapped_column, Mapped, relationship
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()


class County(Base):
    __tablename__ = "countries"
    
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String(100), nullable=False)  # ДОБАВЛЕНО
    code: Mapped[Optional[str]] = mapped_column(String(10))  # ДОБАВЛЕНО
    flag: Mapped[Optional[str]] = mapped_column(String(500))  # ДОБАВЛЕНО
    
    teams: Mapped[list['Teams']] = relationship(back_populates="country")

      # Связь с лигами (у страны много лиг)
    leagues: Mapped[list['League']] = relationship(back_populates="country")
    # Связь с командами (у страны много команд)
    teams: Mapped[list['Teams']] = relationship(back_populates="country")



class League(Base):
    __tablename__ = "leagues"
    
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    country_id: Mapped[UUID] = mapped_column(ForeignKey("countries.id"))
    type: Mapped[Optional[str]] = mapped_column(String(50))  # League или Cup
    logo: Mapped[Optional[str]] = mapped_column(String(500))
    season: Mapped[Optional[int]] = mapped_column(Integer)  # Текущий сезон
    structure: Mapped[dict] = mapped_column(JSON, default={})
    
    # Связи
    country: Mapped['County'] = relationship(back_populates="leagues")
    # В лиге много команд
    teams: Mapped[list['Teams']] = relationship(back_populates="league")


class Player(Base):
    __tablename__ = "players"
    
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    number_in_team: Mapped[Optional[int]] = mapped_column(Integer)
    team_id: Mapped[UUID] = mapped_column(ForeignKey("teams.id"))  # ИСПРАВЛЕНО: team -> team_id
    
    team: Mapped['Teams'] = relationship(back_populates="players")  # ДОБАВЛЕНО


class Teams(Base):
    __tablename__ = "teams"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    country_id: Mapped[UUID] = mapped_column(ForeignKey("countries.id"))
    structure: Mapped[dict] = mapped_column(JSON, default={})  # ИСПРАВЛЕНО: теперь JSON
    logo_teams: Mapped[Optional[str]] = mapped_column(String(500))
    league_id: Mapped[UUID] = mapped_column(ForeignKey("leagues.id"))  # ДОБАВЛЕНО: в какой лиге играет
    
    country: Mapped['County'] = relationship(back_populates="teams")
    players: Mapped[list['Player']] = relationship(back_populates="team")  # ДОБАВЛЕНО
    league: Mapped['League'] = relationship(back_populates="teams")  # ДОБАВЛЕНО
    
    # ИСПРАВЛЕНО: убрал problematic all_matches, добавил правильные связи
    home_matches: Mapped[list['Match']] = relationship(
        foreign_keys='Match.team_one_id',
        back_populates='team_one'
    )
    away_matches: Mapped[list['Match']] = relationship(
        foreign_keys='Match.team_two_id',
        back_populates='team_two'
    )


class Match(Base):
    __tablename__ = "match"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    translation_url: Mapped[Optional[str]] = mapped_column(String(300))
    date_time_start: Mapped[datetime.datetime] = mapped_column(default=datetime.datetime.now)
    ligue: Mapped[str] = mapped_column(String(100), nullable=False)
    team_one_id: Mapped[UUID] = mapped_column(ForeignKey("teams.id"))
    team_two_id: Mapped[UUID] = mapped_column(ForeignKey("teams.id"))
    statistics_team_one: Mapped[Optional[dict]] = mapped_column(JSON, default={})  # ИСПРАВЛЕНО: JSON
    statistics_team_two: Mapped[Optional[dict]] = mapped_column(JSON, default={})  # ИСПРАВЛЕНО: JSON

    # ИСПРАВЛЕНО: добавил back_populates
    team_one: Mapped['Teams'] = relationship(
        foreign_keys=[team_one_id],
        back_populates='home_matches'
    )
    team_two: Mapped['Teams'] = relationship(
        foreign_keys=[team_two_id],
        back_populates='away_matches'
    )


class Advertisement(Base):
    __tablename__ = "advertisement"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    banner_path: Mapped[str] = mapped_column(String(500))  # ИСПРАВЛЕНО: bannner_path -> banner_path
    position: Mapped[str] = mapped_column(String(50))
    link: Mapped[Optional[str]] = mapped_column(String(500))  # ДОБАВЛЕНО
    active: Mapped[bool] = mapped_column(default=True)  # ДОБАВЛЕНО


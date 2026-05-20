from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
from uuid import uuid4
from jose import jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from config import SessionLocal, engine, SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES
from models import Base, User, County, League, Teams, Player, Match

Base.metadata.create_all(bind=engine)

app = FastAPI(title="LiveBall API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# --- PYDANTIC СХЕМЫ ---
class UserRegister(BaseModel):
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: str
    email: str
    is_admin: bool


class Token(BaseModel):
    access_token: str
    token_type: str


# --- БД ---
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# --- АУТЕНТИФИКАЦИЯ ---
def get_password_hash(password):
    return pwd_context.hash(password)


def create_access_token(data: dict):
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    data.update({"exp": expire})
    return jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)


# --- ЭНДПОИНТЫ АУТЕНТИФИКАЦИИ ---
@app.post("/api/register", response_model=UserResponse)
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email уже зарегистрирован")
    
    new_user = User(
        id=uuid4(),
        email=user_data.email,
        hashed_password=get_password_hash(user_data.password)
    )
    db.add(new_user)
    db.commit()
    
    return UserResponse(id=str(new_user.id), email=new_user.email, is_admin=new_user.is_admin)


@app.post("/api/login", response_model=Token)
def login(user_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_data.email).first()
    if not user or not pwd_context.verify(user_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Неверный email или пароль")
    
    token = create_access_token(data={"sub": user.email})
    return {"access_token": token, "token_type": "bearer"}


# --- ЭНДПОИНТЫ ДЛЯ СПРАВОЧНИКОВ ---
@app.get("/api/countries")
def get_countries(db: Session = Depends(get_db)):
    countries = db.query(County).all()
    return [{"id": str(c.id), "name": c.name, "code": c.code, "flag": c.flag} for c in countries]


@app.get("/api/leagues")
def get_leagues(country_id: str = None, db: Session = Depends(get_db)):
    query = db.query(League)
    if country_id:
        query = query.filter(League.country_id == country_id)
    leagues = query.all()
    return [{"id": str(l.id), "name": l.name, "type": l.type, "logo": l.logo, "country_id": str(l.country_id)} for l in leagues]


@app.get("/api/teams")
def get_teams(league_id: str = None, search: str = None, limit: int = 50, db: Session = Depends(get_db)):
    query = db.query(Teams)
    if league_id:
        query = query.filter(Teams.league_id == league_id)
    if search:
        query = query.filter(Teams.name.ilike(f"%{search}%"))
    teams = query.limit(limit).all()
    return [{"id": str(t.id), "name": t.name, "logo": t.logo_teams} for t in teams]


@app.get("/api/teams/{team_id}")
def get_team_detail(team_id: str, db: Session = Depends(get_db)):
    team = db.query(Teams).filter(Teams.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Команда не найдена")
    
    players = db.query(Player).filter(Player.team_id == team_id).limit(30).all()
    
    return {
        "id": str(team.id),
        "name": team.name,
        "logo": team.logo_teams,
        "players": [{"id": str(p.id), "name": p.name, "number": p.number_in_team} for p in players]
    }


# --- ЭНДПОИНТЫ ДЛЯ МАТЧЕЙ (ГЛАВНАЯ СТРАНИЦА) ---
def format_match(match):
    """Форматирует один матч для JSON"""
    if not match:
        return None
    return {
        "id": str(match.id),
        "home_team": match.home_team.name if match.home_team else "?",
        "away_team": match.away_team.name if match.away_team else "?",
        "home_score": match.home_score,
        "away_score": match.away_score,
        "date": match.date.isoformat(),
        "status": match.status,
        "league": match.league.name if match.league else None,
        "venue": match.venue
    }


def format_matches(matches):
    """Форматирует список матчей для JSON"""
    return [format_match(m) for m in matches if m]


@app.get("/api/matches/main")
def get_main_match(db: Session = Depends(get_db)):
    """Главный матч дня"""
    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    tomorrow = today + timedelta(days=1)
    
    match = db.query(Match).filter(
        Match.date >= today,
        Match.date < tomorrow,
        Match.status.in_(['NS', 'TBD'])
    ).order_by(Match.date).first()
    
    return format_match(match)


@app.get("/api/matches/live")
def get_live_matches(db: Session = Depends(get_db)):
    """Матчи, которые идут прямо сейчас"""
    matches = db.query(Match).filter(
        Match.status.in_(['1H', '2H', 'HT', 'LIVE', 'ET', 'PEN'])
    ).order_by(Match.date).all()
    
    return format_matches(matches)


@app.get("/api/matches/upcoming")
def get_upcoming_matches(limit: int = 20, db: Session = Depends(get_db)):
    """Предстоящие матчи (ещё не начались)"""
    now = datetime.now()
    week_later = now + timedelta(days=7)
    
    matches = db.query(Match).filter(
        Match.date >= now,
        Match.date < week_later,
        Match.status.in_(['NS', 'TBD'])
    ).order_by(Match.date).limit(limit).all()
    
    return format_matches(matches)


# --- ЭНДПОИНТЫ ДЛЯ СТРАНИЦЫ ЛИГИ ---
@app.get("/api/matches/league/{league_id}")
def get_league_matches(
    league_id: str, 
    status: str = None,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """
    Матчи конкретной лиги
    status: 'live', 'upcoming', 'past', 'all' (по умолчанию 'all')
    """
    league = db.query(League).filter(League.id == league_id).first()
    if not league:
        raise HTTPException(status_code=404, detail="Лига не найдена")
    
    query = db.query(Match).filter(Match.league_id == league_id)
    now = datetime.now()
    
    if status == 'live':
        query = query.filter(Match.status.in_(['1H', '2H', 'HT', 'LIVE', 'ET', 'PEN']))
    elif status == 'upcoming':
        query = query.filter(
            Match.date >= now,
            Match.status.in_(['NS', 'TBD'])
        )
    elif status == 'past':
        query = query.filter(
            Match.date < now,
            ~Match.status.in_(['NS', 'TBD', 'CANC'])
        )
    
    matches = query.order_by(Match.date).limit(limit).all()
    
    return {
        "league": {
            "id": str(league.id),
            "name": league.name,
            "logo": league.logo
        },
        "matches": format_matches(matches)
    }


@app.get("/api/matches/team/{team_id}")
def get_team_matches(
    team_id: str,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """Матчи конкретной команды (последние и предстоящие)"""
    team = db.query(Teams).filter(Teams.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Команда не найдена")
    
    now = datetime.now()
    
    # Предстоящие матчи
    upcoming = db.query(Match).filter(
        (Match.home_team_id == team_id) | (Match.away_team_id == team_id),
        Match.date >= now,
        Match.status.in_(['NS', 'TBD'])
    ).order_by(Match.date).limit(limit).all()
    
    # Прошедшие матчи
    past = db.query(Match).filter(
        (Match.home_team_id == team_id) | (Match.away_team_id == team_id),
        Match.date < now,
        ~Match.status.in_(['NS', 'TBD', 'CANC'])
    ).order_by(Match.date.desc()).limit(limit).all()
    
    return {
        "team": {
            "id": str(team.id),
            "name": team.name,
            "logo": team.logo_teams
        },
        "upcoming": format_matches(upcoming),
        "past": format_matches(past)
    }


@app.get("/api/matches/date/{date}")
def get_matches_by_date(date: str, db: Session = Depends(get_db)):
    """Матчи за конкретную дату (формат: YYYY-MM-DD)"""
    try:
        target_date = datetime.strptime(date, '%Y-%m-%d')
        next_day = target_date + timedelta(days=1)
    except ValueError:
        raise HTTPException(status_code=400, detail="Неверный формат даты. Используйте YYYY-MM-DD")
    
    matches = db.query(Match).filter(
        Match.date >= target_date,
        Match.date < next_day
    ).order_by(Match.date).all()
    
    return format_matches(matches)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
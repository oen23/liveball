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


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_password_hash(password):
    return pwd_context.hash(password)


def create_access_token(data: dict):
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    data.update({"exp": expire})
    return jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)


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


@app.get("/api/countries")
def get_countries(db: Session = Depends(get_db)):
    countries = db.query(County).all()
    return [{"id": str(c.id), "name": c.name, "code": c.code, "flag": c.flag} for c in countries]


@app.get("/api/matches/today")
def get_todays_matches(db: Session = Depends(get_db)):
    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    tomorrow = today + timedelta(days=1)
    matches = db.query(Match).filter(Match.date >= today, Match.date < tomorrow).all()
    return [{
        "id": str(m.id),
        "home_team": m.home_team.name if m.home_team else "?",
        "away_team": m.away_team.name if m.away_team else "?",
        "home_score": m.home_score,
        "away_score": m.away_score,
        "date": m.date.isoformat(),
        "status": m.status
    } for m in matches]


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
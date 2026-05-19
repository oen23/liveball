from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

DATABASE_URL = 'postgresql://myuser:mypassword@localhost:5433/mydatabase'
engine = create_engine(DATABASE_URL, echo=False)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)

HEADERS = {
    'X-RapidAPI-Key': 'addac0065edb8ebd44a5aea5a228a72a',
    'X-RapidAPI-Host': 'v3.football.api-sports.io'
}

API_BASE_URL = 'https://v3.football.api-sports.io'

CURRENT_SEASON = 2024
SEASONS_TO_UPDATE = [2024]
TOP_LEAGUE_IDS = [39, 140, 135, 78, 61, 88, 94, 2, 3, 848]

SECRET_KEY = "your-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7

ADMIN_EMAIL = "admin@toporfoot.com"
ADMIN_PASSWORD = "tedshsd14"
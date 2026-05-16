import httpx
import time
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import County, League, Teams, Base

# --- НАСТРОЙКА БАЗЫ ДАННЫХ ---
engine = create_engine(
    'postgresql://myuser:mypassword@localhost:5433/mydatabase',
    echo=False  # Поставьте False для скорости
)

SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)

# --- ЗАГОЛОВКИ API ---
headers = {
    'X-RapidAPI-Key': 'addac0065edb8ebd44a5aea5a228a72a',
    'X-RapidAPI-Host': 'v3.football.api-sports.io'
}

API_BASE_URL = 'https://v3.football.api-sports.io'
COUNTRIES_URL = f'{API_BASE_URL}/countries'
LEAGUES_URL = f'{API_BASE_URL}/leagues'
TEAMS_URL = f'{API_BASE_URL}/teams'


def init_db():
    """Создает таблицы в базе данных"""
    print("📦 Создание таблиц...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    print("✅ Таблицы созданы\n")


def load_countries(session):
    """Загружает страны из API"""
    print("🌍 Загрузка стран...")
    
    with httpx.Client(timeout=30.0) as client:
        response = client.get(COUNTRIES_URL, headers=headers)
        response.raise_for_status()
        data = response.json()
    
    countries = data.get('response', [])
    
    for item in countries:
        country = County(
            name=item.get('name'),
            code=item.get('code'),
            flag=item.get('flag')
        )
        session.add(country)
    
    session.commit()
    print(f"   ✅ Добавлено стран: {len(countries)}\n")
    return len(countries)


def load_leagues(session):
    """Загружает лиги из API"""
    print("🏆 Загрузка лиг...")
    
    with httpx.Client(timeout=30.0) as client:
        response = client.get(LEAGUES_URL, headers=headers)
        response.raise_for_status()
        data = response.json()
    
    leagues_data = data.get('response', [])
    print(f"   📊 Получено лиг из API: {len(leagues_data)}")
    
    # Создаем словарь стран для быстрого поиска
    countries_map = {c.name: c.id for c in session.query(County).all()}
    
    added = 0
    for item in leagues_data:
        league_info = item.get('league', {})
        country_name = item.get('country', {}).get('name')
        country_id = countries_map.get(country_name)
        
        if country_id:
            league = League(
                name=league_info.get('name'),
                country_id=country_id,
                type=league_info.get('type'),
                logo=league_info.get('logo'),
                structure={'api_id': league_info.get('id')}
            )
            session.add(league)
            added += 1
    
    session.commit()
    print(f"   ✅ Добавлено лиг: {added}\n")
    return added


def load_teams(session):
    """Загружает команды для каждой лиги"""
    print("⚽ Загрузка команд...")
    
    leagues = session.query(League).all()
    print(f"   📊 Всего лиг для обработки: {len(leagues)}")
    
    total_teams = 0
    
    for i, league in enumerate(leagues, 1):
        api_league_id = league.structure.get('api_id')
        if not api_league_id:
            continue
        
        print(f"\n   [{i}/{len(leagues)}] {league.name[:50]}...")
        
        try:
            with httpx.Client(timeout=30.0) as client:
                response = client.get(TEAMS_URL, headers=headers, params={'league': api_league_id})
                response.raise_for_status()
                data = response.json()
            
            teams_data = data.get('response', [])
            
            for item in teams_data:
                team_info = item.get('team', {})
                
                team = Teams(
                    name=team_info.get('name'),
                    country_id=league.country_id,
                    league_id=league.id,
                    logo_teams=team_info.get('logo'),
                    structure={'api_id': team_info.get('id')}
                )
                session.add(team)
                total_teams += 1
            
            print(f"      ✅ Добавлено команд: {len(teams_data)}")
            session.commit()
            
            # Небольшая задержка, чтобы не перегружать API
            time.sleep(1)
            
        except Exception as e:
            print(f"      ❌ Ошибка: {e}")
            continue
    
    print(f"\n   ✅ ВСЕГО добавлено команд: {total_teams}\n")
    return total_teams


def main():
    """Основная функция"""
    print("=" * 50)
    print("🚀 ЗАГРУЗКА ДАННЫХ В БАЗУ")
    print("=" * 50)
    
    init_db()
    
    with SessionLocal() as session:
        load_countries(session)
        load_leagues(session)
        load_teams(session)
    
    print("=" * 50)
    print("✅ ВСЕ ДАННЫЕ УСПЕШНО ЗАГРУЖЕНЫ!")
    print("=" * 50)


if __name__ == "__main__":
    main()
    

# def load_countries():
#     with SessionLocal() as session:
#         load_countries(session)
#         load_leagues(session)



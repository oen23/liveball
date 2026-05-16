import httpx
import time
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import League, Teams, Player

engine = create_engine(
    'postgresql://myuser:mypassword@localhost:5433/mydatabase',
    echo=False
)

SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)

headers = {
    'X-RapidAPI-Key': 'addac0065edb8ebd44a5aea5a228a72a',
    'X-RapidAPI-Host': 'v3.football.api-sports.io'
}

API_BASE_URL = 'https://v3.football.api-sports.io'
TEAMS_URL = f'{API_BASE_URL}/teams'
PLAYERS_URL = f'{API_BASE_URL}/players'

WANTED_LEAGUE_API_IDS = [39, 140, 135, 78, 61, 88, 94, 2, 3, 848]

# ✅ МЕНЯЕМ СЕЗОН НА 2024 (доступен на бесплатном плане)
SEASON = 2024


def load_teams(session):
    print("⚽ ЗАГРУЗКА КОМАНД")
    print("=" * 50)
    
    all_leagues = session.query(League).all()
    target_leagues = []
    
    for league in all_leagues:
        api_id = league.structure.get('api_id') if league.structure else None
        if api_id in WANTED_LEAGUE_API_IDS:
            target_leagues.append(league)
            print(f"✅ Найдена лига: {league.name} (api_id: {api_id})")
    
    print(f"\n📊 Найдено нужных лиг в БД: {len(target_leagues)}")
    
    if len(target_leagues) == 0:
        print("⚠️ Ни одна из нужных лиг не найдена!")
        return
    
    with httpx.Client(timeout=30.0) as client:
        for league in target_leagues:
            api_league_id = league.structure.get('api_id')
            
            print(f"\n🏆 {league.name}")
            
            try:
                resp = client.get(TEAMS_URL, headers=headers, params={
                    'league': api_league_id,
                    'season': SEASON
                })
                resp.raise_for_status()
                data = resp.json()
                
                if data.get('errors'):
                    print(f"   ❌ Ошибка API: {data['errors']}")
                    continue
                
                teams_data = data.get('response', [])
                print(f"   📊 Получено команд из API: {len(teams_data)}")
                
                added = 0
                for item in teams_data:
                    team_info = item.get('team', {})
                    
                    existing = session.query(Teams).filter_by(
                        name=team_info.get('name'),
                        league_id=league.id
                    ).first()
                    
                    if not existing:
                        team = Teams(
                            name=team_info.get('name'),
                            country_id=league.country_id,
                            league_id=league.id,
                            logo_teams=team_info.get('logo'),
                            structure={'api_id': team_info.get('id')}
                        )
                        session.add(team)
                        added += 1
                
                session.commit()
                print(f"   ✅ Добавлено новых команд: {added}")
                time.sleep(1)
                
            except Exception as e:
                print(f"   ❌ Ошибка: {e}")


def load_players(session):
    print("\n👥 ЗАГРУЗКА ИГРОКОВ")
    print("=" * 50)
    
    all_teams = session.query(Teams).all()
    
    target_league_ids = []
    for league in session.query(League).all():
        api_id = league.structure.get('api_id') if league.structure else None
        if api_id in WANTED_LEAGUE_API_IDS:
            target_league_ids.append(league.id)
    
    teams = [t for t in all_teams if t.league_id in target_league_ids]
    
    print(f"📊 Всего команд для обработки: {len(teams)}")
    
    if len(teams) == 0:
        print("⚠️ Нет команд для выбранных лиг. Сначала запустите load_teams()")
        return
    
    total_players = 0
    
    with httpx.Client(timeout=30.0) as client:
        for i, team in enumerate(teams, 1):
            api_team_id = team.structure.get('api_id') if team.structure else None
            
            if not api_team_id:
                print(f"\n   [{i}/{len(teams)}] ⚠️ {team.name[:40]} - нет api_id")
                continue
            
            print(f"\n   [{i}/{len(teams)}] {team.name[:40]}...")
            
            try:
                resp = client.get(PLAYERS_URL, headers=headers, params={
                    'team': api_team_id,
                    'season': SEASON
                })
                resp.raise_for_status()
                data = resp.json()
                
                if data.get('errors'):
                    print(f"      ⚠️ Ошибка API: {data['errors']}")
                    continue
                
                players_data = data.get('response', [])
                added = 0
                
                for player_item in players_data:
                    player_info = player_item.get('player', {})
                    player_name = player_info.get('name')
                    
                    if not player_name:
                        continue
                    
                    existing = session.query(Player).filter_by(
                        name=player_name,
                        team_id=team.id
                    ).first()
                    
                    if not existing:
                        player = Player(
                            name=player_name,
                            first_name=player_info.get('firstname') or '',
                            number_in_team=player_info.get('number'),
                            team_id=team.id
                        )
                        session.add(player)
                        added += 1
                        total_players += 1
                
                if added > 0:
                    print(f"      ✅ Добавлено игроков: {added}")
                session.commit()
                time.sleep(1.5)
                
            except Exception as e:
                print(f"      ❌ Ошибка: {e}")
    
    print(f"\n✅ ВСЕГО добавлено игроков: {total_players}")


def main():
    print("=" * 60)
    print(f"🚀 ЗАГРУЗКА КОМАНД И ИГРОКОВ (ТОП-ЛИГИ, СЕЗОН {SEASON})")
    print("=" * 60)
    
    print(f"\n📋 Список ID лиг для загрузки: {WANTED_LEAGUE_API_IDS}")
    print(f"⚠️  Внимание: Используется сезон {SEASON} (доступен на бесплатном плане)")
    
    with SessionLocal() as session:
        load_teams(session)
        load_players(session)
    
    print("\n✅ ГОТОВО!")


if __name__ == "__main__":
    main()
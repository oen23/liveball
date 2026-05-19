import httpx
import time
from datetime import datetime, timedelta
from config import SessionLocal, HEADERS, API_BASE_URL, TOP_LEAGUE_IDS, CURRENT_SEASON
from models import Match, League, Teams

FIXTURES_URL = f'{API_BASE_URL}/fixtures'

def update_today_matches():
    today = datetime.now().strftime('%Y-%m-%d')
    print(f"\n🔄 ОБНОВЛЕНИЕ МАТЧЕЙ НА {today}")
    print("=" * 50)
    
    all_matches = []
    
    for league_id in TOP_LEAGUE_IDS:
        params = {'date': today, 'league': league_id, 'season': CURRENT_SEASON}
        
        # Увеличиваем таймаут и добавляем повторные попытки
        for attempt in range(3):
            try:
                with httpx.Client(timeout=60.0) as client:
                    resp = client.get(FIXTURES_URL, headers=HEADERS, params=params)
                    if resp.status_code == 200:
                        matches = resp.json().get('response', [])
                        all_matches.extend(matches)
                        print(f"   Лига {league_id}: {len(matches)} матчей")
                        break
                    else:
                        print(f"   ❌ Ошибка лиги {league_id}: {resp.status_code}")
                        break
            except httpx.ReadTimeout:
                print(f"   ⚠️ Таймаут для лиги {league_id}, попытка {attempt + 1}/3...")
                time.sleep(5)
            except Exception as e:
                print(f"   ❌ Ошибка для лиги {league_id}: {e}")
                break
        
        time.sleep(1)  # Пауза между лигами
    
    if not all_matches:
        print("⚠️ Матчей на сегодня нет (или ошибка соединения)")
        return
    
    with SessionLocal() as session:
        today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        tomorrow_start = today_start + timedelta(days=1)
        deleted = session.query(Match).filter(Match.date >= today_start, Match.date < tomorrow_start).delete()
        print(f"   🗑️ Удалено старых матчей: {deleted}")
        
        added = 0
        for match_data in all_matches:
            fixture = match_data.get('fixture', {})
            league_data = match_data.get('league', {})
            teams_data = match_data.get('teams', {})
            goals_data = match_data.get('goals', {})
            
            league = session.query(League).filter(League.structure['api_id'].astext == str(league_data.get('id'))).first()
            if not league: continue
            
            home_team = session.query(Teams).filter(Teams.name == teams_data.get('home', {}).get('name')).first()
            away_team = session.query(Teams).filter(Teams.name == teams_data.get('away', {}).get('name')).first()
            if not home_team or not away_team: continue
            
            date_str = fixture.get('date')
            match_date = datetime.fromisoformat(date_str.replace('Z', '+00:00')) if date_str else datetime.now()
            
            existing = session.query(Match).filter(Match.fixture_id == fixture.get('id')).first()
            if existing:
                existing.status = fixture.get('status', {}).get('short', 'NS')
                existing.home_score = goals_data.get('home')
                existing.away_score = goals_data.get('away')
            else:
                new_match = Match(
                    fixture_id=fixture.get('id'),
                    league_id=league.id,
                    home_team_id=home_team.id,
                    away_team_id=away_team.id,
                    date=match_date,
                    status=fixture.get('status', {}).get('short', 'NS'),
                    home_score=goals_data.get('home'),
                    away_score=goals_data.get('away'),
                    round=fixture.get('round'),
                    venue=fixture.get('venue', {}).get('name')
                )
                session.add(new_match)
                added += 1
        
        session.commit()
        print(f"   ✅ Добавлено новых матчей: {added}")
    print("=" * 50)

if __name__ == "__main__":
    update_today_matches()
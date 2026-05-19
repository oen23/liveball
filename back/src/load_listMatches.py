import httpx
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from config import SessionLocal, HEADERS, API_BASE_URL
from models import Match, League, Teams

FIXTURES_URL = f'{API_BASE_URL}/fixtures'

# ID только топ-лиг (которые тебя интересуют)
TOP_LEAGUE_IDS = [39, 140, 135, 78, 61, 88, 94, 2, 3, 848]


def get_matches_for_date(date_str: str):
    """
    Получает матчи за конкретную дату только для топ-лиг
    date_str: '2026-05-19'
    """
    print(f"📅 Загрузка матчей на {date_str}")
    
    with httpx.Client(timeout=30.0) as client:
        all_matches = []
        
        # Загружаем матчи отдельно для каждой топ-лиги
        for league_id in TOP_LEAGUE_IDS:
            params = {
                'date': date_str,
                'league': league_id,
                'season': 2025  # 2025/2026 сезон
            }
            
            response = client.get(FIXTURES_URL, headers=HEADERS, params=params)
            
            if response.status_code == 200:
                matches = response.json().get('response', [])
                all_matches.extend(matches)
                print(f"   Лига ID {league_id}: {len(matches)} матчей")
            else:
                print(f"   ❌ Ошибка для лиги {league_id}: {response.status_code}")
            
            # Небольшая пауза, чтобы не перегружать API
            import time
            time.sleep(0.5)
        
        return all_matches


def save_matches_to_db(matches_data, target_date: str):
    """Сохраняет матчи в БД (старые удаляет, новые добавляет)"""
    
    with SessionLocal() as session:
        # 1. Удаляем старые матчи за эту дату (чтобы не было дублей)
        date_obj = datetime.strptime(target_date, '%Y-%m-%d')
        next_day = date_obj + timedelta(days=1)
        
        deleted = session.query(Match).filter(
            Match.date >= date_obj,
            Match.date < next_day
        ).delete()
        print(f"   🗑️ Удалено старых матчей: {deleted}")
        
        # 2. Добавляем новые матчи
        added = 0
        for match_data in matches_data:
            fixture = match_data.get('fixture', {})
            league_data = match_data.get('league', {})
            teams_data = match_data.get('teams', {})
            goals_data = match_data.get('goals', {})
            
            # Находим лигу в БД по api_id
            api_league_id = league_data.get('id')
            league = session.query(League).filter(
                League.structure['api_id'].astext == str(api_league_id)
            ).first()
            
            if not league:
                continue
            
            # Находим команды
            home_team_name = teams_data.get('home', {}).get('name')
            away_team_name = teams_data.get('away', {}).get('name')
            
            home_team = session.query(Teams).filter(
                Teams.name == home_team_name,
                Teams.league_id == league.id
            ).first()
            
            away_team = session.query(Teams).filter(
                Teams.name == away_team_name,
                Teams.league_id == league.id
            ).first()
            
            if not home_team or not away_team:
                # Если не нашли по лиге, ищем по имени без привязки
                home_team = session.query(Teams).filter(Teams.name == home_team_name).first()
                away_team = session.query(Teams).filter(Teams.name == away_team_name).first()
                
                if not home_team or not away_team:
                    continue
            
            # Парсим дату
            date_str = fixture.get('date')
            if date_str:
                # Убираем 'Z' в конце и преобразуем
                match_date = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
            else:
                match_date = datetime.now()
            
            # Создаём матч
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
        return added


def update_matches_for_today():
    """Обновляет матчи на сегодня"""
    today = datetime.now().strftime('%Y-%m-%d')
    print(f"\n🔄 ОБНОВЛЕНИЕ МАТЧЕЙ НА {today}")
    print("=" * 50)
    
    matches = get_matches_for_date(today)
    print(f"\n📊 Всего найдено матчей: {len(matches)}")
    
    if matches:
        save_matches_to_db(matches, today)
    else:
        print("⚠️ Матчей на сегодня нет")
    
    print("=" * 50)


def update_matches_for_tomorrow():
    """Обновляет матчи на завтра (можно запускать вечером)"""
    tomorrow = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
    print(f"\n🔄 ОБНОВЛЕНИЕ МАТЧЕЙ НА {tomorrow}")
    print("=" * 50)
    
    matches = get_matches_for_date(tomorrow)
    print(f"\n📊 Всего найдено матчей: {len(matches)}")
    
    if matches:
        save_matches_to_db(matches, tomorrow)
    else:
        print("⚠️ Матчей на завтра нет")
    
    print("=" * 50)


def update_matches_for_date_range(start_date: str, end_date: str):
    """Обновляет матчи за период (например, неделя)"""
    start = datetime.strptime(start_date, '%Y-%m-%d')
    end = datetime.strptime(end_date, '%Y-%m-%d')
    
    current = start
    while current <= end:
        date_str = current.strftime('%Y-%m-%d')
        matches = get_matches_for_date(date_str)
        if matches:
            save_matches_to_db(matches, date_str)
        current += timedelta(days=1)
        import time
        time.sleep(2)  # Пауза между днями


if __name__ == "__main__":
    # Запускаем обновление на сегодня
    update_matches_for_today()
    
    # Если хочешь также обновить на завтра
    # update_matches_for_tomorrow()
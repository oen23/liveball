import httpx
import time
import json
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from back.src.models import Teams, Player

engine = create_engine('postgresql://myuser:mypassword@localhost:5433/mydatabase', echo=False)
SessionLocal = sessionmaker(bind=engine)

headers = {
    'X-RapidAPI-Key': 'addac0065edb8ebd44a5aea5a228a72a',
    'X-RapidAPI-Host': 'v3.football.api-sports.io'
}
PLAYERS_URL = 'https://v3.football.api-sports.io/players'
SEASON = 2024

# Файл для сохранения прогресса
PROGRESS_FILE = 'load_progress.json'


def load_players_safe():
    """Загружает игроков с сохранением прогресса и большими задержками"""
    
    # Загружаем прогресс
    try:
        with open(PROGRESS_FILE, 'r') as f:
            progress = json.load(f)
            last_team_id = progress.get('last_team_id')
            print(f"📌 Продолжаем с последней обработанной команды ID: {last_team_id}")
    except:
        last_team_id = None
        print("📌 Новый запуск")
    
    with SessionLocal() as session:
        # Получаем команды без игроков
        if last_team_id:
            teams = session.query(Teams).filter(
                Teams.id > last_team_id,
                ~Teams.players.any()
            ).order_by(Teams.id).all()
        else:
            teams = session.query(Teams).filter(~Teams.players.any()).order_by(Teams.id).all()
        
        total_teams = len(teams)
        print(f"👥 Осталось загрузить игроков для {total_teams} команд")
        
        if total_teams == 0:
            print("✅ Все игроки уже загружены!")
            return
        
        total_players = 0
        request_count = 0
        
        for idx, team in enumerate(teams, 1):
            api_team_id = team.structure.get('api_id') if team.structure else None
            if not api_team_id:
                continue
            
            print(f"\n   [{idx}/{total_teams}] {team.name[:45]}...")
            
            # Пауза между запросами - 10 секунд
            if request_count > 0:
                print(f"      💤 Пауза 10 секунд перед следующим запросом...")
                time.sleep(10)
            
            try:
                with httpx.Client(timeout=60.0) as client:
                    resp = client.get(PLAYERS_URL, headers=headers, params={
                        'team': api_team_id,
                        'season': SEASON
                    })
                    request_count += 1
                    
                    if resp.status_code == 429:
                        # При ошибке 429 ждем 5 минут
                        wait_time = 300
                        print(f"      ⚠️ Лимит запросов! Ждем {wait_time} секунд (5 минут)...")
                        time.sleep(wait_time)
                        # Повторяем запрос
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
                        
                        # Проверка на существование игрока
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
                    
                    session.commit()
                    print(f"      ✅ Добавлено игроков: {added}")
                    
                    # Сохраняем прогресс
                    progress = {'last_team_id': str(team.id)}
                    with open(PROGRESS_FILE, 'w') as f:
                        json.dump(progress, f)
                
            except httpx.HTTPStatusError as e:
                if e.response.status_code == 429:
                    print(f"      ❌ Лимит исчерпан. Подождите час или обновите тариф.")
                    print(f"      💾 Прогресс сохранен. Запустите скрипт позже.")
                    # Сохраняем прогресс
                    progress = {'last_team_id': str(team.id)}
                    with open(PROGRESS_FILE, 'w') as f:
                        json.dump(progress, f)
                    break
                else:
                    print(f"      ❌ HTTP ошибка: {e}")
            except Exception as e:
                print(f"      ❌ Ошибка: {e}")
            
            # Дополнительная пауза каждые 10 запросов
            if request_count % 10 == 0 and request_count > 0:
                print(f"      🔄 Сделано {request_count} запросов. Пауза 30 секунд...")
                time.sleep(30)
        
        print(f"\n✅ Добавлено игроков за сессию: {total_players}")
        
        # Удаляем файл прогресса если всё загружено
        remaining = session.query(Teams).filter(~Teams.players.any()).count()
        if remaining == 0:
            import os
            if os.path.exists(PROGRESS_FILE):
                os.remove(PROGRESS_FILE)
                print("✅ Все команды обработаны! Файл прогресса удален.")


if __name__ == "__main__":
    load_players_safe()
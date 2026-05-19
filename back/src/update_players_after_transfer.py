import httpx
import time
import json
from datetime import datetime
from config import SessionLocal, HEADERS, API_BASE_URL, SEASONS_TO_UPDATE
from models import Teams, Player

PLAYERS_URL = f'{API_BASE_URL}/players'
PROGRESS_FILE = 'update_players_progress.json'

def update_players_for_season(season: int):
    print(f"\n🔄 ОБНОВЛЕНИЕ ИГРОКОВ ЗА СЕЗОН {season}")
    print("=" * 50)
    
    with SessionLocal() as session:
        teams = session.query(Teams).all()
        print(f"📊 Команд для обработки: {len(teams)}")
        
        total_added = 0
        total_updated = 0
        total_deleted = 0
        
        with httpx.Client(timeout=60.0) as client:
            for idx, team in enumerate(teams, 1):
                api_team_id = team.structure.get('api_id') if team.structure else None
                if not api_team_id:
                    continue
                
                print(f"\n   [{idx}/{len(teams)}] {team.name[:45]}...")
                
                try:
                    resp = client.get(PLAYERS_URL, headers=HEADERS, params={'team': api_team_id, 'season': season})
                    
                    if resp.status_code == 429:
                        print(f"      ⚠️ Лимит! Ждём 5 минут...")
                        time.sleep(300)
                        resp = client.get(PLAYERS_URL, headers=HEADERS, params={'team': api_team_id, 'season': season})
                    
                    resp.raise_for_status()
                    data = resp.json()
                    
                    if data.get('errors'):
                        print(f"      ⚠️ Ошибка: {data['errors']}")
                        continue
                    
                    players_data = data.get('response', [])
                    current_players = session.query(Player).filter(Player.team_id == team.id).all()
                    current_player_names = {p.name for p in current_players}
                    
                    api_player_names = set()
                    added = 0
                    updated = 0
                    
                    for player_item in players_data:
                        player_info = player_item.get('player', {})
                        player_name = player_info.get('name')
                        if not player_name:
                            continue
                        
                        api_player_names.add(player_name)
                        existing = session.query(Player).filter(Player.name == player_name).first()
                        
                        if existing:
                            if existing.team_id != team.id or existing.number_in_team != player_info.get('number'):
                                existing.team_id = team.id
                                existing.number_in_team = player_info.get('number')
                                updated += 1
                                total_updated += 1
                        else:
                            new_player = Player(
                                name=player_name,
                                first_name=player_info.get('firstname') or '',
                                number_in_team=player_info.get('number'),
                                team_id=team.id
                            )
                            session.add(new_player)
                            added += 1
                            total_added += 1
                    
                    players_to_remove = current_player_names - api_player_names
                    for player_name in players_to_remove:
                        player = session.query(Player).filter(Player.name == player_name, Player.team_id == team.id).first()
                        if player:
                            session.delete(player)
                            total_deleted += 1
                    
                    session.commit()
                    print(f"      ✅ Добавлено: {added}, Обновлено: {updated}, Удалено: {len(players_to_remove)}")
                    
                    with open(PROGRESS_FILE, 'w') as f:
                        json.dump({'last_team_id': str(team.id), 'season': season, 'updated_at': datetime.now().isoformat()}, f)
                    
                    time.sleep(3)
                    
                except Exception as e:
                    print(f"      ❌ Ошибка: {e}")
                    session.rollback()
                    continue
        
        print(f"\n✅ Сезон {season}: добавлено {total_added}, обновлено {total_updated}, удалено {total_deleted}")

def update_all_players():
    print("🚀 НАЧАЛО ОБНОВЛЕНИЯ ИГРОКОВ (ПОСЛЕ ТРАНСФЕРНОГО ОКНА)")
    for season in SEASONS_TO_UPDATE:
        update_players_for_season(season)
        time.sleep(10)
    print("\n✅ ОБНОВЛЕНИЕ ИГРОКОВ ЗАВЕРШЕНО!")

if __name__ == "__main__":
    update_all_players()
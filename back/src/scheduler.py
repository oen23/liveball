import time
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from update_matches_daily import update_today_matches
from update_players_after_transfer import update_all_players

scheduler = BackgroundScheduler()

def start_scheduler():
    scheduler.add_job(update_today_matches, CronTrigger(hour='8,12,16,20', minute=0), id='daily_matches')
    scheduler.add_job(update_all_players, CronTrigger(month='7', day='1', hour='6', minute=0), id='summer_transfer')
    scheduler.add_job(update_all_players, CronTrigger(month='2', day='1', hour='6', minute=0), id='winter_transfer')
    scheduler.start()
    print("✅ Планировщик запущен")

def stop_scheduler():
    scheduler.shutdown()
    print("⏹️ Планировщик остановлен")

if __name__ == "__main__":
    start_scheduler()
    try:
        while True:
            time.sleep(60)
    except KeyboardInterrupt:
        stop_scheduler()
import asyncio
from datetime import datetime, timedelta
import re
from app.api.studio import _pipelines, _running_pipelines, save_pipelines
from app.core.pipeline_runner import run_pipeline

# Very simple cron parser to handle basic cases
def is_cron_due(cron_expr: str, last_run: datetime, now: datetime) -> bool:
    # A true cron parser is complex. 
    # For MVP, we check if we haven't run in the last minute.
    # We will trigger if the minute matches.
    if not last_run or (now - last_run).total_seconds() > 59:
        parts = cron_expr.split()
        if len(parts) >= 5:
            c_min, c_hour, c_day, c_month, c_dow = parts[:5]
            
            # Simple match for minute and hour
            min_match = c_min == "*" or str(now.minute) == c_min
            hour_match = c_hour == "*" or str(now.hour) == c_hour
            
            return min_match and hour_match
    return False

def parse_interval(interval_str: str) -> int:
    """Returns interval in seconds"""
    match = re.match(r'(\d+)([mhd])', interval_str)
    if not match: return 3600 # Default 1h
    
    val = int(match.group(1))
    unit = match.group(2)
    
    if unit == 'm': return val * 60
    if unit == 'h': return val * 3600
    if unit == 'd': return val * 86400
    return 3600

async def scheduler_loop():
    print("⏳ Headless Scheduler Loop Started")
    while True:
        try:
            now = datetime.utcnow()
            for user_id, pipelines in _pipelines.items():
                for pipeline in pipelines:
                    schedule = pipeline.get("schedule")
                    if not schedule or not schedule.get("active"):
                        continue
                        
                    last_run = schedule.get("last_run")
                    if isinstance(last_run, str):
                        last_run = datetime.fromisoformat(last_run)
                        
                    should_run = False
                    
                    if schedule.get("type") == "interval":
                        interval_sec = parse_interval(schedule.get("interval", "1h"))
                        if not last_run or (now - last_run).total_seconds() >= interval_sec:
                            should_run = True
                            
                    elif schedule.get("type") == "cron":
                        if is_cron_due(schedule.get("cron", "0 * * * *"), last_run, now):
                            should_run = True
                            
                    if should_run:
                        # Update last_run immediately to avoid double-trigger in the next 30s check
                        pipeline["schedule"]["last_run"] = now.isoformat()
                        save_pipelines()
                        
                        # Run pipeline headlessly with tracking
                        _running_pipelines.add((user_id, pipeline["id"]))
                        async def tracked_run():
                            try:
                                await run_pipeline(pipeline, user_id)
                            finally:
                                _running_pipelines.remove((user_id, pipeline["id"]))
                        
                        asyncio.create_task(tracked_run())
                        
        except Exception as e:
            print(f"Scheduler error: {e}")
            
        # Check every 30 seconds
        await asyncio.sleep(30)

def start_scheduler():
    asyncio.create_task(scheduler_loop())

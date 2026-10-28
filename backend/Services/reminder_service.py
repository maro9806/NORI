import os
import json
import uuid
import time
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional

REMINDERS_FILE = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "data", "reminders.json")
)


def _ensure_file():
    os.makedirs(os.path.dirname(REMINDERS_FILE), exist_ok=True)
    if not os.path.exists(REMINDERS_FILE):
        with open(REMINDERS_FILE, "w", encoding="utf-8") as f:
            json.dump({"reminders": []}, f, ensure_ascii=False, indent=2)


def load_reminders() -> List[Dict[str, Any]]:
    _ensure_file()
    try:
        with open(REMINDERS_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data.get("reminders", [])
    except Exception:
        return []


def save_reminders(reminders: List[Dict[str, Any]]):
    _ensure_file()
    with open(REMINDERS_FILE, "w", encoding="utf-8") as f:
        json.dump({"reminders": reminders}, f, ensure_ascii=False, indent=2)


def add_reminder(
    message: str,
    duration_seconds: int = 0,
    target_time_str: str = ""
) -> Dict[str, Any]:
    """새로운 타이머 또는 리마인더를 등록합니다."""
    now = datetime.now()
    now_ts = time.time()
    trigger_dt = None

    if duration_seconds and duration_seconds > 0:
        trigger_dt = now + timedelta(seconds=int(duration_seconds))
    elif target_time_str and target_time_str.strip():
        t_str = target_time_str.strip()
        for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M", "%H:%M:%S", "%H:%M"):
            try:
                parsed = datetime.strptime(t_str, fmt)
                if fmt in ("%H:%M:%S", "%H:%M"):
                    trigger_dt = now.replace(
                        hour=parsed.hour,
                        minute=parsed.minute,
                        second=parsed.second if fmt == "%H:%M:%S" else 0,
                        microsecond=0
                    )
                    if trigger_dt <= now:
                        trigger_dt += timedelta(days=1)
                else:
                    trigger_dt = parsed
                break
            except ValueError:
                continue

    if trigger_dt is None:
        # 기본 60초 타이머 폴백
        duration_seconds = max(int(duration_seconds or 60), 1)
        trigger_dt = now + timedelta(seconds=duration_seconds)

    trigger_ts = trigger_dt.timestamp()
    remaining_sec = max(int(round(trigger_ts - now_ts)), 1)

    item = {
        "id": f"rem_{uuid.uuid4().hex[:8]}",
        "message": message.strip() or "예정된 알림 시간입니다, 주인님.",
        "created_at": now.strftime("%Y-%m-%d %H:%M:%S"),
        "trigger_at_str": trigger_dt.strftime("%Y-%m-%d %H:%M:%S"),
        "trigger_timestamp": trigger_ts,
        "duration_seconds": remaining_sec,
        "triggered": False
    }

    reminders = load_reminders()
    reminders.append(item)
    save_reminders(reminders)
    return item


def get_reminders_status() -> Dict[str, Any]:
    """현재 대기 중인 활성 타이머 목록과 시간이 도래한(due) 알림 목록을 반환합니다."""
    reminders = load_reminders()
    now_ts = time.time()

    due_list = []
    active_list = []
    changed = False

    for r in reminders:
        if r.get("triggered"):
            continue
        trig_ts = float(r.get("trigger_timestamp", 0))
        if now_ts >= trig_ts:
            r["triggered"] = True
            r["triggered_at"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            due_list.append(r)
            changed = True
        else:
            r_copy = dict(r)
            r_copy["remaining_seconds"] = max(int(round(trig_ts - now_ts)), 0)
            active_list.append(r_copy)

    if changed:
        # 너무 오래된 완료 알림은 정리 (최근 30개만 유지)
        active_or_recent = [r for r in reminders if not r.get("triggered")][-50:]
        save_reminders(active_or_recent)

    return {
        "active": active_list,
        "due": due_list,
        "server_time": now_ts
    }


def delete_reminder(rem_id: str) -> bool:
    reminders = load_reminders()
    new_list = [r for r in reminders if r.get("id") != rem_id]
    if len(new_list) == len(reminders):
        return False
    save_reminders(new_list)
    return True

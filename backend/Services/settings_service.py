# 5대 전역 설정과 허용 폴더(Workspace) 화이트리스트 목록 CRUD
import os
import json

SETTINGS_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "settings.json"))

DEFAULT_SETTINGS = {
    "api_key": "",
    "workspace_dir": os.path.abspath(r"D:\AIproject"),
    "model_name": "gemini-3.8-flash",
    "stt_model": "gemini-3.8-flash",
    "temperature": 0.2,
    "allowed_workspaces": [
        {
            "id": "ws_main",
            "alias": "기본 작업 폴더",
            "path": os.path.abspath(r"D:\AIproject"),
            "read_only": False,
            "enabled": True
        }
    ]
}

def load_settings() -> dict:
    os.makedirs(os.path.dirname(SETTINGS_PATH), exist_ok=True)
    if not os.path.exists(SETTINGS_PATH):
        with open(SETTINGS_PATH, "w", encoding="utf-8") as f:
            json.dump(DEFAULT_SETTINGS, f, indent=2, ensure_ascii=False)
        return DEFAULT_SETTINGS.copy()
    
    try:
        with open(SETTINGS_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return DEFAULT_SETTINGS.copy()

def update_settings(new_data: dict) -> dict:
    current = load_settings()
    current.update(new_data)
    with open(SETTINGS_PATH, "w", encoding="utf-8") as f:
        json.dump(current, f, indent=2, ensure_ascii=False)
    return current
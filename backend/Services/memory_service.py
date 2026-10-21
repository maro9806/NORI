import os
import json
import time
from typing import Dict, List, Any, Optional

MEMORY_FILE_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "hyper_memory.json"))

DEFAULT_HYPER_MEMORY = {
    "user_profile": {
        "title": "주인님",
        "bio": "개인 디지털 비서 미노리의 사용자",
        "updated_at": ""
    },
    "memories": [
        {
            "id": "mem_default_1",
            "category": "비서 지침",
            "content": "미노리는 아이언맨의 자비스처럼 정중하고 신뢰할 수 있으며, 사용자를 '주인님'으로 부른다.",
            "created_at": time.strftime("%Y-%m-%d %H:%M:%S"),
            "active": True
        },
        {
            "id": "mem_default_2",
            "category": "작업 환경",
            "content": "기본 작업 공간은 D:\\AIproject 이며 로컬 파일 시스템을 안전하게 탐색하고 보좌한다.",
            "created_at": time.strftime("%Y-%m-%d %H:%M:%S"),
            "active": True
        }
    ]
}


def load_hyper_memory() -> Dict[str, Any]:
    """하이퍼 메모리(장기 기억 저장소) 로드."""
    os.makedirs(os.path.dirname(MEMORY_FILE_PATH), exist_ok=True)
    if not os.path.exists(MEMORY_FILE_PATH):
        save_hyper_memory(DEFAULT_HYPER_MEMORY)
        return DEFAULT_HYPER_MEMORY.copy()

    try:
        with open(MEMORY_FILE_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return DEFAULT_HYPER_MEMORY.copy()


def save_hyper_memory(data: Dict[str, Any]) -> bool:
    """하이퍼 메모리 영구 저장."""
    os.makedirs(os.path.dirname(MEMORY_FILE_PATH), exist_ok=True)
    try:
        with open(MEMORY_FILE_PATH, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        return True
    except Exception as e:
        print(f"[오류] 하이퍼 메모리 저장 실패: {e}")
        return False


def add_memory(category: str, content: str) -> Dict[str, Any]:
    """새로운 장기 기억 항목 자율 추가."""
    data = load_hyper_memory()
    mem_id = f"mem_{int(time.time() * 1000)}"
    new_item = {
        "id": mem_id,
        "category": category.strip() or "일반 지침",
        "content": content.strip(),
        "created_at": time.strftime("%Y-%m-%d %H:%M:%S"),
        "active": True
    }
    data.setdefault("memories", []).append(new_item)
    save_hyper_memory(data)
    return new_item


def delete_memory(mem_id: str) -> bool:
    """특정 기억 항목 삭제."""
    data = load_hyper_memory()
    original_len = len(data.get("memories", []))
    data["memories"] = [m for m in data.get("memories", []) if m.get("id") != mem_id]
    if len(data["memories"]) < original_len:
        save_hyper_memory(data)
        return True
    return False


def toggle_memory_active(mem_id: str, active: bool) -> bool:
    """기억 활성/비활성 토글."""
    data = load_hyper_memory()
    for m in data.get("memories", []):
        if m.get("id") == mem_id:
            m["active"] = active
            save_hyper_memory(data)
            return True
    return False


def get_active_memory_prompt() -> str:
    """활성화된 모든 장기 기억을 시스템 프롬프트 주입용 텍스트로 컴파일."""
    data = load_hyper_memory()
    active_mems = [m for m in data.get("memories", []) if m.get("active", True)]
    
    if not active_mems:
        return ""

    lines = ["[미노리 하이퍼 메모리 (사용자에 대해 스스로 기억하고 있는 장기 기억)]"]
    profile = data.get("user_profile", {})
    if profile.get("title") or profile.get("bio"):
        lines.append(f"- 사용자 호칭: {profile.get('title', '주인님')}")
        if profile.get("bio"):
            lines.append(f"- 사용자 소개: {profile.get('bio')}")

    for idx, mem in enumerate(active_mems, start=1):
        cat = mem.get("category", "기억")
        content = mem.get("content", "")
        lines.append(f"{idx}. [{cat}] {content}")

    lines.append("* 위 기억된 사항들을 토대로 일관성 있게 사용자를 대우하고 보좌하세요.")
    return "\n".join(lines)

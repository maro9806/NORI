# 파일 I/O, 디렉터리 스캔, 검색 등 도구 모음
import os
import json
from datetime import datetime
from typing import Dict, Any, List

# 설정 파일 기본 경로
SETTINGS_FILE_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "data", "settings.json")
)


def load_allowed_workspaces() -> List[Dict[str, Any]]:
    """settings에서 활성화된 허용 작업 공간 목록을 로드."""
    if not os.path.exists(SETTINGS_FILE_PATH):
        # 기본 디렉터리 폴백
        return [
            {
                "id": "ws_default",
                "alias": "기본 작업 폴더",
                "path": os.path.abspath(r"D:\AIproject"),
                "read_only": False,
                "enabled": True,
            }
        ]

    try:
        with open(SETTINGS_FILE_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
            return [ws for ws in data.get("allowed_workspaces", []) if ws.get("enabled", True)]
    except Exception:
        return []


def validate_workspace_path(target_path: str, action: str = "read") -> tuple[bool, str, str]:
    """경로가 허용된 작업 공간 내에 있는지 검증하고 절대 경로를 반환합니다.
    
    Returns:
        (is_valid, resolved_abs_path, message)
    """
    workspaces = load_allowed_workspaces()
    if not workspaces:
        return False, "", "접근 실패: 활성화된 작업 공간(Workspace)이 설정되지 않았습니다."

    # 입력된 경로가 상대 경로일 경우 첫 번째 기본 작업 공간을 기준으로 해석
    default_base = os.path.abspath(workspaces[0]["path"])
    abs_target = os.path.abspath(
        target_path if os.path.isabs(target_path) else os.path.join(default_base, target_path)
    )

    matched_workspace = None
    for ws in workspaces:
        base_dir = os.path.abspath(ws["path"])
        # Path Traversal 방어: 대상 경로가 허용 기준 경로의 하위 디렉터리인지 확인
        if os.path.commonpath([abs_target, base_dir]) == base_dir:
            matched_workspace = ws
            break

    if not matched_workspace:
        return False, "", f"보안 차단: 승인된 작업 공간 외부에 대한 접근이 거부되었습니다. ({abs_target})"

    if action == "write" and matched_workspace.get("read_only", False):
        return False, "", f"권한 오류: '{matched_workspace.get('alias')}' 공간은 읽기 전용으로 보호되어 있습니다."

    return True, abs_target, "OK"


# =====================================================================
# Gemini Function Calling 전용 도구 함수 정의
# =====================================================================

def get_current_time() -> dict:
    """현재 시스템의 정확한 날짜, 시각, 요일 정보를 반환합니다."""
    now = datetime.now()
    return {
        "status": "success",
        "current_time": now.strftime("%Y-%m-%d %H:%M:%S"),
        "year": now.year,
        "month": now.month,
        "day": now.day,
        "weekday": now.strftime("%A"),
    }


def list_directory_files(relative_or_abs_path: str = ".") -> dict:
    """허용된 작업 공간 내의 특정 폴더 파일 및 디렉터리 목록을 스캔합니다.
    
    Args:
        relative_or_abs_path: 스캔할 디렉터리 경로 (기본값: 작업 공간 루트)
    """
    is_valid, target_dir, msg = validate_workspace_path(relative_or_abs_path, action="read")
    if not is_valid:
        return {"status": "error", "message": msg}

    if not os.path.exists(target_dir):
        return {"status": "error", "message": f"디렉터리가 존재하지 않습니다: {relative_or_abs_path}"}

    if not os.path.isdir(target_dir):
        return {"status": "error", "message": f"지정된 경로는 폴더가 아닙니다: {relative_or_abs_path}"}

    try:
        entries = []
        for item in os.listdir(target_dir):
            item_path = os.path.join(target_dir, item)
            is_dir = os.path.isdir(item_path)
            size = os.path.getsize(item_path) if not is_dir else 0
            entries.append({
                "name": item,
                "type": "directory" if is_dir else "file",
                "size_bytes": size
            })

        return {
            "status": "success",
            "directory": target_dir,
            "total_items": len(entries),
            "entries": entries
        }
    except Exception as e:
        return {"status": "error", "message": f"목록 조회 실패: {str(e)}"}


def read_local_file(file_path: str) -> dict:
    """허용된 작업 공간 내의 텍스트 파일 내용을 읽어옵니다.
    
    Args:
        file_path: 읽을 파일의 상대 경로 또는 허용된 절대 경로
    """
    is_valid, target_path, msg = validate_workspace_path(file_path, action="read")
    if not is_valid:
        return {"status": "error", "message": msg}

    if not os.path.exists(target_path):
        return {"status": "error", "message": f"파일을 찾을 수 없습니다: {file_path}"}

    if not os.path.isfile(target_path):
        return {"status": "error", "message": f"지정된 경로는 파일이 아닙니다: {file_path}"}

    try:
        with open(target_path, "r", encoding="utf-8", errors="replace") as f:
            content = f.read()

        return {
            "status": "success",
            "file_path": target_path,
            "char_count": len(content),
            "content": content
        }
    except Exception as e:
        return {"status": "error", "message": f"파일 읽기 오류: {str(e)}"}


def write_local_file(file_path: str, content: str) -> dict:
    """허용된 작업 공간 내에 파일을 새로 작성하거나 기존 파일 내용을 갱신합니다.
    
    Args:
        file_path: 저장할 파일의 상대 경로 또는 허용된 절대 경로
        content: 파일에 기록할 텍스트 본문
    """
    is_valid, target_path, msg = validate_workspace_path(file_path, action="write")
    if not is_valid:
        return {"status": "error", "message": msg}

    try:
        # 상위 디렉터리가 없으면 자동 생성
        parent_dir = os.path.dirname(target_path)
        if parent_dir and not os.path.exists(parent_dir):
            os.makedirs(parent_dir, exist_ok=True)

        with open(target_path, "w", encoding="utf-8") as f:
            f.write(content)

        return {
            "status": "success",
            "file_path": target_path,
            "size_written": len(content),
            "message": f"파일이 성공적으로 기록되었습니다. (경로: {target_path})"
        }
    except Exception as e:
        return {"status": "error", "message": f"파일 쓰기 실패: {str(e)}"}


# 에이전트에 공급할 도구 리스트
AGENT_TOOLS = [
    get_current_time,
    list_directory_files,
    read_local_file,
    write_local_file
]



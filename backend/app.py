import os
import sys
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

from backend.Services.settings_service import load_settings, update_settings
from backend.core.agent import test_api_connection, run_agent

app = FastAPI(title="MINORI - Personal Digital Secretary API", version="1.0.0")

# CORS 허용 설정 (프론트엔드 직접 파일 열기 및 로컬 개발용)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 로컬 개발 및 실시간 UI 반영을 위한 캐시 방지 미들웨어
@app.middleware("http")
async def add_no_cache_headers(request, call_next):
    response = await call_next(request)
    path = request.url.path
    if path == "/" or path.endswith((".css", ".js", ".html")):
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
    return response


# =====================================================================
# 요청/응답 Pydantic 모델
# =====================================================================
class SettingsUpdateRequest(BaseModel):
    api_key: Optional[str] = None
    model_name: Optional[str] = None
    temperature: Optional[float] = None
    workspace_dir: Optional[str] = None
    allowed_workspaces: Optional[List[Dict[str, Any]]] = None

class TestConnectionRequest(BaseModel):
    api_key: Optional[str] = None
    model_name: Optional[str] = "gemini-2.5-flash"

class ChatRequest(BaseModel):
    message: str
    chat_id: Optional[str] = "default"
    lorebook_context: Optional[str] = ""
    system_rules: Optional[str] = ""


# =====================================================================
# API 엔드포인트
# =====================================================================

@app.get("/api/settings")
def get_settings():
    """현재 저장된 설정 로드."""
    settings = load_settings()
    return settings


@app.post("/api/settings")
def save_settings(req: SettingsUpdateRequest):
    """설정 갱신 및 파일 저장."""
    update_data = {k: v for k, v in req.model_dump().items() if v is not None}
    saved = update_settings(update_data)
    return {"status": "success", "message": "설정이 저장되었습니다.", "settings": saved}


@app.post("/api/test-connection")
def api_test_connection(req: TestConnectionRequest):
    """Gemini API 키 연결성 및 모델 응답 테스트."""
    api_key = req.api_key
    if not api_key:
        current_settings = load_settings()
        api_key = current_settings.get("api_key", "")

    result = test_api_connection(api_key=api_key, model_name=req.model_name or "gemini-2.5-flash")
    return result


@app.post("/api/chat")
def api_chat(req: ChatRequest):
    """에이전트 루프 호출 및 답변 도출."""
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="메시지가 비어 있습니다.")

    result = run_agent(
        user_prompt=req.message,
        lorebook_context=req.lorebook_context or "",
        system_rules=req.system_rules or ""
    )
    return result


# =====================================================================
# 프론트엔드 정적 파일 서빙 (http://localhost:8000 접속 지원)
# =====================================================================
FRONTEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend"))
if os.path.exists(FRONTEND_DIR):
    app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app:app", host="127.0.0.1", port=8000, reload=True)

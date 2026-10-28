import os
import sys
import tempfile
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

from backend.Services.settings_service import load_settings, update_settings
from backend.Services.memory_service import (
    load_hyper_memory,
    add_memory,
    delete_memory,
    toggle_memory_active,
    update_memory
)
from backend.Services.reminder_service import (
    add_reminder,
    get_reminders_status,
    delete_reminder
)
from backend.core.agent import test_api_connection, run_agent, list_ollama_models
from backend.core.plugin_loader import discover_plugins_metadata, PLUGINS_DIR
from backend.core.tools import GENERATED_IMAGES_DIR

os.makedirs(GENERATED_IMAGES_DIR, exist_ok=True)
os.makedirs(PLUGINS_DIR, exist_ok=True)

app = FastAPI(title="MINORI - Personal Digital Secretary API", version="2.0.0")

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
    openai_api_key: Optional[str] = None
    custom_endpoint: Optional[str] = None
    temperature: Optional[float] = None
    workspace_dir: Optional[str] = None
    allowed_workspaces: Optional[List[Dict[str, Any]]] = None

class TestConnectionRequest(BaseModel):
    api_key: Optional[str] = None
    model_name: Optional[str] = "gemini-3.8-flash"
    base_url: Optional[str] = None

class MemoryCreateRequest(BaseModel):
    category: Optional[str] = "일반 지침"
    content: str

class MemoryUpdateRequest(BaseModel):
    category: Optional[str] = None
    content: str

class MemoryToggleRequest(BaseModel):
    active: bool

class ReminderCreateRequest(BaseModel):
    message: str
    duration_seconds: Optional[int] = 0
    target_time_str: Optional[str] = ""

class ChatRequest(BaseModel):
    message: str
    chat_id: Optional[str] = "default"
    lorebook_context: Optional[str] = ""
    system_rules: Optional[str] = ""
    attachments: Optional[List[Dict[str, Any]]] = None


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
    """API 키 연결성 및 모델 응답 테스트 (Gemini / OpenAI / 로컬 Ollama 엔드포인트)."""
    api_key = req.api_key
    if not api_key:
        current_settings = load_settings()
        api_key = current_settings.get("api_key", "")

    result = test_api_connection(
        api_key=api_key,
        model_name=req.model_name or "gemini-3.8-flash",
        base_url=req.base_url
    )
    return result


@app.get("/api/ollama/models")
def api_get_ollama_models(host: Optional[str] = "http://localhost:11434"):
    """로컬 PC의 Ollama 서버 상태 및 설치된 로컬 LLM 모델 목록 조회."""
    return list_ollama_models(host or "http://localhost:11434")


@app.get("/api/plugins")
def api_get_plugins():
    """plugins/ 폴더에서 자동 인식된 파이썬 커스텀 도구 목록 조회."""
    plugins = discover_plugins_metadata()
    return {"status": "success", "plugins_dir": PLUGINS_DIR, "plugins": plugins}


# =====================================================================
# 타이머 & 리마인더 (선제적 알림) API 엔드포인트
# =====================================================================

@app.get("/api/reminders")
def api_get_reminders():
    """현재 대기 중인 활성 타이머와 시각이 도래한(due) 알림 목록 반환."""
    return get_reminders_status()


@app.post("/api/reminders")
def api_create_reminder(req: ReminderCreateRequest):
    """새로운 타이머/리마인더 등록."""
    item = add_reminder(
        message=req.message,
        duration_seconds=req.duration_seconds or 0,
        target_time_str=req.target_time_str or ""
    )
    return {"status": "success", "reminder": item}


@app.delete("/api/reminders/{rem_id}")
def api_delete_reminder(rem_id: str):
    """특정 타이머/리마인더 취소 및 삭제."""
    ok = delete_reminder(rem_id)
    if not ok:
        raise HTTPException(status_code=404, detail="해당 알림을 찾을 수 없습니다.")
    return {"status": "success", "deleted": True}


# =====================================================================
# 하이퍼 메모리 (장기 기억) API 엔드포인트
# =====================================================================

@app.get("/api/memory")
def api_get_memory():
    """모든 하이퍼 메모리(장기 기억 및 사용자 프로필) 로드."""
    return load_hyper_memory()


@app.post("/api/memory")
def api_add_memory(req: MemoryCreateRequest):
    """새로운 장기 기억 항목 수동/자율 추가."""
    if not req.content.strip():
        raise HTTPException(status_code=400, detail="기억할 내용이 비어 있습니다.")
    new_mem = add_memory(req.category or "일반 지침", req.content.strip())
    return {"status": "success", "memory": new_mem}


@app.delete("/api/memory/{mem_id}")
def api_delete_memory(mem_id: str):
    """특정 기억 항목 삭제."""
    ok = delete_memory(mem_id)
    if not ok:
        raise HTTPException(status_code=404, detail="해당 기억 항목을 찾을 수 없습니다.")
    return {"status": "success", "message": "기억이 영구 삭제되었습니다."}


@app.put("/api/memory/{mem_id}")
@app.patch("/api/memory/{mem_id}")
def api_update_memory(mem_id: str, req: MemoryUpdateRequest):
    """특정 기억 항목 내용 및 카테고리 수정."""
    if not req.content or not req.content.strip():
        raise HTTPException(status_code=400, detail="수정할 기억 내용이 비어 있습니다.")
    updated = update_memory(mem_id, category=req.category, content=req.content.strip())
    if not updated:
        raise HTTPException(status_code=404, detail="수정할 기억 항목을 찾을 수 없습니다.")
    return {"status": "success", "memory": updated}


@app.patch("/api/memory/{mem_id}/toggle")
def api_toggle_memory(mem_id: str, req: MemoryToggleRequest):
    """기억 항목 활성/비활성 토글."""
    ok = toggle_memory_active(mem_id, req.active)
    if not ok:
        raise HTTPException(status_code=404, detail="해당 기억 항목을 찾을 수 없습니다.")
    return {"status": "success", "active": req.active}


@app.post("/api/chat")
def api_chat(req: ChatRequest):
    """에이전트 루프 호출 및 답변 도출 (멀티모달 이미지/문서 첨부 지원)."""
    if not req.message.strip() and not req.attachments:
        raise HTTPException(status_code=400, detail="메시지가 비어 있습니다.")

    prompt_msg = req.message.strip() or "첨부된 파일을 분석해 주세요."
    result = run_agent(
        user_prompt=prompt_msg,
        lorebook_context=req.lorebook_context or "",
        system_rules=req.system_rules or "",
        attachments=req.attachments
    )
    return result


@app.post("/api/stt")
async def api_stt(
    audio: UploadFile = File(...),
    engine: Optional[str] = Form("gemini"),
    prompt: Optional[str] = Form("미노리, MINORI, 자비스, 비서"),
    model: Optional[str] = Form(None)
):
    """음성 오디오 파일(webm/wav)을 고정밀 텍스트로 변환 (Gemini 최신 플래그십 3.8 Flash 또는 Whisper)."""
    try:
        content = await audio.read()
        if not content:
            raise HTTPException(status_code=400, detail="오디오 데이터가 비어 있습니다.")

        settings = load_settings()

        # 1. Google Gemini Audio STT (최신 고속 플래그십 gemini-3.8-flash / 미노리 인지)
        if engine == "gemini":
            api_key = settings.get("api_key", "")
            if not api_key:
                raise HTTPException(status_code=400, detail="Gemini API 키가 설정되지 않았습니다. [설정]에서 API 키를 입력해 주세요.")

            from google import genai
            from google.genai import types

            client = genai.Client(api_key=api_key)
            mime_type = audio.content_type or "audio/webm"

            # 2.5 구형 레거시 모델이거나 미지정 시 최신 gemini-3.8-flash로 자동 지정
            stt_model = (model or settings.get("stt_model", "gemini-3.8-flash")).strip()
            if not stt_model or "2.5" in stt_model:
                stt_model = "gemini-3.8-flash"

            print(f"[STT 요청 처리] stt_model={stt_model}, engine={engine}")

            system_prompt = (
                "당신은 고정밀 음성 인식(STT) 전사 시스템입니다. "
                "사용자가 부르는 비서의 이름은 '미노리'(MINORI)입니다. (며느리나 미누리가 아닙니다). "
                f"키워드 힌트: {prompt}. "
                "음성을 듣고 오직 사용자가 발화한 한국어 문장 텍스트만을 정확하게 출력하세요. "
                "인사말이나 따옴표, 설명 등 어떠한 추가 텍스트도 절대 포함하지 마세요."
            )

            response = client.models.generate_content(
                model=stt_model,
                contents=[
                    types.Part.from_bytes(data=content, mime_type=mime_type),
                    "이 음성의 발화를 정확한 한국어 텍스트로만 전사해줘."
                ],
                config=types.GenerateContentConfig(
                    system_instruction=system_prompt,
                    temperature=0.0
                )
            )
            transcription = response.text.strip() if response.text else ""
            return {"status": "success", "text": transcription, "engine": "gemini", "model": stt_model}

        # 2. OpenAI Whisper STT
        elif engine == "whisper":
            openai_key = settings.get("openai_api_key", "")
            if not openai_key:
                raise HTTPException(status_code=400, detail="OpenAI API 키가 필요합니다. [설정]에서 OpenAI 키를 입력해 주세요.")

            from openai import OpenAI
            client = OpenAI(api_key=openai_key)

            with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as tmp:
                tmp.write(content)
                tmp_path = tmp.name

            try:
                with open(tmp_path, "rb") as f:
                    res = client.audio.transcriptions.create(
                        model="whisper-1",
                        file=f,
                        prompt=prompt or "미노리, MINORI, 자비스, 디지털 비서",
                        language="ko"
                    )
                return {"status": "success", "text": res.text.strip(), "engine": "whisper"}
            finally:
                if os.path.exists(tmp_path):
                    try:
                        os.remove(tmp_path)
                    except Exception:
                        pass

        else:
            raise HTTPException(status_code=400, detail=f"지원하지 않는 STT 엔진: {engine}")

    except Exception as e:
        return {"status": "error", "message": str(e), "text": ""}


# =====================================================================
# 프론트엔드 정적 파일 서빙 (http://localhost:8000 접속 지원)
# =====================================================================
FRONTEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend"))
if os.path.exists(FRONTEND_DIR):
    app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app:app", host="127.0.0.1", port=8000, reload=True)

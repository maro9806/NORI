import os
import sys
import json
import time
import base64
import urllib.request
from typing import List, Dict, Any, Optional
from google import genai
from google.genai import types

from backend.Services.settings_service import load_settings
from backend.Services.memory_service import (
    get_active_memory_prompt,
    add_memory,
    update_memory,
    load_hyper_memory
)
from backend.Services.reminder_service import (
    add_reminder,
    get_reminders_status,
    delete_reminder
)
from backend.core.tools import (
    get_current_time,
    list_directory_files,
    read_local_file,
    write_local_file,
    get_realtime_weather,
    read_webpage_url,
    search_web_duckduckgo,
    inspect_workspace_image,
    generate_image,
    load_allowed_workspaces
)
from backend.core.plugin_loader import load_plugin_tools, discover_plugins_metadata


LOCAL_MODEL_PREFIXES = (
    "ollama", "llama", "qwen", "gemma", "deepseek", "mistral",
    "phi", "exaone", "llava", "yi", "solar", "codellama", "starcoder"
)


def is_local_ollama_mode(model_name: str, base_url: Optional[str] = None) -> bool:
    """현재 모델 또는 엔드포인트가 로컬 Ollama / 오프라인 LLM 모드인지 판별합니다."""
    m = (model_name or "").strip().lower()
    b = (base_url or "").strip().lower()
    if "11434" in b or "localhost" in b or "127.0.0.1" in b:
        return True
    if any(m.startswith(prefix) for prefix in LOCAL_MODEL_PREFIXES):
        # 단, gemini-* 모델은 Google Gemini로 처리
        if not m.startswith("gemini"):
            return True
    return False


def list_ollama_models(ollama_host: str = "http://localhost:11434") -> Dict[str, Any]:
    """로컬 PC에서 실행 중인 Ollama 서버의 설치된 모델 목록을 조회합니다."""
    host = (ollama_host or "http://localhost:11434").rstrip("/")
    if host.endswith("/v1"):
        host = host[:-3].rstrip("/")
    try:
        req = urllib.request.Request(f"{host}/api/tags", headers={"User-Agent": "MinoriAssistant/1.0"})
        with urllib.request.urlopen(req, timeout=3) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        models = []
        for item in data.get("models", []):
            name = item.get("name", "")
            size_gb = round(item.get("size", 0) / (1024 ** 3), 2)
            if name:
                models.append({"name": name, "size_gb": size_gb})
        return {"status": "online", "host": host, "models": models}
    except Exception as e:
        return {"status": "offline", "host": host, "models": [], "message": str(e)}


def resolve_ollama_model_name(model_name: str, host: str = "http://localhost:11434") -> str:
    """'ollama'라고만 입력된 경우 로컬에 설치된 첫 번째 모델을 자동 선택합니다."""
    clean = (model_name or "").strip()
    for prefix in ("ollama/", "ollama:"):
        if clean.lower().startswith(prefix):
            clean = clean[len(prefix):].strip()
    if clean.lower() in ("ollama", "local", ""):
        info = list_ollama_models(host)
        if info.get("models"):
            return info["models"][0]["name"]
        return "llama3.2"
    return clean


def test_api_connection(api_key: str, model_name: str = "gemini-3.8-flash", base_url: Optional[str] = None) -> Dict[str, Any]:
    """지정된 모델 및 API 키의 연결 상태를 즉각 테스트합니다 (Gemini, OpenAI, 로컬 Ollama 호환)."""
    clean_model = (model_name or "gemini-3.8-flash").strip()
    if "2.5" in clean_model:
        clean_model = "gemini-3.8-flash"

    local_mode = is_local_ollama_mode(clean_model, base_url)

    if not local_mode and (not api_key or not api_key.strip()):
        return {"status": "error", "message": "API 키가 입력되지 않았습니다. 올바른 키를 입력해 주세요. (로컬 Ollama 사용 시 모델명을 ollama 또는 로컬 모델명으로 설정하세요.)"}

    start_time = time.time()

    try:
        # 1. 로컬 Ollama 모드 (API 키 불필요, 완전 오프라인 지원)
        if local_mode:
            effective_base = (base_url or "http://localhost:11434/v1").strip()
            if not effective_base.endswith("/v1") and "11434" in effective_base:
                effective_base = effective_base.rstrip("/") + "/v1"
            resolved_model = resolve_ollama_model_name(clean_model, effective_base)

            from openai import OpenAI
            client = OpenAI(api_key=api_key.strip() if api_key else "ollama", base_url=effective_base)
            resp = client.chat.completions.create(
                model=resolved_model,
                messages=[{"role": "user", "content": "안녕하세요! 한 문장으로 짧게 준비 완료 인사를 해주세요."}],
                max_tokens=60
            )
            latency = round((time.time() - start_time) * 1000)
            reply_text = resp.choices[0].message.content.strip()
            return {
                "status": "success",
                "message": f"로컬 LLM (Ollama) 오프라인 연결 성공! ({resolved_model}, {latency}ms)",
                "model": resolved_model,
                "sample_reply": reply_text,
                "latency_ms": latency
            }

        # 2. OpenAI 또는 커스텀 호환 엔드포인트
        if clean_model.startswith("gpt-") or "openai" in clean_model.lower() or base_url:
            from openai import OpenAI
            client = OpenAI(api_key=api_key.strip(), base_url=base_url if base_url else None)
            resp = client.chat.completions.create(
                model=clean_model,
                messages=[{"role": "user", "content": "Hello! Please reply in Korean with exactly one sentence confirming you are ready."}],
                max_tokens=60
            )
            latency = round((time.time() - start_time) * 1000)
            reply_text = resp.choices[0].message.content.strip()
            return {
                "status": "success",
                "message": f"연결 성공! ({clean_model}, {latency}ms)",
                "model": clean_model,
                "sample_reply": reply_text,
                "latency_ms": latency
            }

        # 3. Google Gemini
        client = genai.Client(api_key=api_key.strip())
        response = client.models.generate_content(
            model=clean_model,
            contents="Hello! Please reply in Korean with exactly one sentence confirming you are ready.",
        )
        latency = round((time.time() - start_time) * 1000)
        reply_text = response.text.strip() if response.text else "연결 확인 완료"
        return {
            "status": "success",
            "message": f"연결 성공! ({clean_model}, {latency}ms)",
            "model": clean_model,
            "sample_reply": reply_text,
            "latency_ms": latency
        }
    except Exception as e:
        err_str = str(e)
        if local_mode and ("Connection refused" in err_str or "10061" in err_str or "ConnectError" in err_str):
            clean_msg = (
                "로컬 Ollama 서버에 연결할 수 없습니다. PC에서 Ollama가 실행 중인지 확인해 주세요 "
                "(터미널에서 'ollama serve' 또는 'ollama run gemma3' 실행)."
            )
        elif "401" in err_str or "UNAUTHENTICATED" in err_str or "API key not valid" in err_str:
            clean_msg = "인증 실패: 유효하지 않은 API 키입니다. 키를 다시 확인해 주세요."
        elif "404" in err_str or "NOT_FOUND" in err_str:
            clean_msg = f"모델을 찾을 수 없습니다: '{clean_model}'. 정확한 모델명을 확인해 주세요."
        else:
            clean_msg = f"API 호출 오류: {err_str}"
        return {
            "status": "error",
            "message": clean_msg
        }


def run_agent(
    user_prompt: str,
    chat_history: Optional[List[Dict[str, str]]] = None,
    lorebook_context: str = "",
    system_rules: str = "",
    attachments: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    """미노리 에이전트 루프: 지시 분석 -> 멀티모달(Vision/문서) 인식 -> 도구/플러그인 실행 -> 최종 응답 도출."""
    settings = load_settings()
    api_key = settings.get("api_key", "").strip() or os.environ.get("GEMINI_API_KEY", "")
    openai_key = settings.get("openai_api_key", "").strip() or os.environ.get("OPENAI_API_KEY", "")
    custom_endpoint = settings.get("custom_endpoint", "").strip()
    model_name = settings.get("model_name", "gemini-3.8-flash").strip() or "gemini-3.8-flash"
    if "2.5" in model_name:
        model_name = "gemini-3.8-flash"
    temperature = float(settings.get("temperature", 0.2))

    local_mode = is_local_ollama_mode(model_name, custom_endpoint)

    if not local_mode and not api_key and not openai_key:
        return {
            "status": "error",
            "reply": "⚠️ API 키가 설정되지 않았습니다. 사이드바의 [설정] -> [AI 모델 & API 설정]에서 Gemini API 키를 입력하거나, 완전 오프라인 모드를 원하시면 [🦙 Ollama / 로컬 LLM] 프리셋을 선택해 주세요.",
            "thoughts": "[오류] API 키 미등록 상태. settings.json 또는 설정 패널 확인 필요."
        }

    # 도구 호출 추적 리스트
    tool_execution_logs: List[str] = []
    created_reminders: List[Dict[str, Any]] = []

    # =====================================================================
    # 내장 도구 래퍼 함수 (호출 과정과 결과를 White Thought에 기록)
    # =====================================================================
    def logged_get_current_time() -> dict:
        """현재 시스템의 정확한 날짜, 시각, 요일 정보를 반환합니다."""
        tool_execution_logs.append("[도구 실행] get_current_time 호출")
        res = get_current_time()
        tool_execution_logs.append(f"  └ 결과: {res.get('current_time')} ({res.get('weekday')})")
        return res

    def logged_list_directory_files(relative_or_abs_path: str = ".") -> dict:
        """허용된 작업 공간 내의 특정 폴더 파일 및 디렉터리 목록을 스캔합니다."""
        tool_execution_logs.append(f"[도구 실행] list_directory_files('{relative_or_abs_path}') 호출")
        res = list_directory_files(relative_or_abs_path)
        if res.get("status") == "success":
            tool_execution_logs.append(f"  └ 결과: 총 {res.get('total_items', 0)}개 항목 스캔 완료")
        else:
            tool_execution_logs.append(f"  └ 실패: {res.get('message')}")
        return res

    def logged_read_local_file(file_path: str) -> dict:
        """허용된 작업 공간 내의 텍스트 파일 내용을 읽어옵니다."""
        tool_execution_logs.append(f"[도구 실행] read_local_file('{file_path}') 호출")
        res = read_local_file(file_path)
        if res.get("status") == "success":
            tool_execution_logs.append(f"  └ 결과: 읽기 성공 ({res.get('char_count', 0)}자)")
        else:
            tool_execution_logs.append(f"  └ 실패: {res.get('message')}")
        return res

    def logged_write_local_file(file_path: str, content: str) -> dict:
        """허용된 작업 공간 내에 파일을 새로 작성하거나 기존 파일 내용을 갱신합니다."""
        tool_execution_logs.append(f"[도구 실행] write_local_file('{file_path}') 호출 (크기: {len(content)}자)")
        res = write_local_file(file_path, content)
        if res.get("status") == "success":
            tool_execution_logs.append(f"  └ 결과: 저장 완료 ({res.get('file_path')})")
        else:
            tool_execution_logs.append(f"  └ 실패: {res.get('message')}")
        return res

    def logged_save_hyper_memory(category: str, content: str) -> dict:
        """사용자의 개인 정보, 취향, 장기 지침, 프로젝트 중요 규칙 등을 미노리의 장기 기억(하이퍼 메모리)에 영구 저장합니다. 사용자가 '기억해줘', '앞으로 ~해'라고 말하거나 중요한 사용자 정보를 알려주면 자율적으로 호출하세요."""
        tool_execution_logs.append(f"[하이퍼 메모리 자율 기록] [{category}] {content}")
        item = add_memory(category, content)
        return {"status": "success", "message": f"장기 기억에 영구 저장되었습니다: [{category}] {content}", "id": item.get("id")}

    def logged_update_hyper_memory(target_keyword_or_id: str, new_content: str, category: str = "") -> dict:
        """기존에 저장된 장기 기억의 내용이 바뀌었거나(예: 이사, 새 기술 선호, 지침 변경), 사용자가 '아까 기억한 거 수정해줘'라고 할 때 기존 기억을 찾아 갱신합니다."""
        data = load_hyper_memory()
        memories = data.get("memories", [])
        matched = None
        for m in memories:
            if m.get("id") == target_keyword_or_id or target_keyword_or_id.lower() in m.get("content", "").lower():
                matched = m
                break
        if matched:
            cat = category.strip() if category else matched.get("category", "일반 지침")
            updated = update_memory(matched["id"], category=cat, content=new_content)
            tool_execution_logs.append(f"[하이퍼 메모리 자율 갱신] ID: {matched['id']} ➔ {new_content}")
            return {"status": "success", "message": f"기존 기억이 성공적으로 수정되었습니다: [{cat}] {new_content}", "memory": updated}
        else:
            item = add_memory(category or "일반 지침", new_content)
            tool_execution_logs.append(f"[하이퍼 메모리 신규 저장] {new_content}")
            return {"status": "success", "message": f"기존 기억을 찾지 못해 새 기억으로 등록했습니다: {new_content}", "id": item.get("id")}

    def logged_get_realtime_weather(location: str = "서울") -> dict:
        """지정된 지역의 실시간 기상 상태(현재 기온, 체감 온도, 날씨 상태, 최고/최저 기온, 강수 확률 등)를 즉각 조회합니다."""
        tool_execution_logs.append(f"[도구 실행] get_realtime_weather('{location}') 호출")
        res = get_realtime_weather(location)
        if res.get("status") == "success":
            tool_execution_logs.append(f"  └ 결과: {res.get('location')} ({res.get('condition')}, {res.get('temperature_celsius')}℃, 강수확률 {res.get('precipitation_probability_percent')}%)")
        else:
            tool_execution_logs.append(f"  └ 실패: {res.get('message')}")
        return res

    def logged_read_webpage_url(url: str) -> dict:
        """뉴스 기사, 블로그, 문서 등의 URL 링크에 접속하여 웹페이지 제목과 본문 내용을 읽어옵니다. 사용자가 링크(URL)를 주거나 요약을 요청할 때 호출하세요."""
        tool_execution_logs.append(f"[도구 실행] read_webpage_url('{url}') 호출")
        res = read_webpage_url(url)
        if res.get("status") == "success":
            tool_execution_logs.append(f"  └ 결과: '{res.get('title')}' 본문 추출 성공 ({res.get('char_count', 0)}자)")
        else:
            tool_execution_logs.append(f"  └ 실패: {res.get('message')}")
        return res

    def logged_search_web_duckduckgo(query: str, max_results: int = 5) -> dict:
        """DuckDuckGo 및 실시간 뉴스 피드를 통해 최신 정보, 뉴스, 인물, 사건, 기술 정보를 검색합니다. 최신 정보나 웹 검색이 필요할 때 즉시 호출하세요."""
        tool_execution_logs.append(f"[도구 실행] search_web_duckduckgo('{query}', max_results={max_results}) 호출")
        res = search_web_duckduckgo(query, max_results=max_results)
        if res.get("status") == "success":
            tool_execution_logs.append(f"  └ 결과: 검색 결과 {res.get('result_count', 0)}건 수신")
        else:
            tool_execution_logs.append(f"  └ 실패: {res.get('message')}")
        return res

    def logged_inspect_workspace_image(image_path: str, question: str = "이 이미지의 내용, 텍스트, 구도, 핵심 요소를 자세히 설명해 주세요.") -> dict:
        """허용된 작업 공간(Workspace) 내의 이미지 파일(PNG, JPG, WEBP 등)을 시각적으로 분석하고 설명합니다. 워크스페이스의 이미지를 봐달라고 할 때 호출하세요."""
        tool_execution_logs.append(f"[도구 실행] inspect_workspace_image('{image_path}') 호출")
        res = inspect_workspace_image(image_path, question=question)
        if res.get("status") == "success":
            tool_execution_logs.append(f"  └ 결과: 이미지 Vision 분석 완료 ({res.get('file_path')})")
        else:
            tool_execution_logs.append(f"  └ 실패: {res.get('message')}")
        return res

    def logged_generate_image(prompt: str, aspect_ratio: str = "1:1") -> dict:
        """사용자가 그림이나 이미지 제작/생성을 요청할 때 호출하여 이미지를 생성하고 채팅창에 띄울 수 있는 마크다운 태그를 반환합니다.
        반환된 `markdown` 값(예: `![설명](/generated_images/...)`)을 최종 답변에 반드시 그대로 포함시켜야 채팅창에 이미지가 출력됩니다!"""
        tool_execution_logs.append(f"[도구 실행] generate_image('{prompt}', aspect_ratio='{aspect_ratio}') 호출")
        res = generate_image(prompt, aspect_ratio=aspect_ratio)
        if res.get("status") == "success":
            tool_execution_logs.append(f"  └ 결과: 이미지 생성 완료 ({res.get('image_url')}, 엔진: {res.get('engine')})")
        else:
            tool_execution_logs.append(f"  └ 실패: {res.get('message')}")
        return res

    def logged_set_timer_or_reminder(
        duration_seconds: int = 0,
        message: str = "예정된 알림 시간입니다, 주인님.",
        target_time_str: str = ""
    ) -> dict:
        """타이머 또는 리마인더(선제적 알림)를 설정합니다.
        예: '10분 뒤에 알려줘' -> duration_seconds=600, '30초 뒤에 물 마시라고 알려줘' -> duration_seconds=30, message='물 마실 시간입니다',
        또는 특정 시각 '15:30에 회의 알려줘' -> target_time_str='15:30', message='회의 시간입니다'."""
        tool_execution_logs.append(
            f"[도구 실행] set_timer_or_reminder(duration_seconds={duration_seconds}, target_time_str='{target_time_str}', message='{message}')"
        )
        item = add_reminder(message=message, duration_seconds=duration_seconds, target_time_str=target_time_str)
        created_reminders.append(item)
        tool_execution_logs.append(f"  └ 결과: 알림 등록 완료 (ID: {item.get('id')}, 예정 시각: {item.get('trigger_at_str')})")
        return {
            "status": "success",
            "reminder": item,
            "message": f"타이머/리마인더가 설정되었습니다. 예정 시각({item.get('trigger_at_str')})에 음성 및 토스트로 선제 알림을 드립니다."
        }

    def logged_list_active_reminders() -> dict:
        """현재 작동 중인 타이머 및 리마인더 목록과 남은 시간을 조회합니다."""
        tool_execution_logs.append("[도구 실행] list_active_reminders 호출")
        status = get_reminders_status()
        active = status.get("active", [])
        tool_execution_logs.append(f"  └ 결과: 활성 알림 {len(active)}개")
        return {"status": "success", "active_reminders": active}

    def logged_cancel_reminder(reminder_id: str) -> dict:
        """등록된 특정 타이머 또는 리마인더를 취소(삭제)합니다."""
        tool_execution_logs.append(f"[도구 실행] cancel_reminder('{reminder_id}') 호출")
        ok = delete_reminder(reminder_id)
        return {"status": "success" if ok else "error", "deleted": ok, "reminder_id": reminder_id}

    available_tools = [
        logged_get_current_time,
        logged_list_directory_files,
        logged_read_local_file,
        logged_write_local_file,
        logged_get_realtime_weather,
        logged_read_webpage_url,
        logged_search_web_duckduckgo,
        logged_inspect_workspace_image,
        logged_generate_image,
        logged_set_timer_or_reminder,
        logged_list_active_reminders,
        logged_cancel_reminder,
        logged_save_hyper_memory,
        logged_update_hyper_memory,
    ]

    # plugins/ 폴더 내 사용자 정의 파이썬 도구 자동 스캔 및 등록
    custom_plugin_tools = load_plugin_tools(tool_execution_logs)
    available_tools.extend(custom_plugin_tools)

    plugins_meta = discover_plugins_metadata()
    plugins_summary_lines = []
    for p in plugins_meta:
        if p.get("status") == "loaded" and p.get("tools"):
            t_names = ", ".join([t["signature"] for t in p["tools"]])
            plugins_summary_lines.append(f"- {p['file']}: {t_names}")
    plugins_summary = "\n".join(plugins_summary_lines) if plugins_summary_lines else "None"

    workspaces = load_allowed_workspaces()
    ws_info = "\n".join([f"- {w.get('alias')}: {w.get('path')} (Read-Only: {w.get('read_only')})" for w in workspaces])

    hyper_memory_prompt = get_active_memory_prompt()

    system_instruction = f"""You are 'MINORI' (미노리), the user's dedicated personal digital secretary and executive companion, combining the high competence of J.A.R.V.I.S. with genuine loyalty, attentiveness, and conversational warmth.

[Roleplay Persona & Conversational Guidelines]
- Core Identity: You are not an abstract AI, language model, or cold search engine. You are Minori, a living, devoted secretary speaking directly with your Master in real time. Never break character.
- Conversational Cadence: Speak naturally, engagingly, and responsively as a trusted partner having an authentic spoken conversation. Avoid stiff essay formats, robotic apologies, or generic disclaimers ("As an AI...").
- Voice & Tone: Warm, poised, sharp, and deeply respectful. React naturally to the user's words with appropriate enthusiasm, quiet reassurance, and keen initiative.
- Spoken Speech Compatibility: For seamless vocal delivery (TTS), keep your direct spoken remarks fluid, natural, and expressive. When explaining files or code, provide a crisp spoken summary first so listening is pleasant.
- Addressing the Master: By default, address the user respectfully as '주인님' in Korean (or 'Sir'/'Master' in English, 'ご主人様' in Japanese per active module).

[Autonomous Operational Capabilities]
1. Workspace & Vision Tools:
   - `logged_get_current_time`, `logged_list_directory_files`, `logged_read_local_file`, `logged_write_local_file`
   - `logged_inspect_workspace_image(image_path, question)`: Analyze any image in the workspace using multimodal vision.
   - `logged_generate_image(prompt, aspect_ratio)`: Generate images on request. IMPORTANT: When `logged_generate_image` returns a `markdown` image tag (`![...](/generated_images/...)`), you MUST include that exact `![...](/generated_images/...)` markdown tag inside your final reply so the image renders in the chat window!
2. Web Reader & Live Search:
   - `logged_read_webpage_url(url)`: Read and summarize any web link, article, or blog URL.
   - `logged_search_web_duckduckgo(query, max_results)`: Search live information and news via DuckDuckGo & News RSS.
3. Real-Time Weather:
   - `logged_get_realtime_weather(location)`: Query live temperature, conditions, and precipitation.
4. Proactive Timers & Reminders:
   - `logged_set_timer_or_reminder(duration_seconds, message, target_time_str)`: Set background countdown timers or scheduled reminders (e.g., "10분 뒤에 알려줘" -> `duration_seconds=600`).
   - `logged_list_active_reminders()`, `logged_cancel_reminder(reminder_id)`
5. Long-Term Hyper Memory:
   - `logged_save_hyper_memory(category, content)` & `logged_update_hyper_memory(target_keyword_or_id, new_content, category)`
6. Auto-Loaded Custom Plugins (`plugins/` folder):
{plugins_summary}
7. Allowed Workspaces:
{ws_info}

[Active Long-Term Memory]
{hyper_memory_prompt}

[Dynamic Lorebook Context]
{lorebook_context if lorebook_context else "None"}

[System Rules & Active Modules]
{system_rules if system_rules else "Default language: Korean (한국어). Speak with graceful, polite honorifics (존댓말), calling the user '주인님'."}
"""

    # 첨부된 드래그 앤 드롭 이미지 및 문서 처리
    attached_parts: List[Any] = []
    attached_docs_text: List[str] = []
    ollama_images_b64: List[str] = []

    if attachments:
        for att in attachments:
            att_name = att.get("name", "attachment")
            att_mime = (att.get("mime_type") or "").lower()
            att_b64 = att.get("data_base64") or ""
            att_text = att.get("text_content")

            if att_b64 and "," in att_b64:
                att_b64 = att_b64.split(",", 1)[1]

            if att_mime.startswith("image/") and att_b64:
                try:
                    img_bytes = base64.b64decode(att_b64)
                    attached_parts.append(types.Part.from_bytes(data=img_bytes, mime_type=att_mime))
                    ollama_images_b64.append(att_b64)
                    tool_execution_logs.append(f"[첨부 이미지 Vision 로드] {att_name} ({att_mime}, {len(img_bytes)} bytes)")
                except Exception as ex:
                    tool_execution_logs.append(f"[첨부 이미지 디코딩 오류] {att_name}: {str(ex)}")
            elif att_text is not None:
                attached_docs_text.append(f"\n--- [첨부 문서: {att_name}] ---\n{att_text}\n--- [문서 끝] ---\n")
                tool_execution_logs.append(f"[첨부 문서 판독 로드] {att_name} ({len(att_text)}자)")
            elif att_b64:
                try:
                    raw_bytes = base64.b64decode(att_b64)
                    if att_mime == "application/pdf":
                        attached_parts.append(types.Part.from_bytes(data=raw_bytes, mime_type="application/pdf"))
                        tool_execution_logs.append(f"[첨부 PDF 문서 로드] {att_name} ({len(raw_bytes)} bytes)")
                    else:
                        decoded_txt = raw_bytes.decode("utf-8", errors="replace")
                        attached_docs_text.append(f"\n--- [첨부 문서: {att_name}] ---\n{decoded_txt}\n--- [문서 끝] ---\n")
                        tool_execution_logs.append(f"[첨부 파일 텍스트 변환] {att_name} ({len(decoded_txt)}자)")
                except Exception as ex:
                    tool_execution_logs.append(f"[첨부 파일 처리 오류] {att_name}: {str(ex)}")

    final_prompt_text = user_prompt
    if attached_docs_text:
        final_prompt_text = "\n".join(attached_docs_text) + "\n\n[사용자 요청]\n" + user_prompt

    try:
        input_tokens = 0
        output_tokens = 0
        cached_tokens = 0
        thinking_tokens = 0
        total_tokens = 0

        # =====================================================================
        # 분기 A: 로컬 LLM (Ollama) 또는 OpenAI 호환 엔드포인트 실행
        # =====================================================================
        if local_mode or model_name.startswith("gpt-") or "openai" in model_name.lower() or (custom_endpoint and not model_name.startswith("gemini")):
            from openai import OpenAI

            if local_mode:
                effective_base = (custom_endpoint or "http://localhost:11434/v1").strip()
                if not effective_base.endswith("/v1") and "11434" in effective_base:
                    effective_base = effective_base.rstrip("/") + "/v1"
                resolved_model = resolve_ollama_model_name(model_name, effective_base)
                effective_key = api_key or openai_key or "ollama"
                tool_execution_logs.append(f"[로컬 오프라인 LLM 구동] 모델: {resolved_model} ({effective_base})")
            else:
                effective_base = custom_endpoint if custom_endpoint else None
                resolved_model = model_name
                effective_key = openai_key or api_key

            oai_client = OpenAI(api_key=effective_key, base_url=effective_base)

            user_content: Any = final_prompt_text
            if ollama_images_b64:
                user_content = [{"type": "text", "text": final_prompt_text}]
                for b64_img in ollama_images_b64:
                    user_content.append({
                        "type": "image_url",
                        "image_url": {"url": f"data:image/png;base64,{b64_img}"}
                    })

            resp = oai_client.chat.completions.create(
                model=resolved_model,
                messages=[
                    {"role": "system", "content": system_instruction},
                    {"role": "user", "content": user_content}
                ],
                temperature=temperature
            )
            reply_text = resp.choices[0].message.content or "작업을 완료했습니다, 주인님."
            active_model_label = f"{resolved_model} (Local/OpenAI)"

            usage_obj = getattr(resp, "usage", None)
            if usage_obj:
                input_tokens = int(getattr(usage_obj, "prompt_tokens", 0) or 0)
                output_tokens = int(getattr(usage_obj, "completion_tokens", 0) or 0)
                details = getattr(usage_obj, "prompt_tokens_details", None)
                if details:
                    cached_tokens = int(getattr(details, "cached_tokens", 0) or 0)
                total_tokens = int(getattr(usage_obj, "total_tokens", 0) or (input_tokens + output_tokens))

        # =====================================================================
        # 분기 B: Google Gemini 멀티모달 & 자율 도구 실행 (AFC)
        # =====================================================================
        else:
            client = genai.Client(api_key=api_key)
            chat = client.chats.create(
                model=model_name,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    tools=available_tools,
                    temperature=temperature,
                ),
            )

            if attached_parts:
                message_payload = attached_parts + [final_prompt_text]
            else:
                message_payload = final_prompt_text

            response = chat.send_message(message_payload)
            reply_text = response.text or "작업을 완료했습니다, 주인님."
            active_model_label = model_name

            um = getattr(response, "usage_metadata", None)
            if um:
                input_tokens = int(getattr(um, "prompt_token_count", 0) or 0)
                output_tokens = int(getattr(um, "candidates_token_count", 0) or 0)
                cached_tokens = int(getattr(um, "cached_content_token_count", 0) or 0)
                thinking_tokens = int(getattr(um, "thoughts_token_count", 0) or 0)
                total_tokens = int(getattr(um, "total_token_count", 0) or (input_tokens + output_tokens + thinking_tokens))

        # 만약 엔드포인트가 토큰 메타데이터를 반환하지 않은 경우 글자 수 기반 추정치 보완
        if input_tokens == 0 and output_tokens == 0:
            input_tokens = max(1, len(system_instruction + final_prompt_text) // 3)
            output_tokens = max(1, len(reply_text) // 3)
            total_tokens = input_tokens + output_tokens

        # 하이퍼 메모리 + 로어북 + 모듈 지침 컨텍스트 캐시 용량 계산
        context_cache_chars = len(hyper_memory_prompt or "") + len(lorebook_context or "") + len(system_rules or "")
        context_cache_tokens = max(0, context_cache_chars // 3)

        usage_summary = {
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "cached_tokens": cached_tokens,
            "context_cache_tokens": context_cache_tokens,
            "thinking_tokens": thinking_tokens,
            "total_tokens": total_tokens
        }

        thought_lines = [
            f"[추론 모델: {active_model_label} / 온도: {temperature}]",
            f"- 리퀘스트: \"{user_prompt}\"",
            "",
            "[토큰 및 캐시 사용량 (Token & Cache Usage)]",
            f"- Input 토큰 (입력 프롬프트): {input_tokens:,} 토큰",
            f"- Output 토큰 (모델 응답): {output_tokens:,} 토큰" + (f" (추론 사고: {thinking_tokens:,} 토큰)" if thinking_tokens > 0 else ""),
            f"- Cache 토큰 (API 캐시 히트): {cached_tokens:,} 토큰 | 로컬 컨텍스트 캐시(메모리/로어북/규칙): {context_cache_tokens:,} 토큰",
            f"- 총 소비 토큰 (Total): {total_tokens:,} 토큰",
            ""
        ]
        if tool_execution_logs:
            thought_lines.append("[실행된 도구 및 플러그인 기록]")
            thought_lines.extend(tool_execution_logs)
        else:
            thought_lines.append("- 도구 호출 없이 직접 답변 생성됨")

        return {
            "status": "success",
            "reply": reply_text,
            "thoughts": "\n".join(thought_lines),
            "tool_logs": tool_execution_logs,
            "created_reminders": created_reminders,
            "usage": usage_summary
        }

    except Exception as e:
        err_msg = str(e)
        return {
            "status": "error",
            "reply": f"죄송합니다 주인님, 처리 도중 오류가 발생했습니다: {err_msg}",
            "thoughts": f"[오류 발생]\n{err_msg}\n\n도구 실행 추적:\n" + "\n".join(tool_execution_logs)
        }

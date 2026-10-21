import os
import sys
import time
from typing import List, Dict, Any, Optional
from google import genai
from google.genai import types

from backend.Services.settings_service import load_settings
from backend.Services.memory_service import get_active_memory_prompt, add_memory
from backend.core.tools import (
    get_current_time,
    list_directory_files,
    read_local_file,
    write_local_file,
    load_allowed_workspaces
)


def test_api_connection(api_key: str, model_name: str = "gemini-2.5-flash", base_url: Optional[str] = None) -> Dict[str, Any]:
    """지정된 모델 및 API 키의 연결 상태를 즉각 테스트합니다 (Gemini, OpenAI, 로컬 호환)."""
    if not api_key or not api_key.strip():
        return {"status": "error", "message": "API 키가 입력되지 않았습니다. 올바른 키를 입력해 주세요."}
    
    clean_model = model_name.strip() or "gemini-2.5-flash"
    start_time = time.time()
    
    try:
        # OpenAI 또는 호환 엔드포인트
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
        else:
            # Google Gemini
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
        if "401" in err_str or "UNAUTHENTICATED" in err_str or "API key not valid" in err_str:
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
    system_rules: str = ""
) -> Dict[str, Any]:
    """미노리 에이전트 루프: 지시 분석 -> 도구 실행 (Function Calling) -> 최종 응답 도출."""
    settings = load_settings()
    api_key = settings.get("api_key", "").strip() or os.environ.get("GEMINI_API_KEY", "")
    
    if not api_key:
        return {
            "status": "error",
            "reply": "⚠️ API 키가 설정되지 않았습니다. 사이드바의 [설정] -> [AI 모델 & API 설정]에서 API 키를 입력해 주세요.",
            "thoughts": "[오류] API 키 미등록 상태. settings.json 또는 설정 패널 확인 필요."
        }

    model_name = settings.get("model_name", "gemini-3.8-flash").strip() or "gemini-3.8-flash"
    temperature = float(settings.get("temperature", 0.2))

    # 도구 호출 추적 리스트
    tool_execution_logs = []

    # 도구 래퍼 함수 (호출 과정과 결과를 White Thought에 기록)
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

    available_tools = [
        logged_get_current_time,
        logged_list_directory_files,
        logged_read_local_file,
        logged_write_local_file,
        logged_save_hyper_memory
    ]

    workspaces = load_allowed_workspaces()
    ws_info = "\n".join([f"- {w.get('alias')}: {w.get('path')} (Read-Only: {w.get('read_only')})" for w in workspaces])

    hyper_memory_prompt = get_active_memory_prompt()

    # 토큰 최적화를 위해 베이스 지침은 간결하고 명확한 영어로 구성
    system_instruction = f"""You are 'MINORI' (미노리), an elite personal digital assistant inspired by J.A.R.V.I.S.
You loyally serve the user, addressing them politely and intelligently.

[Operational Directives]
1. Autonomous Tools: You have access to tools for checking current time, listing directories, reading files, writing files, and saving long-term memories. Always inspect before overwriting.
2. Hyper Memory: When the user specifies preferences, habits, personal facts, project rules, or says "remember this" ("기억해줘"), invoke `logged_save_hyper_memory(category, content)` immediately.
3. Allowed Workspaces:
{ws_info}

[Active Long-Term Memory]
{hyper_memory_prompt}

[Dynamic Lorebook Context]
{lorebook_context if lorebook_context else "None"}

[System Rules & Active Modules]
{system_rules if system_rules else "Default language: Korean (한국어). Refer to the user respectfully as '주인님'. Maintain polite, intelligent assistant tone."}
"""


    try:
        client = genai.Client(api_key=api_key)
        
        # 공식 권장 AFC(Automatic Function Calling) 표준인 Chat 세션 생성 및 메시지 전송
        chat = client.chats.create(
            model=model_name,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                tools=available_tools,
                temperature=temperature,
            ),
        )
        response = chat.send_message(user_prompt)

        reply_text = response.text or "작업을 완료했습니다, 주인님."

        thought_lines = [
            f"[추론 모델: {model_name} / 온도: {temperature}]",
            f"- 리퀘스트: \"{user_prompt}\"",
        ]
        if tool_execution_logs:
            thought_lines.append("[실행된 도구 기록]")
            thought_lines.extend(tool_execution_logs)
        else:
            thought_lines.append("- 도구 호출 없이 직접 답변 생성됨")

        return {
            "status": "success",
            "reply": reply_text,
            "thoughts": "\n".join(thought_lines),
            "tool_logs": tool_execution_logs
        }

    except Exception as e:
        err_msg = str(e)
        return {
            "status": "error",
            "reply": f"죄송합니다 주인님, 처리 도중 오류가 발생했습니다: {err_msg}",
            "thoughts": f"[오류 발생]\n{err_msg}\n\n도구 실행 추적:\n" + "\n".join(tool_execution_logs)
        }

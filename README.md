# 🌌 MINORI (미노리) v2.0
> **자율형 개인 디지털 비서 (Autonomous Personal Digital Secretary)**  
> *"아이언맨의 자비스(J.A.R.V.I.S.)처럼, 당신의 일상과 로컬 PC 환경을 스스로 보조하고 실행하는 지능형 파트너"*

<div align="center">

![Python](https://img.shields.io/badge/Python-3.10%2B-blue?logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-0.110%2B-009688?logo=fastapi)
![Google Gemini](https://img.shields.io/badge/Google%20Gemini-3.8%20Flash%20%7C%204%20Argon-4285F4?logo=google)
![Ollama](https://img.shields.io/badge/Ollama-Local%20Offline%20LLM-000000?logo=ollama)
![Whisper](https://img.shields.io/badge/OpenAI-Whisper%20STT-412991?logo=openai)
![Vanilla JS](https://img.shields.io/badge/Frontend-Vanilla%20JS%20%26%20CSS-F7DF1E?logo=javascript)
![License](https://img.shields.io/badge/License-MIT-green)

</div>

---

## 💡 프로젝트 소개 (Overview)

**MINORI(미노리)**는 웹 브라우저 안에서 단순한 질의응답만 반복하는 일반적인 챗봇의 한계를 넘어, **사용자의 로컬 PC 환경을 직접 인지하고, 음성으로 대화하며, 시각(Vision) 분석·이미지 제작·실시간 검색·타이머·플러그인 도구를 자율적으로 실행하여 작업을 완수하는 지능형 AI 비서 시스템**입니다.

사이버펑크 감성의 반응형 **사이버 코어(Cyber Core)** 인터페이스를 기반으로, 브라우저 기본 경고창(`alert`) 없는 현대적인 인터랙션, 하이퍼 메모리(장기 기억), 로어북(Lorebook) & 모듈형 규칙 주입 엔진, 정규식/트리거 매크로 파이프라인, 고정밀 음성 인식(STT)과 합성(TTS), 그리고 완전 오프라인 로컬 LLM(Ollama) 구동까지 하나로 통합했습니다.

---

## ✨ 핵심 기능 (Key Features)

### 1. 🖼️ 멀티모달 Vision 분석 & 채팅창 이미지 제작
- **드래그 앤 드롭 & `Ctrl+V` 캡처 붙여넣기**: 캡처 스크린샷, 사진, 에러 화면, 텍스트/코드/PDF 문서를 채팅창에 끌어다 놓으면 미노리가 즉시 화면 판독 및 문서 분석을 수행.
- **워크스페이스 이미지 시각 분석 (`inspect_workspace_image`)**: 로컬 작업 폴더 내 이미지 파일(`png`, `jpg`, `webp` 등)의 도표, OCR 텍스트, 레이아웃을 정밀 분석.
- **이미지 제작 및 인라인 뷰어 (`generate_image`)**: 자연어 요청으로 이미지를 생성(Google Imagen 3 및 고해상도 아트워크 엔진)하여 채팅창 말풍선 안에 즉시 출력 및 라이트박스 확대/다운로드 지원.

### 2. 🌐 실시간 기상 · URL 웹페이지 리더 · 무료 웹/뉴스 검색
- **실시간 기상 관측 (`get_realtime_weather`)**: 별도 API 키 없이 Open-Meteo 기상망을 통해 국내외 도시의 실시간 기온, 체감 온도, 습도, 최고/최저 기온, 강수 확률을 즉각 브리핑.
- **URL 본문 리더 (`read_webpage_url`)**: 뉴스나 블로그, 기술 문서 링크(URL)의 본문을 추출하여 핵심 요약 수행.
- **무료 실시간 웹/뉴스 검색 (`search_web_duckduckgo`)**: DuckDuckGo 웹 검색 및 실시간 뉴스 RSS를 결합하여 최신 정보 검색.

### 3. ⏰ 선제적 타이머 & 리마인더 (Proactive Notifications)
- *"10분 뒤에 알려줘"*, *"30초 뒤에 스트레칭하라고 알려줘"*, *"15:30에 회의 알려줘"* 등 자연어로 타이머/리마인더 등록.
- 상단 프로필 바에 **실시간 카운트다운 배지(`⏱ 09:42 · 스트레칭`)** 표시 및 지정 시각 도래 시 **채팅 메시지 + 사이버 토스트 + 음성(TTS)**으로 먼저 알림 수행.

### 4. 🔌 `plugins/` 폴더 기반 무중단 커스텀 도구 확장
- `plugins/` 폴더에 파이썬 파일(`.py`) 하나만 넣으면 **서버 재시작 없이(Hot-Reload)** 미노리가 새로운 기술(Function Calling 도구)로 자동 인식하여 즉시 사용.
- 기본 제공 플러그인: `plugins/pc_system_status.py` (로컬 PC의 RAM 메모리 점유율, 디스크 여유 공간, OS/아키텍처 실시간 진단).

### 5. 🧠 하이퍼 메모리 (Hyper Memory Engine)
- 대화 중 중요한 사용자 성향, 프로젝트 규칙, 장기 지침을 미노리가 스스로 판단하여 영구 저장(`logged_save_hyper_memory`)하거나 기존 기억을 자율 수정(`logged_update_hyper_memory`).
- 설정 대시보드에서 기억 항목의 실시간 추가, 인라인 수정, 활성/비활성 토글, 삭제 지원.

### 6. 🦙 로컬 LLM (Ollama) 완전 오프라인 무료 연동
- **[설정] ➔ [AI 모델 & API 설정]**에서 `🦙 Ollama / 로컬 LLM` 프리셋 선택 시, API 키나 인터넷 연결 없이 내 PC GPU(`http://localhost:11434/v1`)로만 동작하는 완전 오프라인 모드 지원 및 설치된 로컬 모델 자동 스캔.

### 7. 🎙️ 자율 음성 상호작용 (STT & TTS) & 토큰/캐시 인스펙터
- **고정밀 STT**: 브라우저 실시간 Web Speech API(미노리 음향 오인식 자동 교정 필터 탑재), **Google Gemini 3.8 Flash Audio STT**, **OpenAI Whisper-1** 지원.
- **자연스러운 문장 청킹 TTS**: 장문 답변도 쉼표 끊김(GC) 없이 끝까지 매끄럽게 낭독.
- **White Thought 토큰 & 캐시 인스펙터**: 각 응답의 **Input 토큰 / Output 토큰 / Cache 토큰(API 캐시 & 컨텍스트 캐시)** 및 실행된 도구 로그를 상단 배지와 접이식 아코디언으로 투명하게 표시.

---

## 📂 디렉터리 구조 (Project Structure)

```text
MINORI/
├── backend/
│   ├── app.py                     # FastAPI 메인 서버 및 라우터 (/api/chat, /api/stt, /api/memory 등)
│   ├── core/
│   │   ├── agent.py               # 자율 에이전트 루프 (Gemini / OpenAI / 로컬 Ollama & 멀티모달 통합)
│   │   ├── tools.py               # 내장 도구 모음 (파일 I/O, 실시간 날씨, 웹 검색/열람, Vision, 이미지 생성)
│   │   └── plugin_loader.py       # plugins/ 폴더 무중단 동적 스캔 및 Function Calling 래퍼
│   ├── Services/
│   │   ├── settings_service.py    # 환경 설정 로드/저장 서비스
│   │   ├── memory_service.py      # 하이퍼 메모리(장기 기억) CRUD 서비스
│   │   └── reminder_service.py    # 백그라운드 타이머 & 리마인더 스케줄링 서비스
│   └── data/
│       └── settings.example.json  # 초기 환경 설정 템플릿 (개인 API 키 제외)
├── frontend/
│   ├── index.html                 # 메인 사이버 코어 UI 및 대화면 설정 대시보드
│   ├── style.css                  # 다크 사이버 테마 스타일시트
│   ├── app.js                     # 프론트엔드 코어 로직 (드래그앤드롭, 마크다운/수식, STT/TTS, 타이머 등)
│   └── generated_images/          # 생성된 이미지 정적 서빙 폴더
├── plugins/
│   ├── README.md                  # 커스텀 파이썬 플러그인 작성 가이드
│   └── pc_system_status.py        # [기본 플러그인] 로컬 PC 메모리/디스크/OS 상태 진단 도구
├── requirements.txt               # Python 필수 패키지 목록
└── run_server.py                  # 원클릭 서버 실행 런처 (http://127.0.0.1:8000)
```

---

## 🚀 빠른 시작 가이드 (Quick Start)

### 1. 레포지토리 클론 및 패키지 설치
```bash
git clone https://github.com/your-username/MINORI.git
cd MINORI

# 가상환경 생성 및 활성화 (권장)
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # macOS / Linux

# 의존 패키지 설치
pip install -r requirements.txt
```

### 2. 서버 실행
```bash
python run_server.py
```

### 3. 브라우저 접속 및 초기 설정
1. 브라우저에서 **`http://127.0.0.1:8000`** 으로 접속합니다.
2. 좌측 상단 **[설정]** 탭 ➔ **[AI 모델 & API 설정]**에서 [Google AI Studio API Key](https://aistudio.google.com/)를 입력하고 **[설정 저장]**을 누르거나, 오프라인 사용 시 **`🦙 Ollama / 로컬 LLM`** 칩을 선택합니다.
3. 대화창에 캡처 이미지를 끌어다 놓거나 마이크/채팅으로 미노리에게 무엇이든 지시해 보세요!

---

## 📜 라이선스 (License)

This project is licensed under the MIT License.

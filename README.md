# MINORI

로컬 PC에서 띄워두고 쓰는 개인용 AI 비서 웹앱입니다.  
FastAPI 백엔드와 바닐라 JS 프론트엔드로 구성되어 있고, 단순 대화뿐 아니라 로컬 작업 폴더의 파일 읽기/쓰기, 이미지 분석 및 생성, 실시간 날씨·웹 검색, 타이머 알림 등을 직접 처리합니다.

---

## 주요 기능

- **로컬 파일 제어**: 지정된 작업 경로(`Workspace`) 내 디렉터리 탐색, 문서/코드 파일 읽기 및 생성·수정
- **이미지·문서 분석 (Vision)**: 채팅창에 캡처 화면(`Ctrl+V`)이나 이미지·문서 파일을 끌어다 놓으면 화면 판독 및 내용 요약 수행 (작업 폴더 내 이미지 분석 포함)
- **이미지 생성**: 프롬프트 요청 시 이미지를 생성해 `frontend/generated_images/`에 저장하고 채팅창에 바로 출력
- **실시간 날씨 & 웹 검색**:
  - Open-Meteo 연동 실시간 기온·강수 확률 조회 (별도 API 키 불필요)
  - URL 본문 스크래핑 요약 및 DuckDuckGo / 뉴스 RSS 기반 실시간 검색
- **타이머 & 리마인더**: *"10분 뒤에 알려줘"* 등 자연어로 타이머 등록 시 상단 카운트다운 표시 및 지정 시각에 음성(TTS)·토스트·채팅 알림
- **하이퍼 메모리 (장기 기억)**: 대화 중 기억해야 할 사용자 성향이나 프로젝트 규칙을 스스로 저장·수정하고 설정 탭에서 직접 관리
- **로어북 & 모듈 규칙 / 정규식·트리거**: 세션·노트 단위 컨텍스트 주입, 시스템 프롬프트 모듈 토글, 입출력 정규식 치환
- **음성 입출력 (STT / TTS)**: 브라우저 내장 Web Speech API, Gemini Audio STT, OpenAI Whisper 지원
- **로컬 LLM (Ollama) 연동**: 인터넷이나 유료 API 키 없이 로컬 PC의 Ollama(`localhost:11434`) 모델로 오프라인 구동 지원
- **플러그인 자동 로드 (`plugins/`)**: `plugins/` 폴더에 파이썬 파일(`.py`)을 넣으면 서버 재시작 없이 도구(Function Calling)로 자동 등록
- **토큰 & 캐시 확인**: 각 답변의 `White Thought` 탭에서 Input / Output / Cache 토큰 소비량 및 실행된 도구 로그 확인

---

## 폴더 구조

```text
├── backend/
│   ├── app.py                     # FastAPI 라우터 및 정적 파일 서빙
│   ├── core/
│   │   ├── agent.py               # 에이전트 루프 (Gemini / OpenAI / Ollama 연동)
│   │   ├── tools.py               # 내장 도구 (파일 I/O, 날씨, 웹 검색/본문 읽기, 이미지 분석/생성)
│   │   └── plugin_loader.py       # plugins/ 폴더 동적 로더
│   ├── Services/
│   │   ├── settings_service.py    # 설정 로드 및 저장
│   │   ├── memory_service.py      # 장기 기억(하이퍼 메모리) 관리
│   │   └── reminder_service.py    # 타이머 및 리마인더 관리
│   └── data/
│       └── settings.example.json  # 설정 파일 예시 (실제 settings.json은 git 제외)
├── frontend/
│   ├── index.html                 # 메인 UI 및 설정 화면
│   ├── style.css                  # 스타일시트
│   ├── app.js                     # 프론트엔드 로직
│   └── generated_images/          # 생성된 이미지 저장 경로
├── plugins/
│   ├── README.md                  # 커스텀 플러그인 작성법
│   └── pc_system_status.py        # 샘플 플러그인 (PC RAM/디스크 상태 조회)
├── requirements.txt
└── run_server.py                  # 서버 실행 스크립트
```

---

## 실행 방법

### 1. 패키지 설치

Python 3.10 이상 환경에서 필요한 패키지를 설치합니다.

```bash
pip install -r requirements.txt
```

### 2. 서버 시작

```bash
python run_server.py
```

서버가 실행되면 브라우저에서 `http://127.0.0.1:8000`으로 접속합니다.

### 3. 초기 설정

1. 좌측 상단 **[설정]** 탭을 누릅니다.
2. **[AI 모델 & API 설정]**에서 Gemini API 키(또는 OpenAI 키)를 입력하고 저장합니다.
   - 오프라인 로컬 모델을 쓸 경우 **Ollama** 프리셋을 누르면 별도 API 키 없이 `http://localhost:11434/v1`로 연결됩니다.
3. 설정을 닫고 채팅창이나 마이크 버튼으로 명령을 입력하면 됩니다.

---

## 커스텀 플러그인 추가 (`plugins/`)

`plugins/` 폴더 안에 일반 파이썬 함수가 담긴 `.py` 파일을 넣으면 미노리가 자동으로 새 도구로 인식합니다.  
함수의 인자 타입 힌트(Type Hint)와 독스트링(Docstring)을 적어두면 상황에 맞춰 알아서 호출합니다. 자세한 예시는 `plugins/README.md`를 참고하세요.

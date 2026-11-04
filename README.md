<div align="center">
  <img src="docs/assets/minori_banner.svg" alt="MINORI Banner" width="100%" />

  <br />

  <img src="https://img.shields.io/badge/Python-3.10+-3776AB?style=flat-square&logo=python&logoColor=white" alt="Python" />
  <img src="https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/Vanilla_JS-ES6+-F7DF1E?style=flat-square&logo=javascript&logoColor=black" alt="JavaScript" />
  <img src="https://img.shields.io/badge/Google_Gemini-8E75B2?style=flat-square&logo=googlegemini&logoColor=white" alt="Gemini" />
  <img src="https://img.shields.io/badge/Ollama-Local_LLM-000000?style=flat-square" alt="Ollama" />
  <img src="https://img.shields.io/badge/Platform-Windows_Standalone_.EXE-0078D6?style=flat-square&logo=windows&logoColor=white" alt="Windows" />
</div>

<br />

로컬 PC에서 띄워두고 쓰는 개인용 AI 비서 데스크톱 웹앱입니다.  
FastAPI 백엔드와 바닐라 JS 프론트엔드로 구성되어 있으며, 일반 대화뿐 아니라 로컬 작업 폴더의 파일·오피스 문서 제어, 이미지 판독 및 생성, 실시간 날씨·웹 검색, 타이머 알림, 정규식 기반 CSS 상태창 시각화를 직접 수행합니다.

---

## 시스템 아키텍처 개요도

<div align="center">
  <img src="docs/assets/minori_architecture.svg" alt="MINORI System Architecture" width="100%" />
</div>

---

## 정규식 기반 CSS 상태창 & 감정 컬러 연동

채팅창에 `[상태창]...[/상태창]` (또는 `[상태창: ...]`) 형태로 작성된 텍스트를 정규식 파이프라인이 감지해, 줄 수나 항목 이름 제한 없이 **HUD 상태창 위젯(그리드 카드, `%` 게이지 바, 브리핑 박스)**으로 실시간 변환합니다.  
감정 키워드(`기쁨`, `미소`, `슬픔`, `화남`, `생각중`, `놀람`, `사랑` 등)에 따라 사이버 코어와 상태창의 네온 컬러 테마가 함께 변합니다.

<div align="center">
  <img src="docs/assets/minori_status_hud.svg" alt="MINORI Status HUD Preview" width="100%" />
</div>

---

## 주요 기능

- **로컬 파일 및 오피스 문서 제어**:
  - 지정된 작업 경로(`Workspace`) 내 디렉터리 탐색, 텍스트/코드 파일 생성 및 부분 수정(`edit_local_file`)
  - 작업 폴더 내 Word(`.docx`), Excel(`.xlsx`), PDF(`.pdf`) 문서 텍스트·표 직접 추출
  - 폴더 내 전체 파일 키워드 일괄 검색(`search_in_files`) 및 윈도우 탐색기/기본 연결 프로그램 즉시 실행(`open_local_path`)
  - 사이드바에서 Windows 기본 폴더 찾아보기 창을 통한 작업 경로 즉시 변경
- **이미지·문서 분석 (Vision)**: 채팅창에 캡처 화면(`Ctrl+V`)이나 이미지·문서 파일을 끌어다 놓으면 화면 판독 및 내용 요약 수행 (작업 폴더 내 이미지 분석 포함)
- **이미지 생성**: 프롬프트 요청 시 이미지를 생성해 `frontend/generated_images/`에 저장하고 채팅창에 바로 출력
- **실시간 날씨 & 웹 검색 & 시스템 시계**:
  - Open-Meteo 연동 실시간 기온·강수 확률 조회 (별도 API 키 불필요)
  - URL 본문 스크래핑 요약 및 DuckDuckGo / 뉴스 RSS 기반 실시간 검색
  - 초 단위(`HH:MM:SS`) 실시간 시스템 시각 동기화
- **타이머 & 리마인더**: *"10분 뒤에 알려줘"* 등 자연어로 타이머 등록 시 상단 카운트다운 표시 및 지정 시각에 음성(TTS)·토스트·채팅 알림
- **대화 세션 영구 보관 & 관리**:
  - 모든 대화 내역과 노트(폴더) 구조를 로컬 디스크에 자동 동기화하여 앱 재실행 시에도 그대로 유지
  - 대화 제목 및 본문 실시간 키워드 검색, 답변 생성 중 즉시 중단(`[■ 중지]` 버튼 / `Esc`) 지원
- **하이퍼 메모리 (장기 기억)**: 대화 중 기억해야 할 사용자 성향이나 프로젝트 규칙을 스스로 저장·수정하고, 설정 탭에서 JSON 내보내기/불러오기 및 직접 편집 가능
- **로어북 & 모듈 규칙 / 트리거**: 세션·노트 단위 컨텍스트 주입, 시스템 프롬프트 모듈 토글, 버튼/이벤트 트리거 실행
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
│   │   ├── tools.py               # 내장 도구 (파일/오피스 I/O, 검색, 탐색기 제어, 날씨, 웹, 이미지)
│   │   ├── paths.py               # 개발 환경 및 PyInstaller(.exe) 패키징 경로 분기
│   │   └── plugin_loader.py       # plugins/ 폴더 동적 로더
│   ├── Services/
│   │   ├── settings_service.py    # 설정 로드, 작업 공간 동기화 및 초기화
│   │   ├── session_service.py     # 멀티턴 대화 세션 로컬 디스크 영속화
│   │   ├── memory_service.py      # 장기 기억(하이퍼 메모리) 관리 및 백업/복원
│   │   └── reminder_service.py    # 타이머 및 리마인더 관리
│   └── data/
│       └── settings.example.json  # 설정 파일 예시 (실제 settings.json 및 개인 데이터는 git 제외)
├── frontend/
│   ├── index.html                 # 메인 UI 및 설정 대시보드
│   ├── style.css                  # 스타일시트 (감정 컬러 테마 및 상태창 위젯 포함)
│   ├── app.js                     # 프론트엔드 로직 및 정규식/트리거 파이프라인
│   └── generated_images/          # 생성된 이미지 저장 경로
├── docs/
│   └── assets/                    # README 전용 커스텀 SVG 배너 및 아키텍처 다이어그램
├── plugins/
│   ├── README.md                  # 커스텀 플러그인 작성법
│   └── pc_system_status.py        # 샘플 플러그인 (PC RAM/디스크 상태 조회)
├── build_exe.py                   # PyInstaller 기반 윈도우 실행 파일(MINORI.exe) 빌드 스크립트
├── requirements.txt
└── run_server.py                  # 서버 및 앱 모드(App Window) 런처 스크립트
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

실행하면 로컬 서버(`http://127.0.0.1:8000`)가 올라오면서 독립 앱 창(Edge/Chrome `--app` 모드)이 자동으로 열립니다.

### 3. 단독 실행 파일(`.exe`) 빌드 (선택)

Python이 없는 환경이나 바탕화면 바로가기용으로 패키징하려면 아래 스크립트를 실행합니다.

```bash
python build_exe.py
```

빌드가 완료되면 `dist/MINORI/MINORI.exe`가 생성됩니다.

### 4. 초기 설정

1. 좌측 상단 **[설정]** 탭을 누릅니다.
2. **[AI 모델 & API 설정]**에서 Gemini API 키(또는 OpenAI 키)를 입력하고 사용할 모델을 선택한 뒤 저장합니다.
   - 오프라인 로컬 모델을 쓸 경우 **Ollama** 프리셋을 누르면 별도 API 키 없이 `http://localhost:11434/v1`로 연결됩니다.
3. 설정을 닫고 채팅창이나 마이크 버튼으로 명령을 입력하면 됩니다.

---

## 커스텀 플러그인 추가 (`plugins/`)

`plugins/` 폴더 안에 일반 파이썬 함수가 담긴 `.py` 파일을 넣으면 미노리가 자동으로 새 도구로 인식합니다.  
함수의 인자 타입 힌트(Type Hint)와 독스트링(Docstring)을 적어두면 상황에 맞춰 알아서 호출합니다. 자세한 예시는 `plugins/README.md`를 참고하세요.

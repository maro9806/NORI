import os
import sys
import time
import socket
import shutil
import threading
import subprocess
import webbrowser
import urllib.request

from backend.core.paths import get_app_root

HOST = "127.0.0.1"
PORT = 8000
APP_URL = f"http://{HOST}:{PORT}"


def setup_logging_streams():
    """--noconsole (창 숨김) 빌드 시 stdout/stderr가 None이 되어 Uvicorn이 크래시하는 현상 방지."""
    is_frozen = getattr(sys, "frozen", False)
    if sys.stdout is None or sys.stderr is None or is_frozen:
        log_path = os.path.join(get_app_root(), "minori_server.log")
        try:
            log_file = open(log_path, "a", encoding="utf-8", buffering=1)
            if sys.stdout is None or is_frozen:
                sys.stdout = log_file
            if sys.stderr is None or is_frozen:
                sys.stderr = log_file
        except Exception:
            pass
    elif sys.platform == "win32":
        try:
            sys.stdout.reconfigure(encoding="utf-8")
            sys.stderr.reconfigure(encoding="utf-8")
        except Exception:
            pass


def is_port_in_use(port: int = PORT) -> bool:
    """포트가 이미 사용 중인지(서버가 이미 실행 중인지) 확인."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.5)
        return s.connect_ex((HOST, port)) == 0


def find_chromium_browser() -> str:
    """Chrome 또는 Edge 실행 파일 경로를 탐색하여 --app 모드를 지원합니다."""
    candidates = [
        shutil.which("chrome"),
        shutil.which("msedge"),
        os.path.expandvars(r"%ProgramFiles%\Google\Chrome\Application\chrome.exe"),
        os.path.expandvars(r"%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"),
        os.path.expandvars(r"%LocalAppData%\Google\Chrome\Application\chrome.exe"),
        os.path.expandvars(r"%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"),
        os.path.expandvars(r"%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"),
    ]
    for path in candidates:
        if path and os.path.isfile(path):
            return path
    return ""


def open_app_window(url: str = APP_URL):
    """Chrome/Edge의 --app 모드로 주소창 없는 독립 데스크톱 앱 창을 띄웁니다."""
    browser_exe = find_chromium_browser()
    if browser_exe:
        try:
            subprocess.Popen(
                [browser_exe, f"--app={url}", "--window-size=1280,860"],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
            return
        except Exception:
            pass
    webbrowser.open(url)


def wait_and_open_browser(url: str = APP_URL):
    """서버가 응답할 준비가 되면 자동으로 앱 창을 엽니다."""
    for _ in range(40):
        try:
            with urllib.request.urlopen(f"{url}/api/settings", timeout=0.5) as resp:
                if resp.status == 200:
                    break
        except Exception:
            time.sleep(0.25)
    open_app_window(url)


if __name__ == "__main__":
    setup_logging_streams()

    # 이미 서버가 백그라운드에서 실행 중이면 브라우저 앱 창만 즉시 띄우고 종료
    if is_port_in_use(PORT):
        open_app_window(APP_URL)
        sys.exit(0)

    import uvicorn
    from backend.app import app

    print("=" * 60)
    print(f"[MINORI] 개인 디지털 비서 서버 시작 ({ time.strftime('%Y-%m-%d %H:%M:%S') })")
    print(f"브라우저 접속 주소: {APP_URL}")
    print("=" * 60)

    # 서버 기동 완료 후 자동으로 앱 모드 창 열기
    threading.Thread(target=wait_and_open_browser, args=(APP_URL,), daemon=True).start()

    is_frozen = getattr(sys, "frozen", False)
    if is_frozen:
        uvicorn.run(app, host=HOST, port=PORT, reload=False, log_config=None)
    else:
        uvicorn.run("backend.app:app", host=HOST, port=PORT, reload=False)

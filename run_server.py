import os
import sys

# Windows 콘솔 인코딩 방어
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

import uvicorn

if __name__ == "__main__":
    print("=" * 60)
    print("[MINORI] 개인 디지털 비서 서버 시작")
    print("브라우저 접속 주소: http://127.0.0.1:8000")
    print("API 설정: [설정] -> [AI 모델 & API 설정]에서 API 키를 입력하세요.")
    print("=" * 60)
    uvicorn.run("backend.app:app", host="127.0.0.1", port=8000, reload=True)

import os
import sys
import time
import shutil
import subprocess
import urllib.request

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
DIST_DIR = os.path.join(ROOT_DIR, "dist", "MINORI")


def copy_tree_clean(src: str, dst: str):
    if not os.path.exists(src):
        return
    if os.path.exists(dst):
        shutil.rmtree(dst)
    shutil.copytree(src, dst)


def sync_data_preserve_existing(src: str, dst: str):
    """재빌드 시 dist/MINORI/backend/data 내 기존 대화/설정/메모리 파일이 날아가지 않도록 보존하며 복사합니다."""
    if not os.path.exists(src):
        return
    os.makedirs(dst, exist_ok=True)
    for item in os.listdir(src):
        s_item = os.path.join(src, item)
        d_item = os.path.join(dst, item)
        if os.path.isdir(s_item):
            sync_data_preserve_existing(s_item, d_item)
        else:
            if not os.path.exists(d_item):
                shutil.copy2(s_item, d_item)


def stop_running_minori():
    """실행 중인 MINORI 서버 및 프로세스 트리를 안전하게 종료하여 파일 잠금(PermissionError)을 해제합니다."""
    try:
        req = urllib.request.Request("http://127.0.0.1:8000/api/shutdown", method="POST")
        urllib.request.urlopen(req, timeout=1.0)
    except Exception:
        pass

    if sys.platform == "win32":
        subprocess.run(
            ["taskkill", "/F", "/T", "/IM", "MINORI.exe"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
    time.sleep(1.5)


def main():
    stop_running_minori()

    # 기존 dist/MINORI/backend/data 백업 보관
    dist_data_dir = os.path.join(DIST_DIR, "backend", "data")
    backup_data_dir = os.path.join(ROOT_DIR, "build", "_data_backup")
    if os.path.exists(dist_data_dir):
        if os.path.exists(backup_data_dir):
            shutil.rmtree(backup_data_dir, ignore_errors=True)
        shutil.copytree(dist_data_dir, backup_data_dir)

    print("[1/3] PyInstaller 빌드 시작 (옵션 A: 앱 모드 / 콘솔 숨김 / 폴더형)...")

    cmd = [
        sys.executable,
        "-m",
        "PyInstaller",
        "--noconfirm",
        "--onedir",
        "--noconsole",
        "--name",
        "MINORI",
        "--hidden-import=uvicorn",
        "--hidden-import=fastapi",
        "--hidden-import=starlette",
        "--hidden-import=pydantic",
        "--hidden-import=multipart",
        "--hidden-import=python_multipart",
        "--hidden-import=google.genai",
        "--hidden-import=openai",
        "--exclude-module=torch",
        "--exclude-module=torchvision",
        "--exclude-module=torchaudio",
        "--exclude-module=scipy",
        "--exclude-module=pandas",
        "--exclude-module=pyarrow",
        "--exclude-module=matplotlib",
        "--exclude-module=IPython",
        "--exclude-module=notebook",
        "run_server.py",
    ]

    subprocess.run(cmd, cwd=ROOT_DIR, check=True)

    print("[2/3] 외부 리소스 폴더 복사 중 (frontend, plugins, backend/data)...")
    copy_tree_clean(
        os.path.join(ROOT_DIR, "frontend"),
        os.path.join(DIST_DIR, "frontend"),
    )
    copy_tree_clean(
        os.path.join(ROOT_DIR, "plugins"),
        os.path.join(DIST_DIR, "plugins"),
    )

    if os.path.exists(backup_data_dir):
        sync_data_preserve_existing(backup_data_dir, dist_data_dir)
        shutil.rmtree(backup_data_dir, ignore_errors=True)
    sync_data_preserve_existing(
        os.path.join(ROOT_DIR, "backend", "data"),
        dist_data_dir,
    )

    print("[3/3] 보조 종료 스크립트 생성 중...")
    stop_bat_path = os.path.join(DIST_DIR, "Stop_MINORI.bat")
    with open(stop_bat_path, "w", encoding="utf-8") as f:
        f.write(
            "@echo off\n"
            "chcp 65001 >nul\n"
            "echo MINORI 백그라운드 프로세스를 종료합니다...\n"
            "taskkill /F /T /IM MINORI.exe >nul 2>&1\n"
            "echo 종료 완료.\n"
            "timeout /t 2 >nul\n"
        )

    exe_path = os.path.join(DIST_DIR, "MINORI.exe")
    print("=" * 60)
    print(f"빌드 완료: {exe_path}")
    print("=" * 60)


if __name__ == "__main__":
    main()

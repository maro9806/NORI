"""
MINORI 기본 제공 플러그인: PC 시스템 리소스 및 하드웨어 상태 진단 도구
이 파일을 plugins/ 폴더에 넣어두면 미노리가 자동으로 PC 메모리/디스크/OS 상태를 확인하는 기술을 습득합니다.
"""
import os
import shutil
import platform
import ctypes


def get_pc_system_status(drive_path: str = "D:\\") -> dict:
    """현재 로컬 PC의 운영체제 정보, 물리 RAM 메모리 사용량 및 여유 공간, 디스크 용량 상태를 실시간 진단합니다.

    Args:
        drive_path: 용량을 확인할 드라이브 경로 (기본값: 'D:\\')
    """
    info = {
        "os": f"{platform.system()} {platform.release()} ({platform.version()})",
        "architecture": platform.machine(),
        "processor": platform.processor(),
        "python_version": platform.python_version(),
    }

    # Windows 메모리 상태 조회 (외부 패키지 없이 ctypes kernel32 직접 호출)
    try:
        class MEMORYSTATUSEX(ctypes.Structure):
            _fields_ = [
                ("dwLength", ctypes.c_ulong),
                ("dwMemoryLoad", ctypes.c_ulong),
                ("ullTotalPhys", ctypes.c_ulonglong),
                ("ullAvailPhys", ctypes.c_ulonglong),
                ("ullTotalPageFile", ctypes.c_ulonglong),
                ("ullAvailPageFile", ctypes.c_ulonglong),
                ("ullTotalVirtual", ctypes.c_ulonglong),
                ("ullAvailVirtual", ctypes.c_ulonglong),
                ("sullAvailExtendedVirtual", ctypes.c_ulonglong),
            ]

        stat = MEMORYSTATUSEX()
        stat.dwLength = ctypes.sizeof(stat)
        ctypes.windll.kernel32.GlobalMemoryStatusEx(ctypes.byref(stat))
        total_gb = round(stat.ullTotalPhys / (1024 ** 3), 2)
        avail_gb = round(stat.ullAvailPhys / (1024 ** 3), 2)
        used_gb = round(total_gb - avail_gb, 2)
        info["memory"] = {
            "usage_percent": stat.dwMemoryLoad,
            "total_gb": total_gb,
            "used_gb": used_gb,
            "available_gb": avail_gb
        }
    except Exception as e:
        info["memory_error"] = str(e)

    # 디스크 용량 조회
    try:
        target = drive_path if os.path.exists(drive_path) else os.getcwd()
        total, used, free = shutil.disk_usage(target)
        info["disk"] = {
            "drive": target,
            "total_gb": round(total / (1024 ** 3), 2),
            "used_gb": round(used / (1024 ** 3), 2),
            "free_gb": round(free / (1024 ** 3), 2),
            "usage_percent": round((used / total) * 100, 1) if total > 0 else 0
        }
    except Exception as e:
        info["disk_error"] = str(e)

    return {
        "status": "success",
        "system_report": info
    }

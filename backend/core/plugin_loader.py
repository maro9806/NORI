import os
import inspect
import functools
import importlib.util
from typing import List, Dict, Any, Callable

PLUGINS_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "plugins")
)


def ensure_plugins_dir() -> str:
    os.makedirs(PLUGINS_DIR, exist_ok=True)
    return PLUGINS_DIR


def discover_plugins_metadata() -> List[Dict[str, Any]]:
    """plugins/ 폴더 내의 모든 파이썬(.py) 플러그인과 등록된 도구 함수 메타데이터를 스캔합니다."""
    ensure_plugins_dir()
    plugins_info = []

    for fname in sorted(os.listdir(PLUGINS_DIR)):
        if not fname.endswith(".py") or fname.startswith("_"):
            continue

        fpath = os.path.join(PLUGINS_DIR, fname)
        if not os.path.isfile(fpath):
            continue

        mod_name = os.path.splitext(fname)[0]
        try:
            spec = importlib.util.spec_from_file_location(f"minori_plugin_{mod_name}", fpath)
            if not spec or not spec.loader:
                continue
            mod = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(mod)

            funcs = []
            for name, obj in inspect.getmembers(mod, inspect.isfunction):
                if name.startswith("_") or obj.__module__ != mod.__name__:
                    continue
                doc = (inspect.getdoc(obj) or "사용자 정의 플러그인 도구").strip()
                sig = str(inspect.signature(obj))
                funcs.append({
                    "name": name,
                    "signature": f"{name}{sig}",
                    "description": doc.split("\n")[0]
                })

            plugins_info.append({
                "file": fname,
                "module": mod_name,
                "status": "loaded",
                "tools": funcs
            })
        except Exception as e:
            plugins_info.append({
                "file": fname,
                "module": mod_name,
                "status": "error",
                "error": str(e),
                "tools": []
            })

    return plugins_info


def load_plugin_tools(tool_execution_logs: List[str]) -> List[Callable]:
    """plugins/ 폴더의 모든 .py 파일에서 도구 함수를 동적으로 로드하고 White Thought 로깅 래퍼를 씌워 반환합니다."""
    ensure_plugins_dir()
    loaded_tools: List[Callable] = []

    for fname in sorted(os.listdir(PLUGINS_DIR)):
        if not fname.endswith(".py") or fname.startswith("_"):
            continue

        fpath = os.path.join(PLUGINS_DIR, fname)
        if not os.path.isfile(fpath):
            continue

        mod_name = os.path.splitext(fname)[0]
        try:
            spec = importlib.util.spec_from_file_location(f"minori_plugin_{mod_name}", fpath)
            if not spec or not spec.loader:
                continue
            mod = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(mod)

            for func_name, func_obj in inspect.getmembers(mod, inspect.isfunction):
                if func_name.startswith("_") or func_obj.__module__ != mod.__name__:
                    continue

                def make_logged_plugin_tool(fn: Callable, plugin_file: str, f_name: str):
                    @functools.wraps(fn)
                    def wrapper(*args, **kwargs):
                        arg_str = ", ".join(
                            [repr(a) for a in args] + [f"{k}={repr(v)}" for k, v in kwargs.items()]
                        )
                        tool_execution_logs.append(f"[플러그인 도구 실행] {plugin_file} ➔ {f_name}({arg_str})")
                        try:
                            res = fn(*args, **kwargs)
                            preview = str(res)
                            if len(preview) > 140:
                                preview = preview[:140] + "..."
                            tool_execution_logs.append(f"  └ 플러그인 결과: {preview}")
                            if isinstance(res, dict):
                                return res
                            return {"status": "success", "result": res}
                        except Exception as ex:
                            tool_execution_logs.append(f"  └ 플러그인 오류: {str(ex)}")
                            return {"status": "error", "message": str(ex)}

                    wrapper.__signature__ = inspect.signature(fn)
                    if not wrapper.__doc__:
                        wrapper.__doc__ = f"플러그인({plugin_file}) 커스텀 도구: {f_name}"
                    return wrapper

                loaded_tools.append(make_logged_plugin_tool(func_obj, fname, func_name))
        except Exception as e:
            tool_execution_logs.append(f"[플러그인 로드 경고] {fname}: {str(e)}")

    return loaded_tools

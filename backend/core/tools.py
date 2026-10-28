# 파일 I/O, 디렉터리 스캔, 실시간 기상, 웹 검색/열람, 비전 분석, 이미지 생성 도구 모음
import os
import re
import json
import uuid
import time
import mimetypes
import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET
from html.parser import HTMLParser
from datetime import datetime
from typing import Dict, Any, List

# 설정 파일 기본 경로
SETTINGS_FILE_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "data", "settings.json")
)

# 생성 이미지 정적 서빙 폴더 (frontend/generated_images)
GENERATED_IMAGES_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "generated_images")
)


def load_allowed_workspaces() -> List[Dict[str, Any]]:
    """settings에서 활성화된 허용 작업 공간 목록을 로드."""
    if not os.path.exists(SETTINGS_FILE_PATH):
        # 기본 디렉터리 폴백
        return [
            {
                "id": "ws_default",
                "alias": "기본 작업 폴더",
                "path": os.path.abspath(r"D:\AIproject"),
                "read_only": False,
                "enabled": True,
            }
        ]

    try:
        with open(SETTINGS_FILE_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
            return [ws for ws in data.get("allowed_workspaces", []) if ws.get("enabled", True)]
    except Exception:
        return []


def validate_workspace_path(target_path: str, action: str = "read") -> tuple[bool, str, str]:
    """경로가 허용된 작업 공간 내에 있는지 검증하고 절대 경로를 반환합니다.
    
    Returns:
        (is_valid, resolved_abs_path, message)
    """
    workspaces = load_allowed_workspaces()
    if not workspaces:
        return False, "", "접근 실패: 활성화된 작업 공간(Workspace)이 설정되지 않았습니다."

    # 입력된 경로가 상대 경로일 경우 첫 번째 기본 작업 공간을 기준으로 해석
    default_base = os.path.abspath(workspaces[0]["path"])
    abs_target = os.path.abspath(
        target_path if os.path.isabs(target_path) else os.path.join(default_base, target_path)
    )

    matched_workspace = None
    for ws in workspaces:
        base_dir = os.path.abspath(ws["path"])
        try:
            # Path Traversal 방어: 대상 경로가 허용 기준 경로의 하위 디렉터리인지 확인
            if os.path.commonpath([abs_target, base_dir]) == base_dir:
                matched_workspace = ws
                break
        except ValueError:
            continue

    if not matched_workspace:
        return False, "", f"보안 차단: 승인된 작업 공간 외부에 대한 접근이 거부되었습니다. ({abs_target})"

    if action == "write" and matched_workspace.get("read_only", False):
        return False, "", f"권한 오류: '{matched_workspace.get('alias')}' 공간은 읽기 전용으로 보호되어 있습니다."

    return True, abs_target, "OK"


# =====================================================================
# Gemini Function Calling 전용 도구 함수 정의
# =====================================================================

def get_current_time() -> dict:
    """현재 시스템의 정확한 날짜, 시각, 요일 정보를 반환합니다."""
    now = datetime.now()
    return {
        "status": "success",
        "current_time": now.strftime("%Y-%m-%d %H:%M:%S"),
        "year": now.year,
        "month": now.month,
        "day": now.day,
        "weekday": now.strftime("%A"),
    }


def list_directory_files(relative_or_abs_path: str = ".") -> dict:
    """허용된 작업 공간 내의 특정 폴더 파일 및 디렉터리 목록을 스캔합니다.
    
    Args:
        relative_or_abs_path: 스캔할 디렉터리 경로 (기본값: 작업 공간 루트)
    """
    is_valid, target_dir, msg = validate_workspace_path(relative_or_abs_path, action="read")
    if not is_valid:
        return {"status": "error", "message": msg}

    if not os.path.exists(target_dir):
        return {"status": "error", "message": f"디렉터리가 존재하지 않습니다: {relative_or_abs_path}"}

    if not os.path.isdir(target_dir):
        return {"status": "error", "message": f"지정된 경로는 폴더가 아닙니다: {relative_or_abs_path}"}

    try:
        entries = []
        for item in os.listdir(target_dir):
            item_path = os.path.join(target_dir, item)
            is_dir = os.path.isdir(item_path)
            size = os.path.getsize(item_path) if not is_dir else 0
            entries.append({
                "name": item,
                "type": "directory" if is_dir else "file",
                "size_bytes": size
            })

        return {
            "status": "success",
            "directory": target_dir,
            "total_items": len(entries),
            "entries": entries
        }
    except Exception as e:
        return {"status": "error", "message": f"목록 조회 실패: {str(e)}"}


def read_local_file(file_path: str) -> dict:
    """허용된 작업 공간 내의 텍스트 파일 내용을 읽어옵니다.
    
    Args:
        file_path: 읽을 파일의 상대 경로 또는 허용된 절대 경로
    """
    is_valid, target_path, msg = validate_workspace_path(file_path, action="read")
    if not is_valid:
        return {"status": "error", "message": msg}

    if not os.path.exists(target_path):
        return {"status": "error", "message": f"파일을 찾을 수 없습니다: {file_path}"}

    if not os.path.isfile(target_path):
        return {"status": "error", "message": f"지정된 경로는 파일이 아닙니다: {file_path}"}

    try:
        with open(target_path, "r", encoding="utf-8", errors="replace") as f:
            content = f.read()

        return {
            "status": "success",
            "file_path": target_path,
            "char_count": len(content),
            "content": content
        }
    except Exception as e:
        return {"status": "error", "message": f"파일 읽기 오류: {str(e)}"}


def write_local_file(file_path: str, content: str) -> dict:
    """허용된 작업 공간 내에 파일을 새로 작성하거나 기존 파일 내용을 갱신합니다.
    
    Args:
        file_path: 저장할 파일의 상대 경로 또는 허용된 절대 경로
        content: 파일에 기록할 텍스트 본문
    """
    is_valid, target_path, msg = validate_workspace_path(file_path, action="write")
    if not is_valid:
        return {"status": "error", "message": msg}

    try:
        # 상위 디렉터리가 없으면 자동 생성
        parent_dir = os.path.dirname(target_path)
        if parent_dir and not os.path.exists(parent_dir):
            os.makedirs(parent_dir, exist_ok=True)

        with open(target_path, "w", encoding="utf-8") as f:
            f.write(content)

        return {
            "status": "success",
            "file_path": target_path,
            "size_written": len(content),
            "message": f"파일이 성공적으로 기록되었습니다. (경로: {target_path})"
        }
    except Exception as e:
        return {"status": "error", "message": f"파일 쓰기 실패: {str(e)}"}


# WMO 날씨 코드 해석 딕셔너리
WMO_WEATHER_CODES = {
    0: "맑음",
    1: "대체로 맑음",
    2: "구름 조금",
    3: "흐림",
    45: "안개",
    48: "서리 안개",
    51: "가벼운 이슬비",
    53: "보통 이슬비",
    55: "짙은 이슬비",
    61: "약한 비",
    63: "보통 비",
    65: "강한 비",
    71: "약한 눈",
    73: "보통 눈",
    75: "강한 눈",
    77: "싸락눈",
    80: "약한 소나기",
    81: "보통 소나기",
    82: "강한 소나기",
    85: "눈 소나기",
    86: "강한 눈 소나기",
    95: "천둥번개",
    96: "천둥번개 및 약한 우박",
    99: "천둥번개 및 강한 우박"
}

KOREA_MAJOR_CITIES = {
    "서울": (37.5665, 126.9780),
    "판교": (37.4019, 127.1086),
    "성남": (37.4200, 127.1265),
    "분당": (37.3827, 127.1189),
    "수원": (37.2636, 127.0286),
    "인천": (37.4563, 126.7052),
    "부산": (35.1796, 129.0756),
    "대구": (35.8714, 128.6014),
    "대전": (36.3504, 127.3845),
    "광주": (35.1595, 126.8526),
    "울산": (35.5384, 129.3114),
    "세종": (36.4800, 127.2890),
    "제주": (33.4996, 126.5312),
    "서귀포": (33.2541, 126.5601),
    "춘천": (37.8813, 127.7298),
    "강릉": (37.7519, 128.8761),
    "청주": (36.6424, 127.4890),
    "전주": (35.8242, 127.1480),
    "포항": (36.0190, 129.3435),
    "창원": (35.2280, 128.6811),
    "여수": (34.7604, 127.6622)
}


def get_realtime_weather(location: str = "서울") -> dict:
    """실시간 기상 정보(현재 기온, 체감 온도, 날씨 상태, 당일 최고/최저 기온, 강수 확률 등)를 조회합니다.
    
    Args:
        location: 조회할 지역명 또는 도시명 (예: '서울', '판교', '부산', 'Tokyo', 'New York' 등. 기본값: '서울')
    """
    loc_clean = (location or "서울").strip()
    lat, lon, resolved_name = None, None, loc_clean

    for city_key, coords in KOREA_MAJOR_CITIES.items():
        if city_key in loc_clean:
            lat, lon = coords
            resolved_name = city_key
            break

    if lat is None or lon is None:
        try:
            geo_url = f"https://geocoding-api.open-meteo.com/v1/search?name={urllib.parse.quote(loc_clean)}&count=1&format=json"
            req_geo = urllib.request.Request(geo_url, headers={"User-Agent": "MinoriAssistant/1.0"})
            with urllib.request.urlopen(req_geo, timeout=5) as resp:
                geo_data = json.loads(resp.read().decode("utf-8"))
            if geo_data.get("results"):
                top = geo_data["results"][0]
                lat = top["latitude"]
                lon = top["longitude"]
                resolved_name = top.get("name", loc_clean)
        except Exception:
            pass

    if lat is None or lon is None:
        lat, lon = 37.5665, 126.9780
        resolved_name = f"{loc_clean}(서울 기준)"

    try:
        weather_url = (
            f"https://api.open-meteo.com/v1/forecast?"
            f"latitude={lat}&longitude={lon}&"
            f"current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&"
            f"daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&"
            f"timezone=auto"
        )
        req_w = urllib.request.Request(weather_url, headers={"User-Agent": "MinoriAssistant/1.0"})
        with urllib.request.urlopen(req_w, timeout=5) as resp:
            w_data = json.loads(resp.read().decode("utf-8"))

        current = w_data.get("current", {})
        daily = w_data.get("daily", {})

        w_code = current.get("weather_code", 0)
        condition_str = WMO_WEATHER_CODES.get(w_code, "맑음")
        temp = current.get("temperature_2m")
        app_temp = current.get("apparent_temperature")
        humidity = current.get("relative_humidity_2m")
        precip = current.get("precipitation")
        wind = current.get("wind_speed_10m")

        max_temp = daily.get("temperature_2m_max", [temp])[0]
        min_temp = daily.get("temperature_2m_min", [temp])[0]
        precip_prob = daily.get("precipitation_probability_max", [0])[0]

        summary = (
            f"현재 {resolved_name} 지역은 {temp}℃ ({condition_str})이며, "
            f"체감 온도는 {app_temp}℃, 습도는 {humidity}%입니다. "
            f"오늘 최고 기온은 {max_temp}℃, 최저 기온은 {min_temp}℃, "
            f"최대 강수 확률은 {precip_prob}%입니다."
        )

        return {
            "status": "success",
            "location": resolved_name,
            "condition": condition_str,
            "temperature_celsius": temp,
            "apparent_temperature_celsius": app_temp,
            "humidity_percent": humidity,
            "precipitation_mm": precip,
            "wind_speed_kmh": wind,
            "today_max_celsius": max_temp,
            "today_min_celsius": min_temp,
            "precipitation_probability_percent": precip_prob,
            "summary": summary
        }
    except Exception as e:
        return {"status": "error", "message": f"기상 데이터 조회 실패: {str(e)}"}


# =====================================================================
# URL 웹페이지 본문 리더 & DuckDuckGo 무료 실시간 웹/뉴스 검색
# =====================================================================

class _CleanHTMLTextExtractor(HTMLParser):
    """스크립트/스타일 태그를 제거하고 웹페이지 제목 및 본문 텍스트만 깔끔하게 추출하는 파서."""
    SKIP_TAGS = {"script", "style", "noscript", "svg", "iframe", "header", "footer", "nav", "aside"}

    def __init__(self):
        super().__init__()
        self.in_title = False
        self.skip_depth = 0
        self.title_parts: List[str] = []
        self.text_parts: List[str] = []

    def handle_starttag(self, tag, attrs):
        t = tag.lower()
        if t == "title":
            self.in_title = True
        elif t in self.SKIP_TAGS:
            self.skip_depth += 1
        elif t in ("p", "br", "div", "li", "h1", "h2", "h3", "h4", "article", "section", "tr"):
            self.text_parts.append("\n")

    def handle_endtag(self, tag):
        t = tag.lower()
        if t == "title":
            self.in_title = False
        elif t in self.SKIP_TAGS and self.skip_depth > 0:
            self.skip_depth -= 1

    def handle_data(self, data):
        if self.in_title:
            self.title_parts.append(data.strip())
        elif self.skip_depth == 0:
            cleaned = data.strip()
            if cleaned:
                self.text_parts.append(cleaned + " ")


def read_webpage_url(url: str) -> dict:
    """지정된 URL(뉴스 기사, 블로그, 기술 문서 등)의 웹페이지에 접속하여 제목과 본문 텍스트를 추출합니다.

    Args:
        url: 읽어올 웹페이지 주소 (http:// 또는 https:// 포함)
    """
    target_url = (url or "").strip()
    if not target_url.startswith(("http://", "https://")):
        target_url = "https://" + target_url

    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
        ),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
    }

    try:
        req = urllib.request.Request(target_url, headers=headers)
        with urllib.request.urlopen(req, timeout=10) as resp:
            raw_bytes = resp.read()
            content_type = resp.headers.get("Content-Type", "")

        # 인코딩 판별 (UTF-8 기본, EUC-KR/CP949 폴백)
        html_str = None
        if "charset=" in content_type.lower():
            cs = content_type.lower().split("charset=")[-1].split(";")[0].strip()
            try:
                html_str = raw_bytes.decode(cs, errors="replace")
            except Exception:
                pass
        if html_str is None:
            try:
                html_str = raw_bytes.decode("utf-8")
            except UnicodeDecodeError:
                html_str = raw_bytes.decode("cp949", errors="replace")

        extractor = _CleanHTMLTextExtractor()
        extractor.feed(html_str)

        title = " ".join(extractor.title_parts).strip() or target_url
        raw_body = "".join(extractor.text_parts)
        # 다중 공백/줄바꿈 정리
        lines = [re.sub(r"\s+", " ", line).strip() for line in raw_body.splitlines()]
        lines = [line for line in lines if len(line) > 1]
        clean_text = "\n".join(lines)

        max_chars = 12000
        truncated = len(clean_text) > max_chars
        if truncated:
            clean_text = clean_text[:max_chars] + "\n...(본문 길이 제한으로 이하 생략됨)"

        return {
            "status": "success",
            "url": target_url,
            "title": title,
            "char_count": len(clean_text),
            "truncated": truncated,
            "content": clean_text
        }
    except Exception as e:
        return {"status": "error", "url": target_url, "message": f"웹페이지 읽기 실패: {str(e)}"}


class _DDGResultParser(HTMLParser):
    """DuckDuckGo HTML 검색 결과 파서."""
    def __init__(self):
        super().__init__()
        self.results: List[Dict[str, str]] = []
        self._cur: Dict[str, str] = {}
        self._in_title = False
        self._in_snippet = False

    def handle_starttag(self, tag, attrs):
        attr_dict = dict(attrs)
        cls = attr_dict.get("class", "")
        if tag == "a" and "result__a" in cls:
            self._in_title = True
            href = attr_dict.get("href", "")
            if "uddg=" in href:
                try:
                    qs = urllib.parse.parse_qs(urllib.parse.urlparse(href).query)
                    href = qs.get("uddg", [href])[0]
                except Exception:
                    pass
            self._cur = {"title": "", "url": href, "snippet": ""}
        elif tag in ("a", "div", "span") and "result__snippet" in cls:
            self._in_snippet = True

    def handle_endtag(self, tag):
        if tag == "a" and self._in_title:
            self._in_title = False
        elif tag in ("a", "div", "span") and self._in_snippet:
            self._in_snippet = False
            if self._cur.get("title") or self._cur.get("snippet"):
                self.results.append(self._cur)
                self._cur = {}

    def handle_data(self, data):
        if self._in_title:
            self._cur["title"] = (self._cur.get("title", "") + data).strip()
        elif self._in_snippet:
            self._cur["snippet"] = (self._cur.get("snippet", "") + data).strip()


def search_web_duckduckgo(query: str, max_results: int = 5) -> dict:
    """API 키 없이 DuckDuckGo 및 실시간 뉴스 RSS를 통해 최신 웹 정보와 뉴스를 무료로 검색합니다.

    Args:
        query: 검색할 키워드 또는 질문 (예: '최신 AI 뉴스', '파이썬 FastAPI 튜토리얼', '오늘 주요 뉴스')
        max_results: 반환할 최대 검색 결과 수 (기본값: 5)
    """
    q = (query or "").strip()
    if not q:
        return {"status": "error", "message": "검색어가 비어 있습니다."}

    limit = max(1, min(int(max_results or 5), 10))
    results: List[Dict[str, str]] = []

    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
        ),
        "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8",
    }

    # 1. DuckDuckGo HTML 검색 시도
    try:
        ddg_url = f"https://html.duckduckgo.com/html/?q={urllib.parse.quote(q)}"
        req = urllib.request.Request(ddg_url, headers=headers)
        with urllib.request.urlopen(req, timeout=7) as resp:
            html_text = resp.read().decode("utf-8", errors="replace")
        parser = _DDGResultParser()
        parser.feed(html_text)
        for item in parser.results[:limit]:
            results.append({
                "source": "DuckDuckGo Web",
                "title": item.get("title", ""),
                "url": item.get("url", ""),
                "snippet": item.get("snippet", "")
            })
    except Exception:
        pass

    # 2. 실시간 최신 뉴스/정보 보강 (Google News Korea RSS - 봇 차단이 없고 최신성이 뛰어남)
    if len(results) < limit:
        try:
            rss_url = f"https://news.google.com/rss/search?q={urllib.parse.quote(q)}&hl=ko&gl=KR&ceid=KR:ko"
            req_rss = urllib.request.Request(rss_url, headers=headers)
            with urllib.request.urlopen(req_rss, timeout=7) as resp:
                xml_bytes = resp.read()
            root = ET.fromstring(xml_bytes)
            for item_el in root.findall(".//item"):
                if len(results) >= limit:
                    break
                title = (item_el.findtext("title") or "").strip()
                link = (item_el.findtext("link") or "").strip()
                pub_date = (item_el.findtext("pubDate") or "").strip()
                source_el = item_el.find("source")
                press = source_el.text.strip() if source_el is not None and source_el.text else "뉴스"
                results.append({
                    "source": f"실시간 뉴스 ({press})",
                    "title": title,
                    "url": link,
                    "snippet": f"발행일시: {pub_date}"
                })
        except Exception:
            pass

    if not results:
        return {
            "status": "error",
            "query": q,
            "message": "검색 결과를 가져오지 못했습니다. 다른 검색어로 시도해 주세요."
        }

    return {
        "status": "success",
        "query": q,
        "result_count": len(results),
        "results": results
    }


# =====================================================================
# 로컬 작업 공간 이미지 정밀 시각 분석 (Multimodal Vision) & 이미지 제작 (Image Gen)
# =====================================================================

def inspect_workspace_image(image_path: str, question: str = "이 이미지의 내용, 텍스트, 구도, 핵심 요소를 자세히 설명해 주세요.") -> dict:
    """허용된 작업 공간(Workspace)에 있는 이미지 파일(PNG, JPG, WEBP, GIF, BMP)을 읽어 시각적으로 정밀 분석하고 설명합니다.

    Args:
        image_path: 분석할 이미지 파일의 상대 경로 또는 절대 경로 (예: 'sample.png', 'screenshots/error.jpg')
        question: 이미지에 대해 특별히 확인하거나 판독할 질문 (기본값: 전반적인 상세 분석 및 텍스트 판독)
    """
    is_valid, target_path, msg = validate_workspace_path(image_path, action="read")
    if not is_valid:
        return {"status": "error", "message": msg}

    if not os.path.exists(target_path) or not os.path.isfile(target_path):
        return {"status": "error", "message": f"이미지 파일을 찾을 수 없습니다: {image_path}"}

    mime_type, _ = mimetypes.guess_type(target_path)
    if not mime_type or not mime_type.startswith("image/"):
        mime_type = "image/png"

    try:
        with open(target_path, "rb") as f:
            img_bytes = f.read()

        # 이미지 해상도/포맷 메타데이터 확인 (Pillow 활용)
        img_meta = {"file_size_bytes": len(img_bytes), "mime_type": mime_type}
        try:
            from PIL import Image
            import io
            with Image.open(io.BytesIO(img_bytes)) as im:
                img_meta["width"] = im.width
                img_meta["height"] = im.height
                img_meta["format"] = im.format
        except Exception:
            pass

        from backend.Services.settings_service import load_settings
        settings = load_settings()
        api_key = settings.get("api_key", "").strip() or os.environ.get("GEMINI_API_KEY", "")

        if not api_key:
            return {
                "status": "error",
                "message": "Gemini Vision 분석을 위한 API 키가 설정되지 않았습니다."
            }

        from google import genai
        from google.genai import types

        client = genai.Client(api_key=api_key)
        vision_model = settings.get("model_name", "gemini-3.8-flash").strip() or "gemini-3.8-flash"
        if not vision_model.startswith("gemini"):
            vision_model = "gemini-3.8-flash"

        prompt_text = (
            f"당신은 고정밀 시각 분석(Vision) 엔진입니다. 사용자의 요청에 맞춰 이미지를 면밀히 분석하세요.\n"
            f"분석 요청: {question or '이 이미지를 상세히 설명해 주세요.'}"
        )

        resp = client.models.generate_content(
            model=vision_model,
            contents=[
                types.Part.from_bytes(data=img_bytes, mime_type=mime_type),
                prompt_text
            ]
        )

        analysis_text = resp.text.strip() if resp.text else "이미지 분석 결과를 추출하지 못했습니다."

        return {
            "status": "success",
            "file_path": target_path,
            "metadata": img_meta,
            "analysis": analysis_text
        }
    except Exception as e:
        return {"status": "error", "message": f"이미지 시각 분석 실패: {str(e)}"}


def generate_image(prompt: str, aspect_ratio: str = "1:1") -> dict:
    """사용자의 설명(프롬프트)을 바탕으로 이미지를 제작하여 저장하고, 채팅창에 즉시 렌더링할 수 있는 이미지 경로와 마크다운을 반환합니다.

    Args:
        prompt: 생성할 이미지에 대한 상세 묘사 프롬프트 (한국어 또는 영어)
        aspect_ratio: 이미지 가로세로 비율 ('1:1', '16:9', '9:16', '4:3', '3:4' 중 선택. 기본값: '1:1')
    """
    os.makedirs(GENERATED_IMAGES_DIR, exist_ok=True)
    clean_prompt = (prompt or "Future cybernetic digital secretary core").strip()
    ratio = aspect_ratio if aspect_ratio in ("1:1", "16:9", "9:16", "4:3", "3:4") else "1:1"

    from backend.Services.settings_service import load_settings
    settings = load_settings()
    api_key = settings.get("api_key", "").strip() or os.environ.get("GEMINI_API_KEY", "")

    if not api_key:
        return {"status": "error", "message": "이미지 생성을 위한 Gemini API 키가 설정되지 않았습니다."}

    from google import genai
    from google.genai import types

    client = genai.Client(api_key=api_key)
    ts_id = f"{int(time.time())}_{uuid.uuid4().hex[:6]}"

    # 1차 시도: Google Imagen 3 (imagen-3.0-generate-002)
    for imagen_model in ("imagen-3.0-generate-002", "imagen-3.0-generate-001"):
        try:
            res = client.models.generate_images(
                model=imagen_model,
                prompt=clean_prompt,
                config=types.GenerateImagesConfig(
                    number_of_images=1,
                    output_mime_type="image/png",
                    aspect_ratio=ratio,
                ),
            )
            if res.generated_images:
                img_bytes = res.generated_images[0].image.image_bytes
                fname = f"gen_{ts_id}.png"
                fpath = os.path.join(GENERATED_IMAGES_DIR, fname)
                with open(fpath, "wb") as f:
                    f.write(img_bytes)
                web_url = f"/generated_images/{fname}"
                return {
                    "status": "success",
                    "engine": imagen_model,
                    "file_path": fpath,
                    "image_url": web_url,
                    "markdown": f"![{clean_prompt}]({web_url})",
                    "instruction": f"생성된 이미지를 답변 본문에 반드시 마크다운 `![{clean_prompt}]({web_url})` 형태로 포함하여 주인님께 보여드리세요."
                }
        except Exception:
            continue

    # 2차 시도: Gemini 고해상도 벡터 아트워크 생성 (API 키 티어 제한 시에도 100% 동작 보장)
    try:
        w, h = (800, 800)
        if ratio == "16:9":
            w, h = (960, 540)
        elif ratio == "9:16":
            w, h = (540, 960)
        elif ratio == "4:3":
            w, h = (800, 600)
        elif ratio == "3:4":
            w, h = (600, 800)

        svg_prompt = (
            f"Create a breathtaking, rich, highly detailed artistic SVG illustration (width='{w}' height='{h}' viewBox='0 0 {w} {h}') "
            f"for the following request: {clean_prompt}\n"
            f"Requirements:\n"
            f"- Use rich linearGradient/radialGradient definitions, glowing filters, layered geometric and organic shapes, lighting effects, and atmospheric details.\n"
            f"- Output ONLY the raw valid <svg xmlns=\"http://www.w3.org/2000/svg\" ...>...</svg> code without markdown fences or explanation."
        )
        svg_model = settings.get("model_name", "gemini-3.8-flash").strip() or "gemini-3.8-flash"
        if not svg_model.startswith("gemini"):
            svg_model = "gemini-3.8-flash"

        resp = client.models.generate_content(
            model=svg_model,
            contents=svg_prompt,
            config=types.GenerateContentConfig(temperature=0.6)
        )
        raw_out = (resp.text or "").strip()
        svg_match = re.search(r"<svg[\s\S]*?</svg>", raw_out, re.IGNORECASE)
        if svg_match:
            svg_code = svg_match.group(0)
            if "xmlns=" not in svg_code[:120]:
                svg_code = svg_code.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"', 1)
            fname = f"gen_{ts_id}.svg"
            fpath = os.path.join(GENERATED_IMAGES_DIR, fname)
            with open(fpath, "w", encoding="utf-8") as f:
                f.write(svg_code)
            web_url = f"/generated_images/{fname}"
            return {
                "status": "success",
                "engine": f"{svg_model}-artwork-engine",
                "file_path": fpath,
                "image_url": web_url,
                "markdown": f"![{clean_prompt}]({web_url})",
                "instruction": f"생성된 이미지를 답변 본문에 반드시 마크다운 `![{clean_prompt}]({web_url})` 형태로 그대로 포함하여 채팅창에 즉시 띄워드리세요."
            }
    except Exception as e:
        return {"status": "error", "message": f"이미지 생성 실패: {str(e)}"}

    return {"status": "error", "message": "이미지를 생성하지 못했습니다."}


# 에이전트에 공급할 기본 도구 리스트
AGENT_TOOLS = [
    get_current_time,
    list_directory_files,
    read_local_file,
    write_local_file,
    get_realtime_weather,
    read_webpage_url,
    search_web_duckduckgo,
    inspect_workspace_image,
    generate_image,
]

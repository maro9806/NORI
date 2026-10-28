# MINORI Custom Plugin Directory (`plugins/`)

이 폴더(`D:\AIproject\plugins\`)에 파이썬 파일(`.py`)을 넣으면, **서버를 재시작할 필요 없이** 미노리(MINORI)가 대화 즉시 새로운 기술(Function Calling 도구)로 자동 인식하여 사용합니다.

## 작성 규칙
1. 파일 이름이 `_`로 시작하지 않는 `.py` 파일을 생성합니다. (예: `my_tool.py`)
2. 일반 파이썬 함수를 작성하고, **타입 힌트(Type Hints)**와 **독스트링(Docstring)**을 적어주면 미노리가 언제 이 도구를 써야 할지 스스로 판단합니다.

### 예시 (`plugins/lotto_generator.py`)
```python
import random

def generate_lotto_numbers(game_count: int = 1) -> dict:
    """로또 6/45 행운의 추천 번호를 추첨하여 반환합니다.

    Args:
        game_count: 생성할 게임 세트 수 (기본값: 1)
    """
    games = []
    for _ in range(max(1, min(game_count, 10))):
        nums = sorted(random.sample(range(1, 46), 6))
        games.append(nums)
    return {"status": "success", "games": games}
```

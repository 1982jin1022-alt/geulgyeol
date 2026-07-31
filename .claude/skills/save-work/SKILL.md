---
name: save-work
description: 지금까지 한 작업 내용을 .claude/worklog/STATE.md에 저장해서 다음 세션에 이어갈 수 있게 합니다. 사용자가 "작업 저장", "여기까지 저장해줘", "오늘 작업 기록해줘", "이제 그만할게", "저장하고 끝내자"라고 할 때, 또는 긴 작업을 마무리할 때 사용합니다.
---

# 작업 저장

이번 세션의 작업 내용을 `D:\gg\.claude\worklog\STATE.md`에 기록합니다. 다음에 PowerShell을 새로 켜도 `/resume-work`로 그대로 이어갈 수 있게 하는 것이 목적입니다.

## 절차

### 1. 현재 상태를 먼저 확인한다

추측하지 말고 실제로 확인하세요. 대화 맥락과 아래 결과를 함께 씁니다.

```powershell
Get-Date -Format 'yyyy-MM-dd HH:mm'
Get-ChildItem D:\gg -Recurse -File -Exclude *.zip |
  Where-Object { $_.FullName -notmatch '\\\.claude\\worklog\\' } |
  Sort-Object LastWriteTime -Descending |
  Select-Object -First 12 @{n='파일';e={$_.FullName.Replace('D:\gg\','')}}, LastWriteTime, Length |
  Format-Table -AutoSize
```

git이 설치돼 있으면(`Get-Command git -ErrorAction SilentlyContinue`) `git status --short`와 `git log --oneline -5`도 함께 확인합니다. 없으면 건너뜁니다.

### 2. 기존 기록을 읽는다

`D:\gg\.claude\worklog\STATE.md`가 이미 있으면 읽습니다. **덮어쓰지 말고 갱신**하세요 — 아직 끝나지 않은 "다음에 할 일" 항목은 유지하고, 이번에 끝낸 것만 옮깁니다.

### 3. 이전 기록을 보관한다

덮어쓰기 전에 사본을 남깁니다.

```powershell
$d = 'D:\gg\.claude\worklog'
New-Item -ItemType Directory -Force "$d\history" | Out-Null
if (Test-Path "$d\STATE.md") {
  Copy-Item "$d\STATE.md" "$d\history\$(Get-Date -Format 'yyyyMMdd-HHmm').md"
}
```

### 4. STATE.md를 쓴다

Write 도구로 아래 형식에 맞춰 작성합니다. **빈 칸을 남기지 말고**, 해당 없으면 "없음"이라고 적으세요.

```markdown
# 글결 작업 기록

> 마지막 저장: YYYY-MM-DD HH:mm

## 한 줄 요약
(다음 세션에서 이 줄만 읽어도 무슨 작업 중인지 알 수 있게 한 문장으로)

## 이번에 한 일
- (무엇을 왜 바꿨는지. 파일과 위치를 `index.html:2771` 형태로 함께 적기)

## 다음에 할 일
- [ ] (구체적인 행동으로. "번역 개선"이 아니라 "index.html:2771 번역 실행부에서 청크 재시도 3회 추가")

## 지금 건드리고 있는 곳
- `파일:줄` — 무슨 함수/단락이고 어떤 상태인지 (작업 중간이면 어디까지 했는지)

## 막힌 것 / 결정 대기
- (있으면. 사용자에게 물어봐야 하는 것도 여기)

## 확인 방법
- (바꾼 걸 어떻게 검증하는지. 예: 브라우저에서 index.html 열고 번역 탭 → 원문 붙여넣기 → 번역 실행)

## 알아둘 것
- (이번에 알아낸 함정, 되돌린 시도, 인코딩 문제 등 다음에 시간 아껄 정보)
```

### 5. 저장했다고 알린다

파일 경로와 "한 줄 요약", "다음에 할 일" 개수를 한국어로 짧게 보고합니다. 전체 내용을 다시 출력하지는 마세요.

## 규칙

- 파일은 **`-Encoding utf8`**로 쓰거나 Write 도구를 쓰세요. 한글이 깨집니다.
- **API 키, GitHub 토큰 같은 비밀값을 STATE.md에 절대 적지 마세요.** 필요하면 "백업 JSON의 ghtok 사용"처럼 위치만 가리킵니다.
- 미완성 작업이 있으면 숨기지 말고 "지금 건드리고 있는 곳"에 어디까지 했는지 정확히 적으세요.
- `.claude/worklog/`는 `.gitignore`에 있으므로 커밋되지 않습니다.

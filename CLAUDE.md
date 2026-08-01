# 글결 (geulgyeol)

외국어 소설을 한국어로 옮겨 읽는 **PWA 번역기**. Gemini API로 번역하고, 결과를 서재에 보관해 읽기 모드로 읽습니다.

- 공개 코드 저장소: `1982jin1022-alt/geulgyeol` (GitHub Pages로 배포)
- 데이터 저장소: `1982jin1022-alt/geulgyeol-data` (비공개 — 앱이 백업 JSON을 GitHub Contents API로 올리는 곳. 코드는 없음)

## 파일 구성

| 파일 | 설명 |
|---|---|
| `index.html` | **앱 전체** (HTML + CSS + JS 단일 파일, 약 4,400줄) |
| `sw.js` | 서비스 워커. network-first — 새 버전이 바로 반영되고, 오프라인일 때만 캐시 사용 |
| `manifest.webmanifest` | PWA 설정 (테마색 `#F6F3FC`, standalone, portrait) |
| `icon-192.png`, `icon-512.png` | 홈 화면 아이콘 |

빌드 도구·의존성·테스트 없음. `index.html`을 브라우저에서 바로 열면 동작합니다.

## index.html 안에서 찾기

`/* ═════ 제목 ═════ */` 형태의 구분선으로 단락이 나뉘어 있습니다. 주요 위치:

- **CSS** 22~940줄 — 테마 변수(`dawn`/`milk`/`matcha`/`paper`/`sky`/`apricot`/`custom` …), 마스코트, 카드, 읽기 모드, 시트
- **HTML** 947줄 번역 탭 · 1061줄 서재 탭 · 1089줄 단어장 탭
- **JS**
  - 1674줄 `store` — localStorage 래퍼. **모든 키에 `gg_` 접두사**
  - 1699줄 탭 전환 / 1720줄 마스코트 / 1787줄 테마·글꼴
  - 2079줄 번역 규칙(고유명사는 본문 괄호 대신 목록으로) / 2082줄 글 갈래
  - 2256줄 Gemini 엔드포인트 / 4254줄 모델 목록
  - 2430줄 각주 / 2507줄 원문↔번역 문단 짝짓기 / 2771줄 **번역 실행**
  - 3071줄 서재(아카이브) — 글 본문은 `gg_arc_<id>` 키에 개별 저장
  - 3401줄 백업·복원·깃허브 연동 (백업 포맷 `v:14`)
  - 4517줄 읽기 모드 / 4546줄 이어읽기 / 4684줄 시작(부팅)

## 작업할 때 주의

- **버전 올리기 — 앱을 고쳐 커밋할 때마다 반드시.** `index.html`의 `<span class="ver">글결 v61</span>`(footer, 1060줄 근처) 숫자를 **1 올리세요.** 앱 아래에 보이는 이 숫자로 지금 켜둔 앱이 어느 패치까지 반영됐는지 판단합니다. **커밋 메시지 첫 줄도 `v61 — 요약` 형태로 시작하세요** — 그래야 `git log --oneline`이 그대로 버전별 변경 목록이 됩니다.
- **인코딩**: `index.html`은 BOM 없는 UTF-8. PowerShell로 읽을 땐 `Get-Content -Encoding UTF8`, 쓸 땐 `-Encoding utf8`을 꼭 지정하세요. 안 하면 한글과 `═` 문자가 깨집니다.
- **git이 설치돼 있습니다.** 다만 git 설치 전에 켜진 셸이면 PATH에 안 잡혀요. 그럴 땐 `$env:Path = [Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User')`를 앞에 붙이거나, 터미널을 새로 켜세요. 자격 증명이 저장돼 있어 푸시할 때 인증 창은 안 뜹니다.
- **커밋 메시지에 큰따옴표가 있으면** PowerShell here-string이 깨져 `pathspec ... did not match`가 납니다. 메시지를 UTF-8 파일로 쓰고 `git commit -F 파일`을 쓰세요.
- **비밀값**: `글결_백업_*.json` 안에 Gemini API 키와 GitHub PAT가 들어 있습니다. 절대 커밋하지 마세요 (`.gitignore`에 등록됨).
- 단일 파일이라 수정 시 줄 번호가 밀립니다. 위 목차의 줄 번호는 참고용이며, 정확한 위치는 구분선 제목으로 검색하세요.

## 작업 이어가기

- 세션 끝낼 때: `/save-work` — 진행 상황을 `.claude/worklog/STATE.md`에 저장
- 세션 시작할 때: `/resume-work` — 저장된 내용을 불러와 이어서 작업

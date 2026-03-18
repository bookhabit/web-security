# CSRF 실습 환경

> **학습 목적 전용** — 이 환경은 의도적으로 취약하게 제작되었습니다.

---

## 디렉토리 구조

```
csrf/
├── CSRF.md                         ← 개념 정리
├── README.md                       ← 이 파일 (실행 가이드)
│
├── 01-basic-get/                   ← 시나리오 1: GET 방식 CSRF
│   ├── vulnerable/bank.php         ← 취약한 은행 앱 (port 8081)
│   ├── attack/evil.html            ← 공격 페이지 (port 8082)
│   └── secure/bank-secure.php     ← 방어 버전 (port 8091)
│
├── 02-post-form/                   ← 시나리오 2: POST 폼 CSRF
│   ├── vulnerable/mypage.php       ← 취약한 마이페이지 (port 8083)
│   ├── attack/evil-form.html       ← 자동 제출 폼 공격 (port 8084)
│   └── secure/mypage-secure.php   ← 방어 버전 (port 8093)
│
└── 03-clickjacking/                ← 시나리오 3: 클릭재킹
    ├── target/donate.php           ← 취약한 기부 페이지 (port 8085)
    ├── attack/clickjack.html       ← 클릭재킹 공격 페이지 (port 8086)
    └── secure/donate-secure.php   ← 방어 버전 (port 8095)
```

---

## 서버 실행 방법

**프로젝트 루트에서** 아래 명령어를 각각 별도 터미널에서 실행합니다.

```bash
# ─────────────────────────────────────────────
#  시나리오 1: GET 방식 CSRF (계좌 이체)
# ─────────────────────────────────────────────
# 취약한 은행 앱
php -S localhost:8081 -t csrf/01-basic-get/vulnerable/

# 공격 페이지 (별도 터미널)
php -S localhost:8082 -t csrf/01-basic-get/attack/

# 방어 버전 (별도 터미널)
php -S localhost:8091 -t csrf/01-basic-get/secure/


# ─────────────────────────────────────────────
#  시나리오 2: POST 폼 CSRF (비밀번호 변경)
# ─────────────────────────────────────────────
# 취약한 마이페이지
php -S localhost:8083 -t csrf/02-post-form/vulnerable/

# 공격 페이지 (별도 터미널)
php -S localhost:8084 -t csrf/02-post-form/attack/

# 방어 버전 (별도 터미널)
php -S localhost:8093 -t csrf/02-post-form/secure/


# ─────────────────────────────────────────────
#  시나리오 3: 클릭재킹
# ─────────────────────────────────────────────
# 취약한 기부 페이지
php -S localhost:8085 -t csrf/03-clickjacking/target/

# 클릭재킹 공격 페이지 (별도 터미널)
php -S localhost:8086 -t csrf/03-clickjacking/attack/

# 방어 버전 (별도 터미널)
php -S localhost:8095 -t csrf/03-clickjacking/secure/
```

---

## 시나리오별 공격 실습 방법

---

### 시나리오 1: GET 방식 CSRF — 자동 이체

**공격 목표**: 피해자가 페이지를 열기만 해도 50만원이 이체됨

#### 1. 준비
```
취약한 은행 (port 8081) + 공격 페이지 (port 8082) 실행
```

#### 2. 공격 시나리오 실행

1. 브라우저에서 **http://localhost:8081/bank.php** 접속
2. `victim / 1234` 로 로그인 → 잔액 100만원 확인
3. **새 탭 또는 같은 브라우저**에서 **http://localhost:8082/evil.html** 접속
4. 은행 탭으로 돌아와 잔액 확인 → **50만원 감소 확인**

#### 3. 공격 원리

```
피해자 브라우저의 동작:
evil.html 렌더링
  └─ <img src="http://localhost:8081/bank.php?action=transfer&to=attacker&amount=500000">
       └─ 브라우저가 자동으로 GET 요청 전송
            └─ 해킹은행 세션 쿠키 자동 첨부
                 └─ 서버: 정상 요청으로 인식 → 이체 실행!
```

#### 4. 방어 버전 테스트

1. **http://localhost:8091/bank-secure.php** 에서 로그인
2. evil.html에 해당하는 공격을 시도해도 → 이체 불가 (POST 방식 + CSRF 토큰)

---

### 시나리오 2: POST 폼 CSRF — 비밀번호 탈취

**공격 목표**: 피해자가 뉴스 사이트를 방문하면 비밀번호가 `hacked123`으로 변경됨

#### 1. 준비
```
마이페이지 (port 8083) + 공격 페이지 (port 8084) 실행
```

#### 2. 공격 시나리오 실행

1. **http://localhost:8083/mypage.php** 접속 후 `victim / 1234` 로그인
2. **새 탭**에서 **http://localhost:8084/evil-form.html** 접속
   - 겉으로는 평범한 뉴스 사이트처럼 보임
   - 페이지 로드 즉시 숨겨진 폼이 자동 제출됨
3. 마이페이지로 돌아와 로그아웃 후, `victim / 1234`로 재로그인 시도
   - **로그인 실패!** 비밀번호가 `hacked123`으로 변경됨

#### 3. 공격 원리

```html
<!-- evil-form.html에 숨겨진 코드 -->
<form id="csrf-attack" method="POST"
      action="http://localhost:8083/mypage.php"
      style="display:none">
  <input type="hidden" name="action"       value="change_password">
  <input type="hidden" name="new_password" value="hacked123">
</form>
<script>
  window.onload = () => document.getElementById('csrf-attack').submit();
</script>
```

- POST라도 CSRF 토큰이 없으면 폼 자동 제출로 공격 가능
- 브라우저가 세션 쿠키를 자동 첨부 → 서버는 정상 요청으로 처리

#### 4. 방어 버전 테스트

1. **http://localhost:8093/mypage-secure.php** 로그인
2. 동일한 공격 시도 → "CSRF 토큰 검증 실패" 로 차단

---

### 시나리오 3: 클릭재킹 — 의도치 않은 클릭

**공격 목표**: 피해자가 게임 아이템을 받으려 클릭했지만 실제로는 10만원 기부

#### 1. 준비
```
기부 페이지 (port 8085) + 공격 페이지 (port 8086) 실행
```

#### 2. 공격 시나리오 실행

1. **http://localhost:8085/donate.php** 접속 (자동 로그인됨)
2. **http://localhost:8086/clickjack.html** 접속
   - 겉으로는 "무료 게임 아이템" 이벤트 페이지처럼 보임
3. "아이템 받기" 버튼 클릭
4. 기부 페이지에서 기부 기록 확인 → **10만원 기부 완료**

#### 3. 공격 구조 시각화

```
[공격 페이지 화면]          [실제 DOM 구조]
┌─────────────────┐         ┌─────────────────┐  ← 가짜 게임 페이지
│  🎮 무료 아이템  │         │  "아이템 받기"  │     (z-index 낮음)
│                 │         ├─────────────────┤
│  [아이템 받기]  │    →    │  투명 iframe    │  ← 실제 기부 페이지
│  (가짜 버튼)    │         │  (opacity: 0)   │     (z-index 높음)
│                 │         │  [기부하기] ←   │     피해자 클릭 수신
└─────────────────┘         └─────────────────┘
```

4. **"공격 iframe 보기" 버튼**을 클릭하면 투명 레이어가 시각화됨

#### 4. 방어 버전 테스트

1. **http://localhost:8095/donate-secure.php** 를 iframe으로 넣으려 하면
2. 브라우저 콘솔에서 `Refused to display in a frame` 오류 확인
3. 공격 페이지의 iframe이 빈 화면으로 표시됨 → 클릭재킹 불가

---

## 방어 기법 요약

| 공격 유형 | 방어 기법 | 코드 예시 |
|-----------|-----------|-----------|
| GET CSRF | POST 방식으로 변경 | `<form method="POST">` |
| GET/POST CSRF | CSRF 토큰 | `$_SESSION['csrf_token'] = bin2hex(random_bytes(32))` |
| POST CSRF | SameSite 쿠키 | `ini_set('session.cookie_samesite', 'Strict')` |
| 비밀번호 변경 CSRF | 현재 비밀번호 재확인 | 폼에 `current_password` 필드 추가 |
| 클릭재킹 | X-Frame-Options | `header('X-Frame-Options: DENY')` |
| 클릭재킹 | CSP frame-ancestors | `header("Content-Security-Policy: frame-ancestors 'none'")` |

---

## CSRF 토큰 올바른 구현 패턴

```php
// ✅ 토큰 생성
function get_csrf_token(): string {
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32)); // 64자리 무작위
    }
    return $_SESSION['csrf_token'];
}

// ✅ 토큰 검증 + 갱신 (일회성)
function verify_and_rotate(string $token): bool {
    $valid = isset($_SESSION['csrf_token'])
          && hash_equals($_SESSION['csrf_token'], $token); // 타이밍 공격 방지
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));   // 사용 후 즉시 갱신
    return $valid;
}

// ✅ 폼에 포함
echo '<input type="hidden" name="csrf_token" value="' . get_csrf_token() . '">';

// ✅ 서버에서 검증
if (!verify_and_rotate($_POST['csrf_token'] ?? '')) {
    die('CSRF 토큰 검증 실패');
}
```

### 취약한 토큰 방식 (❌ 사용 금지)

| 방식 | 이유 |
|------|------|
| 시간 기반 토큰 | 예측 가능 |
| 순차 증가 값 | 예측 가능 |
| 이메일 해시 | 공격자가 이메일 알면 예측 가능 |
| MD5/SHA1 | 취약한 해시 함수 |

---

## 브라우저에서 공격 확인하기

### 개발자 도구로 요청 분석

1. F12 → Network 탭
2. evil.html 접속 시 `bank.php?action=transfer...` 요청 확인
3. Headers → **Cookie** 항목에서 세션 쿠키가 자동 첨부됨을 확인
4. Response → 이체 완료 HTML 응답 확인

### SameSite 쿠키 효과 확인

- 방어 버전(port 8093)에서 `Application` → `Cookies` 확인
- `SameSite: Strict` 설정 확인
- 외부 사이트에서 요청 시 쿠키가 전송되지 않음을 Network 탭에서 확인

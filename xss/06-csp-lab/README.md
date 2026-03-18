# 06. CSP & HttpOnly 실습

> xss.md 연결: 5장 (CSP, HttpOnly Cookie 방어 기술)

## 실행 방법

```bash
open xss/06-csp-lab/no-csp.html
open xss/06-csp-lab/csp-strict.html
```

## 비교 실습

### no-csp.html

1. 파일 열기
2. DevTools (F12) → Network 탭 → 페이지 응답 헤더 확인
   → `Content-Security-Policy` 헤더 없음
3. 입력창에 `<img src=x onerror=alert(1)>` 입력 → 실행됨
4. 인라인 스크립트 실행 버튼 클릭 → 실행됨

### csp-strict.html

1. 파일 열기
2. DevTools → Console 탭에서 CSP 위반 오류 확인:
   ```
   Refused to execute inline script because it violates the following
   Content Security Policy directive: "script-src 'self'"
   ```
3. 같은 XSS 페이로드를 URL로 시도해도 → 브라우저가 실행 차단

## CSP 헤더 설정 방법

### PHP에서 HTTP 헤더로 설정 (권장)
```php
header("Content-Security-Policy: default-src 'self'; script-src 'self'");
```

### HTML meta 태그로 설정 (제한적)
```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'">
```

**meta 태그의 한계**: HTTP 헤더 CSP가 더 강력. meta는 일부 지시문 지원 안 함.

## CSP 주요 지시문

| 지시문 | 설명 |
|---|---|
| `default-src 'self'` | 기본: 자기 출처만 허용 |
| `script-src 'self'` | JS: 자기 출처 파일만 허용 |
| `script-src 'nonce-xxx'` | nonce 일치하는 inline만 허용 |
| `style-src 'self'` | CSS: 자기 출처만 허용 |
| `img-src *` | 이미지: 모든 출처 허용 |
| `connect-src 'none'` | fetch/XHR: 모두 차단 |

## HttpOnly Cookie 실습 포인트

05-session-hijack 실습에서:
- `victim/login.php`: `httponly => false` (취약)
- 콘솔에서 `document.cookie` 입력 → PHPSESSID 보임

방어 버전에서:
- `httponly => true` 설정 시
- 콘솔에서 `document.cookie` 입력 → PHPSESSID 안 보임
- XSS 스크립트가 쿠키를 읽으려 해도 빈 값

## XSS 방어 전략 총정리

```
1. 출력 인코딩 (Output Encoding)   ← 1차 방어선
   PHP: htmlspecialchars()
   JS: textContent

2. CSP 헤더                        ← 2차 방어선 (실행 자체 차단)
   Content-Security-Policy: script-src 'self'

3. HttpOnly Cookie                  ← 피해 최소화
   쿠키 탈취 자체를 차단

3가지 조합 = XSS 거의 불가능
```

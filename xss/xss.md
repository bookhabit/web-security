🛡️ XSS (Cross-Site Scripting) 완벽 분석 가이드

1. 개요 및 파급력
   XSS는 웹 애플리케이션이 사용자로부터 입력받은 값을 적절한 검증 없이 출력할 때, 악성 스크립트가 실행되는 취약점입니다.

주요 공격 시나리오
세션 하이재킹: 브라우저 쿠키(Session ID) 탈취 후 인증 없이 피해자 계정 탈취.

피싱: 가짜 로그인 폼을 삽입하여 사용자 암호 직접 탈취.

데이터 탈취: 뱅킹, 이메일, 게임 사이트에서의 키보드 입력 가로채기(Keylogging).

네트워크 침투: 브라우저를 이용한 내부망(LAN) 포트 스캔 및 공유기 설정(방화벽 등) 조작.

소셜 엔지니어링: SNS에서 친구 임의 추가 및 악성 포스트 게시.

공격 연계: CSRF 공격을 실행하기 위한 사전 단계로 활용.

2. 인젝션 가능 지점 (Attack Surface)
   웹 개발자는 브라우저가 전송하는 모든 데이터를 잠재적인 공격 벡터로 간주해야 합니다.

URI: URL의 모든 부분(Path, Query String 등)이 공격에 이용될 수 있음.

입력 폼 (Input Forms): \* 사용자 입력창뿐만 아니라 hidden, disabled 속성의 필드도 조작 가능.

HTTP 요청 헤더: User-Agent, Referer, Cookie 등 브라우저가 전송하는 모든 헤더 정보.

사용자 생성 콘텐츠 (UGC): \* 이미지, 동영상, PDF 등 바이너리 파일 내 메타데이터.

JSON 데이터 및 DOM 속성 조작.

예시 코드: document.write("<p>URL: " + document.location + "</p>")

3. XSS 공격 유형
   반사형 (Reflected) XSS: URL 파라미터 등에 포함된 스크립트가 즉시 반사되어 실행됨.

저장형 (Stored/Persistent) XSS: 서버 DB에 스크립트가 저장되어 해당 페이지를 방문하는 모든 사용자에게 실행됨.

DOM 기반 (DOM-based) XSS: 서버와 상관없이 브라우저 측 스크립트의 취약한 데이터 처리로 인해 발생.

4. 필터 우회 및 인코딩 기법
   공격자는 단순한 필터링을 우회하기 위해 다양한 인코딩을 시도합니다.

문자셋(Charset) 공략: \* UTF-7 인코딩을 이용해 각괄호(< >)를 +ADw-, +AD4-로 표현.

방어: Content-Type 헤더나 <meta> 태그에 UTF-8을 명시하여 해결.

인코딩 숨기기: \* 퍼센트 인코딩(URL Encoding), 0x00(Null Byte) 삽입.

동일 문자를 다르게 표현하는 멀티바이트 인코딩 오동작 이용.

브라우저 특성 이용: \* 잘못된 바이트 나열, 문자 분리.

자바스크립트 키워드 사이에 탭(\t)이나 개행문자(\n) 추가.

MIME 타입 오설정(Sniffing)을 이용한 실행 유도.

5. 방어 전략 (Defensive Measures)
   핵심 원칙
   "사용자 입력은 절대 신뢰하지 않는다. 모든 출력은 인코딩한다."

주요 방어 기술
문자셋 명시: Content-Type 헤더 및 메타 태그를 통해 언어와 인코딩을 정확히 규정.

출력 인코딩 (Output Encoding): \* 데이터가 HTML 영역에 출력될 때 특수 문자를 엔티티 인코딩 처리.

대상: <, >, &, ", ' 등.

적용 범위: HTML 텍스트, 속성(href, src), 스타일(CSS), 자바스크립트 변수.

입력 검증: 제외 목록(Blacklist)보다는 허용 목록(Whitelist) 방식 지향.

파일 업로드 보안: 실제 파일 형식을 검사하고 올바른 Content-Type을 강제함.

보안 메커니즘 활용: \* 자바스크립트 샌드박스 라이브러리 사용.

CSP (Content Security Policy) 설정 (스크립트 실행 출처 제한).

HttpOnly Cookie 설정 (자바스크립트로 쿠키 접근 차단).

6. 주요 취약 API / 함수 (개발자가 피해야 할 것들)
   클라이언트 사이드 (JavaScript):
   - innerHTML, outerHTML: 문자열을 HTML로 파싱 → 태그 실행
   - document.write(): DOM에 HTML 직접 삽입
   - eval(): 문자열을 JavaScript 코드로 실행
   - setTimeout(string), setInterval(string): 문자열 형태 인자도 eval과 동일
   - element.insertAdjacentHTML(): innerHTML과 동일한 위험
   - jQuery: .html(), .append() 등도 innerHTML 사용 내부적으로

   서버 사이드 (PHP):
   - echo, print 없이 변수 직접 출력
   - htmlspecialchars() 미사용 시 모든 출력 취약

7. 실습 환경 구조
   01-reflected/  : Reflected XSS (PHP + Vanilla JS)
   02-stored/     : Stored XSS (PHP SQLite + localStorage)
   03-dom-based/  : DOM-based XSS (Vanilla JS)
   04-filter-bypass/ : 필터 우회 기법 데모
   05-session-hijack/ : 쿠키 탈취 → 세션 하이재킹 전체 시나리오
   06-csp-lab/    : CSP / HttpOnly 방어 효과 비교

   각 디렉토리 README.md에 공격 방법 및 페이로드 정리됨.

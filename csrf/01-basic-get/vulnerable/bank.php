<?php
/**
 * [취약] CSRF Lab - Scenario 1: GET 방식 계좌 이체
 * 취약점: 이체 요청을 GET 파라미터로 처리 + 출처 검증 없음
 * 실행: php -S localhost:8081 -t csrf/01-basic-get/vulnerable/
 */
session_name('CSRF_BANK_VULN');
session_start();

if (!isset($_SESSION['initialized'])) {
    $_SESSION['initialized'] = true;
    $_SESSION['logged_in']   = false;
    $_SESSION['username']    = '';
    $_SESSION['balance']     = 1000000; // 100만원
    $_SESSION['log']         = [];
}

$msg   = '';
$error = '';

// ── 로그인 처리 ──────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['action'] ?? '') === 'login') {
    $u = $_POST['username'] ?? '';
    $p = $_POST['password'] ?? '';
    // 테스트 계정: victim / 1234
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
    header('Location: bank.php');
    exit;
}

// ── 이체 처리 (❌ 취약: GET 방식, 출처 검증 없음) ────────────
if (($_GET['action'] ?? '') === 'transfer' && $_SESSION['logged_in']) {
    $to     = $_GET['to']     ?? '알 수 없음';
    $amount = (int)($_GET['amount'] ?? 0);

    if ($amount > 0 && $amount <= $_SESSION['balance']) {
        $_SESSION['balance'] -= $amount;
        $_SESSION['log'][]    = [
            'time'    => date('H:i:s'),
            'to'      => htmlspecialchars($to),
            'amount'  => $amount,
            'referer' => $_SERVER['HTTP_REFERER'] ?? '(없음)',
            'by_csrf' => (strpos($_SERVER['HTTP_REFERER'] ?? '', 'localhost:8081') === false) ? '⚠️ 외부 출처' : '정상',
        ];
        $msg = number_format($amount) . '원이 ' . htmlspecialchars($to) . ' 계좌로 이체되었습니다.';
    } else {
        $error = '잔액이 부족하거나 금액이 올바르지 않습니다.';
    }
}
?>
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>[취약] 해킹은행 - CSRF GET Lab</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: 'Segoe UI', sans-serif; background: #f0f2f5; margin: 0; padding: 30px; }
    .wrap { max-width: 700px; margin: 0 auto; }
    .card { background: white; border-radius: 8px; padding: 24px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,.1); }
    h1 { color: #1a3a6b; margin: 0 0 4px; }
    .badge-vuln { display:inline-block; background:#dc2626; color:white; font-size:11px; padding:2px 8px; border-radius:12px; font-weight:700; }
    .balance { font-size: 2rem; font-weight: 700; color: #1a3a6b; }
    .balance span { font-size: 1rem; color: #666; }
    input[type=text],input[type=password],input[type=number] {
      width: 100%; padding: 9px 12px; border: 1px solid #ddd; border-radius: 5px; margin: 6px 0 14px;
    }
    button { padding: 10px 22px; background: #1a3a6b; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px; }
    button:hover { background: #2a52a0; }
    .msg  { background: #d1fae5; border: 1px solid #059669; padding: 10px 14px; border-radius: 5px; margin: 10px 0; color: #065f46; }
    .err  { background: #fee2e2; border: 1px solid #dc2626; padding: 10px 14px; border-radius: 5px; margin: 10px 0; color: #991b1b; }
    .warn { background: #fef3c7; border: 1px solid #d97706; padding: 12px 14px; border-radius: 5px; margin: 10px 0; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th, td { padding: 8px 10px; text-align: left; border-bottom: 1px solid #eee; }
    th { background: #f8fafc; font-weight: 600; color: #555; }
    .tag-warn { color: #d97706; font-weight: 700; }
    .tag-ok   { color: #059669; }
    code { background: #f1f5f9; padding: 2px 6px; border-radius: 3px; font-size: 12px; }
  </style>
</head>
<body>
<div class="wrap">
  <div class="card">
    <h1>🏦 해킹은행 <span class="badge-vuln">CSRF 취약</span></h1>
    <p style="color:#666; margin:4px 0 0">CSRF Lab — Scenario 1: GET 방식 이체 취약점</p>
  </div>

  <?php if (!$_SESSION['logged_in']): ?>
  <!-- ── 로그인 폼 ── -->
  <div class="card">
    <h2>로그인</h2>
    <div class="warn">
      ℹ️ 테스트 계정: <strong>victim / 1234</strong>
    </div>
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
  <!-- ── 메인 대시보드 ── -->
  <div class="card">
    <p style="color:#666; margin:0">안녕하세요, <strong><?= $_SESSION['username'] ?></strong>님
       <a href="bank.php?action=logout" style="float:right; color:#dc2626; text-decoration:none; font-size:13px">로그아웃</a>
    </p>
    <div class="balance"><?= number_format($_SESSION['balance']) ?><span> 원</span></div>
    <?php if ($error): ?><div class="err"><?= $error ?></div><?php endif; ?>
    <?php if ($msg):   ?><div class="msg"><?= $msg ?></div><?php endif; ?>
  </div>

  <!-- ── 이체 폼 (정상 사용) ── -->
  <div class="card">
    <h3>계좌 이체</h3>
    <form method="GET" action="bank.php">
      <input type="hidden" name="action" value="transfer">
      <label>받는 계좌 (수취인)</label>
      <input type="text" name="to" placeholder="예: 홍길동">
      <label>금액 (원)</label>
      <input type="number" name="amount" placeholder="예: 10000">
      <button type="submit">이체하기</button>
    </form>
  </div>

  <!-- ── 취약점 설명 ── -->
  <div class="card">
    <h3>⚠️ 취약점: GET 방식 이체</h3>
    <p>이 앱은 이체를 <strong>GET 파라미터</strong>로 처리합니다. 아래 URL 하나로 이체가 실행됩니다:</p>
    <code>http://localhost:8081/bank.php?action=transfer&amp;to=attacker&amp;amount=500000</code>
    <p style="margin-top:12px">공격자는 이 URL을 <code>&lt;img&gt;</code>나 <code>&lt;iframe&gt;</code>에 심어두면,
    피해자가 <strong>아무것도 클릭하지 않아도</strong> 이체가 실행됩니다.</p>
    <p>👉 공격 페이지: <a href="http://localhost:8082/evil.html" target="_blank">http://localhost:8082/evil.html</a></p>
  </div>

  <!-- ── 이체 로그 ── -->
  <?php if (!empty($_SESSION['log'])): ?>
  <div class="card">
    <h3>이체 기록</h3>
    <table>
      <tr><th>시간</th><th>수취인</th><th>금액</th><th>Referer</th><th>출처 판정</th></tr>
      <?php foreach (array_reverse($_SESSION['log']) as $r): ?>
      <tr>
        <td><?= $r['time'] ?></td>
        <td><?= $r['to'] ?></td>
        <td><?= number_format($r['amount']) ?>원</td>
        <td style="font-size:11px; max-width:200px; overflow:hidden"><?= $r['referer'] ?></td>
        <td class="<?= $r['by_csrf'] === '정상' ? 'tag-ok' : 'tag-warn' ?>"><?= $r['by_csrf'] ?></td>
      </tr>
      <?php endforeach; ?>
    </table>
  </div>
  <?php endif; ?>
  <?php endif; ?>
</div>
</body>
</html>

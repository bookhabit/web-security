<?php
/**
 * [방어] CSRF Lab - Scenario 3: 클릭재킹 방어
 * 방어법: X-Frame-Options + Content-Security-Policy frame-ancestors
 * 실행: php -S localhost:8095 -t csrf/03-clickjacking/secure/
 */

// ✅ 방어 1: X-Frame-Options (구형 브라우저 포함 광범위한 지원)
header('X-Frame-Options: DENY');

// ✅ 방어 2: CSP frame-ancestors (현대적, 더 세밀한 제어)
header("Content-Security-Policy: frame-ancestors 'none'");

session_name('CSRF_CLICK_SEC');
session_start();
if (!isset($_SESSION['donations'])) {
    $_SESSION['donations'] = [];
}
$_SESSION['logged_in'] = true;
$_SESSION['username']  = 'victim';

$msg = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['donate'])) {
    $amount = (int)($_POST['amount'] ?? 10000);
    $_SESSION['donations'][] = [
        'time'   => date('H:i:s'),
        'amount' => $amount,
        'to'     => htmlspecialchars($_POST['recipient'] ?? '자선단체'),
    ];
    $msg = number_format($amount) . '원 기부가 완료되었습니다.';
}
?>
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>[방어] 기부 페이지 - 클릭재킹 방어</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: 'Segoe UI', sans-serif; background: #f0fdf4; margin: 0; padding: 30px; }
    .wrap { max-width: 600px; margin: 0 auto; }
    .card { background: white; border-radius: 8px; padding: 24px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,.1); }
    h1 { color: #065f46; margin: 0 0 4px; }
    .badge-sec { display:inline-block; background:#059669; color:white; font-size:11px; padding:2px 8px; border-radius:12px; font-weight:700; }
    .donate-btn { width: 100%; padding: 16px; background: #059669; color: white; border: none; border-radius: 8px; font-size: 1.2rem; font-weight: 700; cursor: pointer; margin-top: 10px; }
    .msg  { background: #d1fae5; border: 1px solid #059669; padding: 10px 14px; border-radius: 5px; margin: 10px 0; }
    .info { background: #eff6ff; border: 1px solid #3b82f6; padding: 12px 14px; border-radius: 5px; margin: 10px 0; font-size: 13px; }
    code { background: #f1f5f9; padding: 2px 6px; border-radius: 3px; font-size: 12px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th, td { padding: 8px 10px; text-align: left; border-bottom: 1px solid #eee; }
    th { background: #f0fdf4; }
  </style>
</head>
<body>
<div class="wrap">
  <div class="card">
    <h1>🤝 자선 기부 센터 <span class="badge-sec">클릭재킹 방어</span></h1>
  </div>

  <div class="card">
    <div class="info">
      ✅ 이 페이지는 다음 헤더로 iframe 삽입이 차단됩니다:<br>
      <code>X-Frame-Options: DENY</code><br>
      <code>Content-Security-Policy: frame-ancestors 'none'</code><br><br>
      공격 페이지에서 이 URL을 iframe으로 불러오면 브라우저가 <strong>자동으로 차단</strong>합니다.
    </div>
    <?php if ($msg): ?><div class="msg"><?= $msg ?></div><?php endif; ?>
    <form method="POST">
      <input type="hidden" name="recipient" value="정식-자선단체">
      <input type="hidden" name="amount"    value="10000">
      <button type="submit" name="donate" class="donate-btn">
        💚 1만원 기부하기
      </button>
    </form>
  </div>

  <div class="card">
    <h3>🛡️ 방어 원리</h3>
    <table>
      <tr><th>헤더</th><th>역할</th></tr>
      <tr>
        <td><code>X-Frame-Options: DENY</code></td>
        <td>모든 iframe 삽입 차단 (IE9+ 포함 구형 브라우저 지원)</td>
      </tr>
      <tr>
        <td><code>CSP: frame-ancestors 'none'</code></td>
        <td>현대적 방법, X-Frame-Options보다 우선 적용</td>
      </tr>
    </table>
  </div>

  <?php if (!empty($_SESSION['donations'])): ?>
  <div class="card">
    <h3>기부 기록</h3>
    <table>
      <tr><th>시간</th><th>수취인</th><th>금액</th></tr>
      <?php foreach (array_reverse($_SESSION['donations']) as $d): ?>
      <tr><td><?= $d['time'] ?></td><td><?= $d['to'] ?></td><td><?= number_format($d['amount']) ?>원</td></tr>
      <?php endforeach; ?>
    </table>
  </div>
  <?php endif; ?>
</div>
</body>
</html>

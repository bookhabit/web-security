<?php
/**
 * [취약] CSRF Lab - Scenario 3: 클릭재킹 타겟
 * 취약점: X-Frame-Options 헤더 없음 → iframe 삽입 가능
 * 실행: php -S localhost:8085 -t csrf/03-clickjacking/target/
 */

// ❌ X-Frame-Options 헤더 없음 (취약)
// header('X-Frame-Options: DENY');  ← 이 줄이 없으면 클릭재킹 가능!

session_name('CSRF_CLICK_VULN');
session_start();

if (!isset($_SESSION['donations'])) {
    $_SESSION['donations'] = [];
    $_SESSION['logged_in'] = false;
}

$msg = '';

// 간단한 자동 로그인 (데모용)
$_SESSION['logged_in'] = true;
$_SESSION['username']  = 'victim';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['donate'])) {
    $amount = (int)($_POST['amount'] ?? 10000);
    $_SESSION['donations'][] = [
        'time'    => date('H:i:s'),
        'amount'  => $amount,
        'to'      => htmlspecialchars($_POST['recipient'] ?? '자선단체'),
        'referer' => $_SERVER['HTTP_REFERER'] ?? '(없음)',
    ];
    $msg = number_format($amount) . '원 기부가 완료되었습니다.';
}
?>
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>[취약] 기부 페이지 - 클릭재킹 타겟</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: 'Segoe UI', sans-serif; background: #fff7ed; margin: 0; padding: 30px; }
    .wrap { max-width: 600px; margin: 0 auto; }
    .card { background: white; border-radius: 8px; padding: 24px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,.1); }
    h1 { color: #92400e; margin: 0 0 4px; }
    .badge { display:inline-block; background:#dc2626; color:white; font-size:11px; padding:2px 8px; border-radius:12px; font-weight:700; }
    .donate-btn { width: 100%; padding: 16px; background: #f59e0b; color: white; border: none; border-radius: 8px; font-size: 1.2rem; font-weight: 700; cursor: pointer; margin-top: 10px; }
    .donate-btn:hover { background: #d97706; }
    .msg  { background: #d1fae5; border: 1px solid #059669; padding: 10px 14px; border-radius: 5px; margin: 10px 0; }
    .warn { background: #fef3c7; border: 1px solid #d97706; padding: 12px 14px; border-radius: 5px; margin: 10px 0; font-size:13px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th, td { padding: 8px 10px; text-align: left; border-bottom: 1px solid #eee; }
    th { background: #fffbeb; }
  </style>
</head>
<body>
<div class="wrap">
  <div class="card">
    <h1>🤝 자선 기부 센터 <span class="badge">클릭재킹 취약</span></h1>
    <p style="color:#666; margin:4px 0 0">CSRF Lab — Scenario 3: 클릭재킹 타겟 페이지</p>
  </div>

  <div class="card">
    <h2>기부하기</h2>
    <div class="warn">⚠️ 이 페이지는 X-Frame-Options 헤더가 없어 iframe에 삽입 가능합니다.</div>
    <?php if ($msg): ?><div class="msg"><?= $msg ?></div><?php endif; ?>
    <form method="POST">
      <input type="hidden" name="recipient" value="attacker-charity">
      <input type="hidden" name="amount"    value="100000">
      <!--
        이 버튼 위에 공격 사이트가 투명한 레이어를 씌워둡니다.
        피해자는 다른 버튼을 클릭하려 했지만 실제로는 이 버튼이 클릭됨.
      -->
      <button type="submit" name="donate" class="donate-btn">
        💛 10만원 기부하기
      </button>
    </form>
    <p style="font-size: 13px; color: #999; margin-top: 8px; text-align: center">
      👉 공격 페이지: <a href="http://localhost:8086/clickjack.html" target="_blank">http://localhost:8086/clickjack.html</a>
    </p>
  </div>

  <?php if (!empty($_SESSION['donations'])): ?>
  <div class="card">
    <h3>기부 기록</h3>
    <table>
      <tr><th>시간</th><th>수취인</th><th>금액</th><th>Referer</th></tr>
      <?php foreach (array_reverse($_SESSION['donations']) as $d): ?>
      <tr>
        <td><?= $d['time'] ?></td>
        <td><?= $d['to'] ?></td>
        <td><?= number_format($d['amount']) ?>원</td>
        <td style="font-size:11px"><?= $d['referer'] ?></td>
      </tr>
      <?php endforeach; ?>
    </table>
  </div>
  <?php endif; ?>
</div>
</body>
</html>

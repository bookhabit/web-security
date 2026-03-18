<?php
/**
 * [취약] CSRF Lab - Scenario 2: POST 폼 비밀번호 변경
 * 취약점: POST 요청이지만 CSRF 토큰 없음 → 자동 제출 폼으로 공격 가능
 * 실행: php -S localhost:8083 -t csrf/02-post-form/vulnerable/
 */
session_name('CSRF_MYPAGE_VULN');
session_start();

if (!isset($_SESSION['initialized'])) {
    $_SESSION['initialized'] = true;
    $_SESSION['logged_in']   = false;
    $_SESSION['username']    = '';
    $_SESSION['password']    = '1234';     // 현재 비밀번호
    $_SESSION['email']       = 'victim@hack-bank.com';
    $_SESSION['log']         = [];
}

$msg   = '';
$error = '';

// ── 로그인 ───────────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['action'] ?? '') === 'login') {
    if ($_POST['username'] === 'victim' && $_POST['password'] === $_SESSION['password']) {
        $_SESSION['logged_in'] = true;
        $_SESSION['username']  = 'victim';
        $msg = '로그인 성공!';
    } else {
        $error = '아이디 또는 비밀번호가 틀렸습니다.';
    }
}

// ── 로그아웃 ─────────────────────────────────────────────────
if (($_GET['action'] ?? '') === 'logout') {
    session_destroy();
    header('Location: mypage.php');
    exit;
}

// ── 이메일 변경 (❌ 취약: CSRF 토큰 없음) ────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST'
    && ($_POST['action'] ?? '') === 'change_email'
    && $_SESSION['logged_in'])
{
    $new_email = $_POST['new_email'] ?? '';
    if (filter_var($new_email, FILTER_VALIDATE_EMAIL)) {
        $old = $_SESSION['email'];
        $_SESSION['email']  = htmlspecialchars($new_email);
        $_SESSION['log'][]  = [
            'time'    => date('H:i:s'),
            'action'  => '이메일 변경',
            'detail'  => $old . ' → ' . htmlspecialchars($new_email),
            'referer' => $_SERVER['HTTP_REFERER'] ?? '(없음)',
        ];
        $msg = '이메일이 변경되었습니다: ' . htmlspecialchars($new_email);
    } else {
        $error = '올바른 이메일 형식이 아닙니다.';
    }
}

// ── 비밀번호 변경 (❌ 취약: CSRF 토큰 없음) ──────────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST'
    && ($_POST['action'] ?? '') === 'change_password'
    && $_SESSION['logged_in'])
{
    $new_pw = $_POST['new_password'] ?? '';
    if (strlen($new_pw) >= 4) {
        $_SESSION['password'] = $new_pw;
        $_SESSION['log'][]    = [
            'time'    => date('H:i:s'),
            'action'  => '비밀번호 변경',
            'detail'  => '새 비밀번호: ' . htmlspecialchars($new_pw),
            'referer' => $_SERVER['HTTP_REFERER'] ?? '(없음)',
        ];
        $msg = '비밀번호가 변경되었습니다!';
    } else {
        $error = '비밀번호는 4자 이상이어야 합니다.';
    }
}
?>
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>[취약] 마이페이지 - CSRF POST Lab</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: 'Segoe UI', sans-serif; background: #faf5ff; margin: 0; padding: 30px; }
    .wrap { max-width: 700px; margin: 0 auto; }
    .card { background: white; border-radius: 8px; padding: 24px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,.1); }
    h1 { color: #4c1d95; margin: 0 0 4px; }
    .badge-vuln { display:inline-block; background:#dc2626; color:white; font-size:11px; padding:2px 8px; border-radius:12px; font-weight:700; }
    input[type=text],input[type=password],input[type=email] {
      width: 100%; padding: 9px 12px; border: 1px solid #ddd; border-radius: 5px; margin: 6px 0 14px;
    }
    button { padding: 10px 22px; background: #7c3aed; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px; }
    button:hover { background: #6d28d9; }
    .msg  { background: #d1fae5; border: 1px solid #059669; padding: 10px 14px; border-radius: 5px; margin: 10px 0; color: #065f46; }
    .err  { background: #fee2e2; border: 1px solid #dc2626; padding: 10px 14px; border-radius: 5px; margin: 10px 0; color: #991b1b; }
    .warn { background: #fef3c7; border: 1px solid #d97706; padding: 12px 14px; border-radius: 5px; margin: 10px 0; }
    .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
    .info-row:last-child { border: none; }
    .label { color: #6b7280; font-size: 13px; }
    .value { font-weight: 600; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { padding: 7px 10px; text-align: left; border-bottom: 1px solid #eee; }
    th { background: #faf5ff; color: #555; }
    code { background: #f1f5f9; padding: 2px 6px; border-radius: 3px; font-size: 12px; }
  </style>
</head>
<body>
<div class="wrap">
  <div class="card">
    <h1>👤 마이페이지 <span class="badge-vuln">CSRF 취약</span></h1>
    <p style="color:#666; margin:4px 0 0">CSRF Lab — Scenario 2: POST 폼 위조 공격</p>
  </div>

  <?php if (!$_SESSION['logged_in']): ?>
  <div class="card">
    <h2>로그인</h2>
    <div class="warn">ℹ️ 테스트 계정: <strong>victim / 1234</strong></div>
    <?php if ($error): ?><div class="err"><?= $error ?></div><?php endif; ?>
    <?php if ($msg):   ?><div class="msg"><?= $msg ?></div><?php endif; ?>
    <form method="POST">
      <input type="hidden" name="action" value="login">
      <label>아이디</label>
      <input type="text" name="username" placeholder="victim">
      <label>비밀번호</label>
      <input type="password" name="password" placeholder="현재 비밀번호">
      <button type="submit">로그인</button>
    </form>
  </div>

  <?php else: ?>
  <div class="card">
    <p style="color:#666; margin:0 0 12px">
      안녕하세요, <strong><?= $_SESSION['username'] ?></strong>님
      <a href="mypage.php?action=logout" style="float:right; color:#dc2626; text-decoration:none; font-size:13px">로그아웃</a>
    </p>
    <?php if ($error): ?><div class="err"><?= $error ?></div><?php endif; ?>
    <?php if ($msg):   ?><div class="msg"><?= $msg ?></div><?php endif; ?>
    <div class="info-row"><span class="label">아이디</span><span class="value"><?= $_SESSION['username'] ?></span></div>
    <div class="info-row"><span class="label">이메일</span><span class="value"><?= $_SESSION['email'] ?></span></div>
    <div class="info-row"><span class="label">현재 비밀번호</span><span class="value"><?= str_repeat('*', strlen($_SESSION['password'])) ?> (<?= htmlspecialchars($_SESSION['password']) ?>)</span></div>
  </div>

  <!-- 이메일 변경 (취약) -->
  <div class="card">
    <h3>이메일 변경</h3>
    <div class="warn">⚠️ 이 폼은 CSRF 토큰 없이 POST 요청을 처리합니다.</div>
    <form method="POST">
      <input type="hidden" name="action" value="change_email">
      <label>새 이메일</label>
      <input type="email" name="new_email" placeholder="new@example.com">
      <button type="submit">변경하기</button>
    </form>
  </div>

  <!-- 비밀번호 변경 (취약) -->
  <div class="card">
    <h3>비밀번호 변경</h3>
    <div class="warn">⚠️ 기존 비밀번호 확인도, CSRF 토큰도 없습니다!</div>
    <form method="POST">
      <input type="hidden" name="action" value="change_password">
      <label>새 비밀번호</label>
      <input type="password" name="new_password" placeholder="새 비밀번호 입력">
      <button type="submit">변경하기</button>
    </form>
    <p style="margin-top:12px; font-size:13px">
      👉 공격 페이지: <a href="http://localhost:8084/evil-form.html" target="_blank">http://localhost:8084/evil-form.html</a>
      (로그인 유지 상태로 접속)
    </p>
  </div>

  <!-- 변경 로그 -->
  <?php if (!empty($_SESSION['log'])): ?>
  <div class="card">
    <h3>변경 이력</h3>
    <table>
      <tr><th>시간</th><th>작업</th><th>내용</th><th>Referer</th></tr>
      <?php foreach (array_reverse($_SESSION['log']) as $r): ?>
      <tr>
        <td><?= $r['time'] ?></td>
        <td><?= $r['action'] ?></td>
        <td><?= $r['detail'] ?></td>
        <td style="font-size:11px"><?= $r['referer'] ?></td>
      </tr>
      <?php endforeach; ?>
    </table>
  </div>
  <?php endif; ?>
  <?php endif; ?>
</div>
</body>
</html>

<?php
/**
 * [방어] CSRF Lab - Scenario 2: POST 폼 + CSRF 토큰 방어
 * 방어법: CSRF 토큰 + SameSite 쿠키 속성 + 기존 비밀번호 확인
 * 실행: php -S localhost:8093 -t csrf/02-post-form/secure/
 */

// ✅ SameSite=Strict 쿠키 설정 (세션 시작 전에 설정)
session_name('CSRF_MYPAGE_SEC');
ini_set('session.cookie_samesite', 'Strict');
session_start();

if (!isset($_SESSION['initialized'])) {
    $_SESSION['initialized'] = true;
    $_SESSION['logged_in']   = false;
    $_SESSION['username']    = '';
    $_SESSION['password']    = '1234';
    $_SESSION['email']       = 'victim@hack-bank.com';
    $_SESSION['log']         = [];
}

$msg   = '';
$error = '';

function get_csrf_token(): string {
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

function verify_and_rotate(string $token): bool {
    $valid = isset($_SESSION['csrf_token'])
          && hash_equals($_SESSION['csrf_token'], $token);
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32)); // 항상 갱신
    return $valid;
}

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
    header('Location: mypage-secure.php');
    exit;
}

// ── 비밀번호 변경 (✅ 방어: CSRF 토큰 + 현재 비밀번호 확인) ──
if ($_SERVER['REQUEST_METHOD'] === 'POST'
    && ($_POST['action'] ?? '') === 'change_password'
    && $_SESSION['logged_in'])
{
    $token      = $_POST['csrf_token']    ?? '';
    $current_pw = $_POST['current_pw']    ?? '';
    $new_pw     = $_POST['new_password']  ?? '';

    if (!verify_and_rotate($token)) {
        $error = '⛔ CSRF 토큰 검증 실패! 위조된 요청이 차단되었습니다.';
    } elseif ($current_pw !== $_SESSION['password']) {
        $error = '현재 비밀번호가 일치하지 않습니다.';
    } elseif (strlen($new_pw) < 4) {
        $error = '새 비밀번호는 4자 이상이어야 합니다.';
    } else {
        $_SESSION['password'] = $new_pw;
        $_SESSION['log'][]    = [
            'time'   => date('H:i:s'),
            'action' => '비밀번호 변경',
            'status' => '✅ 토큰 검증 통과 + 현재 비밀번호 확인',
        ];
        $msg = '비밀번호가 성공적으로 변경되었습니다.';
    }
}

$csrf_token = get_csrf_token();
?>
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>[방어] 마이페이지 - CSRF 방어</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: 'Segoe UI', sans-serif; background: #f0fdf4; margin: 0; padding: 30px; }
    .wrap { max-width: 700px; margin: 0 auto; }
    .card { background: white; border-radius: 8px; padding: 24px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,.1); }
    h1 { color: #065f46; margin: 0 0 4px; }
    .badge-sec { display:inline-block; background:#059669; color:white; font-size:11px; padding:2px 8px; border-radius:12px; font-weight:700; }
    input[type=text],input[type=password],input[type=email] {
      width: 100%; padding: 9px 12px; border: 1px solid #ddd; border-radius: 5px; margin: 6px 0 14px;
    }
    button { padding: 10px 22px; background: #059669; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px; }
    .msg  { background: #d1fae5; border: 1px solid #059669; padding: 10px 14px; border-radius: 5px; margin: 10px 0; }
    .err  { background: #fee2e2; border: 1px solid #dc2626; padding: 10px 14px; border-radius: 5px; margin: 10px 0; color: #991b1b; }
    .info { background: #eff6ff; border: 1px solid #3b82f6; padding: 12px 14px; border-radius: 5px; margin: 10px 0; font-size: 13px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th, td { padding: 8px 10px; text-align: left; border-bottom: 1px solid #eee; }
    th { background: #f8fafc; }
    code { background: #f1f5f9; padding: 2px 6px; border-radius: 3px; font-size: 12px; }
    .token-box { background: #f1f5f9; padding: 10px; border-radius: 5px; font-family: monospace; font-size: 12px; word-break: break-all; color: #1e40af; margin-top: 8px; }
  </style>
</head>
<body>
<div class="wrap">
  <div class="card">
    <h1>👤 마이페이지 <span class="badge-sec">CSRF 방어</span></h1>
    <p style="color:#666; margin:4px 0 0">CSRF 토큰 + SameSite 쿠키 + 재인증 방어</p>
  </div>

  <?php if (!$_SESSION['logged_in']): ?>
  <div class="card">
    <h2>로그인</h2>
    <div class="info">ℹ️ 테스트 계정: <strong>victim / 1234</strong></div>
    <?php if ($error): ?><div class="err"><?= $error ?></div><?php endif; ?>
    <?php if ($msg):   ?><div class="msg"><?= $msg ?></div><?php endif; ?>
    <form method="POST">
      <input type="hidden" name="action" value="login">
      <label>아이디</label><input type="text" name="username" placeholder="victim">
      <label>비밀번호</label><input type="password" name="password" placeholder="1234">
      <button type="submit">로그인</button>
    </form>
  </div>

  <?php else: ?>
  <div class="card">
    <p style="color:#666; margin:0">안녕하세요, <strong><?= $_SESSION['username'] ?></strong>님
       <a href="mypage-secure.php?action=logout" style="float:right; color:#dc2626; text-decoration:none; font-size:13px">로그아웃</a>
    </p>
    <?php if ($error): ?><div class="err"><?= $error ?></div><?php endif; ?>
    <?php if ($msg):   ?><div class="msg"><?= $msg ?></div><?php endif; ?>
  </div>

  <div class="card">
    <h3>비밀번호 변경</h3>
    <!--
      ✅ 방어 1: csrf_token hidden 필드
      ✅ 방어 2: 현재 비밀번호 재확인 (알고 있어야만 변경 가능)
    -->
    <form method="POST">
      <input type="hidden" name="action"     value="change_password">
      <input type="hidden" name="csrf_token" value="<?= htmlspecialchars($csrf_token) ?>">
      <label>현재 비밀번호 <small>(재인증)</small></label>
      <input type="password" name="current_pw" placeholder="현재 비밀번호 확인">
      <label>새 비밀번호</label>
      <input type="password" name="new_password" placeholder="새 비밀번호">
      <button type="submit">변경하기</button>
    </form>
    <div class="info">
      <strong>🔑 CSRF 토큰:</strong>
      <div class="token-box"><?= htmlspecialchars($csrf_token) ?></div>
    </div>
  </div>

  <div class="card">
    <h3>🛡️ 적용된 다중 방어</h3>
    <table>
      <tr><th>방어 기법</th><th>효과</th></tr>
      <tr>
        <td><code>CSRF Token</code></td>
        <td>공격자가 피해자의 토큰을 읽을 수 없음 (SOP 차단)</td>
      </tr>
      <tr>
        <td><code>SameSite=Strict</code></td>
        <td>다른 사이트에서 발생한 요청에는 쿠키 미전송</td>
      </tr>
      <tr>
        <td><code>현재 비밀번호 확인</code></td>
        <td>비밀번호 변경 시 재인증 → CSRF로도 변경 불가</td>
      </tr>
      <tr>
        <td><code>hash_equals()</code></td>
        <td>타이밍 공격 방지 상수 시간 비교</td>
      </tr>
    </table>
  </div>

  <?php if (!empty($_SESSION['log'])): ?>
  <div class="card">
    <h3>변경 이력</h3>
    <table>
      <tr><th>시간</th><th>작업</th><th>상태</th></tr>
      <?php foreach (array_reverse($_SESSION['log']) as $r): ?>
      <tr><td><?= $r['time'] ?></td><td><?= $r['action'] ?></td><td><?= $r['status'] ?></td></tr>
      <?php endforeach; ?>
    </table>
  </div>
  <?php endif; ?>
  <?php endif; ?>
</div>
</body>
</html>

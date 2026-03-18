<?php
// 피해자 앱: 로그인 + 게시판 (세션 발급)
session_set_cookie_params([
  'lifetime' => 3600,
  'httponly' => false, // ❌ 취약: HttpOnly 비활성화 → JS로 쿠키 읽기 가능
  'samesite' => 'Lax'
]);
session_start();
header('Content-Type: text/html; charset=UTF-8');

$db = new PDO('sqlite:' . __DIR__ . '/victim.sqlite');
$db->exec("CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY, username TEXT, password TEXT
)");
$db->exec("INSERT OR IGNORE INTO users VALUES (1, 'victim', 'password123')");
$db->exec("INSERT OR IGNORE INTO users VALUES (2, 'admin', 'admin123')");

$db->exec("CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT, content TEXT
)");

$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $username = $_POST['username'] ?? '';
  $password = $_POST['password'] ?? '';
  $stmt = $db->prepare("SELECT * FROM users WHERE username=? AND password=?");
  $stmt->execute([$username, $password]);
  $user = $stmt->fetch();
  if ($user) {
    $_SESSION['user'] = $user['username'];
    $_SESSION['user_id'] = $user['id'];
    header('Location: mypage.php');
    exit;
  } else {
    $error = '아이디 또는 비밀번호가 올바르지 않습니다.';
  }
}
?>
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>[피해자 앱] 로그인</title>
  <style>
    body { font-family: monospace; max-width: 500px; margin: 80px auto; padding: 20px; }
    .vuln { background: #ffe0e0; border: 2px solid #c00; padding: 10px; border-radius: 4px; margin-bottom: 20px; }
    .box { background: #f5f5f5; padding: 20px; border-radius: 4px; }
    input { width: 100%; padding: 8px; margin: 6px 0; box-sizing: border-box; }
    button { width: 100%; padding: 10px; cursor: pointer; background: #333; color: white; border: none; margin-top: 8px; }
    .error { color: red; }
    code { background: #eee; padding: 2px 6px; }
  </style>
</head>
<body>
  <h2>피해자 앱 - 로그인</h2>
  <div class="vuln">
    ⚠️ <strong>세션 하이재킹 실습용 피해자 앱</strong><br>
    HttpOnly 쿠키 비활성화 → JS로 세션 쿠키 탈취 가능<br>
    실행: <code>php -S localhost:8080 -t xss/05-session-hijack/victim/</code>
  </div>

  <div class="box">
    <h3>로그인</h3>
    <?php if ($error): ?>
      <p class="error"><?php echo htmlspecialchars($error); ?></p>
    <?php endif; ?>
    <form method="POST">
      <label>아이디:</label>
      <input type="text" name="username" placeholder="victim 또는 admin">
      <label>비밀번호:</label>
      <input type="password" name="password" placeholder="password123 또는 admin123">
      <button type="submit">로그인</button>
    </form>
    <hr>
    <p><strong>테스트 계정:</strong></p>
    <ul>
      <li>victim / password123</li>
      <li>admin / admin123</li>
    </ul>
  </div>
</body>
</html>

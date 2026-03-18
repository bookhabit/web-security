<?php
// 방어: 출력 시 htmlspecialchars() 적용
header('Content-Type: text/html; charset=UTF-8');

$db = new PDO('sqlite:' . __DIR__ . '/board_safe.sqlite');
$db->exec("CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)");

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $title = $_POST['title'] ?? '';
  $content = $_POST['content'] ?? '';
  if ($title && $content) {
    // 저장은 원본 그대로 저장 (방어는 출력 시 적용)
    $stmt = $db->prepare("INSERT INTO posts (title, content) VALUES (?, ?)");
    $stmt->execute([$title, $content]);
  }
  header('Location: board_safe.php');
  exit;
}

$posts = $db->query("SELECT * FROM posts ORDER BY id DESC")->fetchAll(PDO::FETCH_ASSOC);

// ✅ 안전: 출력 전 이스케이프 함수 정의
function e($str) {
  return htmlspecialchars($str, ENT_QUOTES, 'UTF-8');
}
?>
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>[안전] Stored XSS 방어 - 게시판 (PHP)</title>
  <style>
    body { font-family: monospace; max-width: 800px; margin: 40px auto; padding: 20px; }
    .safe { background: #e0ffe0; border: 2px solid #090; padding: 10px; border-radius: 4px; }
    .box { background: #f5f5f5; padding: 15px; margin: 15px 0; border-radius: 4px; }
    .compare { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .bad { background: #ffe0e0; padding: 10px; border-radius: 4px; font-size: 0.9em; }
    .good { background: #e0ffe0; padding: 10px; border-radius: 4px; font-size: 0.9em; }
    code { background: #eee; padding: 2px 6px; display: block; margin: 3px 0; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
    th { background: #eee; }
    form input, form textarea { width: 100%; padding: 6px; box-sizing: border-box; margin: 4px 0; }
    form textarea { height: 80px; font-family: monospace; }
    form button { padding: 8px 20px; cursor: pointer; margin-top: 6px; }
  </style>
</head>
<body>
  <h2>[안전] Stored XSS 방어 - 게시판 (PHP)</h2>
  <div class="safe">✅ htmlspecialchars()로 출력 인코딩이 적용된 안전한 버전입니다.</div>

  <div class="box">
    <div class="compare">
      <div class="bad">
        <strong>❌ 취약 (board.php)</strong>
        <code>echo $post['title'];</code>
        <code>echo $post['content'];</code>
      </div>
      <div class="good">
        <strong>✅ 안전 (이 파일)</strong>
        <code>function e($str) {</code>
        <code>&nbsp;&nbsp;return htmlspecialchars($str, ENT_QUOTES, 'UTF-8');</code>
        <code>}</code>
        <code>echo e($post['title']);</code>
        <code>echo e($post['content']);</code>
      </div>
    </div>
    <p>XSS 페이로드를 저장해도 출력 시 HTML 엔티티로 변환되어 태그가 실행되지 않습니다.</p>
  </div>

  <h3>글 작성 (XSS 페이로드를 입력해도 안전합니다)</h3>
  <form method="POST" action="board_safe.php">
    <label>제목:</label>
    <input type="text" name="title" placeholder='<script>alert(1)</script> 를 입력해보세요' required>
    <label>내용:</label>
    <textarea name="content" placeholder='<img src=x onerror=alert(1)> 를 입력해보세요'></textarea>
    <button type="submit">등록</button>
  </form>

  <h3>게시글 목록</h3>
  <?php if (empty($posts)): ?>
    <p>등록된 글이 없습니다.</p>
  <?php else: ?>
  <table>
    <tr><th>#</th><th>제목</th><th>내용</th><th>작성일시</th></tr>
    <?php foreach ($posts as $post): ?>
    <tr>
      <td><?php echo e($post['id']); ?></td>
      <!-- ✅ 안전: e() 함수로 HTML 인코딩 후 출력 -->
      <td><?php echo e($post['title']); ?></td>
      <td><?php echo e($post['content']); ?></td>
      <td><?php echo e($post['created_at']); ?></td>
    </tr>
    <?php endforeach; ?>
  </table>
  <?php endif; ?>

  <div class="box">
    <p>실행: <code>php -S localhost:8080 -t xss/02-stored/secure/php/</code></p>
  </div>
</body>
</html>

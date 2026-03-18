<?php
// 방어: htmlspecialchars()로 모든 출력 인코딩
header('Content-Type: text/html; charset=UTF-8');
$q = $_GET['q'] ?? '';
$id = $_GET['id'] ?? '';

// ✅ 안전: 출력 전 HTML 엔티티 인코딩
$q_safe = htmlspecialchars($q, ENT_QUOTES, 'UTF-8');
$id_safe = htmlspecialchars($id, ENT_QUOTES, 'UTF-8');
?>
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>[안전] Reflected XSS 방어 - PHP</title>
  <style>
    body { font-family: monospace; max-width: 700px; margin: 40px auto; padding: 20px; }
    .safe { background: #e0ffe0; border: 2px solid #090; padding: 10px; border-radius: 4px; }
    .box { background: #f5f5f5; padding: 15px; margin: 15px 0; border-radius: 4px; }
    .compare { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .bad { background: #ffe0e0; padding: 10px; border-radius: 4px; font-size: 0.9em; }
    .good { background: #e0ffe0; padding: 10px; border-radius: 4px; font-size: 0.9em; }
    code { background: #eee; padding: 2px 6px; display: block; margin: 3px 0; }
    .result { padding: 10px; border: 1px solid #ccc; margin-top: 10px; background: white; }
    form input[type=text] { width: 70%; padding: 6px; }
    form button { padding: 6px 14px; }
  </style>
</head>
<body>
  <h2>[안전] Reflected XSS 방어 - search_safe.php</h2>
  <div class="safe">✅ htmlspecialchars()로 출력 인코딩이 적용된 안전한 버전입니다.</div>

  <div class="box">
    <h3>취약 코드 vs 안전 코드</h3>
    <div class="compare">
      <div class="bad">
        <strong>❌ 취약 (search.php)</strong>
        <code>echo $q;</code>
        <code>value="&lt;?php echo $q; ?&gt;"</code>
      </div>
      <div class="good">
        <strong>✅ 안전 (이 파일)</strong>
        <code>$q_safe = htmlspecialchars($q, ENT_QUOTES, 'UTF-8');</code>
        <code>echo $q_safe;</code>
      </div>
    </div>
    <p><strong>htmlspecialchars()가 변환하는 문자:</strong></p>
    <ul>
      <li><code>&amp;</code> → <code>&amp;amp;</code></li>
      <li><code>&lt;</code> → <code>&amp;lt;</code></li>
      <li><code>&gt;</code> → <code>&amp;gt;</code></li>
      <li><code>"</code> → <code>&amp;quot;</code> (ENT_QUOTES)</li>
      <li><code>'</code> → <code>&amp;#039;</code> (ENT_QUOTES)</li>
    </ul>
  </div>

  <form method="GET" action="search_safe.php">
    <label>검색어: </label>
    <!-- ✅ 안전: 속성값에도 인코딩된 값 사용 -->
    <input type="text" name="q" value="<?php echo $q_safe; ?>">
    <button type="submit">검색</button>
  </form>

  <?php if ($q): ?>
  <div class="result">
    <!-- ✅ 안전: 인코딩된 값 출력 -->
    <p>검색 결과: <?php echo $q_safe; ?></p>
  </div>
  <?php endif; ?>

  <?php if ($id): ?>
  <div class="result">
    <p style="color:green">ID '<?php echo $id_safe; ?>' 안전하게 처리됨.</p>
  </div>
  <?php endif; ?>

  <div class="box">
    <h3>XSS 페이로드를 시도해도 무효화됩니다</h3>
    <p>URL에 <code>?q=&lt;script&gt;alert(1)&lt;/script&gt;</code> 를 추가해도</p>
    <p>화면에 태그 문자열이 그대로 보일 뿐, 스크립트가 실행되지 않습니다.</p>
    <p>실행: <code>php -S localhost:8080 -t xss/01-reflected/secure/php/</code></p>
  </div>
</body>
</html>

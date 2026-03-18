<?php
// 취약점: GET 파라미터를 htmlspecialchars 없이 echo
header('Content-Type: text/html; charset=UTF-8');
$q = $_GET['q'] ?? '';
$id = $_GET['id'] ?? '';
?>
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>[취약] Reflected XSS - PHP</title>
  <style>
    body { font-family: monospace; max-width: 700px; margin: 40px auto; padding: 20px; }
    .vuln { background: #ffe0e0; border: 2px solid #c00; padding: 10px; border-radius: 4px; }
    .box { background: #f5f5f5; padding: 15px; margin: 15px 0; border-radius: 4px; }
    code { background: #eee; padding: 2px 6px; }
    .result { padding: 10px; border: 1px solid #ccc; margin-top: 10px; background: white; }
    form input[type=text] { width: 70%; padding: 6px; }
    form button { padding: 6px 14px; }
  </style>
</head>
<body>
  <h2>[취약] Reflected XSS - PHP search.php</h2>
  <div class="vuln">⚠️ 이 페이지는 의도적으로 취약하게 만들어진 학습용 앱입니다.</div>

  <div class="box">
    <h3>취약 코드 (이 파일의 핵심)</h3>
    <code>$q = $_GET['q'] ?? '';</code><br>
    <code>echo "&lt;p&gt;검색어: " . $q . "&lt;/p&gt;";</code>
    <p>GET 파라미터를 그대로 HTML에 출력 → XSS 발생</p>
  </div>

  <!-- 검색 폼 -->
  <form method="GET" action="search.php">
    <label>검색어: </label>
    <input type="text" name="q" value="<?php echo $q; /* ❌ 취약: 속성값에도 미필터 출력 */ ?>">
    <button type="submit">검색</button>
  </form>

  <?php if ($q): ?>
  <div class="result">
    <!-- ❌ 취약: 사용자 입력을 그대로 HTML에 출력 -->
    <p>검색 결과: <?php echo $q; ?></p>
  </div>
  <?php endif; ?>

  <?php if ($id): ?>
  <div class="result">
    <!-- ❌ 취약: 에러 메시지에 사용자 입력 반사 -->
    <p style="color:red">ID '<?php echo $id; ?>' 에 해당하는 사용자를 찾을 수 없습니다.</p>
  </div>
  <?php endif; ?>

  <div class="box">
    <h3>공격 URL 예시</h3>
    <p>다음 URL을 직접 브라우저 주소창에 붙여넣으세요:</p>
    <ul>
      <li>기본: <code>search.php?q=&lt;script&gt;alert(document.domain)&lt;/script&gt;</code></li>
      <li>이미지 태그: <code>search.php?q=&lt;img src=x onerror=alert(document.cookie)&gt;</code></li>
      <li>속성 탈출: <code>search.php?q=" autofocus onfocus=alert(1) x="</code></li>
      <li>에러 반사: <code>search.php?id=&lt;script&gt;alert(1)&lt;/script&gt;</code></li>
    </ul>
    <p>실행: <code>php -S localhost:8080 -t xss/01-reflected/vulnerable/php/</code></p>
  </div>
</body>
</html>

<?php
require_once 'config.php';
require_login();

$errors = [];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $title   = trim($_POST['title']   ?? '');
    $content = trim($_POST['content'] ?? '');

    if ($title === '')   $errors[] = '제목을 입력해주세요.';
    if ($content === '') $errors[] = '내용을 입력해주세요.';
    if (strlen($title) > 200) $errors[] = '제목은 200자 이하여야 합니다.';

    // 파일 업로드 처리
    $uploaded = [];
    if (!empty($_FILES['files']['name'][0])) {
        foreach ($_FILES['files']['error'] as $i => $err) {
            if ($err === UPLOAD_ERR_NO_FILE) continue;
            if ($err !== UPLOAD_ERR_OK) {
                $errors[] = "파일 업로드 오류 (코드: $err)";
                continue;
            }
            $original = $_FILES['files']['name'][$i];
            $size     = $_FILES['files']['size'][$i];
            $tmp      = $_FILES['files']['tmp_name'][$i];
            $mime     = $_FILES['files']['type'][$i];

            if ($size > MAX_FILE_SIZE) {
                $errors[] = "파일 크기 초과: $original (최대 10MB)";
                continue;
            }
            $ext = strtolower(pathinfo($original, PATHINFO_EXTENSION));
            if (!in_array($ext, ALLOWED_EXTENSIONS, true)) {
                $errors[] = "허용되지 않는 파일 형식: $original";
                continue;
            }
            $stored = uniqid('', true) . '.' . $ext;
            if (move_uploaded_file($tmp, UPLOAD_DIR . $stored)) {
                $uploaded[] = compact('stored', 'original', 'size', 'mime');
            } else {
                $errors[] = "파일 저장 실패: $original";
            }
        }
    }

    if (empty($errors)) {
        $pdo = db();
        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare('INSERT INTO posts (user_id, title, content) VALUES (?, ?, ?)');
            $stmt->execute([$_SESSION['user_id'], $title, $content]);
            $post_id = (int)$pdo->lastInsertId();

            foreach ($uploaded as $f) {
                $pdo->prepare('INSERT INTO attachments (post_id, stored_name, original_name, file_size, mime_type) VALUES (?, ?, ?, ?, ?)')
                    ->execute([$post_id, $f['stored'], $f['original'], $f['size'], $f['mime']]);
            }
            $pdo->commit();
            $_SESSION['flash'] = ['type' => 'success', 'msg' => '게시글이 등록되었습니다.'];
            header("Location: post.php?id=$post_id");
            exit;
        } catch (Exception $e) {
            $pdo->rollBack();
            $errors[] = '저장 중 오류가 발생했습니다.';
        }
    }
}

$page_title = '글쓰기';
include 'includes/header.php';
?>

<h2 class="page-title">글쓰기</h2>

<?php foreach ($errors as $e): ?>
    <div class="flash flash-error"><?= h($e) ?></div>
<?php endforeach; ?>

<form method="post" enctype="multipart/form-data" class="form-wide">
    <div class="form-group">
        <label>제목 *</label>
        <input type="text" name="title" value="<?= h($_POST['title'] ?? '') ?>" required autofocus>
    </div>
    <div class="form-group">
        <label>내용 *</label>
        <textarea name="content" required><?= h($_POST['content'] ?? '') ?></textarea>
    </div>

    <div class="form-group">
        <label>파일 첨부 <span class="text-muted">(최대 10MB, 여러 파일 선택 가능)</span></label>
        <input type="file" name="files[]" multiple
               accept=".jpg,.jpeg,.png,.gif,.pdf,.txt,.zip,.docx,.xlsx">
        <p class="hint">허용 형식: jpg, jpeg, png, gif, pdf, txt, zip, docx, xlsx</p>
    </div>

    <div class="mt-2 flex gap-1">
        <button type="submit" class="btn btn-primary">등록</button>
        <a href="index.php" class="btn btn-secondary">취소</a>
    </div>
</form>

<?php include 'includes/footer.php'; ?>

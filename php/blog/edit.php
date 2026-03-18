<?php
require_once 'config.php';
require_login();

$id  = (int)($_GET['id'] ?? 0);
$pdo = db();

$stmt = $pdo->prepare('SELECT * FROM posts WHERE id = ?');
$stmt->execute([$id]);
$post = $stmt->fetch();

if (!$post || $post['user_id'] !== $_SESSION['user_id']) {
    $_SESSION['flash'] = ['type' => 'error', 'msg' => '수정 권한이 없습니다.'];
    header('Location: index.php');
    exit;
}

// 기존 첨부파일
$stmt = $pdo->prepare('SELECT * FROM attachments WHERE post_id = ?');
$stmt->execute([$id]);
$attachments = $stmt->fetchAll();

$errors = [];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $title   = trim($_POST['title']   ?? '');
    $content = trim($_POST['content'] ?? '');

    if ($title === '')   $errors[] = '제목을 입력해주세요.';
    if ($content === '') $errors[] = '내용을 입력해주세요.';

    // 첨부파일 삭제 요청
    $delete_ids = array_map('intval', $_POST['delete_att'] ?? []);

    // 새 파일 업로드
    $uploaded = [];
    if (!empty($_FILES['files']['name'][0])) {
        foreach ($_FILES['files']['error'] as $i => $err) {
            if ($err === UPLOAD_ERR_NO_FILE) continue;
            if ($err !== UPLOAD_ERR_OK) { $errors[] = "파일 오류 (코드: $err)"; continue; }
            $original = $_FILES['files']['name'][$i];
            $size     = $_FILES['files']['size'][$i];
            $tmp      = $_FILES['files']['tmp_name'][$i];
            $mime     = $_FILES['files']['type'][$i];

            if ($size > MAX_FILE_SIZE) { $errors[] = "파일 크기 초과: $original"; continue; }
            $ext = strtolower(pathinfo($original, PATHINFO_EXTENSION));
            if (!in_array($ext, ALLOWED_EXTENSIONS, true)) { $errors[] = "허용되지 않는 파일 형식: $original"; continue; }
            $stored = uniqid('', true) . '.' . $ext;
            if (move_uploaded_file($tmp, UPLOAD_DIR . $stored)) {
                $uploaded[] = compact('stored', 'original', 'size', 'mime');
            }
        }
    }

    if (empty($errors)) {
        $pdo->beginTransaction();
        try {
            $pdo->prepare('UPDATE posts SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
                ->execute([$title, $content, $id]);

            // 첨부파일 삭제
            foreach ($delete_ids as $aid) {
                $r = $pdo->prepare('SELECT stored_name FROM attachments WHERE id = ? AND post_id = ?');
                $r->execute([$aid, $id]);
                $att = $r->fetch();
                if ($att) {
                    @unlink(UPLOAD_DIR . $att['stored_name']);
                    $pdo->prepare('DELETE FROM attachments WHERE id = ?')->execute([$aid]);
                }
            }

            // 새 첨부파일 저장
            foreach ($uploaded as $f) {
                $pdo->prepare('INSERT INTO attachments (post_id, stored_name, original_name, file_size, mime_type) VALUES (?, ?, ?, ?, ?)')
                    ->execute([$id, $f['stored'], $f['original'], $f['size'], $f['mime']]);
            }

            $pdo->commit();
            $_SESSION['flash'] = ['type' => 'success', 'msg' => '게시글이 수정되었습니다.'];
            header("Location: post.php?id=$id");
            exit;
        } catch (Exception $e) {
            $pdo->rollBack();
            $errors[] = '저장 중 오류가 발생했습니다.';
        }
    }
} else {
    // 기존 값으로 채우기
    $_POST['title']   = $post['title'];
    $_POST['content'] = $post['content'];
}

$page_title = '게시글 수정';
include 'includes/header.php';
?>

<h2 class="page-title">게시글 수정</h2>

<?php foreach ($errors as $e): ?>
    <div class="flash flash-error"><?= h($e) ?></div>
<?php endforeach; ?>

<form method="post" enctype="multipart/form-data" class="form-wide">
    <div class="form-group">
        <label>제목 *</label>
        <input type="text" name="title" value="<?= h($_POST['title'] ?? '') ?>" required>
    </div>
    <div class="form-group">
        <label>내용 *</label>
        <textarea name="content" required><?= h($_POST['content'] ?? '') ?></textarea>
    </div>

    <?php if ($attachments): ?>
    <div class="form-group">
        <label>기존 첨부파일 (삭제할 항목 체크)</label>
        <?php foreach ($attachments as $f): ?>
        <label style="display:flex;align-items:center;gap:.4rem;margin:.25rem 0;font-weight:normal">
            <input type="checkbox" name="delete_att[]" value="<?= $f['id'] ?>">
            <?= h($f['original_name']) ?>
            <span class="text-muted">(<?= format_size((int)$f['file_size']) ?>)</span>
        </label>
        <?php endforeach; ?>
    </div>
    <?php endif; ?>

    <div class="form-group">
        <label>새 파일 추가</label>
        <input type="file" name="files[]" multiple
               accept=".jpg,.jpeg,.png,.gif,.pdf,.txt,.zip,.docx,.xlsx">
    </div>

    <div class="mt-2 flex gap-1">
        <button type="submit" class="btn btn-primary">저장</button>
        <a href="post.php?id=<?= $id ?>" class="btn btn-secondary">취소</a>
    </div>
</form>

<?php include 'includes/footer.php'; ?>

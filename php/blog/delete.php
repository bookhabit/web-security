<?php
require_once 'config.php';
require_login();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: index.php');
    exit;
}

$id  = (int)($_POST['id'] ?? 0);
$pdo = db();

$stmt = $pdo->prepare('SELECT user_id FROM posts WHERE id = ?');
$stmt->execute([$id]);
$post = $stmt->fetch();

if (!$post || $post['user_id'] !== $_SESSION['user_id']) {
    $_SESSION['flash'] = ['type' => 'error', 'msg' => '삭제 권한이 없습니다.'];
    header('Location: index.php');
    exit;
}

// 첨부파일 물리 삭제
$stmt = $pdo->prepare('SELECT stored_name FROM attachments WHERE post_id = ?');
$stmt->execute([$id]);
foreach ($stmt->fetchAll() as $f) {
    @unlink(UPLOAD_DIR . $f['stored_name']);
}

// 게시글 삭제 (ON DELETE CASCADE 로 attachments, comments 자동 삭제)
$pdo->prepare('DELETE FROM posts WHERE id = ?')->execute([$id]);

$_SESSION['flash'] = ['type' => 'success', 'msg' => '게시글이 삭제되었습니다.'];
header('Location: index.php');
exit;

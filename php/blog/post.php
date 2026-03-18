<?php
require_once 'config.php';

$id  = (int)($_GET['id'] ?? 0);
$pdo = db();

$stmt = $pdo->prepare('SELECT p.*, u.username FROM posts p JOIN users u ON p.user_id = u.id WHERE p.id = ?');
$stmt->execute([$id]);
$post = $stmt->fetch();
if (!$post) {
    http_response_code(404);
    $_SESSION['flash'] = ['type' => 'error', 'msg' => '존재하지 않는 게시글입니다.'];
    header('Location: index.php');
    exit;
}

// 조회수 증가
$pdo->prepare('UPDATE posts SET views = views + 1 WHERE id = ?')->execute([$id]);
$post['views']++;

// 첨부파일
$stmt = $pdo->prepare('SELECT * FROM attachments WHERE post_id = ? ORDER BY id');
$stmt->execute([$id]);
$attachments = $stmt->fetchAll();

// 댓글 목록
$stmt = $pdo->prepare('SELECT c.*, u.username FROM comments c JOIN users u ON c.user_id = u.id WHERE c.post_id = ? ORDER BY c.created_at ASC');
$stmt->execute([$id]);
$comments = $stmt->fetchAll();

// 댓글 등록
$comment_error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['comment'])) {
    require_login();
    $content = trim($_POST['comment_content'] ?? '');
    if ($content === '') {
        $comment_error = '댓글 내용을 입력해주세요.';
    } else {
        $pdo->prepare('INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)')
            ->execute([$id, $_SESSION['user_id'], $content]);
        header("Location: post.php?id=$id#comments");
        exit;
    }
}

// 댓글 삭제
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['delete_comment'])) {
    require_login();
    $cid = (int)($_POST['comment_id'] ?? 0);
    $c = $pdo->prepare('SELECT user_id FROM comments WHERE id = ?');
    $c->execute([$cid]);
    $cm = $c->fetch();
    if ($cm && $cm['user_id'] === $_SESSION['user_id']) {
        $pdo->prepare('DELETE FROM comments WHERE id = ?')->execute([$cid]);
    }
    header("Location: post.php?id=$id#comments");
    exit;
}

$is_owner = is_logged_in() && $_SESSION['user_id'] === $post['user_id'];
$image_exts = ['jpg', 'jpeg', 'png', 'gif'];

$page_title = $post['title'];
include 'includes/header.php';
?>

<article class="post-detail">
    <h1><?= h($post['title']) ?></h1>
    <div class="meta">
        <span>✍️ <?= h($post['username']) ?></span> &nbsp;|&nbsp;
        <span>🕐 <?= h(substr($post['created_at'], 0, 16)) ?></span> &nbsp;|&nbsp;
        <span>👁 <?= h($post['views']) ?></span>
        <?php if ($post['updated_at'] !== $post['created_at']): ?>
            &nbsp;|&nbsp; <span>수정됨: <?= h(substr($post['updated_at'], 0, 16)) ?></span>
        <?php endif; ?>
    </div>

    <div class="post-content"><?= h($post['content']) ?></div>

    <?php if ($attachments): ?>
    <div class="attachments">
        <h3>📎 첨부파일 (<?= count($attachments) ?>)</h3>
        <ul class="file-list">
            <?php foreach ($attachments as $f):
                $ext = strtolower(pathinfo($f['original_name'], PATHINFO_EXTENSION));
                $icon = in_array($ext, $image_exts) ? '🖼️' : '📄';
            ?>
            <li class="file-item">
                <span class="file-icon"><?= $icon ?></span>
                <span class="file-name">
                    <a href="download.php?id=<?= $f['id'] ?>"><?= h($f['original_name']) ?></a>
                </span>
                <span class="file-size"><?= format_size((int)$f['file_size']) ?></span>
            </li>

            <?php if (in_array($ext, $image_exts)): ?>
            <li style="list-style:none; padding:.5rem 0;">
                <img src="download.php?id=<?= $f['id'] ?>&inline=1"
                     alt="<?= h($f['original_name']) ?>"
                     class="img-preview">
            </li>
            <?php endif; ?>
            <?php endforeach; ?>
        </ul>
    </div>
    <?php endif; ?>

    <?php if ($is_owner): ?>
    <div class="post-actions">
        <a href="edit.php?id=<?= $post['id'] ?>" class="btn btn-secondary btn-sm">수정</a>
        <form method="post" action="delete.php" style="display:inline"
              onsubmit="return confirm('정말 삭제하시겠습니까?')">
            <input type="hidden" name="id" value="<?= $post['id'] ?>">
            <button type="submit" class="btn btn-danger btn-sm">삭제</button>
        </form>
    </div>
    <?php endif; ?>
</article>

<!-- ── 댓글 ───────────────────────────────────── -->
<section class="comments" id="comments">
    <h3>💬 댓글 (<?= count($comments) ?>)</h3>

    <?php if ($comment_error): ?>
        <div class="flash flash-error"><?= h($comment_error) ?></div>
    <?php endif; ?>

    <?php foreach ($comments as $c): ?>
    <div class="comment-item">
        <div class="comment-meta">
            <strong><?= h($c['username']) ?></strong>
            &nbsp;<?= h(substr($c['created_at'], 0, 16)) ?>
            <?php if (is_logged_in() && $_SESSION['user_id'] === $c['user_id']): ?>
                <form method="post" style="display:inline; margin-left:.5rem">
                    <input type="hidden" name="delete_comment" value="1">
                    <input type="hidden" name="comment_id" value="<?= $c['id'] ?>">
                    <button type="submit" class="btn btn-danger btn-sm"
                            onclick="return confirm('댓글을 삭제할까요?')">삭제</button>
                </form>
            <?php endif; ?>
        </div>
        <div class="comment-content"><?= h($c['content']) ?></div>
    </div>
    <?php endforeach; ?>

    <?php if (is_logged_in()): ?>
    <form method="post" class="mt-2">
        <div class="form-group">
            <textarea name="comment_content" placeholder="댓글을 작성해주세요..." style="min-height:80px"></textarea>
        </div>
        <button type="submit" name="comment" class="btn btn-primary btn-sm">댓글 등록</button>
    </form>
    <?php else: ?>
        <p class="text-muted mt-1"><a href="login.php?redirect=post.php?id=<?= $id ?>">로그인</a> 후 댓글을 작성할 수 있습니다.</p>
    <?php endif; ?>
</section>

<div class="mt-2">
    <a href="index.php" class="btn btn-secondary btn-sm">← 목록</a>
</div>

<?php include 'includes/footer.php'; ?>

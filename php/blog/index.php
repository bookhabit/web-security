<?php
require_once 'config.php';

$page  = max(1, (int)($_GET['page'] ?? 1));
$search = trim($_GET['q'] ?? '');
$offset = ($page - 1) * POSTS_PER_PAGE;

$pdo = db();

if ($search !== '') {
    $like = '%' . $search . '%';
    $s = $pdo->prepare('SELECT COUNT(*) FROM posts WHERE title LIKE ? OR content LIKE ?');
    $s->execute([$like, $like]);
    $total = (int)$s->fetchColumn();

    $stmt = $pdo->prepare('
        SELECT p.*, u.username
        FROM posts p JOIN users u ON p.user_id = u.id
        WHERE p.title LIKE ? OR p.content LIKE ?
        ORDER BY p.created_at DESC
        LIMIT ? OFFSET ?
    ');
    $stmt->execute([$like, $like, POSTS_PER_PAGE, $offset]);
} else {
    $total = (int)$pdo->query('SELECT COUNT(*) FROM posts')->fetchColumn();
    $stmt  = $pdo->prepare('
        SELECT p.*, u.username
        FROM posts p JOIN users u ON p.user_id = u.id
        ORDER BY p.created_at DESC
        LIMIT ? OFFSET ?
    ');
    $stmt->execute([POSTS_PER_PAGE, $offset]);
}
$posts     = $stmt->fetchAll();
$total_pages = (int)ceil($total / POSTS_PER_PAGE);

// 각 게시글의 첨부파일 수 & 댓글 수
$post_ids = array_column($posts, 'id');
$att_counts = $comment_counts = [];
if ($post_ids) {
    $in = implode(',', array_fill(0, count($post_ids), '?'));
    $s = $pdo->prepare("SELECT post_id, COUNT(*) as cnt FROM attachments WHERE post_id IN ($in) GROUP BY post_id");
    $s->execute($post_ids);
    foreach ($s->fetchAll() as $r) $att_counts[$r['post_id']] = $r['cnt'];

    $s = $pdo->prepare("SELECT post_id, COUNT(*) as cnt FROM comments WHERE post_id IN ($in) GROUP BY post_id");
    $s->execute($post_ids);
    foreach ($s->fetchAll() as $r) $comment_counts[$r['post_id']] = $r['cnt'];
}

$page_title = '게시판';
include 'includes/header.php';
?>

<div class="flex justify-between align-center mt-1" style="margin-bottom:.8rem">
    <h2 class="page-title" style="margin-bottom:0">전체 게시글 <span class="text-muted" style="font-size:1rem">(<?= $total ?>)</span></h2>
    <?php if (is_logged_in()): ?>
        <a href="create.php" class="btn btn-primary btn-sm">+ 글쓰기</a>
    <?php endif; ?>
</div>

<form class="search-bar" method="get" action="index.php">
    <input type="text" name="q" value="<?= h($search) ?>" placeholder="제목 또는 내용 검색...">
    <button type="submit" class="btn btn-secondary btn-sm">검색</button>
    <?php if ($search): ?>
        <a href="index.php" class="btn btn-secondary btn-sm">초기화</a>
    <?php endif; ?>
</form>

<?php if (empty($posts)): ?>
    <p class="text-muted">게시글이 없습니다.</p>
<?php else: ?>
<ul class="post-list">
    <?php foreach ($posts as $post): ?>
    <li class="post-item">
        <div class="flex justify-between align-center">
            <a href="post.php?id=<?= $post['id'] ?>" class="post-title">
                <?= h($post['title']) ?>
                <?php if (!empty($att_counts[$post['id']])): ?>
                    <span class="badge">📎 <?= $att_counts[$post['id']] ?></span>
                <?php endif; ?>
            </a>
        </div>
        <div class="post-meta">
            <span>✍️ <?= h($post['username']) ?></span>
            <span>🕐 <?= h(substr($post['created_at'], 0, 16)) ?></span>
            <span>👁 <?= h($post['views']) ?></span>
            <?php if (!empty($comment_counts[$post['id']])): ?>
                <span>💬 <?= $comment_counts[$post['id']] ?></span>
            <?php endif; ?>
        </div>
    </li>
    <?php endforeach; ?>
</ul>

<?php if ($total_pages > 1): ?>
<div class="pagination">
    <?php for ($i = 1; $i <= $total_pages; $i++): ?>
        <?php if ($i === $page): ?>
            <span class="current"><?= $i ?></span>
        <?php else: ?>
            <a href="?page=<?= $i ?><?= $search ? '&q=' . urlencode($search) : '' ?>"><?= $i ?></a>
        <?php endif; ?>
    <?php endfor; ?>
</div>
<?php endif; ?>
<?php endif; ?>

<?php include 'includes/footer.php'; ?>

<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= isset($page_title) ? h($page_title) . ' - ' : '' ?>PHP Blog</title>
    <link rel="stylesheet" href="<?= $base_path ?? '' ?>assets/style.css">
</head>
<body>
<header class="site-header">
    <div class="container">
        <a href="<?= $base_path ?? '' ?>index.php" class="logo">📝 PHP Blog</a>
        <nav>
            <a href="<?= $base_path ?? '' ?>index.php">홈</a>
            <?php if (is_logged_in()): ?>
                <a href="<?= $base_path ?? '' ?>create.php">글쓰기</a>
                <span class="user-info">👤 <?= h(current_user()['username']) ?></span>
                <a href="<?= $base_path ?? '' ?>logout.php">로그아웃</a>
            <?php else: ?>
                <a href="<?= $base_path ?? '' ?>login.php">로그인</a>
                <a href="<?= $base_path ?? '' ?>register.php">회원가입</a>
            <?php endif; ?>
        </nav>
    </div>
</header>
<main class="container">
<?php if (!empty($_SESSION['flash'])): ?>
    <div class="flash flash-<?= h($_SESSION['flash']['type']) ?>">
        <?= h($_SESSION['flash']['msg']) ?>
    </div>
    <?php unset($_SESSION['flash']); ?>
<?php endif; ?>

<?php
require_once 'config.php';

if (is_logged_in()) {
    header('Location: index.php');
    exit;
}

$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = trim($_POST['username'] ?? '');
    $password = $_POST['password'] ?? '';

    if ($username === '' || $password === '') {
        $error = '아이디와 비밀번호를 입력해주세요.';
    } else {
        $stmt = db()->prepare('SELECT id, password FROM users WHERE username = ?');
        $stmt->execute([$username]);
        $user = $stmt->fetch();

        if ($user && password_verify($password, $user['password'])) {
            session_regenerate_id(true);
            $_SESSION['user_id']  = $user['id'];
            $_SESSION['username'] = $username;
            $_SESSION['flash'] = ['type' => 'success', 'msg' => '로그인 되었습니다.'];
            $redirect = $_GET['redirect'] ?? 'index.php';
            header('Location: ' . $redirect);
            exit;
        } else {
            $error = '아이디 또는 비밀번호가 올바르지 않습니다.';
        }
    }
}

$page_title = '로그인';
include 'includes/header.php';
?>

<div class="form-card">
    <h2>로그인</h2>

    <?php if ($error): ?>
        <div class="flash flash-error"><?= h($error) ?></div>
    <?php endif; ?>

    <form method="post">
        <div class="form-group">
            <label>사용자 이름</label>
            <input type="text" name="username" value="<?= h($_POST['username'] ?? '') ?>" required autofocus>
        </div>
        <div class="form-group">
            <label>비밀번호</label>
            <input type="password" name="password" required>
        </div>
        <div class="mt-2">
            <button type="submit" class="btn btn-primary">로그인</button>
            <a href="register.php" class="btn btn-secondary" style="margin-left:.5rem">회원가입</a>
        </div>
    </form>
</div>

<?php include 'includes/footer.php'; ?>

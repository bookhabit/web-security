<?php
require_once 'config.php';

if (is_logged_in()) {
    header('Location: index.php');
    exit;
}

$errors = [];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = trim($_POST['username'] ?? '');
    $email    = trim($_POST['email']    ?? '');
    $password = $_POST['password']      ?? '';
    $confirm  = $_POST['confirm']       ?? '';

    if (strlen($username) < 3 || strlen($username) > 30) {
        $errors[] = '사용자 이름은 3~30자여야 합니다.';
    }
    if (!preg_match('/^[a-zA-Z0-9_]+$/', $username)) {
        $errors[] = '사용자 이름은 영문, 숫자, _ 만 사용 가능합니다.';
    }
    if (strlen($password) < 6) {
        $errors[] = '비밀번호는 최소 6자여야 합니다.';
    }
    if ($password !== $confirm) {
        $errors[] = '비밀번호가 일치하지 않습니다.';
    }

    if (empty($errors)) {
        $pdo = db();
        $exists = $pdo->prepare('SELECT id FROM users WHERE username = ?');
        $exists->execute([$username]);
        if ($exists->fetch()) {
            $errors[] = '이미 사용 중인 사용자 이름입니다.';
        } else {
            $hash = password_hash($password, PASSWORD_BCRYPT);
            $stmt = $pdo->prepare('INSERT INTO users (username, password, email) VALUES (?, ?, ?)');
            $stmt->execute([$username, $hash, $email]);
            $_SESSION['flash'] = ['type' => 'success', 'msg' => '회원가입이 완료되었습니다. 로그인해주세요.'];
            header('Location: login.php');
            exit;
        }
    }
}

$page_title = '회원가입';
include 'includes/header.php';
?>

<div class="form-card">
    <h2>회원가입</h2>

    <?php foreach ($errors as $e): ?>
        <div class="flash flash-error"><?= h($e) ?></div>
    <?php endforeach; ?>

    <form method="post">
        <div class="form-group">
            <label>사용자 이름 *</label>
            <input type="text" name="username" value="<?= h($_POST['username'] ?? '') ?>" required>
            <p class="hint">영문, 숫자, _ 사용 가능 (3~30자)</p>
        </div>
        <div class="form-group">
            <label>이메일</label>
            <input type="email" name="email" value="<?= h($_POST['email'] ?? '') ?>">
        </div>
        <div class="form-group">
            <label>비밀번호 *</label>
            <input type="password" name="password" required>
        </div>
        <div class="form-group">
            <label>비밀번호 확인 *</label>
            <input type="password" name="confirm" required>
        </div>
        <div class="mt-2">
            <button type="submit" class="btn btn-primary">가입하기</button>
            <a href="login.php" class="btn btn-secondary" style="margin-left:.5rem">로그인</a>
        </div>
    </form>
</div>

<?php include 'includes/footer.php'; ?>

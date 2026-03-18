# PHP Blog — 학습용 프로젝트

PHP + SQLite로 구현한 블로그 웹 애플리케이션입니다.
웹 개발 학습 및 보안 취약점 분석·실습 목적으로 만들었습니다.

## 기능

| 기능 | 설명 |
|------|------|
| 회원가입/로그인/로그아웃 | 세션 기반 인증, bcrypt 해싱 |
| 게시글 CRUD | 작성/조회/수정/삭제, 페이지네이션, 검색 |
| 파일 업로드 | 다중 파일, 10MB 제한, 확장자 화이트리스트 |
| 파일 다운로드 | 강제 다운로드 & 이미지 인라인 표시 |
| 댓글 | 등록/삭제 |
| 조회수 | 게시글 조회 시 자동 증가 |

## 파일 구조

```
php/blog/
├── config.php          ← DB 연결, 헬퍼 함수
├── index.php           ← 게시글 목록 + 검색 + 페이지네이션
├── post.php            ← 게시글 상세 + 댓글
├── create.php          ← 게시글 작성 + 파일 업로드
├── edit.php            ← 게시글 수정
├── delete.php          ← 게시글 삭제
├── register.php        ← 회원가입
├── login.php           ← 로그인
├── logout.php          ← 로그아웃
├── download.php        ← 파일 다운로드/인라인
├── includes/
│   ├── header.php
│   └── footer.php
├── assets/
│   └── style.css
├── uploads/            ← 업로드 파일 저장 위치
└── blog.db             ← SQLite DB (최초 실행 시 자동 생성)
```

## 실행 방법

```bash
# PHP 내장 웹서버로 실행 (PHP 7.4+)
cd php/blog
php -S localhost:8080

# 브라우저에서 접속
open http://localhost:8080
```

## 기술 스택

- **언어**: PHP 7.4+
- **DB**: SQLite 3 (PDO)
- **인증**: PHP Session + `password_hash()` (bcrypt)
- **프론트**: 순수 HTML/CSS (프레임워크 없음)

## 보안 포인트 (추후 분석용)

현재 구현에서 공부해볼 수 있는 보안 주제:

- [ ] SQL Injection — PDO Prepared Statement로 방어
- [ ] XSS — `htmlspecialchars()` 적용 여부 확인
- [ ] CSRF — 폼에 토큰이 없음 (취약점 실습 가능)
- [ ] 파일 업로드 — 확장자 화이트리스트만 적용 (MIME 스푸핑 가능?)
- [ ] 경로 조작 — download.php의 파일 경로 처리
- [ ] 세션 고정 — `session_regenerate_id()` 적용 여부
- [ ] 무차별 대입 — 로그인 시도 횟수 제한 없음

# 할 일 목록 앱 — 설계 계획

## 목표

사용자가 할 일을 추가/완료/삭제할 수 있는 앱.

## 기술 스택

- Node.js + Express
- SQLite (로컬 파일 DB)
- React (프론트엔드)

## API

```
POST   /todos          할 일 추가
GET    /todos          목록 조회
PATCH  /todos/:id      완료 처리
DELETE /todos/:id      삭제
```

## 구현 계획

1. `todos` 테이블 생성 (id, title, done, created_at)
2. CRUD 엔드포인트 4개 구현
3. 간단한 React 프론트엔드

## 팀

개발자 1명, 예상 사용자 2~3명 (개인 프로젝트)

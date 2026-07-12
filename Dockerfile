# 1단계: Base 이미지 설정 및 pnpm 활성화
FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# 2단계: 소스 빌드 단계
FROM base AS builder
WORKDIR /app

# 워크스페이스 종속성 파일들 복사
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY frontend/package.json ./frontend/

# 의존성 설치
RUN pnpm install --frozen-lockfile

# 소스코드 전체 복사
COPY . .

# 프론트엔드 빌드 (frontend/dist 생성) 및 백엔드 빌드 (dist/index.js 생성)
RUN pnpm --filter frontend build
RUN pnpm build

# 3단계: 런타임 서빙 단계
FROM base AS runner
WORKDIR /app

# 빌드 결과물 복사
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/frontend/dist ./frontend/dist
COPY --from=builder /app/package.json /app/pnpm-lock.yaml ./

# 프로덕션 의존성만 설치
RUN pnpm install --prod --frozen-lockfile

# 포트 노출
EXPOSE 3000

# 컨테이너 내 웹 UI 서버 구동
CMD ["node", "dist/index.js", "ui", "--port", "3000"]

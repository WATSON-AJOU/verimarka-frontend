# 사용자 프론트엔드

로컬 기본 주소: `http://127.0.0.1:5173/`

## 로컬 실행

### 1. 의존성 설치
```bash
cd /Users/emfpdlzj/Desktop/verimarka/verimarka-FRONTEND/verimarka-frontend
npm install
```

### 2. 환경변수 확인
로컬 백엔드를 함께 띄우는 경우 API 주소는 보통 아래 값을 사용합니다.

```bash
VITE_API_BASE_URL=http://127.0.0.1:8000
```

필요하면 프로젝트 루트에 `.env.local`을 만들고 값을 넣습니다.

```bash
VITE_APP_NAME=VeriMarka
VITE_API_BASE_URL=http://127.0.0.1:8000
VITE_GOOGLE_REDIRECT_URI=http://127.0.0.1:5173/auth/google/callback
VITE_KAKAO_REDIRECT_URI=http://127.0.0.1:5173/auth/kakao/callback
VITE_APPLE_REDIRECT_URI=http://127.0.0.1:5173/auth/apple/callback
```

지갑 연결 QR을 테스트하려면 WalletConnect project id도 필요합니다.

```bash
VITE_WALLETCONNECT_PROJECT_ID=...
```

### 3. 개발 서버 실행
```bash
npm run dev -- --host 127.0.0.1 --port 5173
```

브라우저에서 `http://127.0.0.1:5173/`로 접속합니다.

### 4. 빌드 확인
```bash
npm run build
```

## 백엔드와 같이 실행
백엔드는 별도 터미널에서 먼저 실행합니다.

```bash
cd /Users/emfpdlzj/Desktop/verimarka/verimarka-BACKEND
USE_FAKE_REDIS=1 USE_FAKE_CELERY=1 DJANGO_SETTINGS_MODULE=config.settings.dev .venv/bin/python manage.py runserver 127.0.0.1:8000
```

실제 Redis/Celery 기반 기능까지 확인하려면 백엔드 README의 Docker Compose 실행 방식을 사용합니다.

## CI/CD
GitHub Actions 워크플로는 `main` 브랜치 push 또는 수동 실행 시 사용자 프론트를 빌드한 뒤, 서버의 사용자 정적 경로로 `dist` 를 동기화합니다.

워크플로 파일:
`/.github/workflows/deploy-frontend.yml`

필수 GitHub Secrets:
- `VITE_APP_NAME`
- `VITE_API_BASE_URL`
- `VITE_GOOGLE_REDIRECT_URI`
- `FRONTEND_DEPLOY_HOST`
- `FRONTEND_DEPLOY_PORT`
- `FRONTEND_DEPLOY_USER`
- `FRONTEND_DEPLOY_SSH_KEY`
- `FRONTEND_DEPLOY_PATH`

선택 GitHub Secret:
- `FRONTEND_RELOAD_COMMAND`
- `FRONTEND_HEALTHCHECK_URL`
- `FRONTEND_HEALTHCHECK_RETRIES`
- `FRONTEND_HEALTHCHECK_INTERVAL_SECONDS`

권장 운영값:
- `FRONTEND_DEPLOY_PATH`: nginx가 바라보는 사용자 프론트 정적 경로
  `/usr/share/nginx/html` 를 직접 쓰는 구조가 아니라면, 실제 서버에서 bind mount 원본인 `../verimarka-FRONTEND/verimarka-frontend/dist` 경로를 넣어야 합니다.
- `FRONTEND_RELOAD_COMMAND`:
  ```zsh
  cd /opt/verimarka/verimarka-BACKEND && docker compose -f docker-compose.prod.yml exec -T verimarka-nginx nginx -s reload
  ```
- `FRONTEND_HEALTHCHECK_URL`: 배포 직후 사용자 프론트 확인용 URL
  예: `https://verimarka.com/health/`
- `FRONTEND_HEALTHCHECK_RETRIES`: 헬스체크 재시도 횟수
- `FRONTEND_HEALTHCHECK_INTERVAL_SECONDS`: 헬스체크 재시도 간격(초)

현재 운영 compose 기준으로 nginx는 사용자 프론트를 아래 경로에서 읽습니다.
`../verimarka-FRONTEND/verimarka-frontend/dist:/usr/share/nginx/html:ro`

배포 중 `rsync`, nginx reload, `FRONTEND_HEALTHCHECK_URL` 검증 중 하나라도 실패하면 직전 `dist` 백업본으로 자동 복원합니다.

기본 헬스 엔드포인트는 `GET /health/` 입니다.

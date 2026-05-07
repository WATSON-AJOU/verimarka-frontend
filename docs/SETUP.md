# Verimarka Frontend Setup

이 문서는 사용자 프론트엔드 로컬 실행 방법을 정리합니다. 기존 상세 인수인계 내용은 [HANDOFF.md](../HANDOFF.md)와 [verimarka-frontend/HANDOFF.md](../verimarka-frontend/HANDOFF.md)를 참고하세요.

## 실행 주소

- Backend: `http://127.0.0.1:8000/`
- User Frontend: `http://127.0.0.1:5173/`
- Admin Frontend: `http://127.0.0.1:4173/`

## 1. 백엔드 실행

사용자 프론트 개발 서버는 `/api` 요청을 `http://127.0.0.1:8000` 백엔드로 프록시합니다. 먼저 백엔드를 실행합니다.

```bash
cd /Users/emfpdlzj/Desktop/verimarka/verimarka-BACKEND
source .venv/bin/activate
USE_FAKE_REDIS=1 USE_FAKE_CELERY=1 DJANGO_SETTINGS_MODULE=config.settings.dev python manage.py runserver 127.0.0.1:8000
```

실제 AI 분석, 저작물 검증, 워터마크 삽입 작업까지 확인하려면 백엔드의 Redis와 Celery worker도 함께 실행해야 합니다.

## 2. 의존성 설치

```bash
cd /Users/emfpdlzj/Desktop/verimarka/verimarka-FRONTEND/verimarka-frontend
npm install
```

## 3. 환경변수

로컬 API 호출은 Vite proxy를 사용하므로 `VITE_API_BASE_URL`을 생략할 수 있습니다. OAuth 로그인을 테스트할 때는 `verimarka-frontend/.env.local`에 값을 설정합니다.

```bash
VITE_APP_NAME=VeriMarka
VITE_GOOGLE_CLIENT_ID=your-google-client-id
VITE_KAKAO_CLIENT_ID=your-kakao-client-id
VITE_GOOGLE_REDIRECT_URI=http://127.0.0.1:5173/auth/google/callback
VITE_KAKAO_REDIRECT_URI=http://127.0.0.1:5173/auth/kakao/callback
VITE_APPLE_REDIRECT_URI=http://127.0.0.1:5173/auth/apple/callback
VITE_WALLETCONNECT_PROJECT_ID=your-walletconnect-project-id
```

## 4. 개발 서버 실행

```bash
npm run dev -- --host 127.0.0.1 --port 5173
```

## 5. 빌드 확인

```bash
npm run build
```


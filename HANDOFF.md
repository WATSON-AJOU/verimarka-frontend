# WATSON-FRONTEND

사용자 프론트엔드 프로젝트입니다.

로컬 기본 주소: `http://127.0.0.1:5173/`

## 로컬 실행

### 1. 백엔드 실행
사용자 프론트 개발 서버는 `/api` 요청을 `http://127.0.0.1:8000` 백엔드로 프록시합니다.
먼저 백엔드를 별도 터미널에서 실행합니다.

Redis/Celery 없이 화면과 일반 API 연결만 확인하려면:

```bash
cd /Users/emfpdlzj/Desktop/verimarka/verimarka-BACKEND
source .venv/bin/activate
USE_FAKE_REDIS=1 USE_FAKE_CELERY=1 DJANGO_SETTINGS_MODULE=config.settings.dev python manage.py runserver 127.0.0.1:8000
```

실제 비동기 등록/검증/워터마크 작업까지 확인하려면 백엔드 README의 Docker Compose, Redis, Celery 실행 순서를 따릅니다.

### 2. 의존성 설치
```bash
cd /Users/emfpdlzj/Desktop/verimarka/verimarka-FRONTEND/verimarka-frontend
npm install
```

### 3. 환경변수 설정
로컬 API 호출은 Vite proxy를 사용하므로 `VITE_API_BASE_URL`을 생략해도 됩니다.
OAuth 로그인을 테스트할 때만 `verimarka-frontend/.env.local`에 클라이언트 ID를 넣습니다.

```bash
VITE_GOOGLE_CLIENT_ID=your-google-client-id
VITE_KAKAO_CLIENT_ID=your-kakao-client-id
```

백엔드 프록시를 쓰지 않고 API 주소를 직접 지정하려면:

```bash
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```

### 4. 개발 서버 실행
```bash
npm run dev
```

브라우저에서 `http://127.0.0.1:5173/`로 접속합니다.

포트를 명시해서 실행하려면:

```bash
npm run dev -- --host 127.0.0.1 --port 5173
```

### 5. 빌드 확인
```bash
npm run build
```

## 전체 로컬 실행 주소

- 백엔드: `http://127.0.0.1:8000/`
- 사용자 프론트엔드: `http://127.0.0.1:5173/`
- 관리자 프론트엔드: `http://127.0.0.1:4173/`

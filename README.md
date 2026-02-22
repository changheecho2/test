# 반주자 매칭 MVP

반주자(피아니스트)와 연주자를 연결하는 두-사이드 마켓플레이스 MVP입니다.

## 구조

- `apps/web`: Next.js(App Router) + TypeScript + Tailwind UI
- `functions`: Firebase Functions(Node 20)
- `firestore.rules`: 보안 규칙

## 요구 사항

- Node.js 20+
- Firebase 프로젝트
- Stripe 계정

## 로컬 실행

### Web

```
cd apps/web
npm install
npm run dev
```

### Functions

```
cd functions
npm install
```

Firebase CLI로 배포/에뮬레이터 실행을 진행하세요.

## 환경 변수

### Web (`apps/web/.env`)

`.env.example`를 참고하여 생성합니다.

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_FUNCTIONS_REGION` (기본: `asia-northeast3`)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

### Functions (`functions/.env`)

`.env.example`를 참고하여 생성합니다.

- `FUNCTIONS_REGION` (기본: `asia-northeast3`)
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_SUCCESS_URL`
- `STRIPE_CANCEL_URL`

`STRIPE_SUCCESS_URL`/`STRIPE_CANCEL_URL`는 결제 성공/취소 후 돌아갈 URL입니다.
예: `https://your-domain.com/dashboard`

## Firebase 설정

1. Firebase 프로젝트 생성
2. Authentication에서 이메일/비밀번호 로그인 활성화
3. Firestore 생성
4. 보안 규칙 배포

```
firebase deploy --only firestore:rules
```

## Stripe 설정

1. Stripe 대시보드에서 Webhook 엔드포인트 생성
2. 이벤트: `checkout.session.completed`
3. Webhook 시크릿을 `STRIPE_WEBHOOK_SECRET`로 등록
4. Functions 배포

```
firebase deploy --only functions
```

## Cloudflare Pages 배포

- 빌드 명령: `npm install && npm run build`
- 출력 디렉터리: `.next`
- 작업 디렉터리: `apps/web`

## 데이터 모델

- `accompanists/{uid}`
- `requests/{id}`
- `requests/{id}/private/contact`

## 샘플 반주자 생성(시드)

Firebase 콘솔에서 `accompanists` 컬렉션에 아래 형태로 문서를 생성합니다.

```
{
  "displayName": "김하은",
  "region": "서울",
  "specialties": ["성악", "바이올린"],
  "purposes": ["입시", "공연"],
  "priceMin": 70000,
  "priceMax": 150000,
  "bio": "성악 반주 10년 경력",
  "education": "서울예대",
  "experience": "오페라단 전속 반주",
  "portfolioLinks": ["https://example.com"],
  "availableSlots": "주말 오후",
  "isPublic": true
}
```

문서 ID는 반주자 UID와 동일해야 합니다(로그인 계정 UID).

## 스팸 방지(선택)

요청서 폼에 Cloudflare Turnstile을 추가하면 자동화 요청을 줄일 수 있습니다.

## 주의 사항

- 요청서는 Cloud Function `createRequest`로만 생성됩니다.
- 자유 입력 필드에서 연락처/외부 링크는 서버/클라이언트 모두 차단합니다.
- 결제 완료 후에만 요청자 이메일이 공개됩니다.

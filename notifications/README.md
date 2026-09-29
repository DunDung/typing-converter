# 구매 알림

한영타변환기 전용 Firebase 프로젝트 `typing-converter-rc`의 서울 리전에서 실행한다.
앱 코드는 바꾸지 않고 RevenueCat 웹훅으로 수신한다.

## 발송 조건

- RevenueCat 인증 헤더가 일치하는 POST 요청만 처리.
- 이 프로젝트의 iOS/Android 앱, `ad_free_lifetime`(Android 구매 옵션 `:buy` 포함)만 허용.
- `PRODUCTION`의 `NON_RENEWING_PURCHASE`이며 실제 결제 금액이 양수인 경우만 발송.
- `NOTIFY_FROM_MS` 이전 구매는 무시하여 기존 구매 복원으로 과거 매출을 새 구매처럼 알리지 않는다.
- 테스트 이벤트는 정상 응답만 반환하며 메일을 발송하지 않는다.
- 스토어와 거래 ID의 SHA-256으로 중복을 방지한다. 고객 이메일·익명 사용자 ID·원본 영수증은 저장하거나 메일로 보내지 않는다.

## 메일

기존 EmailJS 서비스 `service_2syktss`, 템플릿 `template_4nk0rnw`를 사용한다.
수신처는 EmailJS 템플릿의 기존 고정 주소이며 요청 데이터로 변경할 수 없다.
`emailjs-message.html`은 기존 의견 보내기의 `nickname`, `comment` 변수를 유지한다.
제목은 `[알림] {{nickname}}`, 구매 메일에는 스토어·현지 통화 결제 금액·한국 시각을 표시한다.
정산액은 별도이므로 결제 금액을 순수익으로 표시하지 않는다.

## 비밀 및 권한

- `REVENUECAT_WEBHOOK_SECRET`, `EMAILJS_PRIVATE_KEY`: Google Secret Manager에 저장하고 런타임 서비스 계정에 해당 비밀의 접근 권한만 부여한다.
- `purchase-notifier@typing-converter-rc.iam.gserviceaccount.com`: 이 전용 프로젝트의 Firestore 접근만 허용.
- Firestore 클라이언트 접근은 모두 거부한다. 앱에 Firebase SDK나 관리자 자격 증명을 넣지 않는다.
- 함수 최소 인스턴스 0, 최대 1. EmailJS 월 발송 한도는 기존 의견 메일과 공유한다.

## 오류와 재시도

RevenueCat은 실패 응답을 재시도한다. 이메일 제공자가 명확히 거절한 요청은 재시도할 수 있다.
동시 요청은 Firestore 트랜잭션으로 차단한다. 발송 후 DB 기록 실패 또는 타임아웃처럼
메일 수락 여부가 불명확하면 재발송 대신 `needs_reconciliation` / `uncertain`으로 남긴다.
이 경우 함수 오류 로그와 EmailJS 발송 이력을 확인하고, 실제 발송 여부를 확인한 뒤
해당 기록을 `sent` 또는 `failed`로 수정하고 RevenueCat에서 재시도한다.
메일 제공자가 멱등 키를 지원하지 않으므로 불명확한 응답까지 정확히 한 번 발송을 보장하지 않는다.

## 검증

`cd functions && npm ci && npm test`

실제 발송 테스트는 사용자 승인 후 고정 수신처에 1통만 보낸다.
## 운영 연결 (2026-09-29)

- 함수: `https://asia-northeast3-typing-converter-rc.cloudfunctions.net/purchaseNotification`
- RevenueCat 프로젝트 `316a9dc3`, 웹훅 `whintgr2e24d3a52f` (`광고 제거 구매 이메일 알림`). Production only / Non renewing purchase / 이 프로젝트의 모든 앱.
- 기존 고정 수신처: `ebseud6135@gmail.com`.
- EmailJS 비브라우저 API 허용, 비밀 키 필수 옵션 유지. 템플릿 수정 저장 완료.
- RevenueCat 콘솔 테스트: HTTP 200 `Test accepted; no email sent` 확인.
- 실제 함수 검증: 무인증 401, 인증 TEST 200, Sandbox 무시 200, Firestore의 발송 완료 거래 중복 처리 200. QA 기록은 `qa: true`로 남겼으며 실제 결제/발송이 아니다.
- 승인된 테스트 메일 1통: EmailJS 발송 이력 2026-09-29 09:14:19 KST `OK` 확인. 이 발송은 EmailJS 연결 검증이며 실제 유료 구매부터 전체 흐름을 검증한 것은 아니다.
- Node.js 22 자동 테스트 7개 통과. 앱 재빌드/스토어 재심사 불필요.
- Artifact Registry 함수 빌드 산출물 보관 기간 7일.

## 재배포

Node.js 22에서 `cd notifications && firebase deploy --only functions:purchase-notifications --project typing-converter-rc`.
Firestore 규칙 변경 시 `firebase deploy --only firestore:rules --project typing-converter-rc`.
환경 파일 `functions/.env.typing-converter-rc`의 `NOTIFY_FROM_MS`는 최초 연결 시점을 유지한다.
비밀 값은 Secret Manager에서 관리하며 저장소나 로그에 출력하지 않는다.

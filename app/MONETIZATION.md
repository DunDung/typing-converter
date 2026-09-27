# 광고와 광고 제거 구매

## 화면과 노출 정책

- 앱 상단 오른쪽 **광고 제거** 버튼에서 구매 창을 연다. 별도 설정 페이지를 만들지 않는다.
- 창에는 스토어에서 조회한 현지 가격, 일회성 구매 안내, 구매 복원, 닫기를 표시한다. 구매 후에는 **광고 없이 이용 중**으로 바뀐다.
- 광고 제거 권한은 RevenueCat의 `ad_free` entitlement로 판단한다. 웹 페이지나 로컬 boolean으로 구매 권한을 부여하지 않는다.
- 구매/복원 성공 시 앱 오픈 광고와 배너가 모두 제거된다. SDK 고객 정보 업데이트에 따라 권한 변경도 반영한다.
- 확인 전/네트워크 실패로 구매 상태를 모르면 광고를 보류한다. RevenueCat의 캐시·스토어 검증을 사용한다.
- 앱 오픈 광고는 **콜드 스타트의 시작 화면에서** 요청·표시한다. WebView와 병렬로 준비하고 광고 요청 후 최대 5초, 구매 상태 확인·SDK 준비를 포함해 전체 최대 12초 대기한다. 최초 실행과 재실행 모두 요청하며 시간 간격·하루 횟수 제한은 없다. 노출 기록은 진단용으로만 보관한다.
- 광고가 늦게 도착했거나 앱이 백그라운드이거나 구매 창을 열었으면 건너뛴다. 복귀·복사·비우기·종료에 광고를 추가하지 않는다. WebView가 먼저 준비되어도 시작 화면을 유지해 광고가 준비되면 표시한다. 5초 내 준비되지 않거나 광고 오류가 발생하면 즉시 콘텐츠로 진입하며 뒤늦은 광고는 표시하지 않는다. 광고가 열린 뒤에는 닫을 때까지 시작 화면을 유지한다.
- 하단 적응형 배너는 콘텐츠 표시 후 유지하되 키보드/구매 창/백그라운드에서는 숨긴다. 키보드마다 광고 컴포넌트를 새로 만들지 않는다. 배너 로딩 실패 시 빈 영역을 남기지 않으며, 활성 상태에서 30초 간격으로 최대 2회 재시도한다. 개발 빌드에서는 오류 표시와 수동 재시도를 제공한다.
- Google UMP 동의 상태가 광고 요청을 허용할 때만 광고 SDK를 초기화한다. 필요한 지역에서는 구매 창 하단에 광고 개인정보 설정 진입점을 제공한다. 기존 비개인화 광고 요청을 유지한다.

## 활성화에 필요한 콘솔 설정

2026-09-27 AdMob 앱 오픈 광고 단위를 생성하고 EAS production 환경에 반영했다. 두 플랫폼 모두 광고 단위 및 앱 수준의 빈도 제한이 없다. 두 플랫폼 상품과 RevenueCat 공개 SDK 키, 구매 검증 자격 증명 및 스토어 알림 연결을 완료했다. 실제 결제 검증과 앱 출시는 미완료다.

- Android: `ca-app-pub-1298150935322847/7616897370`
- iOS: `ca-app-pub-1298150935322847/5991066920`

1. **AdMob:** Android/iOS 각각 앱 오픈 광고 단위를 만든다. 기존 전면 광고 ID를 재사용하지 않는다. 콘솔의 광고 단위 및 앱 수준 빈도 제한을 사용하지 않는다. UMP에 필요한 개인정보 메시지도 구성한다.
2. **Google Play Console:** `com.typing_converter` 앱에 광고 제거용 일회성 상품을 만들고 활성화한다. 이 상품은 소모하지 않는 구매로 운영한다. 가격은 콘솔에서 결정한다.
3. **App Store Connect:** `com.typingconverter` 앱에 Non-Consumable 상품을 만들고 가격·판매 지역·심사 정보를 등록한다. Xcode와 Apple 개발자 설정의 In-App Purchase capability를 확인한다.
4. **RevenueCat:** 두 스토어 앱을 프로젝트에 연결하고 구매 검증용 스토어 자격 증명을 등록한다. 각 스토어 상품을 가져와 `ad_free` entitlement에 연결한다. 코드는 상품 ID로 직접 조회하므로 Offering은 필수가 아니다. 환불·구매 변경 추적을 위한 스토어 알림 연동도 구성한다. 별도 서비스이므로 사용량별 요금과 개인정보 처리 내용을 확인한다.
5. `.env.example`을 참고해 로컬 `app/.env`와 EAS의 해당 빌드 환경에 공개 SDK 키·상품 ID·앱 오픈 광고 ID를 넣는다. RevenueCat 비밀 키, Play 서비스 계정 JSON, Apple 비밀 키는 앱이나 Git에 넣지 않는다.
6. 새 서비스 연동에 맞춰 개인정보처리방침 및 스토어 데이터 공개 내용을 갱신한다. 구매는 같은 스토어 계정에서 복원하며, 앱 자체 계정이 없으므로 Android ↔ iOS 구매 공유는 제공하지 않는다.

환경 변수는 `src/monetization/config.js`에서 읽는다. 변경 후 새 네이티브 빌드가 필요하다. 설정이 없으면 상품 구매 버튼을 비활성화하고 준비 중 안내를 표시한다. production EAS 빌드는 `eas-build-post-install` 검사에서 필요한 플랫폼 설정이 없거나 Google 테스트 광고 ID이면 실패한다. 이 검사는 값의 존재와 형태를 확인하며 실제 스토어 상품 상태를 검증하지는 않는다.

## 웹 변경 반영

`frontend`에서 `npm run build`하면 GitHub Pages가 사용하는 `docs` 디렉터리가 갱신된다. 앱은 원격 페이지를 읽으므로 **웹 변경 배포와 네이티브 앱 출시가 각각 필요**하다. `?native=1`은 웹 제목 중복 표시를 막는 레이아웃 플래그일 뿐 결제 권한과 무관하다. 웹 방문자에게는 스토어 구매 버튼을 표시하지 않는다.

의견 보내기는 새 앱의 네이티브 헤더에서 제공한다. 웹이 `converter-ready` 메시지에 `feedback-v1` 지원을 알리고, 앱이 `feedback-header-ready`로 응답한 뒤에만 웹 하단 버튼을 숨긴다. 상단 버튼은 `open-feedback` 이벤트로 기존 웹 모달을 연다. 구버전 앱·일반 웹에서는 하단 텍스트 버튼을 유지하며, 새 앱이 이전 웹을 읽으면 상단 의견 버튼을 표시하지 않는다.

## 검증

```sh
cd app
npm test
npx expo install --check
npx expo export --platform android --output-dir /tmp/typing-converter-export
cd android
./gradlew :app:bundleRelease
```

로컬 AAB는 debug 키를 사용하는 빌드 검증용이다. 실제 결제 검증은 Play 내부 테스트 배포/라이선스 테스터와 iOS StoreKit Sandbox에서 진행한다.

출시 전 아래 시나리오를 확인한다.

- 신규 무료 사용자: 첫 실행부터 앱 오픈 광고 요청, 닫힌 뒤 배너 표시.
- 이후 실행: 로딩 중에 준비된 경우만 표시. 로딩 완료 후 늦게 로드/복사/키보드 입력/백그라운드 복귀 때는 표시 없음.
- 짧은 간격 재실행 및 하루 2회 노출 이후에도 새 콜드 스타트에서 광고 요청.
- 구매 완료: 두 광고 모두 즉시 제거. 앱 재시작/같은 스토어 계정 재설치 후 구매 복원.
- 구매 취소/결제 보류/오류: 광고 제거 권한을 잘못 부여하지 않음. 중복 탭으로 결제 중복 실행 없음.
- 구매자 오프라인 및 환불: SDK가 제공하는 권한/캐시를 따르고 구매 상태 확인 실패 시 광고 보류. 실제 환불 반영 지연도 확인.
- 스토어 가격·상품 설명·권한 연결 일치. 실상품으로 청구하는 테스트는 사용자가 직접 수행.

자동화 테스트는 SDK를 대체한 구매/광고 상태 흐름 검증이며, 실제 광고 노출 및 스토어 결제 완료를 증명하지 않는다.

## 공식 참고

- [앱 오픈 광고 구현](https://docs.page/invertase/react-native-google-mobile-ads/displaying-ads)
- [Google 앱 오픈 광고 가이드](https://support.google.com/admob/answer/9341964)
- [RevenueCat Expo 설정](https://www.revenuecat.com/docs/getting-started/installation/expo)
- [구매 복원](https://www.revenuecat.com/docs/getting-started/restoring-purchases)

## 2026-09-27 출시 진행 상태

- 완료: Android/iOS 앱 오픈 광고 단위 생성, 콘솔 하루 2회 제한, production EAS 광고 ID 지정.
- 완료: 웹 개선 커밋 `98f1a9c` GitHub Pages 배포 성공. 실제 주소의 `app.486d8ab5.js` 반영 확인.
- 완료: iOS 시뮬레이터 입력/복사/키보드/상단 의견 창, 테스트 배너 확인. 자동화 테스트 23개 통과.
- 가격 확정: Android/iOS 한국 판매 가격 일회성 1,900원 (2026-09-27 사용자 승인).
- 완료: App Store Connect 비소모품 `ad_free_lifetime` (Apple ID `6816602725`) 생성. 한국 기준 가격 1,900원, 나머지 지역 자동 환산, 기본 전체 판매 지역 및 한국어 표시 이름/설명 저장. 아직 제출 준비 중이며 첫 상품은 새 앱 버전과 함께 심사해야 한다.
- 완료: RevenueCat 프로젝트 `316a9dc3`, iOS 앱 `appb0f13c3fd3` 생성. 사용자 승인 후 별도 인앱 구매 P8 키를 등록하고 `Valid credentials` 확인. 실상품 `prode210646fce`를 `ad_free` entitlement에 연결했고 production EAS에 공개 iOS SDK 키/상품 ID 반영. 비밀 키는 저장소나 앱에 넣지 않았다.
- 완료: RevenueCat 이메일 인증 및 Android 앱 항목 `app4d8385151b` (`com.typing_converter`) 생성. Android 서비스 계정 JSON도 등록했으며 상세 검증 상태는 아래 후속 항목 참조.
- 참고: 온보딩의 Test Store 상품은 실스토어 상품이 아니다. 실상품은 수동으로 연결했으며 App Store Connect API 자동 가져오기/판매 상태 조회 키는 미등록이다. 앱은 상품 ID 직접 조회를 사용하므로 Offering 연결은 필수가 아니다.
- 완료: iOS production 빌드 `f010c817-3b28-4744-959b-ac801fcd8272` 성공, EAS 제출 `34cb03eb-253f-487f-87fa-b6a8a10eb01f`로 App Store Connect 업로드 완료. TestFlight에서 26.9.1 (1) 처리 완료 및 기존 Team (Expo) 그룹 연결 확인. 앱 심사 제출은 아직 하지 않음.
- 완료: Android production 빌드 `6a18678e-387c-49fa-aa65-3b4bf09e3b8f` 성공. EAS 기존 업로드 서명키 사용. Play 내부 테스트에 14 (26.9.1), target SDK 36 번들 업로드 및 출시 완료. 한영타변환기 전용 내부 테스터 목록(본인 계정 1명)을 연결하고 트랙 활성 확인. 프로덕션 심사 제출은 아직 하지 않음.
- 완료: iOS 프로덕션/Sandbox 서버 알림을 RevenueCat 해당 앱 URL에 연결. 실제 iOS 상품을 default Offering의 lifetime 패키지에도 연결.
- 완료: 웹 커밋 `078c213` 배포. 의견 전송 성공/실패 처리, 앱 전용 화면의 네이버 분석 비활성화, `https://dundung.github.io/typing-converter/privacy.html` 공개 확인. App Store 개인정보 URL 수정 및 실제 SDK·구매·문의 데이터 8개 항목 공개. 입력 문장·카드 정보는 수집하지 않음.
- 완료: AdMob 유럽 동의 메시지 ‘한영타변환기 · 유럽 광고 동의’를 해당 iOS/Android 2개 앱에만 게시. EEA/영국/스위스 대상, 동의 거절 활성화. 미국 규정 메시지는 미구성.
- 완료: 사용자 승인 후 전용 Google Cloud 프로젝트 및 서비스 계정 생성, API 활성화, Play 앱 권한 부여, RevenueCat JSON 등록. 구매 검증 자격 증명과 RTDN 연결 검증을 완료했으며 아래 후속 상태 참조.
- 대기: 실기기 TestFlight 상품 가격 확인 요청. iOS 시뮬레이터의 StoreKit 상품 조회는 빈 목록이라 실제 결제·복원 성공을 검증하지 못함. 모의 테스트 23개만 통과한 상태. 실제 결제·복원·환불 검증, 심사용 스크린샷, 양 스토어 심사 제출이 남음.

- 완료: Google Play 일회성 제품 `ad_free_lifetime`, 구매 옵션 `buy` 생성·활성화. 한국 KRW 1,900 및 173개 지역 자동 환산 가격 설정. 이전 결제 라이브러리 호환 옵션 활성, 다중 수량 구매 비활성. RevenueCat Android 실상품 `prod288ee64d71` 생성 및 Published 상태 확인. `ad_free` entitlement와 default Offering의 `$rc_lifetime` 패키지 연결 완료.
- 완료: Google Play 개인정보처리방침 URL을 공개 GitHub Pages 방침으로 변경하고, 데이터 보안 신고를 기존 ‘수집 없음’에서 광고 SDK/구매 내역/선택적 의견 전송을 포함한 8개 데이터 유형으로 수정·저장. 게시 개요에 검토 전송 대기 상태.
- 내부 테스트 참여 링크: https://play.google.com/apps/internaltest/4701714254390060366 (등록된 본인 Google 계정으로 참여).

## Google Cloud 연결 후속 상태

- 사용자 승인으로 `typing-converter-rc` 프로젝트(번호 `364579553627`) 생성 및 기존 홍준성 결제 계정 연결 완료.
- 사용자 API 약관 동의 후 Google Play Android Developer API, Google Play Developer Reporting API, Cloud Pub/Sub API 활성화 확인.
- `revenuecat-service-account@typing-converter-rc.iam.gserviceaccount.com` 생성. 전용 프로젝트에 처음 Pub/Sub Editor와 Monitoring Viewer를 부여했고, 2026-09-27 사용자 승인 후 Pub/Sub Editor를 Pub/Sub Admin으로 교체했다. Monitoring Viewer는 유지하며 다른 프로젝트 권한은 변경하지 않았다.
- Google Play에서 해당 서비스 계정 활성 확인. 한영타변환기 앱만 대상으로 앱 정보 조회/앱 품질 조회/재무 데이터 조회/주문 및 구독 관리 부여. 다른 앱·출시·관리자 권한은 부여하지 않음.
- 사용자가 저장한 서비스 계정 JSON을 RevenueCat Android 앱에 업로드·저장 완료. 비밀 키 내용은 저장소나 앱에 포함하지 않음.
- RevenueCat Android 상품 `prod288ee64d71` (`ad_free_lifetime`) Published / Non-consumable 확인. `ad_free` entitlement의 연결 상품 목록과 default Offering의 `$rc_lifetime`에 Play Store 상품 표시를 확인.
- 완료: RevenueCat Android 앱에서 `Valid credentials` 확인. 기존 Google Play 구매 검증 insufficient permissions 오류 해소. Play 앱 범위 권한은 그대로 유지했다. 상품 설명 저장 및 Cloud 권한 변경 이후 정상화되었으며 정확한 단일 원인은 확정하지 않는다.
- 완료: `projects/typing-converter-rc/topics/Play-Store-Notifications` 연결. Play Console에서 일회성 상품/무효화 알림을 포함한 RTDN 저장 및 테스트 발송. RevenueCat `Connected to Google`, 마지막 수신 `2026-09-27 07:25 UTC` 확인. 이는 알림 연결 확인이며 실제 결제·환불 테스트 완료를 의미하지 않는다.
- 출시 게이트: 실제 스토어 상품 조회·샌드박스 구매/복원 확인, iOS 인앱 구매 심사 스크린샷 및 최신 앱 스크린샷, 양 스토어 심사 제출은 아직 미완료.

## 2026-09-27 스토어 이미지 교체

- `marketing/store-2026-09/`에 실제 iOS 시뮬레이터 화면과 HTML/CSS 구성 원본, 생성 일러스트 및 최종 PNG 보관.
- App Store iPhone: 1290×2796 이미지 4장 업로드, 변환/양방향/복사/간편 사용 순으로 정렬 완료.
- Google Play 휴대전화: 1080×1920 이미지 4장 및 1024×500 대표 이미지 교체·저장 완료. 설명도 새 기능·광고 제거 구매·데이터 처리 범위에 맞춰 수정. 아직 검토 전송 전.
- 완료: 실제 iPad 화면 기반 App Store 13인치 이미지 2장 및 Play 7/10인치 태블릿 이미지 각 2장 교체·정렬·저장. Play의 새 이미지 7종에 AI 생성·수정 라벨 적용.
- 미완료: 실기기 상품 조회·구매/복원, iOS IAP 심사용 스크린샷, 양 스토어 심사 제출.


## 2026-09-27 시작 광고 수정본 테스트 배포

- 커밋 `5cd0581`: WebView 준비 여부와 시작 화면 종료를 분리. 시작 후 최대 3초 광고 대기, 실패/시간 초과 시 진입, 열린 광고 종료 후 진입. 첫 실행 제외·4시간 간격·하루 2회 제한 유지.
- 구매자/최근 노출/구매 상태 미확인/노출 실패/늦은 응답을 포함한 자동 테스트 30개 통과. 시뮬레이터 광고 서버 네트워크 오류로 실제 수정본 광고 노출은 미검증.
- iOS 26.9.1 (2): EAS `bda613bb-9c82-46e5-b24b-a538f1853049` 빌드 성공. 제출 `5ba52092-4729-47f8-8a4e-4b74b41628da` 업로드 성공. App Store Connect 처리 완료, 기존 Team (Expo) 내부 테스트 그룹 2명 연결 확인.
- Android 26.9.1 (15): EAS `feb1ff63-6029-4086-99f7-52c6cb754994` 빌드 성공. Play 내부 테스트 출시 2에서 '내부 테스터에게 제공됨' 확인. 지원 기기 감소 없음. R8 가독화 파일 미첨부 경고 1개, 차단 오류 없음.
- 사용자에게 내부 테스트 참여 링크 전달 완료. 구매/복원 실거래 및 스토어 정식 심사는 완료되지 않음. 기존 프로덕션 초안은 14번이므로 심사 전 수정본으로 교체해야 함.
- 한국 IAP 현재 가격 KRW 1,900 확인. 사용자 TestFlight 구매 버튼에는 USD 0.99 표시됨. RevenueCat 공식 문서의 TestFlight 통화 메타데이터 이슈와 일치하나 Apple 결제 확인창 통화는 미확인.


## 시작 광고 미노출 후속 수정 (iOS 3 / Android 16)

- 사용자 26.9.1 (2) 실기기 보고: 배너는 보이나 시작 광고 미노출. 해당 기기의 정확한 스킵 사유는 아직 수집하지 못함.
- 기존 코드에서 iOS 초기 inactive 상태가 시작 광고를 영구 취소하는 결함과 구매 상태 조회가 3초를 넘으면 광고 요청 자체가 생략되는 결함을 실패 테스트 2개로 재현.
- 초기/일시적 inactive에서는 로드한 광고를 보관하고 active 전환 시 표시. 실제 background 이동 시 취소. 광고 요청 이후 3초 대기하며 전체 시작 대기는 8초로 제한.
- 앱 제목 길게 누르기: 시작 광고의 요청/초기화/스킵/오류/노출 기록을 기기 내 진단 창으로 확인. 외부로 자동 전송하지 않음.
- 첫 실행 제외·4시간 간격·하루 2회 제한과 구매자 광고 제거는 유지. 실제 기기에서 새 수정본 광고 노출은 별도 검증 필요.

## 시작 광고 요청 제한 제거 (iOS 3 / Android 17)

- 첫 실행 제외, 4시간 간격 및 하루 2회 로컬 제한 제거. Android/iOS AdMob 광고 단위 제한도 해제.
- 초기 iOS inactive 및 느린 구매 조회 수정 포함. 광고 요청 후 최대 5초, 초기화 포함 전체 최대 12초 대기. 준비된 광고는 시작 화면에서 표시하고 닫힌 뒤 콘텐츠로 진입.
- 구매 상태 미확인·광고 제거 구매자·실제 백그라운드 전환·SDK 오류·시간 초과는 광고를 표시하지 않음. 광고 재고 부족은 앱에서 강제 해결할 수 없으며 기기 제목 길게 누르기 진단으로 원인 확인.
- 자동화 테스트 34개 통과. 실제 기기 광고 표시 및 새 빌드 배포는 진행 중이며 완료로 간주하지 않음.
- Android 16 중간 빌드는 취소됨. iOS EAS 월 무료 한도 소진으로 로컬 빌드를 위한 Xcode 업데이트 진행.
- 의견 보내기 실패는 EmailJS Gmail Invalid grant가 원인. 동일 계정 재인증 완료, 2026-09-27 17:35 실제 웹에서 승인된 테스트 1통 성공(OK). 앱/프론트 코드 변경 없이 복구.

## Android 17 내부 테스트 배포 완료

- 2026-09-27 17:56: Play 내부 테스트 출시 3에서 `17 (26.9.1) 시작 광고 수정`, 내부 테스터에게 제공됨 확인.
- EAS 빌드 `3228f71c-4955-42e3-8006-24417b860e4f` 성공, 커밋 `9c7ef71`. 지원 기기 감소 없음, R8 가독화 파일 미첨부 경고 1개만 표시.
- Android/iOS AdMob 앱 오픈 단위 모두 광고 단위/앱 수준 제한 없음 확인.
- 시뮬레이터 로그: 시작 299ms 광고 요청, 668ms SDK network-error. 새 로직의 실제 요청은 확인했으나 광고 표시 자체는 네트워크 오류로 미검증.
- iOS: Xcode 27.0 (27A266a) 업데이트 완료. 사용자 승인 후 새 라이선스 Agree 클릭. 시스템 관리자 인증은 사용자 직접 입력 대기. CocoaPods 1.17.0, Fastlane 2.240.1 준비 완료. iOS 3 빌드/업로드는 아직 미완료.

- 사용자 실기기 확인: Android 17 수정본에서 앱 오픈 광고 실제 노출 확인 완료. iOS는 필수 구성요소 설치 및 SDK 27 준비 완료 후 로컬 빌드 진행 중.

## iOS 3 로컬 빌드 및 업로드

- Xcode 27 대응: 라이브러리 리소스 번들의 최소 iOS 버전을 앱의 기존 최소 15.1로 정렬. 앱 지원 범위 변경 없음.
- Apple WWDR G3 중간 인증서 복구 후 기존 배포 인증서 검증 통과. `/tmp` 경로의 Metro 불일치를 피하기 위해 실제 사용자 캐시 경로에서 로컬 EAS 빌드.
- iOS 26.9.1 (3) 로컬 빌드 성공. IPA: `/private/tmp/typing-ios3-artifacts/build-1790512118291.ipa`.
- EAS 제출 `63c617fd-bd76-475f-af6c-a05e1aa23045`: App Store Connect 업로드 성공. TestFlight 처리 및 테스터 연결 확인 진행 중.

- TestFlight 완료 확인: iOS 26.9.1 (3), Apple 처리 완료. 기존 Team (Expo) 내부 그룹 테스터 2명 연결 및 새 테스트 내용 저장 완료. iOS 실기기 광고 노출은 사용자 확인 대기.

# 한영타변환기

Android 앱은 Expo SDK 54 / React Native 0.81을 사용하며, Google Play의 2026년 요구사항에 맞춰 `compileSdkVersion`과 `targetSdkVersion`을 36으로 설정합니다.

## 개발 및 네이티브 설정 갱신

Node.js 22.13 이상과 JDK 17을 권장합니다. 로컬 Android 빌드는 Android SDK 36과 `ANDROID_HOME` 설정이 필요합니다.

```sh
cd app
npm ci
npx expo install --check
npx expo prebuild --clean --no-install
```

이 저장소는 `android`와 `ios` 네이티브 프로젝트를 함께 관리합니다. `app.json`이나 네이티브 의존성을 바꾸면 prebuild 후 생성된 파일도 함께 반영해야 합니다. EAS Build는 이 폴더들이 있으면 설정을 자동 동기화하지 않으므로, Expo Doctor의 관련 경고는 동기화 여부를 직접 확인해야 합니다. iOS 개발 시에는 prebuild 후 `cd ios && pod install`도 실행합니다.

## Android 검증 및 출시

```sh
cd app
npx expo export --platform android --output-dir /tmp/typing-converter-export
cd android
./gradlew :app:bundleRelease
```

로컬 Gradle의 release 빌드는 현재 debug 키로 서명하므로 검증용입니다. Google Play 제출용 AAB는 기존 업로드 키를 사용하는 EAS production 빌드로 생성합니다.

```sh
cd app
npx eas-cli build --platform android --profile production
```

현재 버전은 `26.9.1` / `versionCode: 17`입니다. Play Console에 이미 사용한 코드가 있다면 그보다 큰 값으로 변경하고 다시 prebuild해야 합니다. 경고 해제에는 API 36을 대상으로 빌드한 새 AAB를 Play Console에 제출하고 출시하는 과정이 필요합니다.

출시 전 Android 16 기기에서 상태 표시줄·내비게이션 영역과 콘텐츠/광고가 겹치지 않는지, 키보드 입력·변환·뒤로가기 두 번 종료가 정상인지 확인합니다.

- [Google Play 대상 API 요구사항](https://support.google.com/googleplay/android-developer/answer/11926878?hl=ko)
- [Expo SDK 54 변경 사항](https://expo.dev/changelog/sdk-54)

## 광고 및 구매

앱 오픈 광고·배너와 일회성 광고 제거 구매의 동작, 필요한 콘솔 설정, 테스트 절차는 [광고 및 구매 설정](app/MONETIZATION.md)을 참고하세요. 실제 판매 활성화 전 AdMob·스토어·RevenueCat 설정이 필요합니다.

## Android dev client

Dev client는 출시 앱과 같은 `com.typing_converter` / **한영타변환기** 패키지를 사용합니다. 기존 출시 앱과 서명이 다르면 설치가 거부될 수 있습니다.

```sh
cd app/android
./gradlew :app:assembleDebug
```

APK: `app/android/app/build/outputs/apk/debug/app-debug.apk`.

최신 웹 UI는 집요한약알림과 같은 방식으로 Tailscale을 통해 확인합니다. Mac과 휴대폰 모두 같은 Tailscale 네트워크에 연결한 뒤 터미널 두 개에서 실행합니다.

```sh
# 첫 번째 터미널 (저장소 루트)
npm --prefix app run dev:web

# 두 번째 터미널 (저장소 루트)
npm --prefix app run dev-client
```

`dev-client` 명령은 `tailscale ip -4`로 Mac 주소를 읽어 Expo의 `REACT_NATIVE_PACKAGER_HOSTNAME`과 웹뷰의 `EXPO_PUBLIC_CONVERTER_URL`을 함께 설정합니다. 현재 Expo 주소는 `http://100.105.248.73:9000`, 프론트 주소는 `http://100.105.248.73:8082/?native=1`입니다. `App.js`의 개발용 기본 주소도 이 Tailscale 프론트를 사용하며 release는 GitHub Pages를 사용합니다.

휴대폰에서 **한영타변환기** dev client를 열고 Expo 주소에 연결합니다. 개발 서버가 켜져 있어야 하며, 같은 Wi-Fi일 필요는 없습니다. 테스트 광고를 사용하며 구매 설정이 없으면 구매 버튼은 비활성화됩니다. 실제 결제 검증은 적절한 서명과 스토어 설정을 갖춘 Play 내부 테스트 빌드에서 진행합니다.

웹 화면이 준비되면 `converter-ready` 메시지로 앱 로딩을 종료합니다. 15초간 응답이 없으면 연결 안내와 다시 시도를 표시합니다. 개발 화면에서는 외부 분석 스크립트를 불러오지 않습니다.

빌드한 dev client APK는 `typing-converter-dev-client-android-<version>-vc<versionCode>.apk` 이름으로 Google Drive 루트(`gdrive:`)에 업로드합니다. 집요한약알림 등 다른 앱의 APK는 유지합니다.

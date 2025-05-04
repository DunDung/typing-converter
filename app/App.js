import React, { useEffect } from "react";
import { BackHandler, Platform, StatusBar as RNStatusBar, ToastAndroid, View } from "react-native";
import { WebView } from "react-native-webview";
import { AdEventType, BannerAd, BannerAdSize, InterstitialAd, TestIds } from "react-native-google-mobile-ads";
import { StatusBar } from "expo-status-bar";

const IOS_BANNER_UNIT = "ca-app-pub-1298150935322847/2763811393";
const ANDROID_BANNER_UNIT = "ca-app-pub-1298150935322847/1973473906";
const IOS_INTERSTITIAL_UNIT = "ca-app-pub-1298150935322847/9093416025";
const ANDROID_INTERSTITIAL_UNIT = "ca-app-pub-1298150935322847/4054818123";

const bannerUnitId = __DEV__ ? TestIds.BANNER : Platform.OS === "ios" ? IOS_BANNER_UNIT : ANDROID_BANNER_UNIT;
const interstitialUnitId = __DEV__ ? TestIds.INTERSTITIAL : Platform.OS === "ios" ? IOS_INTERSTITIAL_UNIT : ANDROID_INTERSTITIAL_UNIT;

const toastWithDurationHandler = () => {
    ToastAndroid.show("'뒤로' 버튼을  한번 더 누르시면 종료됩니다.", ToastAndroid.SHORT);
};

export default function App() {
    let time = 0;

    useEffect(() => {
        // 👇 전면 광고 로드 및 표시
        const interstitial = InterstitialAd.createForAdRequest(interstitialUnitId, {
            requestNonPersonalizedAdsOnly: true,
        });

        const unsubscribe = interstitial.addAdEventListener(AdEventType.LOADED, () => {
            interstitial.show();
        });

        interstitial.load();

        // 👇 안드로이드 백버튼 이벤트 핸들러
        const backAction = () => {
            time += 1;
            toastWithDurationHandler();
            if (time === 1) {
                setTimeout(() => (time = 0), 800);
            } else if (time === 2) {
                BackHandler.exitApp();
                return false;
            }
            return true;
        };

        BackHandler.addEventListener("hardwareBackPress", backAction);

        return () => {
            BackHandler.removeEventListener("hardwareBackPress", backAction);
            unsubscribe(); // 전면광고 리스너 해제
        };
    }, []);

    return (
        <View style={{ flex: 1, paddingTop: Platform.OS === "android" ? RNStatusBar.currentHeight : 0 }}>
            <StatusBar style="auto" />
            <WebView source={{ uri: "https://dundung.github.io/typing-converter/" }} />
            <View style={{ height: "auto" }}>
                <BannerAd unitId={bannerUnitId} size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER} requestOptions={{ requestNonPersonalizedAdsOnly: true }} />
            </View>
        </View>
    );
}

import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    BackHandler,
    Keyboard,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    ToastAndroid,
    View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { BannerAd, BannerAdSize } from "react-native-google-mobile-ads";
import { StatusBar } from "expo-status-bar";
import { bannerAdId } from "./src/monetization/config";
import { useAdFreePurchase } from "./src/monetization/useAdFreePurchase";
import { useAds } from "./src/monetization/useAds";
import AdFreeModal from "./src/components/AdFreeModal";

const PAGE_URL = __DEV__
    ? process.env.EXPO_PUBLIC_CONVERTER_URL || "http://100.105.248.73:8082/?native=1"
    : "https://dundung.github.io/typing-converter/?native=1";

export default function App() {
    const [feedbackAvailable, setFeedbackAvailable] = useState(false);
    const [purchaseVisible, setPurchaseVisible] = useState(false);
    const [keyboardVisible, setKeyboardVisible] = useState(false);
    const [loading, setLoading] = useState(true);
    const [pageError, setPageError] = useState(false);
    const [bannerError, setBannerError] = useState(null);
    const [bannerAttempt, setBannerAttempt] = useState(0);
    const webView = useRef(null);
    const lastBack = useRef(0);
    const purchase = useAdFreePurchase();
    const ads = useAds({ ownership: purchase.ownership, purchaseBusy: purchase.busy || purchaseVisible });

    useEffect(() => {
        if (!bannerError || bannerAttempt >= 2 || !ads.showBanner || keyboardVisible) return;
        const timer = setTimeout(() => {
            setBannerError(null);
            setBannerAttempt((value) => value + 1);
        }, 30000);
        return () => clearTimeout(timer);
    }, [bannerError, bannerAttempt, ads.showBanner, keyboardVisible]);

    useEffect(() => {
        if (!loading) return;
        const timeout = setTimeout(() => {
            setLoading(false);
            setPageError(true);
        }, 15000);
        return () => clearTimeout(timeout);
    }, [loading]);

    useEffect(() => {
        const show = Keyboard.addListener(Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow", () =>
            setKeyboardVisible(true),
        );
        const hide = Keyboard.addListener(Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide", () =>
            setKeyboardVisible(false),
        );
        return () => {
            show.remove();
            hide.remove();
        };
    }, []);
    useEffect(() => {
        if (Platform.OS !== "android") return;
        const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
            if (ads.showing || purchase.busy) return true;
            if (purchaseVisible) {
                setPurchaseVisible(false);
                return true;
            }
            if (Date.now() - lastBack.current < 1500) {
                BackHandler.exitApp();
                return true;
            }
            lastBack.current = Date.now();
            ToastAndroid.show("뒤로 버튼을 한 번 더 누르면 종료됩니다.", ToastAndroid.SHORT);
            return true;
        });
        return () => subscription.remove();
    }, [ads.showing, purchase.busy, purchaseVisible]);

    const finishLoading = () => {
        setLoading(false);
    };
    return (
        <SafeAreaProvider>
            <SafeAreaView style={styles.page}>
                <StatusBar style="dark" />
                <View style={styles.header}>
                    <Text accessibilityRole="header" style={styles.title}>
                        한영타변환기
                    </Text>
                    <View style={styles.headerActions}>
                    {feedbackAvailable && (
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="의견 보내기"
                            disabled={loading || ads.startupPending || pageError || ads.showing}
                            style={styles.headerButton}
                            onPress={() => webView.current?.injectJavaScript(
                                'window.dispatchEvent(new CustomEvent("converter-native", {detail: {type: "open-feedback"}})); true;'
                            )}
                        >
                            <Text style={styles.feedbackText}>의견 보내기</Text>
                        </Pressable>
                    )}
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={purchase.ownership === "owned" ? "광고 제거 구매 정보" : "광고 제거 구매"}
                        disabled={ads.showing || ads.startupPending}
                        onPress={() => {
                            Keyboard.dismiss();
                            setPurchaseVisible(true);
                        }}
                        style={styles.headerButton}
                    >
                        <Text style={styles.purchaseText}>
                            {purchase.ownership === "owned" ? "광고 없이 이용 중" : "광고 제거"}
                        </Text>
                    </Pressable>
                    </View>
                </View>
                <View style={styles.content}>
                    <WebView
                        ref={webView}
                        source={{ uri: PAGE_URL }}
                        style={styles.webView}
                        onLoadStart={() => setFeedbackAvailable(false)}
                        onLoadEnd={finishLoading}
                        onMessage={(event) => {
                            if (event.nativeEvent.url?.split("?")[0] !== PAGE_URL.split("?")[0]) return;
                            try {
                                const message = JSON.parse(event.nativeEvent.data);
                                if (message.type === "converter-ready") {
                                    finishLoading();
                                    setPageError(false);
                                    const supportsFeedback = Array.isArray(message.capabilities) && message.capabilities.includes("feedback-v1");
                                    setFeedbackAvailable(supportsFeedback);
                                    if (supportsFeedback) webView.current?.injectJavaScript(
                                        'window.dispatchEvent(new CustomEvent("converter-native", {detail: {type: "feedback-header-ready"}})); true;'
                                    );
                                }
                            } catch { /* Ignore unrelated page messages. */ }
                        }}
                        onError={() => {
                            finishLoading();
                            setPageError(true);
                        }}
                        onHttpError={(event) => {
                            if (
                                event.nativeEvent.statusCode >= 400 &&
                                event.nativeEvent.url?.split("?")[0] === PAGE_URL.split("?")[0]
                            ) {
                                finishLoading();
                                setPageError(true);
                            }
                        }}
                    />
                    {(loading || ads.startupPending) && (
                        <View style={styles.loading} pointerEvents="auto">
                            <ActivityIndicator color="#334ec6" />
                            <Text style={styles.loadingText}>변환기를 불러오는 중이에요</Text>
                        </View>
                    )}
                    {pageError && !ads.startupPending && (
                        <View style={styles.loading}>
                            <Text style={styles.loadingText}>
                                {__DEV__
                                    ? "로컬 화면에 연결하지 못했어요. 휴대폰의 Tailscale 연결과 Mac의 개발 서버를 확인해 주세요."
                                    : "화면을 불러오지 못했어요. 인터넷 연결을 확인해 주세요."}
                            </Text>
                            {__DEV__ && <Text selectable style={styles.loadingText}>{PAGE_URL}</Text>}
                            <Pressable
                                accessibilityRole="button"
                                style={styles.purchaseButton}
                                onPress={() => {
                                    setPageError(false);
                                    setLoading(true);
                                    webView.current?.reload();
                                }}
                            >
                                <Text style={styles.purchaseText}>다시 시도</Text>
                            </Pressable>
                        </View>
                    )}
                </View>
                {ads.bannerEnabled && !ads.startupPending && !loading && !pageError && !bannerError && (
                    <View style={[styles.banner, (!ads.showBanner || keyboardVisible) && { display: "none" }]}>
                        <BannerAd
                            key={bannerAttempt}
                            unitId={bannerAdId}
                            size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
                            requestOptions={{ requestNonPersonalizedAdsOnly: true }}
                            onAdLoaded={() => console.info("[ads] banner loaded")}
                            onAdFailedToLoad={(error) => {
                                const message = `${error.code}: ${error.message}`;
                                console.warn("[ads] banner failed", message);
                                setBannerError(message);
                            }}
                        />
                    </View>
                )}
                {__DEV__ && purchase.ownership === "free" && !keyboardVisible && !purchaseVisible && (ads.error || bannerError) && (
                    <Pressable accessibilityRole="button" style={styles.adDiagnostic} onPress={() => {
                        setBannerError(null);
                        setBannerAttempt(0);
                        if (ads.error) ads.retry();
                    }}>
                        <Text style={styles.adDiagnosticText}>광고 테스트 오류 · 눌러서 재시도{ "\n" }{ads.error || bannerError}</Text>
                    </Pressable>
                )}
                <AdFreeModal
                    visible={purchaseVisible}
                    onClose={() => setPurchaseVisible(false)}
                    purchase={purchase}
                    privacyRequired={ads.privacyRequired}
                    onPrivacy={() =>
                        ads
                            .privacyOptions()
                            .catch(() => Alert.alert("설정을 불러오지 못했어요", "잠시 후 다시 시도해 주세요."))
                    }
                />
            </SafeAreaView>
        </SafeAreaProvider>
    );
}
const styles = StyleSheet.create({
    page: { flex: 1, backgroundColor: "#f7f8fc" },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: "white",
        borderBottomWidth: 1,
        borderBottomColor: "#e8ecf4",
    },
    headerActions: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end", flexShrink: 1 },
    headerButton: { paddingHorizontal: 8, paddingVertical: 14, minHeight: 48 },
    feedbackText: { color: "#475569", fontSize: 14, fontWeight: "600" },
    title: { fontSize: 20, fontWeight: "700", color: "#18243b", flexShrink: 1 },
    purchaseButton: { paddingHorizontal: 12, paddingVertical: 14, minHeight: 48 },
    purchaseText: { color: "#334ec6", fontSize: 14, fontWeight: "600" },
    content: { flex: 1 },
    webView: { backgroundColor: "#f7f8fc" },
    loading: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "#f7f8fc",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
    },
    loadingText: { marginVertical: 16, color: "#475569", fontSize: 15, textAlign: "center" },
    adDiagnostic: { padding: 8, backgroundColor: "#fff3df" },
    adDiagnosticText: { fontSize: 12, color: "#754b13" },
    banner: {
        borderTopWidth: 1,
        borderTopColor: "#e8ecf4",
        paddingTop: 8,
        alignItems: "center",
        backgroundColor: "white",
    },
});

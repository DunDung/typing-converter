import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import mobileAds, {
    AdsConsent,
    AdsConsentPrivacyOptionsRequirementStatus,
    AppOpenAd,
    AdEventType,
} from "react-native-google-mobile-ads";
import { openAdId } from "./config";
import { canShowOpenAd, recordOpenAd } from "./policy.mjs";

const HISTORY_KEY = "@typing-converter/open-ad-history-v1";

export function useAds({ ownership, purchaseBusy }) {
    const [ready, setReady] = useState(false);
    const [error, setError] = useState(null);
    const [retryCount, setRetryCount] = useState(0);
    const [active, setActive] = useState(AppState.currentState === "active");
    const [privacyRequired, setPrivacyRequired] = useState(false);
    const [showing, setShowing] = useState(false);
    const [historyLoaded, setHistoryLoaded] = useState(false);
    const [startupPending, setStartupPending] = useState(true);
    const startupFinished = useRef(false);
    const startupTimer = useRef(null);
    const finishStartup = useCallback(() => {
        startupFinished.current = true;
        clearTimeout(startupTimer.current);
        setStartupPending(false);
    }, []);
    useEffect(() => {
        startupTimer.current = setTimeout(finishStartup, 3000);
        return () => clearTimeout(startupTimer.current);
    }, [finishStartup]);
    const history = useRef(null);
    const attempted = useRef(false);
    const current = useRef({ ownership, purchaseBusy });
    current.current = { ownership, purchaseBusy };

    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const raw = await AsyncStorage.getItem(HISTORY_KEY);
                const parsed = raw ? JSON.parse(raw) : { hasLaunched: false };
                // Corrupt history must never bypass the cap.
                if (!parsed || typeof parsed.hasLaunched !== "boolean") throw new Error("Invalid history");
                if (alive) history.current = parsed;
                await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify({ ...parsed, hasLaunched: true }));
                if (alive) setHistoryLoaded(true);
            } catch {
                if (alive) finishStartup(); // Storage failure must not hold the startup screen.
            }
        })();
        const subscription = AppState.addEventListener("change", (state) => setActive(state === "active"));
        return () => {
            alive = false;
            subscription.remove();
        };
    }, []);

    useEffect(() => {
        if (!openAdId || ownership === "owned" || purchaseBusy || !active ||
            (historyLoaded && !canShowOpenAd({ history: history.current, now: Date.now(),
                contentReady: false, active: true, adFree: false, purchaseBusy: false }))) {
            finishStartup();
        }
    }, [ownership, purchaseBusy, active, historyLoaded, finishStartup]);

    const updateConsent = useCallback((info) => {
        setPrivacyRequired(info.privacyOptionsRequirementStatus === AdsConsentPrivacyOptionsRequirementStatus.REQUIRED);
        return info.canRequestAds;
    }, []);

    useEffect(() => {
        if (ownership !== "free") return;
        let alive = true;
        let timer;
        let attempts = 0;
        const initialize = async () => {
            try {
                let info;
                try {
                    info = await AdsConsent.gatherConsent();
                } catch (consentError) {
                    // UMP may still permit requests using consent from a previous session.
                    info = await AdsConsent.getConsentInfo();
                    if (!info.canRequestAds) throw consentError;
                }
                if (!alive) return;
                if (!updateConsent(info)) {
                    finishStartup();
                    setReady(false);
                    setError("광고 요청이 허용되지 않은 동의 상태입니다.");
                    return;
                }
                await mobileAds().initialize();
                if (alive) {
                    setReady(true);
                    setError(null);
                }
            } catch (failure) {
                if (!alive) return;
                finishStartup();
                setReady(false);
                const message = `${failure.code || "ads/init"}: ${failure.message || String(failure)}`;
                setError(message);
                console.warn("[ads] initialization failed", message);
                if (attempts++ < 2) timer = setTimeout(initialize, 30000);
            }
        };
        initialize();
        return () => {
            alive = false;
            clearTimeout(timer);
        };
    }, [ownership, updateConsent, retryCount]);

    useEffect(() => {
        if (!ready || !historyLoaded || !openAdId || attempted.current) return;
        attempted.current = true;
        const eligible = () =>
            canShowOpenAd({
                history: history.current,
                now: Date.now(),
                contentReady: startupFinished.current,
                active: AppState.currentState === "active",
                adFree: current.current.ownership !== "free",
                purchaseBusy: current.current.purchaseBusy,
            });
        if (!eligible()) { finishStartup(); return; }
        let disposed = false;
        const ad = AppOpenAd.createForAdRequest(openAdId, { requestNonPersonalizedAdsOnly: true });
        const unsubscribers = [
            ad.addAdEventListener(AdEventType.LOADED, () => {
                if (disposed || !eligible()) return;
                clearTimeout(startupTimer.current);
                startupFinished.current = true; // Never show a second ad in this session.
                setShowing(true);
                ad.show().catch(() => {
                    if (!disposed) { setShowing(false); finishStartup(); }
                });
            }),
            ad.addAdEventListener(AdEventType.OPENED, () => {
                const next = recordOpenAd(history.current, Date.now());
                history.current = next;
                AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(next)).catch(() => {});
            }),
            ad.addAdEventListener(AdEventType.CLOSED, () => { setShowing(false); finishStartup(); }),
            ad.addAdEventListener(AdEventType.ERROR, () => { setShowing(false); finishStartup(); }),
        ];
        ad.load();
        return () => {
            disposed = true;
            unsubscribers.forEach((unsubscribe) => unsubscribe());
        };
    }, [ready, historyLoaded, finishStartup]);

    const privacyOptions = async () => {
        const info = await AdsConsent.showPrivacyOptionsForm();
        setReady(updateConsent(info));
    };
    return {
        startupPending,
        error,
        retry: () => setRetryCount((value) => value + 1),
        bannerEnabled: ready && ownership === "free",
        showBanner: ready && active && ownership === "free" && !purchaseBusy && !showing,
        showing,
        privacyRequired,
        privacyOptions,
    };
}

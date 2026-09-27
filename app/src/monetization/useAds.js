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
    const startedAt = useRef(Date.now());
    const trace = useRef([]);
    const note = useCallback((event) => {
        const line = `${Date.now() - startedAt.current}ms ${event}`;
        trace.current = [...trace.current.slice(-24), line];
        console.info("[app-open]", line);
    }, []);
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
    const overallTimer = useRef(null);
    const showingRef = useRef(false);
    const tryShow = useRef(() => {});
    const finishStartup = useCallback((reason) => {
        if (reason) note(reason);
        startupFinished.current = true;
        clearTimeout(startupTimer.current);
        clearTimeout(overallTimer.current);
        setStartupPending(false);
    }, [note]);
    useEffect(() => {
        note(`startup state=${AppState.currentState}`);
        overallTimer.current = setTimeout(() => finishStartup("startup-timeout: 8s"), 8000);
        return () => { clearTimeout(startupTimer.current); clearTimeout(overallTimer.current); };
    }, [finishStartup, note]);
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
        const subscription = AppState.addEventListener("change", (state) => {
            note(`app-state=${state}`);
            setActive(state === "active");
            // iOS can start inactive or briefly become inactive for system UI.
            if (state === "background" && !showingRef.current) finishStartup("backgrounded");
            if (state === "active") tryShow.current();
        });
        return () => {
            alive = false;
            subscription.remove();
        };
    }, []);

    useEffect(() => {
        if (!openAdId || ownership === "owned" || purchaseBusy || AppState.currentState === "background" ||
            (historyLoaded && !canShowOpenAd({ history: history.current, now: Date.now(),
                contentReady: false, active: true, adFree: false, purchaseBusy: false }))) {
            finishStartup(`skip: ownership=${ownership}, busy=${purchaseBusy}, first=${history.current?.hasLaunched === false}, last=${history.current?.lastShownAt || 0}, count=${history.current?.count || 0}`);
        }
    }, [ownership, purchaseBusy, active, historyLoaded, finishStartup]);

    const updateConsent = useCallback((info) => {
        setPrivacyRequired(info.privacyOptionsRequirementStatus === AdsConsentPrivacyOptionsRequirementStatus.REQUIRED);
        return info.canRequestAds;
    }, []);

    useEffect(() => {
        note(`ownership=${ownership}`);
        if (ownership !== "free") return;
        let alive = true;
        let timer;
        let attempts = 0;
        const initialize = async () => {
            try {
                note("consent-start");
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
                note("sdk-initialize");
                await mobileAds().initialize();
                if (alive) {
                    note("sdk-ready");
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
        const eligible = () => canShowOpenAd({
            history: history.current, now: Date.now(), contentReady: startupFinished.current,
            active: true, // Loading may begin while iOS is inactive; presentation may not.
            adFree: current.current.ownership !== "free", purchaseBusy: current.current.purchaseBusy,
        });
        if (!eligible()) { finishStartup("request-skipped"); return; }
        let disposed = false;
        let loaded = false;
        const unsubscribers = [];
        const fail = (failure) => {
            if (disposed) return;
            showingRef.current = false;
            setShowing(false);
            finishStartup(`ad-error: ${failure?.code || "unknown"} ${failure?.message || ""}`);
        };
        try {
            const ad = AppOpenAd.createForAdRequest(openAdId, { requestNonPersonalizedAdsOnly: true });
            tryShow.current = () => {
                if (disposed || !loaded || !eligible() || AppState.currentState !== "active") return;
                loaded = false;
                startupFinished.current = true;
                clearTimeout(startupTimer.current);
                clearTimeout(overallTimer.current);
                showingRef.current = true;
                setShowing(true);
                note("show-request");
                try { Promise.resolve(ad.show()).catch(fail); } catch (failure) { fail(failure); }
            };
            unsubscribers.push(
                ad.addAdEventListener(AdEventType.LOADED, () => {
                    if (disposed) return;
                    note("ad-loaded");
                    loaded = true;
                    tryShow.current();
                }),
                ad.addAdEventListener(AdEventType.OPENED, () => {
                    note("ad-opened");
                    const next = recordOpenAd(history.current, Date.now());
                    history.current = next;
                    AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(next)).catch(() => {});
                }),
                ad.addAdEventListener(AdEventType.CLOSED, () => {
                    showingRef.current = false;
                    setShowing(false);
                    finishStartup("ad-closed");
                }),
                ad.addAdEventListener(AdEventType.ERROR, fail),
            );
            note("ad-load-request");
            // Give the ad its own loading window after ownership/consent/SDK setup.
            startupTimer.current = setTimeout(() => finishStartup("ad-load-timeout: 3s"), 3000);
            ad.load();
        } catch (failure) { fail(failure); }
        return () => {
            disposed = true;
            tryShow.current = () => {};
            unsubscribers.forEach((unsubscribe) => unsubscribe());
        };
    }, [ready, historyLoaded, finishStartup, note]);

    const privacyOptions = async () => {
        const info = await AdsConsent.showPrivacyOptionsForm();
        setReady(updateConsent(info));
    };
    return {
        diagnostics: () => trace.current.join("\n"),
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

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import * as policy from "../src/monetization/policy.mjs";
const require = createRequire(import.meta.url);
const { transformSync } = require("@babel/core");
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
function loadHook(name, mocks) {
    const file = new URL(`../src/monetization/${name}.js`, import.meta.url);
    const code = transformSync(fs.readFileSync(file, "utf8"), {
        filename: file.pathname,
        configFile: false,
        babelrc: false,
        plugins: [require.resolve("@babel/plugin-transform-modules-commonjs")],
    }).code;
    const module = { exports: {} };
    new Function("require", "module", "exports", code)(
        (id) => (id === "react" ? React : id === "./policy.mjs" ? policy : mocks[id]),
        module,
        module.exports,
    );
    return module.exports;
}
function appState() {
    let listener;
    return {
        currentState: "active",
        addEventListener: (_, cb) => {
            listener = cb;
            return { remove() {} };
        },
        emit(state) {
            this.currentState = state;
            listener?.(state);
        },
    };
}
async function renderHook(hook, props) {
    let value, root;
    function Component(p) {
        value = hook(p);
        return null;
    }
    await act(async () => {
        root = TestRenderer.create(React.createElement(Component, props));
    });
    return {
        get value() {
            return value;
        },
        async update(props) {
            await act(async () => root.update(React.createElement(Component, props)));
        },
        async dispose() {
            await act(async () => root.unmount());
        },
    };
}
const free = { entitlements: { active: {} } };
const owned = { entitlements: { active: { ad_free: { isActive: true } } } };
function purchasesMock(overrides = {}) {
    return {
        configure() {},
        getCustomerInfo: async () => free,
        getProducts: async () => [{ identifier: "remove_ads", priceString: "₩3,300" }],
        purchaseStoreProduct: async () => ({ customerInfo: owned }),
        restorePurchases: async () => owned,
        addCustomerInfoUpdateListener(cb) {
            this.listener = cb;
        },
        removeCustomerInfoUpdateListener() {},
        ...overrides,
    };
}
async function purchaseHook(store) {
    const { useAdFreePurchase } = loadHook("useAdFreePurchase", {
        "react-native": { AppState: appState() },
        "react-native-purchases": {
            __esModule: true,
            default: store,
            PRODUCT_CATEGORY: { NON_SUBSCRIPTION: "NON_SUBSCRIPTION" },
        },
        "./config": { entitlementId: "ad_free", productId: "remove_ads", purchaseApiKey: "public-test-key" },
    });
    return renderHook(useAdFreePurchase);
}
test("purchase grants entitlement and refund update revokes it", async () => {
    const store = purchasesMock(),
        hook = await purchaseHook(store);
    assert.equal(hook.value.ownership, "free");
    await act(async () => hook.value.buy());
    assert.equal(hook.value.ownership, "owned");
    await act(async () => store.listener(free));
    assert.equal(hook.value.ownership, "free");
    await hook.dispose();
});
test("cancelled purchase does not unlock or show failure", async () => {
    const hook = await purchaseHook(
        purchasesMock({
            purchaseStoreProduct: async () => {
                throw { userCancelled: true };
            },
        }),
    );
    await act(async () => hook.value.buy());
    assert.equal(hook.value.ownership, "free");
    assert.equal(hook.value.message, "");
    assert.equal(hook.value.busy, false);
    await hook.dispose();
});
test("restore works without an available product", async () => {
    const hook = await purchaseHook(purchasesMock({ getProducts: async () => [] }));
    assert.equal(hook.value.product, null);
    await act(async () => hook.value.restore());
    assert.equal(hook.value.ownership, "owned");
    await hook.dispose();
});
test("offline ownership remains unknown instead of serving ads to buyers", async () => {
    const hook = await purchaseHook(
        purchasesMock({
            getCustomerInfo: async () => {
                throw Error("offline");
            },
        }),
    );
    assert.equal(hook.value.ownership, "loading");
    await hook.dispose();
});
test("double tap launches one store transaction and pending does not grant access", async () => {
    let resolve,
        calls = 0;
    const hook = await purchaseHook(
        purchasesMock({
            purchaseStoreProduct: () => {
                calls++;
                return new Promise((r) => {
                    resolve = r;
                });
            },
        }),
    );
    let first;
    await act(async () => {
        first = hook.value.buy();
        void hook.value.buy();
    });
    assert.equal(calls, 1);
    assert.equal(hook.value.busy, true);
    await act(async () => {
        resolve({ customerInfo: free });
        await first;
    });
    assert.equal(hook.value.ownership, "free");
    await hook.dispose();
});
async function adsHook(history = { hasLaunched: true }, consent = {}, options = {}) {
    const events = {};
    let loads = 0,
        shows = 0,
        saved;
    const ad = {
        addAdEventListener: (name, cb) => {
            events[name] = cb;
            return () => delete events[name];
        },
        load: () => loads++,
        show: async () => {
            shows++;
            if (options.showFails) throw Error("show failed");
            events.opened?.();
        },
    };
    const state = appState();
    state.currentState = options.initialState ?? "active";
    const nativeAds = {
        __esModule: true,
        default: () => ({ initialize: async () => {} }),
        AdsConsent: { gatherConsent: async () => ({ canRequestAds: true }), ...consent },
        AdsConsentPrivacyOptionsRequirementStatus: { REQUIRED: "required" },
        AppOpenAd: { createForAdRequest: () => ad },
        AdEventType: { LOADED: "loaded", OPENED: "opened", CLOSED: "closed", ERROR: "error" },
    };
    const { useAds } = loadHook("useAds", {
        "react-native": { AppState: state },
        "react-native-google-mobile-ads": nativeAds,
        "@react-native-async-storage/async-storage": {
            getItem: async () => JSON.stringify(history),
            setItem: async (_, value) => {
                saved = JSON.parse(value);
            },
        },
        "./config": { openAdId: "test-app-open" },
    });
    const contentReady = { current: false },
        hook = await renderHook(useAds, { ownership: options.ownership || "free", purchaseBusy: false, contentReady });
    return {
        hook,
        events,
        contentReady,
        state,
        get loads() {
            return loads;
        },
        get shows() {
            return shows;
        },
        get saved() {
            return saved;
        },
    };
}
test("fast WebView still waits for the startup ad", async () => {
    const h = await adsHook();
    assert.equal(h.loads, 1);
    h.contentReady.current = true;
    await act(async () => h.events.loaded());
    assert.equal(h.shows, 1);
    assert.equal(h.hook.value.startupPending, true);
    await act(async () => h.events.closed());
    assert.equal(h.hook.value.startupPending, false);
    await h.hook.dispose();
});
test("backgrounded app does not show an ad", async () => {
    const h = await adsHook();
    await act(async () => h.state.emit("background"));
    await act(async () => h.events.loaded());
    assert.equal(h.shows, 0);
    await h.hook.dispose();
});
test("shown ad persists the impression cap", async () => {
    const h = await adsHook();
    await act(async () => h.events.loaded());
    assert.equal(h.shows, 1);
    assert.equal(h.saved.count, 1);
    assert.ok(h.saved.lastShownAt);
    await act(async () => h.events.closed());
    assert.equal(h.hook.value.showing, false);
    await h.hook.dispose();
});
test("first launch never requests app-open ad", async () => {
    const h = await adsHook({ hasLaunched: false });
    assert.equal(h.loads, 0);
    assert.equal(h.saved.hasLaunched, true);
    await h.hook.dispose();
});

test("consent refresh failure uses previously permitted consent", async () => {
    const h = await adsHook(undefined, {
        gatherConsent: async () => { throw Error("offline"); },
        getConsentInfo: async () => ({ canRequestAds: true }),
    });
    assert.equal(h.hook.value.bannerEnabled, true);
    assert.equal(h.hook.value.error, null);
    await h.hook.dispose();
});
test("consent failure without prior permission blocks ads and permits retry", async () => {
    let online = false;
    const h = await adsHook(undefined, {
        gatherConsent: async () => {
            if (!online) throw Error("offline");
            return { canRequestAds: true };
        },
        getConsentInfo: async () => ({ canRequestAds: false }),
    });
    assert.equal(h.hook.value.bannerEnabled, false);
    assert.equal(h.loads, 0);
    assert.match(h.hook.value.error, /offline/);
    online = true;
    await act(async () => h.hook.value.retry());
    assert.equal(h.hook.value.bannerEnabled, true);
    assert.equal(h.hook.value.error, null);
    await h.hook.dispose();
});

test("successful product retry clears stale errors and failed refresh removes stale price", async () => {
    let available = false;
    const hook = await purchaseHook(purchasesMock({
        getProducts: async () => {
            if (!available) throw Error("offline");
            return [{ identifier: "remove_ads", priceString: "₩3,300" }];
        },
    }));
    assert.equal(hook.value.product, null);
    assert.ok(hook.value.message);
    available = true;
    await act(async () => hook.value.refresh());
    assert.ok(hook.value.product);
    assert.equal(hook.value.message, "");
    available = false;
    await act(async () => hook.value.refresh());
    assert.equal(hook.value.product, null);
    await hook.dispose();
});

test("startup timeout releases content and rejects late ads", async (t) => {
    t.mock.timers.enable({ apis: ["setTimeout"] });
    const h = await adsHook();
    assert.equal(h.hook.value.startupPending, true);
    await act(async () => t.mock.timers.tick(3000));
    assert.equal(h.hook.value.startupPending, false);
    await act(async () => h.events.loaded());
    assert.equal(h.shows, 0);
    await h.hook.dispose();
});
test("ad failure immediately releases startup screen", async () => {
    const h = await adsHook();
    await act(async () => h.events.error());
    assert.equal(h.hook.value.startupPending, false);
    await h.hook.dispose();
});

test("purchased user enters immediately without requesting ads", async () => {
    const h = await adsHook(undefined, {}, { ownership: "owned" });
    assert.equal(h.hook.value.startupPending, false);
    assert.equal(h.loads, 0);
    await h.hook.dispose();
});
test("recent impression skips startup wait and ad request", async () => {
    const h = await adsHook({ hasLaunched: true, lastShownAt: Date.now() });
    assert.equal(h.hook.value.startupPending, false);
    assert.equal(h.loads, 0);
    await h.hook.dispose();
});
test("ownership update while loading prevents ad display", async () => {
    const h = await adsHook();
    await h.hook.update({ ownership: "owned", purchaseBusy: false });
    await act(async () => h.events.loaded());
    assert.equal(h.shows, 0);
    assert.equal(h.hook.value.startupPending, false);
    await h.hook.dispose();
});
test("show rejection releases startup and does not count impression", async () => {
    const h = await adsHook(undefined, {}, { showFails: true });
    await act(async () => h.events.loaded());
    assert.equal(h.hook.value.startupPending, false);
    assert.equal(h.hook.value.showing, false);
    assert.equal(h.saved.lastShownAt, undefined);
    await h.hook.dispose();
});
test("unknown purchase state times out without serving ads", async (t) => {
    t.mock.timers.enable({ apis: ["setTimeout"] });
    const h = await adsHook(undefined, {}, { ownership: "loading" });
    await act(async () => t.mock.timers.tick(8000));
    assert.equal(h.hook.value.startupPending, false);
    await h.hook.update({ ownership: "free", purchaseBusy: false });
    assert.equal(h.loads, 0);
    await h.hook.dispose();
});

test("iOS initial inactive state does not permanently skip startup ad", async () => {
    const h = await adsHook(undefined, {}, { initialState: "inactive" });
    try {
        assert.equal(h.hook.value.startupPending, true);
        await act(async () => h.state.emit("active"));
        assert.equal(h.loads, 1);
        await act(async () => h.events.loaded());
        assert.equal(h.shows, 1);
    } finally { await h.hook.dispose(); }
});
test("slow ownership lookup still leaves an ad loading window", async (t) => {
    t.mock.timers.enable({ apis: ["setTimeout"] });
    const h = await adsHook(undefined, {}, { ownership: "loading" });
    try {
        await act(async () => t.mock.timers.tick(3100));
        await h.hook.update({ ownership: "free", purchaseBusy: false });
        assert.equal(h.loads, 1);
        await act(async () => h.events.loaded());
        assert.equal(h.shows, 1);
    } finally { await h.hook.dispose(); }
});

test("ad loaded while iOS inactive waits for active without losing it", async () => {
    const h = await adsHook(undefined, {}, { initialState: "inactive" });
    await act(async () => h.events.loaded());
    assert.equal(h.shows, 0);
    assert.equal(h.hook.value.startupPending, true);
    await act(async () => h.state.emit("active"));
    assert.equal(h.shows, 1);
    await act(async () => h.state.emit("inactive"));
    await act(async () => h.state.emit("active"));
    assert.equal(h.shows, 1);
    await h.hook.dispose();
});
test("diagnostics preserve the SDK error instead of silently skipping", async () => {
    const h = await adsHook();
    await act(async () => h.events.error({ code: "no-fill", message: "No ad available" }));
    assert.match(h.hook.value.diagnostics(), /ad-load-request/);
    assert.match(h.hook.value.diagnostics(), /no-fill/);
    assert.equal(h.hook.value.startupPending, false);
    await h.hook.dispose();
});

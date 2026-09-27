import test from "node:test";
import assert from "node:assert/strict";
import {
    canShowOpenAd,
    recordOpenAd,
    hasAdFreeEntitlement,
    dayKey,
    OPEN_AD_INTERVAL_MS,
} from "../src/monetization/policy.mjs";
const now = new Date(2026, 8, 13, 12).getTime();
const eligible = {
    history: { hasLaunched: true },
    now,
    contentReady: false,
    active: true,
    adFree: false,
    purchaseBusy: false,
};

test("returning free user can see an ad only during initial loading", () => {
    assert.equal(canShowOpenAd(eligible), true);
    for (const override of [
        { contentReady: true },
        { active: false },
        { adFree: true },
        { purchaseBusy: true },
        { history: null },
        { history: { hasLaunched: false } },
    ]) {
        assert.equal(canShowOpenAd({ ...eligible, ...override }), false);
    }
});
test("four hour cap survives restart and does not reset at midnight", () => {
    const lastShownAt = now - OPEN_AD_INTERVAL_MS + 1;
    assert.equal(canShowOpenAd({ ...eligible, history: { hasLaunched: true, lastShownAt, day: "yesterday" } }), false);
    assert.equal(canShowOpenAd({ ...eligible, history: { hasLaunched: true, lastShownAt: lastShownAt - 1 } }), true);
});
test("daily cap and next day reset", () => {
    const full = { hasLaunched: true, day: dayKey(now), count: 2 };
    assert.equal(canShowOpenAd({ ...eligible, history: full }), false);
    const tomorrow = now + 24 * 60 * 60 * 1000;
    assert.equal(canShowOpenAd({ ...eligible, history: full, now: tomorrow }), true);
    assert.equal(recordOpenAd(full, tomorrow).count, 1);
    assert.equal(recordOpenAd({ ...full, count: 1 }, now).count, 2);
});
test("clock rollback cannot bypass interval", () => {
    assert.equal(canShowOpenAd({ ...eligible, history: { hasLaunched: true, lastShownAt: now + 1000 } }), false);
});
test("only an active ad_free entitlement unlocks ad removal", () => {
    for (const info of [
        null,
        {},
        { entitlements: { active: { other: { isActive: true } } } },
        { entitlements: { active: { ad_free: { isActive: false } } } },
    ]) {
        assert.equal(hasAdFreeEntitlement(info, "ad_free"), false);
    }
    assert.equal(hasAdFreeEntitlement({ entitlements: { active: { ad_free: { isActive: true } } } }, "ad_free"), true);
});

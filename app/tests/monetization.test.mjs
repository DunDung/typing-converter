import test from "node:test";
import assert from "node:assert/strict";
import {
    canShowOpenAd,
    recordOpenAd,
    hasAdFreeEntitlement,
    dayKey,
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
    ]) {
        assert.equal(canShowOpenAd({ ...eligible, ...override }), false);
    }
});
test("first install and recent impressions do not suppress startup requests", () => {
    for (const history of [null, { hasLaunched: false }, { hasLaunched: true, lastShownAt: now, day: dayKey(now), count: 20 }]) {
        assert.equal(canShowOpenAd({ ...eligible, history }), true);
    }
});
test("impression history still records actual displays", () => {
    assert.equal(recordOpenAd({ count: 3, day: dayKey(now) }, now).count, 4);
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

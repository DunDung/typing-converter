export function dayKey(now) {
    const date = new Date(now);
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

export function canShowOpenAd({ contentReady, active, adFree, purchaseBusy }) {
    return !contentReady && active && !adFree && !purchaseBusy;
}

export function recordOpenAd(history, now) {
    return {
        hasLaunched: true,
        lastShownAt: now,
        day: dayKey(now),
        count: history.day === dayKey(now) ? (history.count || 0) + 1 : 1,
    };
}

export function hasAdFreeEntitlement(info, entitlementId) {
    return info?.entitlements?.active?.[entitlementId]?.isActive === true;
}

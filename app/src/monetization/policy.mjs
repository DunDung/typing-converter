export const OPEN_AD_INTERVAL_MS = 4 * 60 * 60 * 1000;
export const OPEN_AD_DAILY_LIMIT = 2;

export function dayKey(now) {
    const date = new Date(now);
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

export function canShowOpenAd({ history, now, contentReady, active, adFree, purchaseBusy }) {
    if (!history || !history.hasLaunched || contentReady || !active || adFree || purchaseBusy) return false;
    if (history.lastShownAt && now - history.lastShownAt < OPEN_AD_INTERVAL_MS) return false;
    return history.day !== dayKey(now) || (history.count || 0) < OPEN_AD_DAILY_LIMIT;
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

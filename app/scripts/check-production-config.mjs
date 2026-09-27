// EAS runs this after dependency installation; local validation can specify android or ios.
const platform = process.argv[2] || process.env.EAS_BUILD_PLATFORM;
if (process.env.EAS_BUILD_PROFILE === "production" || process.argv[2]) {
    if (!["android", "ios"].includes(platform)) throw new Error("Specify android or ios");
    const prefix = platform.toUpperCase();
    const names = [
        `EXPO_PUBLIC_REVENUECAT_${prefix}_API_KEY`,
        `EXPO_PUBLIC_AD_FREE_${prefix}_PRODUCT_ID`,
        `EXPO_PUBLIC_ADMOB_${prefix}_APP_OPEN_ID`,
    ];
    const missing = names.filter((name) => !process.env[name]?.trim());
    if (missing.length)
        throw new Error(`Production configuration missing: ${missing.join(", ")}. See app/MONETIZATION.md.`);
    const adId = process.env[names[2]];
    if (!/^ca-app-pub-\d+\/\d+$/.test(adId) || adId.startsWith("ca-app-pub-3940256099942544"))
        throw new Error("A production app-open ad unit is required");
    if (process.env[names[0]].startsWith("test_"))
        throw new Error("Use a platform RevenueCat public SDK key, not a Test Store key");
    console.log(`${platform}: production monetization configuration present`);
}

import { Platform } from "react-native";
import { TestIds } from "react-native-google-mobile-ads";

export const entitlementId = "ad_free";
export const purchaseApiKey =
    Platform.OS === "ios"
        ? process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY
        : process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY;
export const productId =
    Platform.OS === "ios"
        ? process.env.EXPO_PUBLIC_AD_FREE_IOS_PRODUCT_ID
        : process.env.EXPO_PUBLIC_AD_FREE_ANDROID_PRODUCT_ID;
const productionOpenAdId =
    Platform.OS === "ios"
        ? process.env.EXPO_PUBLIC_ADMOB_IOS_APP_OPEN_ID
        : process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_OPEN_ID;
export const openAdId = __DEV__ ? TestIds.APP_OPEN : productionOpenAdId;
export const bannerAdId = __DEV__
    ? TestIds.BANNER
    : Platform.OS === "ios"
      ? "ca-app-pub-1298150935322847/2763811393"
      : "ca-app-pub-1298150935322847/1973473906";

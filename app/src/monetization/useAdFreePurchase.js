import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import Purchases, { PRODUCT_CATEGORY } from "react-native-purchases";
import { entitlementId, productId, purchaseApiKey } from "./config";
import { hasAdFreeEntitlement } from "./policy.mjs";

let configured = false;
function configure() {
    if (!purchaseApiKey || !productId) return false;
    if (!configured) {
        Purchases.configure({ apiKey: purchaseApiKey });
        configured = true;
    }
    return true;
}

export function useAdFreePurchase() {
    const [ownership, setOwnership] = useState("loading");
    const [product, setProduct] = useState(null);
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState("");
    const operation = useRef(false);
    const mounted = useRef(true);
    const acceptInfo = useCallback((info) => {
        if (mounted.current) setOwnership(hasAdFreeEntitlement(info, entitlementId) ? "owned" : "free");
    }, []);

    const refresh = useCallback(async () => {
        if (mounted.current) setMessage("");
        try {
            if (!configure()) {
                if (mounted.current) {
                    setOwnership("free");
                    setMessage("광고 제거 구매를 준비하고 있어요. 잠시 후 다시 확인해 주세요.");
                }
                return;
            }
        } catch {
            if (mounted.current) setMessage("구매 서비스를 연결하지 못했어요. 잠시 후 다시 시도해 주세요.");
            return;
        }
        try {
            acceptInfo(await Purchases.getCustomerInfo());
        } catch {
            // Keep ads disabled when ownership cannot be determined. The SDK manages its verified cache.
            if (mounted.current) setMessage("구매 내역을 확인하지 못했어요. 연결을 확인하고 다시 시도해 주세요.");
        }
        try {
            const products = await Purchases.getProducts([productId], PRODUCT_CATEGORY.NON_SUBSCRIPTION);
            if (mounted.current) {
                const matchingProduct = products.find((item) => item.identifier === productId);
                setProduct(matchingProduct || null);
                if (!matchingProduct) setMessage("지금은 상품을 불러올 수 없어요. 잠시 후 다시 시도해 주세요.");
            }
        } catch {
            if (mounted.current) {
                setProduct(null);
                setMessage("상품을 불러오지 못했어요. 연결을 확인해 주세요.");
            }
        }
    }, [acceptInfo]);

    useEffect(() => {
        mounted.current = true;
        void refresh();
        if (purchaseApiKey && productId) Purchases.addCustomerInfoUpdateListener(acceptInfo);
        const subscription = AppState.addEventListener("change", (state) => {
            if (state === "active" && configured)
                Purchases.getCustomerInfo()
                    .then(acceptInfo)
                    .catch(() => {});
        });
        return () => {
            mounted.current = false;
            subscription.remove();
            if (configured) Purchases.removeCustomerInfoUpdateListener(acceptInfo);
        };
    }, [refresh, acceptInfo]);

    const transact = useCallback(
        async (restore) => {
            if (operation.current || (!restore && !product)) return;
            try {
                if (!configure()) return;
            } catch {
                setMessage("구매 서비스를 연결하지 못했어요. 잠시 후 다시 시도해 주세요.");
                return;
            }
            operation.current = true;
            setBusy(true);
            setMessage("");
            try {
                const info = restore
                    ? await Purchases.restorePurchases()
                    : (await Purchases.purchaseStoreProduct(product)).customerInfo;
                acceptInfo(info);
                setMessage(
                    hasAdFreeEntitlement(info, entitlementId)
                        ? "광고가 제거되었어요. 이용해 주셔서 감사합니다."
                        : restore
                          ? "이 스토어 계정에서 복원할 구매 내역을 찾지 못했어요."
                          : "구매 상태를 확인 중이에요. 완료되면 광고가 자동으로 제거됩니다.",
                );
            } catch (error) {
                if (!error.userCancelled)
                    setMessage("구매 처리를 완료하지 못했어요. 잠시 후 다시 시도하거나 구매 복원을 눌러 주세요.");
            } finally {
                operation.current = false;
                if (mounted.current) setBusy(false);
            }
        },
        [product, acceptInfo],
    );

    return {
        ownership,
        product,
        busy,
        message,
        refresh,
        configured: Boolean(purchaseApiKey && productId),
        buy: () => transact(false),
        restore: () => transact(true),
    };
}

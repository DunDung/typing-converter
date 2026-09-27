import React from "react";
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function AdFreeModal({ visible, onClose, purchase, privacyRequired, onPrivacy }) {
    const owned = purchase.ownership === "owned";
    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={() => !purchase.busy && onClose()}>
            <View style={styles.overlay}>
                <View style={styles.card} accessibilityViewIsModal>
                    <ScrollView>
                        <Text accessibilityRole="header" style={styles.title}>
                            {owned ? "광고 없이 이용 중" : "광고 제거"}
                        </Text>
                        <Text style={styles.description}>
                            {owned ? "시작 광고와 하단 배너가 제거됐어요." : "한 번 구매하면 시작 광고와 하단 배너가 사라져요."}
                        </Text>
                        {!owned && (
                            <Pressable
                                accessibilityRole="button"
                                disabled={!purchase.product || purchase.busy || purchase.ownership === "loading"}
                                onPress={purchase.buy}
                                style={[
                                    styles.buy,
                                    (!purchase.product || purchase.busy || purchase.ownership === "loading") &&
                                        styles.disabled,
                                ]}
                            >
                                <Text style={styles.buyText}>
                                    {purchase.product
                                        ? `${purchase.product.priceString} · 1회 구매`
                                        : purchase.configured ? "상품을 불러올 수 없어요" : "판매 준비 중"}
                                </Text>
                            </Pressable>
                        )}
                        {purchase.busy && (
                            <ActivityIndicator accessibilityLabel="구매 처리 중" style={{ marginTop: 12 }} />
                        )}
                        {purchase.configured && !!purchase.message && (
                            <Text accessibilityLiveRegion="polite" style={styles.message}>
                                {purchase.message}
                            </Text>
                        )}
                        <View style={styles.actions}>
                            <Pressable
                                accessibilityRole="button"
                                disabled={purchase.busy || !purchase.configured}
                                onPress={purchase.restore}
                                style={styles.link}
                            >
                                <Text style={!purchase.configured ? styles.muted : styles.linkText}>구매 복원</Text>
                            </Pressable>
                            {!owned && purchase.configured && (!purchase.product || !!purchase.message) && (
                                <Pressable
                                    accessibilityRole="button"
                                    disabled={purchase.busy}
                                    onPress={purchase.refresh}
                                    style={styles.link}
                                >
                                    <Text style={styles.linkText}>다시 확인</Text>
                                </Pressable>
                            )}
                            <Pressable
                                accessibilityRole="button"
                                disabled={purchase.busy}
                                onPress={onClose}
                                style={styles.link}
                            >
                                <Text style={styles.linkText}>닫기</Text>
                            </Pressable>
                        </View>
                        {privacyRequired && (
                            <Pressable
                                accessibilityRole="button"
                                disabled={purchase.busy}
                                onPress={onPrivacy}
                                style={styles.link}
                            >
                                <Text style={styles.linkText}>광고 개인정보 설정</Text>
                            </Pressable>
                        )}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}
const styles = StyleSheet.create({
    overlay: { flex: 1, justifyContent: "center", backgroundColor: "rgba(15,23,42,0.45)", padding: 24 },
    card: {
        backgroundColor: "white",
        borderRadius: 24,
        padding: 24,
        maxHeight: "85%",
        width: "100%",
        maxWidth: 480,
        alignSelf: "center",
    },
    title: { fontSize: 23, fontWeight: "700", color: "#18243b" },
    description: { fontSize: 16, lineHeight: 25, marginTop: 16, color: "#334155" },
    buy: { padding: 17, backgroundColor: "#334ec6", borderRadius: 12, alignItems: "center", marginTop: 24 },
    disabled: { backgroundColor: "#a1aabe" },
    buyText: { color: "white", fontSize: 16, fontWeight: "600" },
    message: { fontSize: 14, color: "#334155", lineHeight: 22, marginTop: 12 },
    actions: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginTop: 12 },
    link: { paddingVertical: 14, paddingHorizontal: 8, minHeight: 48 },
    linkText: { color: "#334ec6", fontSize: 14 },
    muted: { color: "#94a3b8" },
});

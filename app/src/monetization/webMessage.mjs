// Android WebMessageListener reports sourceOrigin rather than the page URL.
// Accept that form only while the WebView is on the exact converter page.
export function isConverterMessage(source, currentPage, expectedPage, platform) {
    try {
        const expected = new URL(expectedPage);
        const current = new URL(currentPage);
        const sender = new URL(source);
        if (current.origin !== expected.origin || current.pathname !== expected.pathname) return false;
        if (sender.origin !== expected.origin) return false;
        return sender.pathname === expected.pathname ||
            (platform === "android" && sender.pathname === "/" && !sender.search && !sender.hash);
    } catch { return false; }
}

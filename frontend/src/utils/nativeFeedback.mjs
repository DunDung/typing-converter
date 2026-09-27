// Only hide the web entry after the native header confirms support.
export function connectFeedback(host, { onHeader, onOpen }) {
  let supported = false;
  const receive = ({ detail }) => {
    if (!host.ReactNativeWebView?.postMessage) return;
    if (detail?.type === "feedback-header-ready") {
      supported = true;
      onHeader();
    } else if (supported && detail?.type === "open-feedback") {
      onOpen();
    }
  };
  host.addEventListener("converter-native", receive);
  return () => host.removeEventListener("converter-native", receive);
}

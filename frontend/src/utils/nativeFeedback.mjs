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

// Android may expose its bridge after Vue mounts, or deliver onLoadStart late.
// Re-announce briefly even after an acknowledgement to reconcile that ordering.
export function announceConverterReady(host) {
  const send = () => host.ReactNativeWebView?.postMessage(JSON.stringify({
    type: "converter-ready", capabilities: ["feedback-v1"],
  }));
  send();
  const timers = [250, 1000, 3000, 6000].map(delay => host.setTimeout(send, delay));
  const resume = () => {
    if (host.document?.visibilityState === "visible") send();
  };
  host.document?.addEventListener("visibilitychange", resume);
  return () => {
    timers.forEach(timer => host.clearTimeout(timer));
    host.document?.removeEventListener("visibilitychange", resume);
  };
}

export async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Older WebViews and denied permissions may still support a user-initiated copy.
    }
  }
  const previousFocus = document.activeElement;
  const el = document.createElement("textarea");
  el.value = text;
  el.readOnly = true;
  el.style.position = "fixed";
  el.style.opacity = "0";
  document.body.appendChild(el);
  try {
    el.select();
    el.setSelectionRange(0, text.length);
    if (!document.execCommand("copy")) throw new Error("Copy failed");
  } finally {
    el.remove();
    previousFocus?.focus({ preventScroll: true });
  }
}

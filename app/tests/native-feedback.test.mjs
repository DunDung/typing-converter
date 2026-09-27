import test from "node:test";
import assert from "node:assert/strict";
import { connectFeedback, announceConverterReady } from "../../frontend/src/utils/nativeFeedback.mjs";

function host(native) {
  const target = new EventTarget();
  if (native) target.ReactNativeWebView = { postMessage() {} };
  target.send = (type) => target.dispatchEvent(new CustomEvent("converter-native", { detail: { type } }));
  return target;
}
test("ordinary web retains its own feedback entry", () => {
  const page = host(false);
  let hidden = false;
  connectFeedback(page, { onHeader: () => { hidden = true; }, onOpen: () => assert.fail() });
  page.send("feedback-header-ready");
  assert.equal(hidden, false);
});
test("old native without header acknowledgement retains web feedback", () => {
  const page = host(true);
  connectFeedback(page, { onHeader: () => assert.fail(), onOpen: () => assert.fail() });
  page.send("open-feedback");
});
test("supported native opens feedback and removes listener on unmount", () => {
  const page = host(true);
  let hidden = false, opens = 0;
  const disconnect = connectFeedback(page, { onHeader: () => { hidden = true; }, onOpen: () => opens++ });
  page.send("feedback-header-ready");
  page.send("open-feedback");
  assert.equal(hidden, true);
  assert.equal(opens, 1);
  disconnect();
  page.send("open-feedback");
  assert.equal(opens, 1);
});

test("ready announcement recovers a late Android bridge and stops on unmount", () => {
  const pending = new Map();
  let nextId = 0;
  const page = host(false);
  page.setTimeout = callback => { pending.set(++nextId, callback); return nextId; };
  page.clearTimeout = id => pending.delete(id);
  let requests = 0;
  const stop = announceConverterReady(page);
  assert.equal(requests, 0);
  page.ReactNativeWebView = { postMessage: message => {
    assert.deepEqual(JSON.parse(message).capabilities, ["feedback-v1"]);
    requests++;
  } };
  for (const callback of pending.values()) callback();
  assert.equal(requests, 4);
  stop();
  assert.equal(pending.size, 0);
});

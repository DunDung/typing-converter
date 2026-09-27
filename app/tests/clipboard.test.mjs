import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const source = fs.readFileSync(new URL("../../frontend/src/utils/clipboard.js", import.meta.url), "utf8");
const { copyText } = await import("data:text/javascript;base64," + Buffer.from(source).toString("base64"));
function environment(writeText, success) {
    let removed = false,
        restored = false,
        copied = "";
    Object.defineProperty(globalThis, "navigator", { configurable: true, value: { clipboard: { writeText } } });
    globalThis.document = {
        activeElement: {
            focus() {
                restored = true;
            },
        },
        body: { appendChild() {} },
        createElement: () => ({
            style: {},
            select() {
                copied = this.value;
            },
            setSelectionRange() {},
            remove() {
                removed = true;
            },
        }),
        execCommand: () => success,
    };
    return {
        get removed() {
            return removed;
        },
        get restored() {
            return restored;
        },
        get copied() {
            return copied;
        },
    };
}
test("modern clipboard copies exact text", async () => {
    let result;
    environment(async (text) => {
        result = text;
    }, false);
    await copyText("안녕하세요\nhello");
    assert.equal(result, "안녕하세요\nhello");
});
test("denied clipboard uses fallback and restores focus", async () => {
    const e = environment(async () => {
        throw Error("denied");
    }, true);
    await copyText("안녕");
    assert.equal(e.copied, "안녕");
    assert.equal(e.removed, true);
    assert.equal(e.restored, true);
});
test("failed fallback rejects instead of falsely reporting success", async () => {
    const e = environment(undefined, false);
    await assert.rejects(copyText("안녕"));
    assert.equal(e.removed, true);
    assert.equal(e.restored, true);
});

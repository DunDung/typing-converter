import test from 'node:test';
import assert from 'node:assert/strict';
import { isConverterMessage } from '../src/monetization/webMessage.mjs';
const page = 'https://dundung.github.io/typing-converter/?native=1';
test('Android origin-only messages are accepted on the converter page', () => {
    assert.equal(isConverterMessage('https://dundung.github.io', page, page, 'android'), true);
});
test('iOS and legacy Android full page messages remain accepted', () => {
    for (const platform of ['ios', 'android']) assert.equal(isConverterMessage(page, page, page, platform), true);
});
test('foreign origins, other pages and malformed URLs remain rejected', () => {
    for (const source of ['https://evil.example', 'https://dundung.github.io/other/', '', undefined]) {
        assert.equal(isConverterMessage(source, page, page, 'android'), false);
    }
    assert.equal(isConverterMessage('https://dundung.github.io', 'https://dundung.github.io/other/', page, 'android'), false);
    assert.equal(isConverterMessage('https://dundung.github.io', page, page, 'ios'), false);
});

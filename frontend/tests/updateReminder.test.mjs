import test from 'node:test';
import assert from 'node:assert/strict';
import { legacyPlatform, claimReminder } from '../src/utils/updateReminder.mjs';
const ios = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_4 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148';
const android = 'Mozilla/5.0 (Linux; Android 15; Pixel 9 Build/AP4A; wv) AppleWebKit/537.36 Version/4.0 Chrome/133.0 Mobile Safari/537.36';
test('old wrappers qualify, current wrappers and browsers do not', () => {
  assert.equal(legacyPlatform({userAgent: ios}), 'ios');
  assert.equal(legacyPlatform({userAgent: android}), 'android');
  for (const userAgent of [ios, android]) assert.equal(legacyPlatform({userAgent, search:'?native=1'}), null);
  assert.equal(legacyPlatform({userAgent: ios + ' Safari/604.1'}), null);
  assert.equal(legacyPlatform({userAgent: ios + ' CriOS/133.0'}), null);
  assert.equal(legacyPlatform({userAgent: android.replace('; wv)', ')')}), null);
  assert.equal(legacyPlatform({userAgent: 'Mozilla/5.0 (Macintosh) AppleWebKit/605.1.15 Safari/605.1.15'}), null);
});
test('one display per local calendar day across reloads', () => {
  const values = new Map();
  const storage = {getItem: k => values.get(k), setItem: (k,v) => values.set(k,v)};
  assert.equal(claimReminder(storage, new Date(2026,9,1,8)), true);
  assert.equal(claimReminder(storage, new Date(2026,9,1,23,59)), false);
  assert.equal(claimReminder(storage, new Date(2026,9,2,0,1)), true);
});
test('unavailable storage does not cause an endlessly repeated prompt', () => {
  assert.equal(claimReminder({getItem(){throw Error('denied');}}), false);
});

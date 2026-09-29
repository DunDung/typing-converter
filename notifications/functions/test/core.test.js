const { test } = require('node:test');
const assert = require('node:assert/strict');
const { authorized, purchase, deliver } = require('../core');
const starts = 1700000000000;
const event = { id: 'event1', transaction_id: 'txn1', type: 'NON_RENEWING_PURCHASE', environment: 'PRODUCTION', store: 'APP_STORE', app_id: 'appb0f13c3fd3', product_id: 'ad_free_lifetime', purchased_at_ms: starts + 1000, price_in_purchased_currency: 1900, currency: 'KRW' };

test('authorization requires a non-empty exact bearer secret', () => {
  assert.equal(authorized('Bearer abc', 'abc'), true);
  for (const value of [undefined, '', 'abc', 'Bearer def', 'Bearer abc extra']) assert.equal(authorized(value, 'abc'), false);
  assert.equal(authorized('Bearer ', ''), false);
});
test('accepts paid iOS and Android purchases with localized amount', () => {
  assert.match(purchase(event, starts).params.comment, /1,900/);
  const android = purchase({ ...event, store: 'PLAY_STORE', app_id: 'app4d8385151b', product_id: 'ad_free_lifetime:buy' }, starts);
  assert.match(android.params.comment, /Android/);
});
test('ignores sandbox, restoration history, other apps/products, zero price and malformed events', () => {
  for (const patch of [{ environment: 'SANDBOX' }, { type: 'TRANSFER' }, { type: 'INITIAL_PURCHASE' }, { purchased_at_ms: starts - 1 }, { product_id: 'other' }, { app_id: 'other' }, { transaction_id: '' }, { currency: 'bad' }, { price_in_purchased_currency: 0 }, { purchased_at_ms: NaN }]) assert.equal(purchase({ ...event, ...patch }, starts), null);
  assert.equal(purchase(null, starts), null);
  assert.equal(purchase(event, NaN), null);
});
test('transaction key remains stable across replayed event IDs and exposes no customer details', () => {
  assert.equal(purchase(event, starts).key, purchase({ ...event, id: 'event2' }, starts).key);
  assert.doesNotMatch(JSON.stringify(purchase(event, starts)), /txn1/);
});
test('successful delivery is marked sent and duplicate/reentrant attempts never send', async () => {
  let calls = 0, saved = false;
  const item = purchase(event, starts);
  const result = await deliver(item, { claim: async () => 'claimed', sent: async () => { saved = true; } }, async () => { calls++; });
  assert.equal(result.result, 'sent'); assert.equal(saved, true);
  for (const claim of ['sent', 'busy', 'uncertain']) await deliver(item, { claim: async () => claim }, async () => { calls++; });
  assert.equal(calls, 1);
});
test('explicit rejection is retryable; timeout is held for reconciliation', async () => {
  for (const [error, expected] of [[Object.assign(new Error('rejected'), { definitelyRejected: true }), 'failed'], [new Error('timeout'), 'uncertain']]) {
    let status;
    const result = await deliver(purchase(event, starts), { claim: async () => 'claimed', fail: async (_, s) => { status = s; } }, async () => { throw error; });
    assert.equal(status, expected); assert.equal(result.status, 503);
  }
});
test('mail success followed by storage failure does not claim success', async () => {
  const result = await deliver(purchase(event, starts), { claim: async () => 'claimed', sent: async () => { throw new Error('offline'); } }, async () => {});
  assert.equal(result.result, 'needs_reconciliation');
});

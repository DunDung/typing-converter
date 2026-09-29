const { createHash, timingSafeEqual } = require('node:crypto');

const STORES = { APP_STORE: 'iOS · App Store', PLAY_STORE: 'Android · Google Play' };
const APPS = { APP_STORE: 'appb0f13c3fd3', PLAY_STORE: 'app4d8385151b' };

function authorized(actual, secret) {
  if (!secret || typeof actual !== 'string') return false;
  const a = Buffer.from(actual);
  const b = Buffer.from(`Bearer ${secret}`);
  return a.length === b.length && timingSafeEqual(a, b);
}

function purchase(event, startsAt) {
  if (!event || event.type !== 'NON_RENEWING_PURCHASE' || event.environment !== 'PRODUCTION') return null;
  if (!APPS[event.store] || APPS[event.store] !== event.app_id) return null;
  if (!['ad_free_lifetime', 'ad_free_lifetime:buy'].includes(event.product_id)) return null;
  if (typeof event.id !== 'string' || !event.id || typeof event.transaction_id !== 'string' || !event.transaction_id) return null;
  if (!Number.isFinite(event.purchased_at_ms) || !Number.isFinite(startsAt) || event.purchased_at_ms < startsAt) return null;
  if (!Number.isFinite(event.price_in_purchased_currency) || event.price_in_purchased_currency <= 0) return null;
  if (typeof event.currency !== 'string' || !/^[A-Z]{3}$/.test(event.currency)) return null;
  const key = createHash('sha256').update(`${event.store}:${event.transaction_id}`).digest('hex');
  let amount;
  try {
    amount = new Intl.NumberFormat('ko-KR', { style: 'currency', currency: event.currency }).format(event.price_in_purchased_currency);
  } catch { return null; }
  const when = new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', dateStyle: 'medium', timeStyle: 'medium', hour12: false }).format(event.purchased_at_ms);
  return {
    key,
    metadata: { eventId: event.id, store: event.store, purchasedAt: event.purchased_at_ms },
    params: {
      nickname: '한영타변환기 광고 제거 구매',
      comment: `광고 제거 상품이 구매되었어요.\n\n상품: 광고 제거 · 1회 구매\n스토어: ${STORES[event.store]}\n결제 금액: ${amount} (${event.currency})\n구매 시각: ${when} (한국 시간)\n\n표시 금액은 고객 결제 금액이며, 스토어 수수료·세금 차감 후 정산액과 다를 수 있습니다.`,
    },
  };
}

// Store adapter uses a Firestore transaction, never an in-memory deduplication cache.
async function deliver(item, store, send) {
  const claim = await store.claim(item);
  if (claim === 'sent') return { status: 200, result: 'duplicate' };
  if (claim === 'busy') return { status: 503, result: 'retry' };
  if (claim === 'uncertain') return { status: 503, result: 'needs_reconciliation' };
  try {
    await send(item.params);
  } catch (error) {
    // A timeout can happen after the provider accepted mail. Do not blindly resend.
    await store.fail(item.key, error.definitelyRejected === true ? 'failed' : 'uncertain');
    return { status: 503, result: 'mail_failed' };
  }
  try {
    await store.sent(item.key);
  } catch {
    // The durable "sending" record becomes uncertain when its lease expires.
    return { status: 503, result: 'needs_reconciliation' };
  }
  return { status: 200, result: 'sent' };
}

module.exports = { authorized, purchase, deliver };

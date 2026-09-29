const { onRequest } = require('firebase-functions/v2/https');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { authorized, purchase, deliver } = require('./core');

initializeApp();
const db = getFirestore();
const collection = db.collection('purchaseEmailNotifications');
const store = {
  claim: item => db.runTransaction(async tx => {
    const ref = collection.doc(item.key);
    const doc = await tx.get(ref);
    const previous = doc.data();
    if (previous?.status === 'sent') return 'sent';
    if (previous?.status === 'uncertain') return 'uncertain';
    if (previous?.status === 'sending') return previous.leaseUntil > Date.now() ? 'busy' : 'uncertain';
    tx.set(ref, { ...item.metadata, status: 'sending', leaseUntil: Date.now() + 120000, updatedAt: FieldValue.serverTimestamp() });
    return 'claimed';
  }),
  sent: key => collection.doc(key).update({ status: 'sent', sentAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() }),
  fail: (key, status) => collection.doc(key).update({ status, updatedAt: FieldValue.serverTimestamp() }),
};

async function sendMail(params) {
  const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(15000),
    body: JSON.stringify({
      service_id: 'service_2syktss',
      template_id: 'template_4nk0rnw',
      user_id: 'user_FRGW9AFFOhL8ApQvS3xev',
      accessToken: process.env.EMAILJS_PRIVATE_KEY,
      template_params: params,
    }),
  });
  if (!response.ok) {
    const error = new Error(`Email provider status ${response.status}`);
    error.definitelyRejected = response.status >= 400 && response.status < 500;
    throw error;
  }
}

exports.purchaseNotification = onRequest({
  region: 'asia-northeast3',
  memory: '256MiB',
  minInstances: 0,
  maxInstances: 1,
  concurrency: 1,
  timeoutSeconds: 45,
  cors: false,
  invoker: 'public',
  serviceAccount: 'purchase-notifier@typing-converter-rc.iam.gserviceaccount.com',
  secrets: ['REVENUECAT_WEBHOOK_SECRET', 'EMAILJS_PRIVATE_KEY'],
}, async (req, res) => {
  res.set('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).send('Method not allowed');
  if (!authorized(req.get('authorization'), process.env.REVENUECAT_WEBHOOK_SECRET)) return res.status(401).send('Unauthorized');
  if (!req.is('application/json') || (req.rawBody?.length || 0) > 262144) return res.status(400).send('Invalid request');
  if (req.body?.event?.type === 'TEST') return res.status(200).send('Test accepted; no email sent');
  if (!process.env.EMAILJS_PRIVATE_KEY || !process.env.NOTIFY_FROM_MS) return res.status(503).send('Not configured');
  const item = purchase(req.body?.event, Number(process.env.NOTIFY_FROM_MS));
  if (!item) return res.status(200).send('Ignored');
  try {
    const result = await deliver(item, store, sendMail);
    if (result.status !== 200) console.error('Purchase notification delivery requires attention', { key: item.key, result: result.result });
    return res.status(result.status).send(result.result);
  } catch {
    console.error('Purchase notification storage unavailable');
    return res.status(503).send('Retry later');
  }
});

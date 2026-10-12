export const MEASUREMENT_ID = 'G-00MX9HGYFK';
const CONSENT_KEY = 'typing-usage-analytics-consent';
const EVENTS = new Set(['converter_open', 'result_copy']);
export function usageSurface(host) {
  const ua = host.navigator.userAgent;
  const app = new URLSearchParams(host.location.search).get('native') === '1' || !!host.ReactNativeWebView || /; wv\)/.test(ua) || (/iPhone|iPad|iPod/.test(ua) && !/Safari|CriOS|FxiOS|EdgiOS/.test(ua));
  return app ? 'app_webview' : 'web_browser';
}
export function createUsageAnalytics(host) {
  let allowed = false;
  let started = false;
  const production = host.location.hostname === 'dundung.github.io';
  const tag = function () { host.dataLayer ||= []; host.dataLayer.push(arguments); };
  const track = (event, direction) => {
    if (!production || !allowed || !EVENTS.has(event)) return;
    tag('event', event, {send_to: MEASUREMENT_ID, usage_surface: usageSurface(host),
      ...(direction === 'toKorean' || direction === 'toEnglish' ? {conversion_direction: direction} : {})});
  };
  const setConsent = value => {
    allowed = value === 'granted';
    try { host.localStorage.setItem(CONSENT_KEY, allowed ? 'granted' : 'denied'); } catch { /* no persistence */ }
    if (!production) return;
    host[`ga-disable-${MEASUREMENT_ID}`] = !allowed;
    if (started) tag('consent', 'update', {analytics_storage: allowed ? 'granted' : 'denied'});
    if (!allowed || started) return;
    started = true;
    host.gtag = tag;
    tag('consent', 'default', {analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied'});
    tag('js', new Date());
    tag('config', MEASUREMENT_ID, {send_page_view: false, allow_google_signals: false,
      allow_ad_personalization_signals: false, page_location: 'https://dundung.github.io/typing-converter/',
      page_referrer: '', page_title: '한영타변환기', user_properties: {usage_surface: usageSurface(host)}});
    const script = host.document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
    host.document.head.appendChild(script);
    track('converter_open');
  };
  let consent = null;
  try { consent = host.localStorage.getItem(CONSENT_KEY); } catch { /* default off */ }
  if (consent === 'granted') setConsent(consent);
  return {track, setConsent, consent};
}

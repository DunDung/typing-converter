const KEY = 'typing-converter-update-reminder-day';
export const storeLinks = {
  ios: 'https://apps.apple.com/kr/app/id6745451167',
  android: 'https://play.google.com/store/apps/details?id=com.typing_converter',
};

// Old wrappers have neither a version bridge nor the new native=1 URL marker.
// Keep normal browsers and every new wrapper out of this legacy-only prompt.
export function legacyPlatform({ search = '', userAgent = '', maxTouchPoints = 0 }) {
  if (new URLSearchParams(search).get('native') === '1') return null;
  if (/Android/.test(userAgent) && /; wv\)/.test(userAgent)) return 'android';
  const ios = /iPhone|iPad|iPod/.test(userAgent) || (/Macintosh/.test(userAgent) && maxTouchPoints > 1);
  if (ios && /AppleWebKit/.test(userAgent) && !/Safari|CriOS|FxiOS|EdgiOS|OPiOS/.test(userAgent)) return 'ios';
  return null;
}

export function localDay(date) {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

export function claimReminder(storage, date = new Date()) {
  try {
    const day = localDay(date);
    if (storage.getItem(KEY) === day) return false;
    storage.setItem(KEY, day);
    return true;
  } catch {
    // Without persistent storage we cannot enforce the daily limit.
    return false;
  }
}

import test from 'node:test';
import assert from 'node:assert/strict';
import {createUsageAnalytics, MEASUREMENT_ID} from '../src/utils/usageAnalytics.mjs';
function fixture(hostname = 'dundung.github.io') {
 const store = new Map(); const scripts=[];
 const host={location:{hostname,search:'?native=1&text=PRIVATE'},navigator:{userAgent:'iPhone'},localStorage:{getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v)},document:{createElement:()=>({}),head:{appendChild:x=>scripts.push(x)}}};
 return {host,scripts};
}
test('no Analytics script or events before consent',()=>{
 const {host,scripts}=fixture(); const a=createUsageAnalytics(host); a.track('result_copy','toKorean');
 assert.equal(scripts.length,0); assert.equal(host.dataLayer,undefined);
});
test('allowlist excludes arbitrary events, parameters and URL content',()=>{
 const {host,scripts}=fixture(); const a=createUsageAnalytics(host); a.setConsent('granted'); a.track('result_copy','toKorean'); a.track('PRIVATE','PRIVATE');
 assert.equal(scripts.length,1); assert.ok(!JSON.stringify(host.dataLayer).includes('PRIVATE'));
 assert.ok(JSON.stringify(host.dataLayer).includes('app_webview'));
 a.setConsent('denied'); const count=host.dataLayer.length; a.track('result_copy','toEnglish'); assert.equal(host.dataLayer.length,count);
 assert.equal(host[`ga-disable-${MEASUREMENT_ID}`],true);
});
test('development hosts never load production tracking',()=>{
 const {host,scripts}=fixture('localhost'); createUsageAnalytics(host).setConsent('granted'); assert.equal(scripts.length,0);
});

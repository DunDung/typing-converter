if(!self.define){let e,n={};const r=(r,t)=>(r=new URL(r+".js",t).href,n[r]||new Promise((n=>{if("document"in self){const e=document.createElement("script");e.src=r,e.onload=n,document.head.appendChild(e)}else e=r,importScripts(r),n()})).then((()=>{let e=n[r];if(!e)throw new Error(`Module ${r} didn’t register its module`);return e})));self.define=(t,i)=>{const o=e||("document"in self?document.currentScript.src:"")||location.href;if(n[o])return;let s={};const c=e=>r(e,o),l={module:{uri:o},exports:s,require:c};n[o]=Promise.all(t.map((e=>l[e]||c(e)))).then((e=>(i(...e),s)))}}define(["./workbox-db5fc017"],(function(e){"use strict";e.setCacheNameDetails({prefix:"frontend"}),self.addEventListener("message",(e=>{e.data&&"SKIP_WAITING"===e.data.type&&self.skipWaiting()})),e.precacheAndRoute([{url:"/typing-converter/css/app.cd8aa391.css",revision:null},{url:"/typing-converter/css/chunk-vendors.67c156c4.css",revision:null},{url:"/typing-converter/fonts/materialdesignicons-webfont.21f691f0.ttf",revision:null},{url:"/typing-converter/fonts/materialdesignicons-webfont.54b0f60d.woff2",revision:null},{url:"/typing-converter/fonts/materialdesignicons-webfont.5d875350.eot",revision:null},{url:"/typing-converter/fonts/materialdesignicons-webfont.d671cbf6.woff",revision:null},{url:"/typing-converter/index.html",revision:"3b77a9a2cc17e21eb4f8c7abe6e48b8c"},{url:"/typing-converter/js/app.b595e60c.js",revision:null},{url:"/typing-converter/js/chunk-vendors.1b37d5a8.js",revision:null},{url:"/typing-converter/js/webfontloader.c69cbc4f.js",revision:null},{url:"/typing-converter/manifest.json",revision:"4b14c64efaf846819b9a229b4193c8b7"},{url:"/typing-converter/robots.txt",revision:"b6216d61c03e6ce0c9aea6ca7808f7ca"}],{})}));
//# sourceMappingURL=service-worker.js.map

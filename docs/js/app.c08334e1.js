(function(){"use strict";var e={7838:function(e,t,n){var o=n(9242),r=n(3396),i=n(7718),a=n(9271);function u(e,t,n,o,u,c){const l=(0,r.up)("router-view");return(0,r.wg)(),(0,r.j4)(i.q,{id:"app"},{default:(0,r.w5)((()=>[(0,r.Wm)(a.O,null,{default:(0,r.w5)((()=>[(0,r.Wm)(l)])),_:1})])),_:1})}var c={name:"App",data:()=>({})},l=n(89);const d=(0,l.Z)(c,[["render",u]]);var f=d,s=n(2483),p=n(1201),h=n(1539),m=n(6375),g=n(4846),b=n(1275),v=n(9782),y=n(165),O=n(4842);const A=e=>((0,r.dD)("data-v-214e1e8a"),e=e(),(0,r.Cn)(),e),w=A((()=>(0,r._)("h1",null,"한/영타 변환기",-1))),x=A((()=>(0,r._)("a",{href:"https://hits.seeyoufarm.com",style:{float:"right"}},[(0,r._)("img",{src:"https://hits.seeyoufarm.com/api/count/incr/badge.svg?url=https%3A%2F%2Fdundung.github.io%2Ftyping-converter%2F&count_bg=%23C4C4C4&title_bg=%238A8A8A&icon=&icon_color=%23E7E7E7&title=%5Eo%5E&edge_flat=false"})],-1)));function C(e,t,n,o,i,a){return(0,r.wg)(),(0,r.iD)(r.HY,null,[(0,r.Wm)(h.K,{class:"pb-0"},{default:(0,r.w5)((()=>[w,x])),_:1}),(0,r.Wm)(h.K,{fluid:""},{default:(0,r.w5)((()=>[(0,r.Wm)(b.r,{modelValue:e.mappingTarget,"onUpdate:modelValue":t[0]||(t[0]=t=>e.mappingTarget=t),inline:"","hide-details":""},{default:(0,r.w5)((()=>[(0,r.Wm)(g.R,{label:"영어 -> 한글",value:"toKorean"}),(0,r.Wm)(g.R,{label:"한글 -> 영어",value:"toEnglish"})])),_:1},8,["modelValue"]),(0,r.Wm)(O.z,{clearable:"","clear-icon":"mdi-trash-can-outline",rows:"10","auto-grow":"",label:"여기에 변환할 문장을 입력해주세요.",modelValue:e.inputText,"onUpdate:modelValue":t[1]||(t[1]=t=>e.inputText=t)},null,8,["modelValue"]),(0,r.Wm)(O.z,{readonly:"",rows:"10","append-inner-icon":"mdi-content-copy","onClick:appendInner":e.copy,label:"변환 결과","auto-grow":"",modelValue:e.convertInputText,"onUpdate:modelValue":t[2]||(t[2]=t=>e.convertInputText=t)},null,8,["onClick:appendInner","modelValue"]),(0,r.Wm)(p._,{class:"mx-auto"},{default:(0,r.w5)((()=>[(0,r.Wm)(y.hw,{modelValue:e.inputComment,"onUpdate:modelValue":t[3]||(t[3]=t=>e.inputComment=t),label:"댓글을 남겨주세요!",required:"","hide-details":"","append-inner-icon":"mdi-plus-circle-outline","onClick:appendInner":e.createComment},null,8,["modelValue","onClick:appendInner"]),(0,r.Wm)(m.i,{items:e.comments,"item-props":"",lines:"three",border:"border"},null,8,["items"])])),_:1}),(0,r.Wm)(v.v,{timeout:1e3,modelValue:e.snackbarFlag,"onUpdate:modelValue":t[4]||(t[4]=t=>e.snackbarFlag=t),color:"indigo",variant:"tonal",rounded:"pill"},{default:(0,r.w5)((()=>[(0,r.Uk)(" 복사 완료 ")])),_:1},8,["modelValue"])])),_:1})],64)}n(7658);const T="rRseEfaqQtTdwWczxvgkoiOjpuPhynbml",_="ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎㅏㅐㅑㅒㅓㅔㅕㅖㅗㅛㅜㅠㅡㅣ",k="ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ",j="ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ",E="ㄱㄲㄳㄴㄵㄶㄷㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅄㅅㅆㅇㅈㅊㅋㅌㅍㅎ",V=e=>{let t="";if(0===e.length)return t;for(let n=0;n<e.length;n++){let o=e.charAt(n),r=o.charCodeAt(0),i=k.indexOf(o),a=j.indexOf(o),u=E.indexOf(o),c=[-1,-1,-1,-1,-1];44032<=r&&r<=55203?(r-=44032,c[0]=Math.floor(r/588),c[1]=Math.floor(r/28)%21,c[3]=r%28-1):-1!==i?c[0]=i:-1!==a?c[1]=a:-1!==u?c[3]=u:t+=o,-1!==c[1]&&(9===c[1]?(c[1]=27,c[2]=19):10===c[1]?(c[1]=27,c[2]=20):11===c[1]?(c[1]=27,c[2]=32):14===c[1]?(c[1]=29,c[2]=23):15===c[1]?(c[1]=29,c[2]=24):16===c[1]?(c[1]=29,c[2]=32):19===c[1]?(c[1]=31,c[2]=32):(c[1]=_.indexOf(j.charAt(c[1])),c[2]=-1)),-1!==c[3]&&(2===c[3]?(c[3]=0,c[4]=9):4===c[3]?(c[3]=2,c[4]=12):5===c[3]?(c[3]=2,c[4]=18):8===c[3]?(c[3]=5,c[4]=0):9===c[3]?(c[3]=5,c[4]=6):10===c[3]?(c[3]=5,c[4]=7):11===c[3]?(c[3]=5,c[4]=9):12===c[3]?(c[3]=5,c[4]=16):13===c[3]?(c[3]=5,c[4]=17):14===c[3]?(c[3]=5,c[4]=18):17===c[3]?(c[3]=7,c[4]=9):(c[3]=_.indexOf(E.charAt(c[3])),c[4]=-1));for(let e=0;e<5;e++)-1!==c[e]&&(t+=T.charAt(c[e]))}return t},W=e=>{let t="";if(0===e.length)return t;let n=-1,o=-1,r=-1;for(let i=0;i<e.length;i++){let a=e.charAt(i),u=T.indexOf(a);if(-1===u)-1!==n?t+=-1!==o?P(n,o,r):k.charAt(n):-1!==o?t+=j.charAt(o):-1!==r&&(t+=E.charAt(r)),n=-1,o=-1,r=-1,t+=a;else if(u<19)-1!==o?-1===n?(t+=j.charAt(o),o=-1,n=k.indexOf(_.charAt(u))):-1===r?(r=E.indexOf(_.charAt(u)),-1===r&&(t+=P(n,o,r),n=k.indexOf(_.charAt(u)),o=-1)):0===r&&9===u?r=2:3===r&&12===u?r=4:3===r&&18===u?r=5:7===r&&0===u?r=8:7===r&&6===u?r=9:7===r&&7===u?r=10:7===r&&9===u?r=11:7===r&&16===u?r=12:7===r&&17===u?r=13:7===r&&18===u?r=14:16===r&&9===u?r=17:(t+=P(n,o,r),n=k.indexOf(_.charAt(u)),o=-1,r=-1):-1===n?(-1!==r&&(t+=E.charAt(r),r=-1),n=k.indexOf(_.charAt(u))):0===n&&9===u?(n=-1,r=2):2===n&&12===u?(n=-1,r=4):2===n&&18===u?(n=-1,r=5):5===n&&0===u?(n=-1,r=8):5===n&&6===u?(n=-1,r=9):5===n&&7===u?(n=-1,r=10):5===n&&9===u?(n=-1,r=11):5===n&&16===u?(n=-1,r=12):5===n&&17===u?(n=-1,r=13):5===n&&18===u?(n=-1,r=14):7===n&&9===u?(n=-1,r=17):(t+=k.charAt(n),n=k.indexOf(_.charAt(u)));else{if(-1!==r){let e;2===r?(r=0,e=9):4===r?(r=3,e=12):5===r?(r=3,e=18):8===r?(r=7,e=0):9===r?(r=7,e=6):10===r?(r=7,e=7):11===r?(r=7,e=9):12===r?(r=7,e=16):13===r?(r=7,e=17):14===r?(r=7,e=18):17===r?(r=16,e=9):(e=k.indexOf(E.charAt(r)),r=-1),t+=-1!==n?P(n,o,r):E.charAt(r),n=e,o=-1,r=-1}-1===o?o=j.indexOf(_.charAt(u)):8===o&&19===u?o=9:8===o&&20===u?o=10:8===o&&32===u?o=11:13===o&&23===u?o=14:13===o&&24===u?o=15:13===o&&32===u?o=16:18===o&&32===u?o=19:(-1!==n?(t+=P(n,o,r),n=-1):t+=j.charAt(o),o=-1,t+=_.charAt(u))}}return-1!==n?t+=-1!==o?P(n,o,r):k.charAt(n):-1!==o?t+=j.charAt(o):-1!==r&&(t+=E.charAt(r)),t},P=(e,t,n)=>String.fromCharCode(44032+21*e*28+28*t+n+1);var F=(0,r.aZ)({name:"HomeView",data:()=>({mappingTarget:"toKorean",inputText:"",snackbarFlag:!1,githubToken:"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",inputComment:"",comments:[]}),computed:{convertInputText(){return"toEnglish"===this.mappingTarget?V(this.inputText):W(this.inputText)}},methods:{copy(){const e=document.createElement("textarea");e.value=this.convertInputText,e.style.position="fixed",e.style.top="-9999px",e.style.left="-9999px",document.body.appendChild(e),e.select(),document.execCommand("copy"),document.body.removeChild(e),this.snackbarFlag=!0},createComment(){fetch("https://api.github.com/repos/dundung/typing-converter/issues",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"token "+this.githubToken},body:JSON.stringify({title:this.comments.length+1+"번째 댓글",body:this.inputComment})}).then((()=>{this.inputComment="",window.location.reload()}))}},created(){fetch("https://api.github.com/repos/dundung/typing-converter/issues",{method:"GET",headers:{Authorization:"token "+this.githubToken}}).then((e=>e.json())).then((e=>{for(let t in e)this.comments.push({title:e[t].body,subtitle:e[t].created_at.replace("T","  ").replace("Z","").slice(0,-3)}),parseInt(t)!==e.length-1&&this.comments.push({type:"divider"})}))}});const I=(0,l.Z)(F,[["render",C],["__scopeId","data-v-214e1e8a"]]);var M=I;const S=[{path:"/",name:"home",component:M}],R=(0,s.p7)({history:(0,s.PO)("/typing-converter/"),routes:S});var U=R,z=n(65),N=(0,z.MT)({state:{},getters:{},mutations:{},actions:{},modules:{}}),q=(n(9773),n(8957)),K=(0,q.Rd)();async function Z(){const e=await n.e(461).then(n.t.bind(n,3657,23));e.load({google:{families:["Roboto:100,300,400,500,700,900&display=swap"]}})}Z(),(0,o.ri)(f).use(U).use(N).use(K).mount("#app")}},t={};function n(o){var r=t[o];if(void 0!==r)return r.exports;var i=t[o]={exports:{}};return e[o](i,i.exports,n),i.exports}n.m=e,function(){var e=[];n.O=function(t,o,r,i){if(!o){var a=1/0;for(d=0;d<e.length;d++){o=e[d][0],r=e[d][1],i=e[d][2];for(var u=!0,c=0;c<o.length;c++)(!1&i||a>=i)&&Object.keys(n.O).every((function(e){return n.O[e](o[c])}))?o.splice(c--,1):(u=!1,i<a&&(a=i));if(u){e.splice(d--,1);var l=r();void 0!==l&&(t=l)}}return t}i=i||0;for(var d=e.length;d>0&&e[d-1][2]>i;d--)e[d]=e[d-1];e[d]=[o,r,i]}}(),function(){n.n=function(e){var t=e&&e.__esModule?function(){return e["default"]}:function(){return e};return n.d(t,{a:t}),t}}(),function(){var e,t=Object.getPrototypeOf?function(e){return Object.getPrototypeOf(e)}:function(e){return e.__proto__};n.t=function(o,r){if(1&r&&(o=this(o)),8&r)return o;if("object"===typeof o&&o){if(4&r&&o.__esModule)return o;if(16&r&&"function"===typeof o.then)return o}var i=Object.create(null);n.r(i);var a={};e=e||[null,t({}),t([]),t(t)];for(var u=2&r&&o;"object"==typeof u&&!~e.indexOf(u);u=t(u))Object.getOwnPropertyNames(u).forEach((function(e){a[e]=function(){return o[e]}}));return a["default"]=function(){return o},n.d(i,a),i}}(),function(){n.d=function(e,t){for(var o in t)n.o(t,o)&&!n.o(e,o)&&Object.defineProperty(e,o,{enumerable:!0,get:t[o]})}}(),function(){n.f={},n.e=function(e){return Promise.all(Object.keys(n.f).reduce((function(t,o){return n.f[o](e,t),t}),[]))}}(),function(){n.u=function(e){return"js/webfontloader.c69cbc4f.js"}}(),function(){n.miniCssF=function(e){}}(),function(){n.g=function(){if("object"===typeof globalThis)return globalThis;try{return this||new Function("return this")()}catch(e){if("object"===typeof window)return window}}()}(),function(){n.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)}}(),function(){var e={},t="frontend:";n.l=function(o,r,i,a){if(e[o])e[o].push(r);else{var u,c;if(void 0!==i)for(var l=document.getElementsByTagName("script"),d=0;d<l.length;d++){var f=l[d];if(f.getAttribute("src")==o||f.getAttribute("data-webpack")==t+i){u=f;break}}u||(c=!0,u=document.createElement("script"),u.charset="utf-8",u.timeout=120,n.nc&&u.setAttribute("nonce",n.nc),u.setAttribute("data-webpack",t+i),u.src=o),e[o]=[r];var s=function(t,n){u.onerror=u.onload=null,clearTimeout(p);var r=e[o];if(delete e[o],u.parentNode&&u.parentNode.removeChild(u),r&&r.forEach((function(e){return e(n)})),t)return t(n)},p=setTimeout(s.bind(null,void 0,{type:"timeout",target:u}),12e4);u.onerror=s.bind(null,u.onerror),u.onload=s.bind(null,u.onload),c&&document.head.appendChild(u)}}}(),function(){n.r=function(e){"undefined"!==typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})}}(),function(){n.p="/typing-converter/"}(),function(){var e={143:0};n.f.j=function(t,o){var r=n.o(e,t)?e[t]:void 0;if(0!==r)if(r)o.push(r[2]);else{var i=new Promise((function(n,o){r=e[t]=[n,o]}));o.push(r[2]=i);var a=n.p+n.u(t),u=new Error,c=function(o){if(n.o(e,t)&&(r=e[t],0!==r&&(e[t]=void 0),r)){var i=o&&("load"===o.type?"missing":o.type),a=o&&o.target&&o.target.src;u.message="Loading chunk "+t+" failed.\n("+i+": "+a+")",u.name="ChunkLoadError",u.type=i,u.request=a,r[1](u)}};n.l(a,c,"chunk-"+t,t)}},n.O.j=function(t){return 0===e[t]};var t=function(t,o){var r,i,a=o[0],u=o[1],c=o[2],l=0;if(a.some((function(t){return 0!==e[t]}))){for(r in u)n.o(u,r)&&(n.m[r]=u[r]);if(c)var d=c(n)}for(t&&t(o);l<a.length;l++)i=a[l],n.o(e,i)&&e[i]&&e[i][0](),e[i]=0;return n.O(d)},o=self["webpackChunkfrontend"]=self["webpackChunkfrontend"]||[];o.forEach(t.bind(null,0)),o.push=t.bind(null,o.push.bind(o))}();var o=n.O(void 0,[998],(function(){return n(7838)}));o=n.O(o)})();
//# sourceMappingURL=app.c08334e1.js.map
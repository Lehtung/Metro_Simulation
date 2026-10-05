/* @file js/03-giao-dien.js — cài đặt giao diện 5.3.0 (const GD): nền tối / sáng / theo hệ thống, kiểu bố cục, màu nhấn, ngôn ngữ; hộp Cài đặt mở bằng nút bánh răng */
/* Lưu trên trình duyệt của máy (localStorage, khoá «mpct_giao_dien_v1»); không có quyền lưu thì vẫn chạy với mặc định.
   Đặt thuộc tính trên <html>: data-nen (toi|sang), data-bocuc (doc|ngang), data-nhan (lam|ngoc|ho) — CSS ở css/12-giao-dien-khung.css.
   Ngôn ngữ đổi qua App.setLang (js/90); App.setLang gọi lại GD.setLang để cập nhật nút và nhãn của nút bánh răng. */
const GD=(function(){
const KHOA='mpct_giao_dien_v1',MAC={nen:'toi',bocuc:'doc',nhan:'lam',lang:'vi'};
let cd=Object.assign({},MAC),lang='vi';
try{const s=JSON.parse(localStorage.getItem(KHOA)||'null');if(s&&typeof s==='object')for(const k in MAC)if(typeof s[k]==='string')cd[k]=s[k];}catch(e){}
const HOP={nen:['toi','sang','he'],bocuc:['doc','ngang'],nhan:['lam','ngoc','ho'],lang:['vi','en']};
for(const k in HOP)if(HOP[k].indexOf(cd[k])<0)cd[k]=MAC[k];
const EN={'Cài đặt giao diện và ngôn ngữ':'Display and language settings','Xanh lam':'Blue','Xanh ngọc':'Teal','Hổ phách':'Amber','Đóng':'Close'};
const _=s=>lang==='en'&&EN[s]?EN[s]:s;
let mq=null;try{mq=window.matchMedia('(prefers-color-scheme: dark)');}catch(e){}
const nenThuc=()=>cd.nen==='he'?(mq&&mq.matches?'toi':'sang'):cd.nen;
function luu(){try{localStorage.setItem(KHOA,JSON.stringify(cd));}catch(e){}}
function ap(){const h=document.documentElement,bc=h.dataset.bocuc;
 h.dataset.nen=nenThuc();h.dataset.bocuc=cd.bocuc;h.dataset.nhan=cd.nhan;capNhatNut();
 /* đổi bố cục làm đổi kích thước vùng nội dung: báo cho bản đồ Leaflet và biểu đồ vẽ lại */
 if(bc&&bc!==cd.bocuc)setTimeout(()=>{try{window.dispatchEvent(new Event('resize'));}catch(e){}},60);}
function capNhatNut(){const m=document.getElementById('mod-caidat');if(!m)return;
 m.querySelectorAll('[data-cd]').forEach(b=>{const on=cd[b.dataset.cd]===b.dataset.v||(b.dataset.cd==='lang'&&b.dataset.v===lang);
  b.classList.toggle('on',on);b.setAttribute('aria-checked',on?'true':'false');});}
function dat(k,v){if(!HOP[k]||HOP[k].indexOf(v)<0)return;cd[k]=v;luu();
 if(k==='lang'){try{App.setLang(v);}catch(e){console.error(e);}}else ap();}
function mo(){const m=document.getElementById('mod-caidat');if(!m)return;capNhatNut();m.hidden=false;
 const b=m.querySelector('[data-cd].on')||m.querySelector('button');if(b)try{b.focus();}catch(e){}}
function dong(){const m=document.getElementById('mod-caidat');if(m)m.hidden=true;try{document.getElementById('h_caidat').focus();}catch(e){}}
function macDinh(){const l=cd.lang;cd=Object.assign({},MAC,{lang:l});luu();ap();}
function setLang(x){lang=x;cd.lang=x;luu();const g=document.getElementById('h_caidat');
 if(g){g.title=_('Cài đặt giao diện và ngôn ngữ');g.setAttribute('aria-label',g.title);}
 document.querySelectorAll('#mod-caidat [aria-label]').forEach(e=>{if(!e.dataset.vi)e.dataset.vi=e.getAttribute('aria-label');const t=_(e.dataset.vi);e.setAttribute('aria-label',t);if(e.title)e.title=t;});
 capNhatNut();}
function gan(){const g=document.getElementById('h_caidat');if(g)g.addEventListener('click',mo);
 const m=document.getElementById('mod-caidat');
 if(m){m.querySelectorAll('[data-cd]').forEach(b=>b.addEventListener('click',()=>dat(b.dataset.cd,b.dataset.v)));
  const r=m.querySelector('[data-cd-mac]');if(r)r.addEventListener('click',macDinh);
  const c=m.querySelector('[data-close]');if(c)c.addEventListener('click',dong);}
 const pb=document.getElementById('h_pb');if(pb)try{pb.textContent='v'+window.APP_VERSION.so;}catch(e){}
 if(mq)try{mq.addEventListener('change',()=>{if(cd.nen==='he')ap();});}catch(e){}}
ap();
gan();                                                   /* khối script nằm cuối <body>: phần đánh dấu đã có sẵn */
return {mo,dong,dat,setLang,macDinh,lang:()=>cd.lang,cauHinh:()=>Object.assign({nenThuc:nenThuc()},cd)};
})();

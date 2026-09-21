/* @file js/khung/api.js — gọi máy chủ Google Apps Script
   Mọi yêu cầu là POST, thân là chuỗi JSON, không đặt tiêu đề riêng (Content-Type mặc định text/plain) để trình duyệt
   gửi "yêu cầu đơn giản", không cần preflight CORS — Apps Script trả lời qua googleusercontent.com có cho phép mọi nguồn.
   Mã phiên lưu trong sessionStorage: đóng thẻ trình duyệt là mất phiên. */
(function(){
'use strict';
const KHOA='kd_phien';
class LoiApi extends Error{constructor(ma,thongBao){super(thongBao);this.ma=ma;}}
function token(){try{return sessionStorage.getItem(KHOA)||'';}catch(e){return '';}}
function datToken(t){try{t?sessionStorage.setItem(KHOA,t):sessionStorage.removeItem(KHOA);}catch(e){}}
async function goi(hd,duLieu){
  const C=window.CAU_HINH_WEB||{}, url=String(C.API_URL||'');
  if(!/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(url)&&!C.CHO_PHEP_URL_KHAC)
    throw new LoiApi('CAU_HINH','Chưa cấu hình địa chỉ máy chủ. Mở tệp js/khung/cau-hinh.js và dán địa chỉ Web App của Google Apps Script vào API_URL.');
  const ctl=new AbortController(), hen=setTimeout(()=>ctl.abort(),C.THOI_GIAN_CHO_MS||90000);
  let r;
  try{ r=await fetch(url,{method:'POST',body:JSON.stringify(Object.assign({hd,token:token()},duLieu||{})),redirect:'follow',signal:ctl.signal,cache:'no-store'}); }
  catch(e){ throw new LoiApi('MANG',e&&e.name==='AbortError'?'Máy chủ phản hồi quá lâu, vui lòng thử lại.':'Không kết nối được máy chủ Google Apps Script. Kiểm tra mạng hoặc địa chỉ API_URL.'); }
  finally{ clearTimeout(hen); }
  if(!r.ok) throw new LoiApi('MANG','Máy chủ trả lỗi HTTP '+r.status+'.');
  let j;
  try{ j=await r.json(); }
  catch(e){ throw new LoiApi('MAY_CHU','Máy chủ không trả JSON — kiểm tra Web App đã triển khai với quyền truy cập "Anyone" (Bất kỳ ai).'); }
  if(!j||!j.ok){ if(j&&j.ma==='PHIEN') datToken(''); throw new LoiApi(j&&j.ma||'MAY_CHU',j&&j.loi||'Lỗi không xác định.'); }
  return j;
}
window.API={goi,token,datToken,LoiApi};
})();

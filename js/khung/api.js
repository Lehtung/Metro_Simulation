/* @file js/khung/api.js — gọi máy chủ Google Apps Script
   Mọi yêu cầu là POST, thân là chuỗi JSON, không đặt tiêu đề riêng (Content-Type mặc định text/plain) để trình duyệt
   gửi "yêu cầu đơn giản", không cần preflight CORS — Apps Script trả lời qua googleusercontent.com có cho phép mọi nguồn.
   Mã phiên lưu trong sessionStorage: đóng thẻ trình duyệt là mất phiên.

   THỬ LẠI. Apps Script không trả lời thẳng: nó chuyển hướng sang script.googleusercontent.com/macros/echo,
   và bước này thỉnh thoảng trả HTTP 404. Đây là trục trặc phía Google, không phải mã sai. Vì vậy:
   – mọi hành động CHỈ ĐỌC (kể cả đăng nhập) được thử lại tối đa 4 lần với giãn cách tăng dần, ngay trong lớp này,
     nên người dùng không phải tự bấm Đăng nhập nhiều lần nữa;
   – các hành động có GHI (đổi mật khẩu, tạo tài khoản, lưu dữ liệu…) KHÔNG tự thử lại, tránh ghi hai lần;
   – mỗi lần gọi kèm một chuỗi ngẫu nhiên '_n' để hai lần thử không bao giờ giống hệt nhau: yêu cầu trùng khớp
     từng byte có thể được Apps Script trả về cùng một user_content_key, tức là lặp lại đúng cái 404 vừa gặp. */
(function(){
'use strict';
const KHOA='kd_phien';
class LoiApi extends Error{constructor(ma,thongBao){super(thongBao);this.ma=ma;}}
function token(){try{return sessionStorage.getItem(KHOA)||'';}catch(e){return '';}}
function datToken(t){try{t?sessionStorage.setItem(KHOA,t):sessionStorage.removeItem(KHOA);}catch(e){}}
const nghi=ms=>new Promise(r=>setTimeout(r,ms));

/* Hành động chỉ đọc — an toàn khi gọi lại. Đăng nhập nằm trong danh sách này: gọi lại chỉ tạo phiên mới,
   và mật khẩu sai thì máy chủ trả lỗi ứng dụng (không phải lỗi mạng) nên không bị thử lại, không làm tăng số lần sai. */
const CHI_DOC={dang_nhap:1,khoi_dong:1,tai_ma:1,tai_thong_so:1,ds_nguoi_dung:1,nhat_ky:1,dang_xuat:1};
const CHO=[600,1500,3000,6000];

async function goiMot(hd,duLieu){
  const C=window.CAU_HINH_WEB||{}, url=String(C.API_URL||'');
  if(!/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(url)&&!C.CHO_PHEP_URL_KHAC)
    throw new LoiApi('CAU_HINH','Chưa cấu hình địa chỉ máy chủ. Mở tệp js/khung/cau-hinh.js và dán địa chỉ Web App của Google Apps Script vào API_URL.');
  const than=Object.assign({hd,token:token(),_n:Math.random().toString(36).slice(2)+Date.now().toString(36)},duLieu||{});
  const ctl=new AbortController(), hen=setTimeout(()=>ctl.abort(),C.THOI_GIAN_CHO_MS||90000);
  let r;
  try{ r=await fetch(url,{method:'POST',body:JSON.stringify(than),redirect:'follow',signal:ctl.signal,cache:'no-store'}); }
  catch(e){ throw new LoiApi('MANG',e&&e.name==='AbortError'?'Máy chủ phản hồi quá lâu.':'Không kết nối được máy chủ Google Apps Script.'); }
  finally{ clearTimeout(hen); }
  if(!r.ok) throw new LoiApi('MANG','Máy chủ trả lỗi HTTP '+r.status+'.');
  let j;
  try{ j=await r.json(); }
  catch(e){ throw new LoiApi('MANG','Máy chủ không trả JSON (phản hồi có thể bị cắt giữa chừng).'); }
  if(!j||!j.ok){ if(j&&j.ma==='PHIEN') datToken(''); throw new LoiApi(j&&j.ma||'MAY_CHU',j&&j.loi||'Lỗi không xác định.'); }
  return j;
}

/* tuyChon.bao(lanThu, tongLan, thongBaoLanTruoc) — để màn hình chờ hiện "đang thử lại".
   tuyChon.thuLai — ép số lần thử lại, dùng khi nơi gọi muốn tự lo việc thử lại. */
async function goi(hd,duLieu,tuyChon){
  const t=tuyChon||{};
  const soLan=t.thuLai!=null?t.thuLai:(CHI_DOC[hd]?CHO.length:0);
  let cuoi=null;
  for(let i=0;i<=soLan;i++){
    if(i){ if(t.bao) try{t.bao(i,soLan,cuoi&&cuoi.message);}catch(e){} await nghi(CHO[Math.min(i-1,CHO.length-1)]); }
    try{ return await goiMot(hd,duLieu); }
    catch(e){ if(!e||e.ma!=='MANG') throw e; cuoi=e; }
  }
  cuoi.message=cuoi.message+' Đã thử lại '+soLan+' lần. '
    +'Lỗi 404 ở đây phát sinh tại bước chuyển hướng của Apps Script sang script.googleusercontent.com, không phải do địa chỉ sai. '
    +'Cách xử lý: trong Chrome mở Cài đặt → Quyền riêng tư và bảo mật → Cookie của bên thứ ba → thêm '
    +'[*.]googleusercontent.com và [*.]google.com vào danh sách được phép; hoặc mở trang ở cửa sổ ẩn danh và chỉ đăng nhập một tài khoản Google.';
  throw cuoi;
}
window.API={goi,token,datToken,LoiApi};
})();

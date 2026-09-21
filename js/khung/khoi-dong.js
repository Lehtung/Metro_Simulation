/* @file js/khung/khoi-dong.js — điều phối bản web: đăng nhập → tải dữ liệu, thông số, mã logic từ Apps Script → khởi động ứng dụng
   Trình tự: (1) có phiên cũ thì khôi phục, không thì hiện màn hình đăng nhập; (2) nhận "gói" gồm dữ liệu (các bảng DL_*),
   thông số (THONG_SO) và mã logic đã xáo trộn; (3) dựng CORE từ bảng; (4) chèn các khối mã logic theo đúng thứ tự;
   (5) chờ sự kiện app:san-sang rồi áp thông số dùng chung; (6) khi người dùng nạp tệp Excel dữ liệu mẫu (sự kiện
   app:nap-du-lieu) thì ghi đè dữ liệu tuyến và thông số lên Google Sheet cho lần sau. */
(function(){
'use strict';
const el=id=>document.getElementById(id);
const CAP={xem:1,bien_tap:2,quan_tri:3};
let ND=null, daNap=false;
function chu(s){el('kd_dang_tai_chu').textContent=s;}
function loi(s){const b=el('kd_loi');b.textContent=s||'';b.hidden=!s;}
function hien(phan){['kd_f_dn','kd_f_doi','kd_dang_tai'].forEach(i=>{el(i).hidden=(i!==phan);});}
function manHinh(on){el('kd_man').hidden=!on;document.body.classList.toggle('kd-khoa',on);}
function coQuyen(v){return !!ND&&(CAP[ND.vai_tro]||0)>=(CAP[v]||9);}
function bao(s){try{if(daNap&&window.App&&App.toast){App.toast(s);return;}}catch(e){}loi(s);}
function capNhatMenu(){
  if(!ND) return;
  el('kd_nd_chu').textContent=ND.ho_ten||ND.ten; el('kd_nd_ten').textContent=(ND.ho_ten||ND.ten)+' ('+ND.ten+')';
  el('kd_nd_vai').textContent=ND.ten_vai_tro||ND.vai_tro;
  document.querySelectorAll('#kd_menu [data-quyen]').forEach(b=>{b.hidden=!coQuyen(b.dataset.quyen);});
}

/* Mã kiểm tra 32 bit (FNV-1a trên từng đơn vị UTF-16) — đúng công thức bam32_ của máy chủ. */
function bam32(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h.toString(16);}

const nghi=ms=>new Promise(r=>setTimeout(r,ms));

/* Tải một phần mã, có thử lại.
   Hai loại trục trặc đều được xử lý ở đây:
   – đường truyền: Apps Script chuyển hướng phản hồi sang script.googleusercontent.com và bước này thỉnh thoảng
     trả HTTP 404 hoặc đứt giữa chừng, nhất là khi gọi liên tiếp nhiều lần. Đây là trục trặc nhất thời của Google,
     gọi lại sau một nhịp là được;
   – sai lệch nội dung: độ dài hoặc mã kiểm tra không khớp số máy chủ báo.
   Lỗi về phiên, quyền hay dữ liệu thì KHÔNG thử lại, vì gọi lại cũng cho kết quả ấy.
   Máy chủ trước 3.24.5 không gửi 'dai'/'ks' — khi đó bỏ qua bước kiểm nội dung. */
const CHO_THU_LAI=[700,1800,3500,6000];
async function taiPhanMa(i){
  let cuoi='';
  for(let lan=0;lan<=CHO_THU_LAI.length;lan++){
    if(lan) { chu('Đang nạp mã tính toán… phần '+(i+1)+', thử lại lần '+lan+'…'); await nghi(CHO_THU_LAI[lan-1]); }
    try{
      const p=await API.goi('tai_ma',{phan:i});
      const ma=String(p.ma==null?'':p.ma);
      if(p.dai!=null&&ma.length!==p.dai){cuoi='nhận '+ma.length+'/'+p.dai+' ký tự';continue;}
      if(p.ks&&bam32(ma)!==p.ks){cuoi='mã kiểm tra '+bam32(ma)+' ≠ '+p.ks;continue;}
      p.ma=ma; return p;
    }catch(e){
      const ma=e&&e.ma;
      if(ma==='PHIEN'||ma==='QUYEN'||ma==='PHAI_DOI_MK'||ma==='DU_LIEU'||ma==='CAU_HINH') throw e;
      cuoi=(e&&e.message)||String(e);
    }
  }
  throw new Error('Phần mã thứ '+(i+1)+'/'+SO_PHAN+' không tải được sau '+(CHO_THU_LAI.length+1)+' lần thử. '
    +'Lần cuối: '+cuoi+'. Nếu là lỗi HTTP 404 thì đây là trục trặc nhất thời ở bước chuyển hướng của Google Apps Script '
    +'(script.googleusercontent.com) chứ không phải mã sai — thường gặp khi trình duyệt đang đăng nhập nhiều tài khoản Google '
    +'hoặc chặn cookie bên thứ ba. Hãy thử lại, hoặc mở trang trong cửa sổ ẩn danh chỉ đăng nhập một tài khoản Google.');
}
let SO_PHAN=0;

/* ---- bộ nhớ đệm mã tính toán trong trình duyệt ----
   Mã tính toán chỉ đổi khi triển khai bản mới, nên không có lý do tải lại mỗi lần đăng nhập.
   Khoá đệm là vân tay mã PHIEN_BAN_LOGIC do máy chủ gửi kèm: triển khai bản mới là khoá đổi,
   bản đệm cũ bị xoá và mã mới được tải về ngay lần đăng nhập kế tiếp — không cần thao tác tay.
   Nội dung lấy ra khỏi đệm vẫn phải qua đúng phép kiểm mã 32 bit như khi nhận từ máy chủ.
   Chọn nơi lưu bằng CAU_HINH_WEB.DEM_MA: 'lau_dai' (mặc định, giữ qua các lần mở trình duyệt),
   'phien' (xoá khi đóng thẻ) hoặc 'tat' (không đệm). */
const TIEN_TO_DEM='kd_ma_';
function khoDem(){
  const ch=(window.CAU_HINH_WEB||{}).DEM_MA||'lau_dai';
  try{ if(ch==='tat') return null; return ch==='phien'?sessionStorage:localStorage; }catch(e){ return null; }
}
function docDem(pb){
  const kho=khoDem(); if(!kho||!pb) return null;
  try{
    const s=kho.getItem(TIEN_TO_DEM+pb); if(!s) return null;
    const d=JSON.parse(s);
    if(!Array.isArray(d)||!d.length) return null;
    for(const m of d){ if(!m||typeof m.ma!=='string'||!m.ma||bam32(m.ma)!==m.ks) return null; }
    return d;
  }catch(e){ return null; }
}
function ghiDem(pb,tep){
  const kho=khoDem(); if(!kho||!pb) return;
  try{
    for(let i=kho.length-1;i>=0;i--){ const k=kho.key(i); if(k&&k.indexOf(TIEN_TO_DEM)===0&&k!==TIEN_TO_DEM+pb) kho.removeItem(k); }
    kho.setItem(TIEN_TO_DEM+pb, JSON.stringify(tep.map(m=>({ten:m.ten,ma:m.ma,ks:bam32(m.ma)}))));
  }catch(e){ /* hết chỗ hoặc trình duyệt chặn: bỏ qua, chỉ mất phần tăng tốc */ }
}
function xoaDemMa(){
  const kho=khoDem(); if(!kho) return 0;
  let n=0; try{ for(let i=kho.length-1;i>=0;i--){ const k=kho.key(i); if(k&&k.indexOf(TIEN_TO_DEM)===0){kho.removeItem(k);n++;} } }catch(e){}
  return n;
}
window.XOA_DEM_MA=xoaDemMa;      /* gõ XOA_DEM_MA() trong Console để buộc tải lại mã */

/* Tải toàn bộ các phần mã, chạy song song tối đa 3 luồng — nhanh gấp khoảng ba lần so với nối đuôi,
   nhưng vẫn đủ thưa để không làm bước chuyển hướng của Apps Script quá tải (nguồn gốc của lỗi 404). */
const SONG_SONG=3;
async function taiTatCaPhanMa(tong){
  const kq=new Array(tong); let ke=0, xong=0;
  async function luong(){
    for(;;){
      const i=ke++; if(i>=tong) return;
      kq[i]=await taiPhanMa(i);
      xong++; chu('Đang nạp mã tính toán… '+Math.round((xong/tong)*100)+' %');
    }
  }
  const n=Math.max(1,Math.min(SONG_SONG,tong));
  await Promise.all(Array.from({length:n},(_,k)=>nghi(k*150).then(luong)));
  return kq;
}

/* ---- nạp gói ứng dụng ---- */
async function napGoi(j){
  ND=j.nguoi_dung; capNhatMenu();
  hien('kd_dang_tai'); loi('');
  chu('Đang dựng dữ liệu 5 tuyến từ Google Sheet…');
  window.CORE=BANG_DU_LIEU.raCore(j.goi.du_lieu);
  /* Mã tính toán tải theo từng phần: một phản hồi Apps Script không chở nổi cả gói (bị cắt giữa chừng). */
  const tong=+j.goi.so_phan_ma||0;
  if(!tong) throw new Error('Máy chủ không có mã tính toán (so_phan_ma = 0) — kiểm tra các tệp logic_*.html trên Apps Script.');
  SO_PHAN=tong;
  const pbMa=j.goi.phien_ban_logic||'';
  let tep=docDem(pbMa);
  if(tep){
    chu('Dùng mã tính toán đã lưu trong trình duyệt…');
  }else{
    const kq=await taiTatCaPhanMa(tong);
    tep=[]; let dang=null;
    for(let i=0;i<tong;i++){
      const p=kq[i];
      if(!dang||dang.ten!==p.ten){dang={ten:p.ten,ma:'',dai:p.tep_dai,ks:p.tep_ks};tep.push(dang);}
      dang.ma+=p.ma;
      if(p.cuoi_tep){
        /* Kiểm tệp đã ghép: độ dài và mã kiểm tra phải trùng số máy chủ báo. */
        if(dang.dai!=null&&dang.ma.length!==dang.dai)
          throw new Error('Tệp mã '+dang.ten+' ghép lại được '+dang.ma.length+' ký tự, máy chủ báo '+dang.dai+' — một phần bị thiếu trên đường truyền. Thử đăng nhập lại.');
        if(dang.ks&&bam32(dang.ma)!==dang.ks)
          throw new Error('Tệp mã '+dang.ten+' sai mã kiểm tra sau khi ghép ('+bam32(dang.ma)+' ≠ '+dang.ks+') — nội dung bị đổi trên đường truyền. Thử đăng nhập lại.');
        dang=null;
      }
    }
    ghiDem(pbMa,tep);
  }
  chu('Đang khởi động các phân hệ…');
  const loiNap=[];
  const batLoi=e=>{
    let m=e.message||String(e.error||e);
    if(e.lineno||e.colno) m+=' [dòng '+e.lineno+', cột '+e.colno+']';
    loiNap.push(m);
  };
  window.addEventListener('error',batLoi);
  const sanSang=new Promise((ok,hong)=>{document.addEventListener('app:san-sang',ok,{once:true});setTimeout(()=>hong(new Error('Ứng dụng không khởi động được trong 60 giây.')),60000);});
  for(const m of tep){
    const truoc=loiNap.length;
    const s=document.createElement('script');s.textContent=m.ma;s.dataset.logic=m.ten;
    try{ document.body.appendChild(s); }catch(e){ loiNap.push((e&&e.message||String(e))); }
    if(loiNap.length>truoc) loiNap[truoc]='tệp '+m.ten+' ('+m.ma.length+' ký tự): '+loiNap[truoc];
  }
  window.removeEventListener('error',batLoi);
  if(loiNap.length) throw new Error('Lỗi khi nạp mã tính toán: '+loiNap.slice(0,3).join(' | '));
  await sanSang;
  chu('Đang áp thông số dùng chung…');
  const kq=THONG_SO.ap(j.goi.thong_so);
  daNap=true; manHinh(false); el('kd_nd').hidden=false;
  bao('Xin chào '+(ND.ho_ten||ND.ten)+' — đã nạp dữ liệu và '+(j.goi.thong_so||[]).length+' thông số từ Google Sheet'+(kq.ap?' ('+kq.ap+' giá trị khác mặc định)':'')+'.');
  if(kq.bo_qua.length) console.warn('[thong-so] bỏ qua:',kq.bo_qua);
}
async function batDau(){
  manHinh(true);
  if(API.token()){
    hien('kd_dang_tai'); chu('Đang khôi phục phiên làm việc…');
    try{ await napGoi(await API.goi('khoi_dong')); return; }
    catch(e){ if(e.ma==='PHAI_DOI_MK'){ moDoiMatKhau(true); return; } if(daNap) {loi(e.message);return;} if(e.ma!=='PHIEN') loi(e.message); }
  }
  hien('kd_f_dn'); try{el('kd_ten').focus();}catch(e){}
}

/* ---- đăng nhập ---- */
el('kd_f_dn').addEventListener('submit',async ev=>{
  ev.preventDefault(); const nut=el('kd_nut_dn'); nut.disabled=true; loi('');
  try{
    const j=await API.goi('dang_nhap',{ten:el('kd_ten').value.trim(),mat_khau:el('kd_mk').value});
    API.datToken(j.token); ND=j.nguoi_dung;
    if(j.phai_doi_mk){ el('kd_mk_cu').value=el('kd_mk').value; el('kd_mk').value=''; moDoiMatKhau(true); return; }
    el('kd_mk').value=''; await napGoi(j);
  }catch(e){ if(!daNap) hien('kd_f_dn'); loi(e.message); }
  finally{ nut.disabled=false; }
});

/* ---- đổi mật khẩu (bắt buộc ở lần đầu, hoặc tự nguyện từ trình đơn) ---- */
function moDoiMatKhau(batBuoc){
  el('kd_doi_ly_do').textContent=batBuoc?'Đây là lần đăng nhập đầu tiên hoặc mật khẩu vừa được đặt lại. Hãy đặt mật khẩu mới để tiếp tục.':'Đổi mật khẩu cho tài khoản '+(ND?ND.ten:'')+'.';
  el('kd_huy_doi').hidden=batBuoc; ['kd_mk_moi','kd_mk_lai'].forEach(i=>el(i).value='');
  if(!batBuoc) el('kd_mk_cu').value='';
  loi(''); manHinh(true); hien('kd_f_doi'); try{el(batBuoc&&el('kd_mk_cu').value?'kd_mk_moi':'kd_mk_cu').focus();}catch(e){}
}
el('kd_huy_doi').addEventListener('click',()=>{loi('');manHinh(false);});
el('kd_f_doi').addEventListener('submit',async ev=>{
  ev.preventDefault(); loi('');
  const moi=el('kd_mk_moi').value;
  if(moi!==el('kd_mk_lai').value){loi('Hai lần nhập mật khẩu mới không khớp.');return;}
  const nut=el('kd_nut_doi'); nut.disabled=true;
  try{
    const j=await API.goi('doi_mat_khau',{mat_khau_cu:el('kd_mk_cu').value,mat_khau_moi:moi});
    ['kd_mk_cu','kd_mk_moi','kd_mk_lai'].forEach(i=>el(i).value='');
    if(daNap){ manHinh(false); bao('Đã đổi mật khẩu.'); }
    else await napGoi(j);
  }catch(e){ if(e.ma==='PHIEN'){ hien('kd_f_dn'); } loi(e.message); }
  finally{ nut.disabled=false; }
});

/* ---- trình đơn tài khoản ---- */
function dongMenu(){el('kd_menu').hidden=true;el('kd_nd_nut').setAttribute('aria-expanded','false');}
el('kd_nd_nut').addEventListener('click',e=>{e.stopPropagation();const m=el('kd_menu');m.hidden=!m.hidden;el('kd_nd_nut').setAttribute('aria-expanded',String(!m.hidden));});
document.addEventListener('click',e=>{if(!el('kd_nd').contains(e.target)) dongMenu();});
document.addEventListener('keydown',e=>{if(e.key==='Escape') dongMenu();});
async function thucHien(nhan,f){dongMenu();try{bao(nhan+'…');const s=await f();if(s)bao(s);}catch(e){bao('Không thực hiện được: '+e.message);if(e.ma==='PHIEN')setTimeout(()=>location.reload(),2500);}}
el('kd_m_luu_ts').addEventListener('click',()=>{
  if(!confirm('Ghi bộ thông số đang dùng lên Google Sheet? Mọi người dùng sẽ nhận bộ thông số này ở lần mở ứng dụng tiếp theo.')) return;
  thucHien('Đang lưu thông số',async()=>{const j=await API.goi('luu_thong_so',{dong:THONG_SO.thu()});return 'Đã lưu thông số lên Google Sheet ('+j.so_thay_doi+' giá trị thay đổi).';});
});
el('kd_m_tai_ts').addEventListener('click',()=>thucHien('Đang tải thông số',async()=>{
  const j=await API.goi('tai_thong_so');const kq=THONG_SO.ap(j.thong_so);return 'Đã áp thông số từ Google Sheet ('+kq.ap+' giá trị thay đổi).';}));
el('kd_m_luu_dl').addEventListener('click',()=>{
  if(!confirm('Ghi dữ liệu 5 tuyến đang dùng (ga, đường cong, trắc dọc, ghi, hạn chế tốc độ) đè lên các bảng DL_* trên Google Sheet?')) return;
  thucHien('Đang ghi dữ liệu tuyến',async()=>{const j=await API.goi('luu_du_lieu',{bang:BANG_DU_LIEU.tuCore(CORE,{chiTuyen:true})});return 'Đã ghi lên Google Sheet: '+j.tom_tat.join('; ')+'.';});
});
el('kd_m_doi_mk').addEventListener('click',()=>{dongMenu();moDoiMatKhau(false);});
el('kd_m_qt').addEventListener('click',()=>{dongMenu();if(window.QUAN_TRI)QUAN_TRI.mo(ND);});
el('kd_m_thoat').addEventListener('click',async()=>{dongMenu();try{await API.goi('dang_xuat');}catch(e){}API.datToken('');location.reload();});

/* ---- dữ liệu nạp từ tệp Excel mẫu → ghi đè lên Google Sheet ---- */
document.addEventListener('app:nap-du-lieu',()=>{
  if(!daNap) return;
  if(!coQuyen('bien_tap')){bao('Dữ liệu từ tệp chỉ dùng trong phiên này — tài khoản "chỉ xem" không ghi được lên Google Sheet.');return;}
  thucHien('Đang ghi dữ liệu từ tệp lên Google Sheet',async()=>{
    const a=await API.goi('luu_du_lieu',{bang:BANG_DU_LIEU.tuCore(CORE,{chiTuyen:true})});
    const b=await API.goi('luu_thong_so',{dong:THONG_SO.thu()});
    return 'Đã ghi dữ liệu từ tệp lên Google Sheet để dùng cho lần sau ('+a.tom_tat.length+' bảng, '+b.so_thay_doi+' thông số thay đổi).';
  });
});

window.KHOI_DONG={get nguoiDung(){return ND;},get daNap(){return daNap;},coQuyen};
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',batDau); else batDau();
})();

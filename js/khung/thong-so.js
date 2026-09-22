/* @file js/khung/thong-so.js — thu thập và áp bộ thông số tính toán dùng chung (bảng THONG_SO trên Google Sheet)
   Mỗi dòng: [phan_he, khoa, gia_tri, kieu, nhan]
     phan_he : 1-mo-phong | 2-dung-do | 3-hieu-suat | 4-gis | 5-kho-gioi-han
     khoa    : id của ô nhập trên giao diện, riêng phân hệ 5 dùng "P.<tên>" cho tham số khổ giới hạn (GAU.P)
     kieu    : so | chu | dung_sai
   Cách áp (giữ đúng hành vi của ứng dụng gốc — xem UX.restore): ô nhập phân hệ 1 được gán lặng rồi gọi run() một lần;
   ô của phân hệ khác được gán rồi phát sự kiện change để mô-đun cập nhật trạng thái trong; chỉ áp các giá trị KHÁC giá trị hiện có. */
(function(){
'use strict';
const TAB_PH={'tab-sim':'1-mo-phong','tab-ops':'2-dung-do','tab-eng':'3-hieu-suat','tab-gis':'4-gis','tab-gau':'5-kho-gioi-han'};
/* không phải thông số: lựa chọn tuyến/xem, tệp, hay phụ thuộc tuyến đang chọn */
const BO_QUA=['line','tw_sel','fxlsx','h_file','d_line','gaA','gaB','e_line','g_t','g_mode','g_hw','g_spd','g_dir','g_tq','g_sp'];
/* thứ tự áp các ô điều khiển của phân hệ 5 (ô sau phụ thuộc ô trước) */
const THU_TU_GAU=['gu_pow','gu_volt','gu_tbauto','gu_tb','gu_mode','gu_qs'];
const el=id=>document.getElementById(id);
const sach=s=>String(s||'').replace(/\s+/g,' ').trim();
function nhanCua(e){
  const l=el('l_'+e.id);
  if(l&&l.firstChild) return sach(l.firstChild.textContent);
  const lab=e.closest('label'); if(lab){const sp=lab.querySelector('span[data-t],span'); return sach(sp&&!sp.contains(e)?sp.textContent:lab.textContent).slice(0,120);}
  let p=e.previousElementSibling; while(p&&p.tagName!=='LABEL') p=p.previousElementSibling;
  if(p) return sach(p.firstChild?p.firstChild.textContent:p.textContent).slice(0,120);
  const tr=e.closest('tr'); if(tr&&tr.cells&&tr.cells[0]) return sach(tr.cells[0].textContent).slice(0,120);
  return '';
}
function oDieuKhien(){
  const out=[];
  document.querySelectorAll('.tabpage input[id], .tabpage select[id], .tabpage textarea[id]').forEach(e=>{
    if(BO_QUA.indexOf(e.id)>=0||e.type==='file'||e.type==='button'||e.readOnly||e.disabled&&e.id!=='gu_tb') return;
    if(e.dataset&&e.dataset.k) return;                /* ô tham số GAU.P — xử lý riêng */
    if(e.closest('#stlist')) return;                  /* danh sách ga dừng: phụ thuộc tuyến */
    const tp=e.closest('.tabpage'); const ph=tp&&TAB_PH[tp.id]; if(!ph) return;
    out.push({e,ph});
  });
  return out;
}
function giaTri(e){return (e.type==='checkbox'||e.type==='radio')?(e.checked?'TRUE':'FALSE'):String(e.value);}
function kieuCua(e){return (e.type==='checkbox'||e.type==='radio')?'dung_sai':(e.type==='number'||e.type==='range')?'so':'chu';}
/* ---- thu: trạng thái hiện tại → các dòng ---- */
function thu(){
  const rows=[];
  for(const {e,ph} of oDieuKhien()) rows.push([ph,e.id,giaTri(e),kieuCua(e),nhanCua(e)]);
  try{ if(typeof GIS!=='undefined'&&GIS.params) rows.push(['4-gis','du_phong_pc',String(GIS.params().spare),'so','Dự phòng đoàn tàu (%)']); }catch(x){}
  try{
    if(typeof GAU!=='undefined'&&GAU.P){
      document.querySelectorAll('#tab-gau input[data-k]').forEach(i=>{
        const k=i.dataset.k; if(i.readOnly||!(k in GAU.P)) return;
        const v=GAU.P[k]; if(typeof v!=='number'&&typeof v!=='string'&&typeof v!=='boolean') return;
        rows.push(['5-kho-gioi-han','P.'+k,typeof v==='boolean'?(v?'TRUE':'FALSE'):String(v),typeof v==='number'?'so':typeof v==='boolean'?'dung_sai':'chu',nhanCua(i)]);
      });
    }
  }catch(x){}
  return rows;
}
/* ---- áp: các dòng → giao diện và trạng thái các mô-đun; trả về {ap, bo_qua} ---- */
function ap(rows){
  const kq={ap:0,bo_qua:[]};
  if(!rows||!rows.length) return kq;
  const doi=(e,v,k)=>{ if(e.type==='checkbox'||e.type==='radio'){const b=(String(v).toUpperCase()==='TRUE'||v==='1');if(e.checked===b)return false;e.checked=b;return true;}
                       if(String(e.value)===String(v)) return false; e.value=v; return String(e.value)===String(v)||(e.tagName==='SELECT'?(kq.bo_qua.push(k+' (không có lựa chọn "'+v+'")'),false):true); };
  const theo={}; for(const r of rows){ if(!r||!r[1]) continue; theo[String(r[1])]=r; }
  let chayLai=false; const phatSK=[];
  /* 1) ô điều khiển thường, theo thứ tự trên giao diện */
  for(const {e,ph} of oDieuKhien()){
    const r=theo[e.id]; if(!r||THU_TU_GAU.indexOf(e.id)>=0) continue;
    if(!doi(e,r[2],e.id)) continue; kq.ap++;
    if(ph==='1-mo-phong') chayLai=true; else phatSK.push(e);
  }
  for(const e of phatSK){ try{e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));}catch(x){} }
  if(chayLai){ try{ if(typeof onPat==='function') onPat(); }catch(x){} try{ run(); }catch(x){ console.error('[thong-so] run()',x); } }
  /* 2) GIS */
  const g=theo['du_phong_pc'];
  try{ if(g&&typeof GIS!=='undefined'&&+g[2]!==GIS.params().spare){ GIS.setParams({du_phong_pc:+g[2]}); kq.ap++; } }catch(x){}
  /* 3) phân hệ 5: ô điều khiển theo thứ tự phụ thuộc, rồi các tham số GAU.P, rồi vẽ lại một lần */
  if(typeof GAU!=='undefined'&&GAU.P){
    for(const id of THU_TU_GAU){ const r=theo[id], e=el(id); if(!r||!e) continue;
      if(id==='gu_tb'&&e.disabled) continue;
      if(doi(e,r[2],id)){ kq.ap++; try{e.dispatchEvent(new Event('change',{bubbles:true}));}catch(x){} } }
    let doiP=false;
    for(const k in theo){ if(k.indexOf('P.')!==0) continue; const pk=k.slice(2), r=theo[k];
      if(!(pk in GAU.P)){ kq.bo_qua.push(k); continue; }
      const v=r[3]==='so'?Number(r[2]):r[3]==='dung_sai'?String(r[2]).toUpperCase()==='TRUE':String(r[2]);
      if(r[3]==='so'&&!isFinite(v)){ kq.bo_qua.push(k+' (không phải số)'); continue; }
      if(GAU.P[pk]!==v){ GAU.P[pk]=v; doiP=true; kq.ap++; } }
    if(doiP) try{ GAU.render(); }catch(x){ console.error('[thong-so] GAU.render()',x); }
  }
  if(kq.ap){ try{ App.computeTimes(); }catch(x){} try{ App.renderData&&App.renderData(); }catch(x){} }
  return kq;
}
window.THONG_SO={thu,ap};
})();

/* @file js/khung/quan-tri.js — hộp thoại quản trị tài khoản (chỉ vai trò quan_tri; máy chủ kiểm tra lại quyền ở mọi thao tác) */
(function(){
'use strict';
const el=id=>document.getElementById(id);
const VT={xem:'Chỉ xem và tính toán',bien_tap:'Biên tập dữ liệu, thông số',quan_tri:'Quản trị'};
let toi=null;
const h=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function tb(html,loi){const b=el('kd_qt_tb');b.innerHTML=html;b.hidden=!html;b.classList.toggle('kd-loi',!!loi);}
async function taiDs(){
  el('kd_qt_ds').innerHTML='<tr><td colspan="7">Đang tải…</td></tr>';
  try{
    const j=await API.goi('ds_nguoi_dung');
    el('kd_qt_ds').innerHTML=j.nguoi_dung.map(n=>{
      const tt=n.trang_thai==='khoa'?'<span class="kd-nhan do">Đã khoá</span>':n.tam_khoa?'<span class="kd-nhan vang">Tạm khoá</span>':String(n.phai_doi_mk).toUpperCase()==='TRUE'?'<span class="kd-nhan vang">Chờ đổi mật khẩu</span>':'<span class="kd-nhan xanh">Hoạt động</span>';
      return '<tr data-ten="'+h(n.ten)+'"><td><b>'+h(n.ten)+'</b></td><td>'+h(n.ho_ten)+'</td><td><select data-hd="vai">'+
        Object.keys(VT).map(k=>'<option value="'+k+'"'+(k===n.vai_tro?' selected':'')+'>'+VT[k]+'</option>').join('')+'</select></td><td>'+tt+'</td><td>'+h(n.dang_nhap_cuoi)+'</td><td>'+h(n.doi_mk_luc)+'</td>'+
        '<td><button type="button" data-hd="dat_lai">Đặt lại mật khẩu</button><button type="button" data-hd="'+(n.trang_thai==='khoa'?'mo':'khoa')+'">'+(n.trang_thai==='khoa'?'Mở khoá':'Khoá')+'</button></td></tr>';
    }).join('')||'<tr><td colspan="7">Chưa có tài khoản.</td></tr>';
  }catch(e){el('kd_qt_ds').innerHTML='';tb(h(e.message),true);}
}
async function taiNhatKy(){
  el('kd_nk_ds').innerHTML='<tr><td colspan="5">Đang tải…</td></tr>';
  try{const j=await API.goi('nhat_ky',{so_dong:200});
    el('kd_nk_ds').innerHTML=j.dong.map(d=>'<tr>'+d.map(x=>'<td>'+h(x)+'</td>').join('')+'</tr>').join('')||'<tr><td colspan="5">Chưa có nhật ký.</td></tr>';}
  catch(e){el('kd_nk_ds').innerHTML='<tr><td colspan="5">'+h(e.message)+'</td></tr>';}
}
function the(i){el('kd_qt_the1').classList.toggle('on',i===1);el('kd_qt_the2').classList.toggle('on',i===2);el('kd_qt_p1').hidden=i!==1;el('kd_qt_p2').hidden=i!==2;if(i===2)taiNhatKy();}
el('kd_qt_the1').addEventListener('click',()=>the(1));
el('kd_qt_the2').addEventListener('click',()=>the(2));
el('kd_qt_ds').addEventListener('change',async e=>{
  const s=e.target; if(s.dataset.hd!=='vai') return; const ten=s.closest('tr').dataset.ten;
  try{await API.goi('cap_nhat_nguoi_dung',{ten,vai_tro:s.value});tb('Đã đổi vai trò của <b>'+h(ten)+'</b> thành '+h(VT[s.value])+'.');}
  catch(e2){tb(h(e2.message),true);} taiDs();
});
el('kd_qt_ds').addEventListener('click',async e=>{
  const b=e.target.closest('button[data-hd]'); if(!b) return; const ten=b.closest('tr').dataset.ten, hd=b.dataset.hd;
  try{
    if(hd==='dat_lai'){ if(!confirm('Đặt lại mật khẩu cho "'+ten+'"? Người dùng phải đổi mật khẩu ở lần đăng nhập tới.')) return;
      const j=await API.goi('dat_lai_mat_khau',{ten});
      tb('Mật khẩu tạm của <b>'+h(j.ten)+'</b>: <code>'+h(j.mat_khau_tam)+'</code> — chỉ hiển thị một lần; hãy chuyển cho người dùng qua kênh an toàn.'); }
    else { if(hd==='khoa'&&!confirm('Khoá tài khoản "'+ten+'"? Phiên đang mở của tài khoản này sẽ bị chặn ngay.')) return;
      await API.goi('cap_nhat_nguoi_dung',{ten,trang_thai:hd==='khoa'?'khoa':'hoat_dong'}); tb('Đã '+(hd==='khoa'?'khoá':'mở khoá')+' tài khoản <b>'+h(ten)+'</b>.'); }
  }catch(e2){tb(h(e2.message),true);}
  taiDs();
});
el('kd_f_tao').addEventListener('submit',async e=>{
  e.preventDefault();
  try{const j=await API.goi('tao_nguoi_dung',{ten:el('kd_tao_ten').value.trim().toLowerCase(),ho_ten:el('kd_tao_ho_ten').value.trim(),vai_tro:el('kd_tao_vai').value});
    tb('Đã tạo tài khoản <b>'+h(j.ten)+'</b>. Mật khẩu tạm: <code>'+h(j.mat_khau_tam)+'</code> — chỉ hiển thị một lần; người dùng phải đổi ở lần đăng nhập đầu.');
    el('kd_tao_ten').value='';el('kd_tao_ho_ten').value='';}
  catch(e2){tb(h(e2.message),true);}
  taiDs();
});
window.QUAN_TRI={mo(nd){toi=nd;tb('');the(1);el('kd_mod_qt').hidden=false;taiDs();}};
})();

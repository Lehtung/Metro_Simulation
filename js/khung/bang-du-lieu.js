/* @file js/khung/bang-du-lieu.js — lược đồ bảng dữ liệu trên Google Sheet và chuyển đổi hai chiều với CORE
   Dùng chung cho trình duyệt (window.BANG_DU_LIEU) và công cụ dựng/kiểm thử trên Node (module.exports).

   Mỗi bảng trên Google Sheet: dòng 1 = mã cột (máy đọc), dòng 2 = mô tả tiếng Việt kèm đơn vị, dữ liệu từ dòng 3.
   Mọi ô ghi ở định dạng văn bản thuần (@) để Google Sheet không tự đổi "1/9" thành ngày tháng hay "S1.01" thành số.
   Số được ghi bằng String(x) của JavaScript nên đọc lại trùng từng bit. Ô trống = trường không có (hoặc null nếu cột cho phép rỗng). */
(function(goc){
'use strict';
/* kiểu: so = số, chu = văn bản, dung_sai = đúng/sai; rong: ô trống nghĩa là null (thay vì không có trường) */
const LUOC_DO={
 DL_TUYEN:{mo_ta:'Danh mục tuyến',cot:[
  ['ma_tuyen','chu','Mã tuyến (khoá)'],
  ['ten','chu','Tên tuyến'],
  ['chieu_dai_m','so','Chiều dài tuyến (m)'],
  ['van_toc_thiet_ke_kmh','so','Vận tốc thiết kế (km/h)'],
  ['van_toc_khai_thac_kmh','so','Vận tốc khai thác (km/h)'],
  ['thoi_gian_phu_s','so','Thời gian phụ (s)']]},
 DL_GA:{mo_ta:'Nhà ga',cot:[
  ['ma_tuyen','chu','Mã tuyến'],['stt','so','Số thứ tự trên tuyến'],
  ['ma','chu','Mã ga'],['ten','chu','Tên ga (không bắt buộc)'],
  ['s0','so','Lý trình đầu ke ga (m)'],['s1','so','Lý trình cuối ke ga (m)'],['ch','so','Lý trình tim ga (m)'],
  ['L','so','Chiều dài ke ga (m)'],['tang','so','Số tầng'],['sau','so','Độ sâu (m)',1],['z','so','Cao độ ray tại ga (m)',1],
  ['tc','dung_sai','Ga trung chuyển (TRUE/FALSE)'],['vuot','dung_sai','Ga có đường vượt (TRUE/FALSE)'],
  ['X','so','Toạ độ X VN-2000 (m)',1],['Y','so','Toạ độ Y VN-2000 (m)',1]]},
 DL_DUONG_CONG:{mo_ta:'Đường cong nằm',cot:[
  ['ma_tuyen','chu','Mã tuyến'],['stt','so','Số thứ tự'],
  ['s0','so','Lý trình đầu (m)'],['s1','so','Lý trình cuối (m)'],['R','so','Bán kính (m)']]},
 DL_TRAC_DOC:{mo_ta:'Trắc dọc (điểm đổi dốc)',cot:[
  ['ma_tuyen','chu','Mã tuyến'],['stt','so','Số thứ tự'],
  ['ly_trinh','so','Lý trình (m)'],['cao_do','so','Cao độ đỉnh ray (m)']]},
 DL_GHI:{mo_ta:'Ghi (bẻ ghi) và hạn chế tốc độ qua ghi',cot:[
  ['ma_tuyen','chu','Mã tuyến'],['stt','so','Số thứ tự'],
  ['ga','chu','Mã ga'],['loai','chu','Loại ghi'],['tang','chu','Tỷ số ghi (ví dụ 1/9)'],
  ['s0','so','Lý trình đầu (m)'],['s1','so','Lý trình cuối (m)'],['v','so','Tốc độ hạn chế (km/h)']]},
 DL_HAN_CHE:{mo_ta:'Hạn chế tốc độ',cot:[
  ['ma_tuyen','chu','Mã tuyến'],['stt','so','Số thứ tự'],
  ['s0','so','Lý trình đầu (m)'],['s1','so','Lý trình cuối (m)'],['v','so','Tốc độ hạn chế (km/h)'],['ly_do','chu','Lý do']]},
 DL_HINH_HOC_TUYEN:{mo_ta:'Hình học tuyến trên bản đồ (WGS-84)',cot:[
  ['ma_tuyen','chu','Mã tuyến'],['stt','so','Số thứ tự điểm'],
  ['vi_do','so','Vĩ độ (độ)'],['kinh_do','so','Kinh độ (độ)']]},
 DL_DEPOT:{mo_ta:'Khu depot',cot:[
  ['stt','so','Số thứ tự depot'],['ma_tuyen','chu','Tuyến'],['ten','chu','Tên depot']]},
 DL_DEPOT_TOA_DO:{mo_ta:'Ranh giới khu depot (WGS-84)',cot:[
  ['stt_depot','so','Số thứ tự depot'],['stt','so','Số thứ tự điểm'],
  ['vi_do','so','Vĩ độ (độ)'],['kinh_do','so','Kinh độ (độ)']]}
};
/* bảng nhận dữ liệu từ tệp Excel mẫu (các bảng tuyến); hình học bản đồ và depot không có trong tệp Excel */
const BANG_TUYEN=['DL_TUYEN','DL_GA','DL_DUONG_CONG','DL_TRAC_DOC','DL_GHI','DL_HAN_CHE'];
const TAT_CA=Object.keys(LUOC_DO);

function oGhi(v,kieu){
  if(v===undefined||v===null) return '';
  if(kieu==='dung_sai') return v?'TRUE':'FALSE';
  return String(v);
}
function dauBang(ten){const L=LUOC_DO[ten];return [L.cot.map(c=>c[0]),L.cot.map(c=>c[2])];}
function bangTu(ten,dsDoiTuong){
  const L=LUOC_DO[ten];
  return dauBang(ten).concat(dsDoiTuong.map(o=>L.cot.map(c=>oGhi(o[c[0]],c[1]))));
}
/* CORE → các bảng (mảng hai chiều gồm cả 2 dòng tiêu đề) */
function tuCore(CORE,tuyChon){
  const chiTuyen=tuyChon&&tuyChon.chiTuyen;
  const B={TUYEN:[],GA:[],DC:[],TD:[],GHI:[],HC:[],HH:[],DP:[],DPT:[]};
  const khoa=Object.keys(CORE.lines).sort((a,b)=>+a-+b);
  for(const k of khoa){const l=CORE.lines[k];
    B.TUYEN.push({ma_tuyen:k,ten:l.ten,chieu_dai_m:l.chieu_dai_m,van_toc_thiet_ke_kmh:l.van_toc_thiet_ke_kmh,
      van_toc_khai_thac_kmh:l.van_toc_khai_thac_kmh,thoi_gian_phu_s:l.thoi_gian_phu_s});
    (l.ga||[]).forEach((g,i)=>B.GA.push(Object.assign({ma_tuyen:k,stt:i+1},g)));
    (l.duong_cong||[]).forEach((g,i)=>B.DC.push(Object.assign({ma_tuyen:k,stt:i+1},g)));
    (l.trac_doc||[]).forEach((p,i)=>B.TD.push({ma_tuyen:k,stt:i+1,ly_trinh:p[0],cao_do:p[1]}));
    (l.ghi||[]).forEach((g,i)=>B.GHI.push(Object.assign({ma_tuyen:k,stt:i+1},g)));
    (l.han_che||[]).forEach((g,i)=>B.HC.push(Object.assign({ma_tuyen:k,stt:i+1},g)));
  }
  const R={DL_TUYEN:bangTu('DL_TUYEN',B.TUYEN),DL_GA:bangTu('DL_GA',B.GA),DL_DUONG_CONG:bangTu('DL_DUONG_CONG',B.DC),
    DL_TRAC_DOC:bangTu('DL_TRAC_DOC',B.TD),DL_GHI:bangTu('DL_GHI',B.GHI),DL_HAN_CHE:bangTu('DL_HAN_CHE',B.HC)};
  if(chiTuyen) return R;
  for(const k of Object.keys(CORE.geom||{}).sort((a,b)=>+a-+b))
    CORE.geom[k].forEach((p,i)=>B.HH.push({ma_tuyen:k,stt:i+1,vi_do:p[0],kinh_do:p[1]}));
  (CORE.depots||[]).forEach((d,i)=>{B.DP.push({stt:i+1,ma_tuyen:d.c,ten:d.name});
    (d.coords||[]).forEach((p,j)=>B.DPT.push({stt_depot:i+1,stt:j+1,vi_do:p[0],kinh_do:p[1]}));});
  R.DL_HINH_HOC_TUYEN=bangTu('DL_HINH_HOC_TUYEN',B.HH);R.DL_DEPOT=bangTu('DL_DEPOT',B.DP);R.DL_DEPOT_TOA_DO=bangTu('DL_DEPOT_TOA_DO',B.DPT);
  return R;
}
/* các bảng → CORE; ném lỗi (liệt kê tối đa 20 ô sai) nếu dữ liệu không hợp lệ */
function raCore(bang){
  const loi=[];
  function doc(ten){
    const L=LUOC_DO[ten], rows=bang[ten];
    if(!rows||rows.length<2){loi.push('Thiếu bảng '+ten);return [];}
    const dau=rows[0].map(x=>String(x).trim()), idx=L.cot.map(c=>dau.indexOf(c[0]));
    L.cot.forEach((c,i)=>{if(idx[i]<0&&!(c[0]==='ten'&&ten==='DL_GA')) loi.push(ten+': thiếu cột '+c[0]);});
    const out=[];
    for(let r=2;r<rows.length;r++){
      const row=rows[r]; if(!row||row.every(x=>x===''||x===null||x===undefined)) continue;
      const o={};
      L.cot.forEach((c,i)=>{
        if(idx[i]<0) return;
        const raw=row[idx[i]], s=(raw===null||raw===undefined)?'':String(raw).trim();
        if(s===''){ if(c[3]) o[c[0]]=null; return; }
        if(c[1]==='so'){const x=Number(s.indexOf(',')>=0&&s.indexOf('.')<0?s.replace(',','.'):s);
          if(!isFinite(x)){loi.push(ten+' dòng '+(r+1)+', cột '+c[0]+': "'+s+'" không phải số');return;} o[c[0]]=x;}
        else if(c[1]==='dung_sai'){const u=s.toUpperCase(); o[c[0]]=(u==='TRUE'||u==='1'||u==='X'||u==='CÓ'||u==='CO'||u==='YES');}
        else o[c[0]]=s;
      });
      out.push(o);
    }
    return out;
  }
  const sx=(a,b)=>(a.stt||0)-(b.stt||0);
  const nhom=(ds,k)=>{const m={};for(const o of ds){(m[o[k]]=m[o[k]]||[]).push(o);}for(const x in m)m[x].sort(sx);return m;};
  const bo=(o,ks)=>{const r={};for(const k in o) if(ks.indexOf(k)<0) r[k]=o[k];return r;};
  const T=doc('DL_TUYEN'),G=nhom(doc('DL_GA'),'ma_tuyen'),DC=nhom(doc('DL_DUONG_CONG'),'ma_tuyen'),TD=nhom(doc('DL_TRAC_DOC'),'ma_tuyen'),
        GH=nhom(doc('DL_GHI'),'ma_tuyen'),HC=nhom(doc('DL_HAN_CHE'),'ma_tuyen'),HH=nhom(doc('DL_HINH_HOC_TUYEN'),'ma_tuyen'),
        DP=doc('DL_DEPOT').sort(sx),DPT=nhom(doc('DL_DEPOT_TOA_DO'),'stt_depot');
  if(!T.length) loi.push('Bảng DL_TUYEN không có tuyến nào');
  if(loi.length) throw new Error('Dữ liệu trên Google Sheet không hợp lệ:\n• '+loi.slice(0,20).join('\n• ')+(loi.length>20?'\n… và '+(loi.length-20)+' lỗi khác':''));
  const CORE={lines:{},geom:{},depots:[]};
  for(const t of T){const k=t.ma_tuyen;
    CORE.lines[k]={ten:t.ten,chieu_dai_m:t.chieu_dai_m,van_toc_thiet_ke_kmh:t.van_toc_thiet_ke_kmh,
      van_toc_khai_thac_kmh:t.van_toc_khai_thac_kmh,thoi_gian_phu_s:t.thoi_gian_phu_s,
      ga:(G[k]||[]).map(o=>bo(o,['ma_tuyen','stt'])),
      duong_cong:(DC[k]||[]).map(o=>bo(o,['ma_tuyen','stt'])),
      trac_doc:(TD[k]||[]).map(o=>[o.ly_trinh,o.cao_do]),
      ghi:(GH[k]||[]).map(o=>bo(o,['ma_tuyen','stt'])),
      han_che:(HC[k]||[]).map(o=>bo(o,['ma_tuyen','stt']))};
  }
  for(const k in HH) CORE.geom[k]=HH[k].map(o=>[o.vi_do,o.kinh_do]);
  for(const d of DP) CORE.depots.push({c:d.ma_tuyen,name:d.ten,coords:(DPT[d.stt]||[]).map(o=>[o.vi_do,o.kinh_do])});
  return CORE;
}
const API={LUOC_DO,BANG_TUYEN,TAT_CA,dauBang,tuCore,raCore};
if(typeof module!=='undefined'&&module.exports) module.exports=API; else goc.BANG_DU_LIEU=API;
})(typeof window!=='undefined'?window:this);

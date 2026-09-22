/* @file js/00-gan-su-kien.js — gắn sự kiện cho mọi nút lệnh / ô chọn của phần đánh dấu tĩnh */
/* Gắn toàn bộ sự kiện của phần đánh dấu tĩnh (thay cho onclick="…" / onchange="…" nội tuyến của bản 3.21.0).
   Khối này PHẢI là khối script đầu tiên trong <body> để thứ tự đăng ký trùng với thứ tự trình duyệt từng dựng
   bộ xử lý nội tuyến. Hàm gọi tới (run, tab, App.report…) được tra ở thời điểm bấm nên có thể khai báo ở tệp sau.
   Trong mỗi hàm, this = phần tử phát sự kiện, event = đối tượng sự kiện (giống bộ xử lý nội tuyến). */
(function(){
 function gan(id,loai,xuLy){
  const e=document.getElementById(id);
  if(!e){console.error('[gan-su-kien] không tìm thấy #'+id);return;}
  e.addEventListener(loai,xuLy);
 }
 /* — Hộp thoại «Dữ liệu chung 5 tuyến» — */
 gan('h_nut_nap_excel','click',function(event){document.getElementById('h_file').click();});
 gan('h_file','change',function(event){loadXlsx(this);});
 gan('h_nut_xuat_du_lieu','click',function(event){App.exportData();});
 gan('h_nut_xuat_ket_qua','click',function(event){App.exportResults();});
 gan('h_nut_kiem_tra','click',function(event){App.check();});
 /* — Phân hệ 1 – nhập liệu — */
 gan('aw','change',function(event){setAW();});
 gan('asrc','change',function(event){run();});
 gan('gg','change',function(event){run();});
 gan('hzghi','change',function(event){run();});
 gan('curve','change',function(event){run();});
 gan('usehz','change',function(event){run();});
 gan('fxlsx','change',function(event){loadXlsx(this);});
 gan('b_check','click',function(event){check();});
 gan('b_expk','click',function(event){expXlsxKQ();});
 gan('b_run','click',function(event){run();});
 /* — Phân hệ 1 – thẻ biểu đồ — */
 gan('t1','click',function(event){tab(1);});
 gan('t2','click',function(event){tab(2);});
 gan('t3','click',function(event){tab(3);});
 gan('t4','click',function(event){tab(4);});
 gan('t5','click',function(event){tab(5);});
 gan('t6','click',function(event){tab(6);});
 gan('t7','click',function(event){tab(7);});
 gan('t8','click',function(event){tab(8);});
 gan('nut_phong_to','click',function(event){zoomBy(0.7);});
 gan('nut_thu_nho','click',function(event){zoomBy(1/0.7);});
 gan('b_zall','click',function(event){zoomReset();});
 gan('b_csv','click',function(event){expCSV();});
 gan('b_svg','click',function(event){expSVG();});
 gan('b_pdf','click',function(event){expPDF();});
 gan('b_sweep','click',function(event){sweep();});
 gan('b_sens','click',function(event){sens();});
 gan('b_bench','click',function(event){benchRun();});
 gan('pattern','change',function(event){onPat();});
 gan('b_all','click',function(event){chkAll(1);});
 gan('b_none','click',function(event){chkAll(0);});
 gan('b_ic','click',function(event){chkIC();});
 gan('b_opt','click',function(event){optimise();});
 /* — Phân hệ 3 – báo cáo — */
 gan('eng_nut_pdf','click',function(event){App.report('eng',true);});
 gan('eng_nut_xem','click',function(event){App.report('eng',false);});
 /* — Phân hệ 5 – báo cáo — */
 gan('gau_nut_pdf','click',function(event){App.report('gau',true);});
 gan('gau_nut_xem','click',function(event){App.report('gau',false);});
})();

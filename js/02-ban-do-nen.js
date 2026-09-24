/* @file js/02-ban-do-nen.js — danh mục bản đồ nền cho Leaflet (window.BASEMAPS) */
(function(){
 const A_OSM='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
 const defs=[
  /* 3.32.2: TOÀN BỘ nền chuyển sang Esri ArcGIS Online — không cần khoá API, không ràng buộc Referer.
     Đã bỏ CARTO (22/9: bắt buộc khoá API, in chìm «API KEY REQUIRED») và OpenStreetMap (23/9: trả 403
     «Access blocked», vì chính sách của OSM không cho ứng dụng phát hành dạng tệp gọi thẳng máy chủ
     tình nguyện của họ). Cả hai lần ảnh lỗi VẪN TẢI ĐƯỢC nên không sinh `tileerror` — không có cách
     nào phát hiện bằng mã; lối thoát là ô «Nền tự khai» ở thẻ GIS. */
  ['Bản đồ nền','Street map','https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',{maxZoom:19,attribution:'Tiles &copy; Esri'}],
  ['Nền sáng','Light base','https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',{maxZoom:16,attribution:'Tiles &copy; Esri'}],
  /* 3.32.6: ảnh vệ tinh là ảnh chụp thuần, không có chữ. Phần tử thứ năm là danh sách lớp phủ
     TRONG SUỐT của chính Esri, ghép lên trên để hiện địa danh và tên đường — đúng cách Esri dựng
     lớp «Imagery Hybrid». Lớp phủ đi kèm lớp nền, không vào bảng chọn lớp. */
  ['Ảnh vệ tinh','Satellite','https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{maxZoom:19,attribution:'Tiles &copy; Esri, Maxar, Earthstar Geographics'},
   ['https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
    'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}']],
  ['Nền địa hình','Topographic','https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',{maxZoom:19,attribution:'Tiles &copy; Esri'}]
 ];
 /* 3.32.2: địa chỉ ảnh nền do người dùng tự khai. Nhớ trên máy, và ghi vào 8_THAM_SO_GIS để
    chia sẻ cho cả nhóm. Trả về chuỗi rỗng nếu chưa khai. */
 window.NEN_TU_KHAI=function(v){try{
   if(v===undefined)return localStorage.getItem('nen_tu_khai')||'';
   if(v)localStorage.setItem('nen_tu_khai',v);else localStorage.removeItem('nen_tu_khai');
  }catch(e){}
  return v||'';};
 window.BASEMAPS=function(){const o={};const tuKhai=(window.NEN_TU_KHAI()||'').trim();
  const ds=tuKhai?defs.concat([['Nền tự khai','Custom base',tuKhai,{maxZoom:20,attribution:'Nguồn ảnh nền do người dùng khai báo'}]]):defs;
  ds.forEach((d,i)=>{const t=L.tileLayer(d[2],d[3]);t._nm=[d[0],d[1]];t._i=i;o[d[0]]=t;
   /* 3.32.6: lớp phủ chữ (nếu có) bật tắt THEO lớp nền, không thêm dòng vào bảng chọn lớp —
      một thứ điều khiển được ở hai nơi là nguồn gốc mâu thuẫn. zIndex 300+ để chữ nằm trên ảnh. */
   if(d[4]&&d[4].length){const mz=(d[3]&&d[3].maxZoom)||19;
    const nhan=d[4].map((u,j)=>L.tileLayer(u,{maxZoom:mz,zIndex:300+j,attribution:''}));
    t._nhan=nhan;
    t.on('add',()=>{const m=t._map;if(m)nhan.forEach(n=>{if(!m.hasLayer(n))n.addTo(m)});});
    t.on('remove',()=>{nhan.forEach(n=>{const m=n._map;if(m)m.removeLayer(n)});});}
   let bad=0;t.on('tileerror',()=>{if(++bad!==8||i>=3)return;const m=t._map;if(!m)return;const nx=o[defs[3][0]];if(!nx||nx===t||m.hasLayer(nx))return;
    nx.addTo(m);m.removeLayer(t);try{parent.__tileWarn&&parent.__tileWarn()}catch(e){}});});
  window.BASEMAPS._last=o;return o;};
})();

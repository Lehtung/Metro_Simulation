/* @file js/02-ban-do-nen.js — danh mục bản đồ nền cho Leaflet (window.BASEMAPS) */
(function(){
 const A_OSM='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
 const defs=[
  ['Bản đồ nền','Street map','https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',{subdomains:'abcd',maxZoom:20,attribution:A_OSM+' &copy; <a href="https://carto.com/attributions">CARTO</a>'}],
  ['Nền sáng','Light base','https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',{subdomains:'abcd',maxZoom:20,attribution:A_OSM+' &copy; <a href="https://carto.com/attributions">CARTO</a>'}],
  ['Ảnh vệ tinh','Satellite','https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{maxZoom:19,attribution:'Tiles &copy; Esri, Maxar, Earthstar Geographics'}],
  ['Nền xám (dự phòng)','Grey base (fallback)','https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',{maxZoom:16,attribution:'Tiles &copy; Esri'}]
 ];
 window.BASEMAPS=function(){const o={};defs.forEach((d,i)=>{const t=L.tileLayer(d[2],d[3]);t._nm=[d[0],d[1]];t._i=i;o[d[0]]=t;
   let bad=0;t.on('tileerror',()=>{if(++bad!==8||i>=3)return;const m=t._map;if(!m)return;const nx=o[defs[3][0]];if(!nx||nx===t||m.hasLayer(nx))return;
    nx.addTo(m);m.removeLayer(t);try{parent.__tileWarn&&parent.__tileWarn()}catch(e){}});});
  window.BASEMAPS._last=o;return o;};
})();

/* @file js/khung/cau-hinh.js — cấu hình bản web (sửa dòng API_URL sau khi triển khai Apps Script)
   API_URL: địa chỉ Web App của Google Apps Script, dạng https://script.google.com/macros/s/<mã triển khai>/exec
   (Apps Script → Deploy → Manage deployments → sao chép "Web app URL"). */
window.CAU_HINH_WEB = {
  API_URL: 'https://script.google.com/macros/s/AKfycbxYPn814r58wJ7-IlS0HBRNqX2u6V5KLAieK8jotSPCTHadPLnXLjJSjWuKmBEvSV2h/exec
',
  THOI_GIAN_CHO_MS: 90000,
  /* Nơi lưu đệm mã tính toán trong trình duyệt:
     'lau_dai' — giữ qua các lần mở trình duyệt (mặc định, nhanh nhất)
     'phien'   — chỉ giữ trong thẻ đang mở, đóng thẻ là xoá
     'tat'     — không lưu đệm, lần nào cũng tải lại mã từ máy chủ */
  DEM_MA: 'lau_dai',
  /* Số luồng tải mã lúc khởi đầu (1–8, mặc định 4). Số luồng tự co về 1 ngay khi gặp trục trặc.
     Đặt 1 nếu mạng cơ quan hay chặn: chậm hơn nhưng êm nhất. */
  SO_LUONG: 4
};

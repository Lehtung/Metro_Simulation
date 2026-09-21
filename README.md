# Metro_Simulation — Mô phỏng chạy tàu Đường sắt đô thị (bản web)

Trang tĩnh chạy trên GitHub Pages: https://lehtung.github.io/Metro_Simulation/

Kho này chỉ chứa **lớp giao diện** (HTML, CSS) và **khung** đăng nhập / gọi máy chủ. Mã tính toán, dữ liệu 5 tuyến,
bộ thông số và tài khoản nằm trên Google Apps Script + Google Sheet của Ban Quản lý, chỉ được gửi về trình duyệt sau khi đăng nhập.

Tệp duy nhất cần sửa khi triển khai: `js/khung/cau-hinh.js` → dán địa chỉ Web App của Apps Script vào `API_URL`.

Các tệp trong kho được **sinh tự động** bởi `07_TRIEN_KHAI_WEB/cong_cu/dung_ban_web.mjs` trong gói bàn giao — không sửa tay
ở đây, hãy sửa mã nguồn rồi dựng lại (xem `HUONG_DAN_TRIEN_KHAI.md` trong gói bàn giao).

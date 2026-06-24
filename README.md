# 🏛️ The Will Studio - Premium Management System

Hệ thống Quản lý và Điều hành nội bộ cao cấp dành cho Studio cưới **The Will Studio**, được thiết kế với giao diện Champagne/Gold sang trọng, tích hợp đầy đủ tính năng vận hành doanh nghiệp thời gian thực.

![The Will Studio Mockup](assets/the_will_studio_mockup.png)

---

## 🛠️ Công Nghệ Sử Dụng (Tech Stack)

Hệ thống được phát triển theo mô hình ứng dụng web đơn trang (SPA) tối ưu và độc lập:
* **Frontend:** React JS (Vite), Tailwind CSS v4 (Sử dụng hệ phông chữ hiện đại *Plus Jakarta Sans* và *Playfair Display*).
* **Backend:** Express API (Node.js) chạy song song với Vite Dev Middleware.
* **ORM:** Prisma v6 (Đảm bảo truy vấn an toàn và tự động hóa lược đồ).
* **Cơ sở dữ liệu:** PostgreSQL (Chạy độc lập trên môi trường Docker).
* **Bảo mật:** Cơ chế Session Token (Bearer Authorization) lưu trữ và đồng bộ hóa trạng thái đăng nhập.

---

## ✨ Tính Năng Nổi Bật

1. **Quản lý Hợp đồng & Đơn hàng:** Theo dõi trạng thái đơn hàng (Mới, Xác nhận, Đang chụp, Hậu kỳ, Sẵn sàng, Đã giao, Đã hủy) trực quan.
2. **Hệ thống Phân công Công việc:** Giao việc cho các bộ phận (Thợ chụp, Thợ làm ảnh), cập nhật trạng thái tiến độ thời gian thực.
3. **Bong bóng thông báo (Toast Balloons) thời gian thực:** Nhận cảnh báo thông báo mới và tin nhắn nội bộ ngay lập tức tại bất cứ trang nào đang mở, có hiệu ứng chuyển động mượt mà.
4. **Theo dõi Mục tiêu OKR:** Quản lý doanh số và tiến trình mục tiêu theo phòng ban (Chụp ảnh, Hậu kỳ, CSKH, Marketing).
5. **Kênh Chat nội bộ:** Trò chuyện nhóm chung và chat riêng tư giữa các nhân viên để phối hợp công việc.
6. **Quản lý Cơ sở dữ liệu chuyên nghiệp:**
   * Xuất toàn bộ dữ liệu hệ thống ra tệp `.json` dự phòng.
   * Khôi phục dữ liệu từ tệp tin đã sao lưu trực tiếp vào PostgreSQL.
   * Lên lịch tự động sao lưu và tạo bản sao lưu vật lý độc lập trên ổ đĩa máy chủ.

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Nhanh (Localhost)

### Yêu cầu hệ thống:
* **Docker** & **Docker Compose**
* **Node.js** (Phiên bản >= 20)

### Các bước khởi chạy môi trường sản xuất (Production):

1. **Tải mã nguồn về máy chủ/localhost:**
   ```bash
   git clone https://github.com/vinhle158/weddingstudio.git
   cd weddingstudio
   ```

2. **Cấu hình tệp môi trường (`.env`):**
   Tạo tệp `.env` ở thư mục gốc của dự án với nội dung:
   ```env
   DATABASE_URL="postgresql://studio_user:production_password@postgres:5432/studio_db?schema=public"
   APP_URL="http://localhost:3000"
   ```

3. **Khởi chạy hệ thống bằng Docker Compose:**
   Chạy lệnh dưới đây để tự động tải cơ sở dữ liệu PostgreSQL, biên dịch mã nguồn sản xuất của Web và khởi chạy hệ thống:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d --build
   ```

4. **Truy cập ứng dụng:**
   Mở trình duyệt và truy cập: `http://localhost:3000`

---

## 🔑 Tài Khoản Thử Nghiệm Mặc Định

Dữ liệu hạt giống (Seed data) sẽ tự động được khởi tạo vào PostgreSQL khi chạy lần đầu. Bạn có thể sử dụng các tài khoản sau để đăng nhập:

| Chức vụ | Tài khoản (Email) | Mật khẩu (Password) | Quyền hạn |
| :--- | :--- | :--- | :--- |
| **Quản trị viên (Admin)** | `admin@studio.com` | `123abc456` *(hoặc `admin123`)* | Toàn quyền, cấu hình hệ thống, quản trị dữ liệu |
| **Quản lý (Manager)** | `manager@studio.com` | `manager123` | Quản lý hợp đồng, đơn hàng, khách hàng, giao việc |
| **Nhân viên (Photographer)** | `photo@studio.com` | `staff123` | Nhận công việc được giao, báo cáo tiến độ |
| **Nhân viên (Editor)** | `editor@studio.com` | `staff123` | Nhận công việc được giao, báo cáo tiến độ |

---

## 📂 Cấu Trúc Thư Mục Dự Án

* **`server.ts`**: Express Server cấu hình các API endpoints và static web server.
* **`prisma/`**: Chứa lược đồ cơ sở dữ liệu `schema.prisma`.
* **`src/db_service.ts`**: Cầu nối truy vấn cơ sở dữ liệu PostgreSQL thông qua Prisma Client.
* **`src/App.tsx`**: Giao diện và luồng điều hướng chính của ứng dụng.
* **`src/components/`**: Các tab chức năng (Lịch trình, Hợp đồng, Khách hàng, Nhóm chat, Mục tiêu OKR, Cài đặt).

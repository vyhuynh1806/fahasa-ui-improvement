# 🐱 Cat's Little Day – Một ngày nhỏ của mèo

**Cat's Little Day** là ứng dụng quản lý công việc cá nhân (Todo App) kết hợp trò chơi chăm sóc mèo ảo. Người dùng hoàn thành các nhiệm vụ hằng ngày để nhận xu, sau đó dùng xu chăm sóc chú mèo Miu trong khu vườn nhỏ.

Dự án có **frontend, backend và cơ sở dữ liệu SQLite thực tế**. Các thao tác trên giao diện được gửi đến REST API và lưu vào database; không sử dụng `localStorage` làm nơi lưu dữ liệu chính.

## 1. Mục tiêu dự án

- Giúp người dùng lập kế hoạch và theo dõi công việc mỗi ngày.
- Khuyến khích hoàn thành nhiệm vụ qua cơ chế thưởng xu và chăm sóc thú cưng.
- Xây dựng một website full-stack với giao diện thân thiện, responsive.
- Thực hành HTML, CSS, JavaScript, Node.js, Express, SQLite và REST API.

## 2. Chức năng hệ thống

### 🏡 Trang Cat's Garden – Khu vườn của Miu

- Hiển thị chú mèo Miu cùng khung cảnh khu vườn pastel.
- Mèo có **3 trạng thái**: vui vẻ, buồn ngủ và đói.
- Hiển thị **số xu hiện có** của người dùng.
- Hiển thị nhiệm vụ trong ngày, cho phép đánh dấu hoàn thành và thêm nhanh công việc.
- **Hoàn thành một nhiệm vụ:** sẽ nhận **10 xu**.
- **Cho mèo ăn:** tiêu **20 xu**, giảm mức độ đói của mèo.
- Có thể **vuốt ve**, **cho ngủ** và **đánh thức** mèo.
- Có hiệu ứng chuyển động và phản hồi trực quan khi người dùng tương tác.

### 📒 Trang My Little Tasks – Sổ tay công việc

- **Thêm công việc:** nhập tên, mô tả và ngày thực hiện.
- **Xem công việc:** chuyển giữa danh sách hôm nay và tất cả công việc.
- **Sửa công việc:** cập nhật nội dung hoặc ngày thực hiện.
- **Xóa công việc** không còn cần thiết.
- **Đánh dấu hoàn thành / bỏ hoàn thành** bằng checkbox.
- **Tìm kiếm** công việc theo tên (hỗ trợ tìm không dấu).
- **Lọc trạng thái:** Tất cả / Chưa hoàn thành / Đã hoàn thành.
- Theo dõi **thanh tiến độ hoàn thành công việc trong ngày**.
- Thay đổi công việc được cập nhật vào SQLite thông qua API.

### 🌷 Trang My Progress – Thống kê

- Tổng số công việc đã tạo.
- Số công việc đã hoàn thành và chưa hoàn thành.
- Tỷ lệ hoàn thành công việc.
- Tổng số xu hiện có.
- Thống kê tiến độ trong ngày và biểu đồ công việc trong **7 ngày gần nhất**.
- Sử dụng **Chart.js** để trực quan hóa số liệu.

### 🪙 Quy tắc tính xu

| Hành động | Thay đổi xu |
| --- | ---: |
| Đánh dấu một công việc chưa hoàn thành thành hoàn thành | +10 |
| Đánh dấu hoàn thành lại công việc đã hoàn thành | 0 |
| Bỏ đánh dấu hoàn thành | -10 |
| Xóa công việc đã hoàn thành | -10 |
| Cho mèo ăn | -20 |

Việc hoàn thành task và thay đổi số xu được xử lý bằng **SQLite transaction** để tránh cộng thưởng trùng. Nếu đã tiêu xu rồi mới bỏ hoàn thành hoặc xóa task, số xu có thể âm nhằm bảo đảm tính nhất quán; người dùng phải có ít nhất 20 xu để cho mèo ăn.

## 3. Công nghệ sử dụng

| Thành phần | Công nghệ |
| --- | --- |
| Frontend | HTML5, CSS3, JavaScript thuần (ES Modules) |
| Backend | Node.js, Express.js |
| Database | SQLite (`node:sqlite`) |
| Giao tiếp | REST API, Fetch API, JSON |
| Biểu đồ | Chart.js |
| Kiểm thử | Node.js Test Runner (`node --test`) |

> Yêu cầu **Node.js 22.13.0 trở lên** để sử dụng module `node:sqlite`.

## 4. Cơ sở dữ liệu

Database được **tự khởi tạo khi chạy lần đầu**, với hai bảng chính:

- **`tasks`**: `id`, `title`, `description`, `task_date`, `status`, `created_at` — lưu thông tin và trạng thái công việc.
- **`cat`**: `id`, `mood`, `hunger`, `coins`, `updated_at` — lưu trạng thái mèo và số xu.

File SQLite nằm tại `backend/database/cats.sqlite` sau khi chạy ứng dụng. Dữ liệu được giữ lại khi khởi động lại server. Database có dữ liệu công việc mẫu ở lần chạy đầu để thuận tiện trải nghiệm.

## 5. Các REST API chính

| Phương thức | Endpoint | Chức năng |
| --- | --- | --- |
| GET | `/api/tasks` | Lấy danh sách công việc; hỗ trợ `date`, `status`, `search` |
| POST | `/api/tasks` | Thêm công việc |
| PUT | `/api/tasks/:id` | Sửa công việc |
| DELETE | `/api/tasks/:id` | Xóa công việc |
| PATCH | `/api/tasks/:id/complete` | Hoàn thành / bỏ hoàn thành công việc |
| GET | `/api/stats` | Lấy số liệu thống kê |
| GET | `/api/cat` | Lấy trạng thái mèo và số xu |
| POST | `/api/cat/feed` | Cho mèo ăn |
| POST | `/api/cat/pet` | Vuốt ve mèo |
| POST | `/api/cat/nap` | Cho mèo ngủ / đánh thức |

Frontend sử dụng `fetch()` gọi API; backend kiểm tra dữ liệu đầu vào và trả thông báo lỗi bằng JSON khi yêu cầu không hợp lệ.

## 6. Cấu trúc thư mục

```text
cats-little-day/
├── frontend/
│   ├── index.html            # Cat's Garden
│   ├── tasks.html            # My Little Tasks
│   ├── progress.html         # My Progress
│   ├── css/style.css
│   ├── js/                   # Fetch API và xử lý giao diện
│   └── assets/               # Hình minh họa SVG
├── backend/
│   ├── server.js             # Express server
│   ├── routes/               # Khai báo API routes
│   ├── controllers/          # Xử lý yêu cầu API
│   └── database/             # Kết nối, schema, thao tác SQLite
├── tests/store.test.js       # Kiểm thử database và nghiệp vụ
├── package.json
├── .gitignore
└── README.md
```

## 7. Hướng dẫn cài đặt và chạy

**Bước 1:** Cài Node.js 22.13+ và mở thư mục **`cats-little-day`** (nơi có file `package.json`) trong VS Code.

**Bước 2:** Mở Terminal và chạy:

```bash
npm install
npm run dev
```

Trên **Windows PowerShell**, nếu bị chặn script `npm.ps1`, dùng:

```powershell
npm.cmd install
npm.cmd run dev
```

**Bước 3:** Truy cập **http://127.0.0.1:3000** để dùng website.

Nếu cổng 3000 đang được chương trình khác sử dụng, đổi cổng trên PowerShell:

```powershell
$env:PORT=43127
npm.cmd start
```

Sau đó mở **http://127.0.0.1:43127**. Giữ Terminal chạy server trong lúc sử dụng ứng dụng.

> **Lưu ý:** Không dùng Live Server hoặc mở HTML trực tiếp bằng `file://` để chạy chức năng CRUD và chăm mèo, vì các tính năng này cần Express API và SQLite.

## 8. Kiểm thử

Chạy bộ kiểm thử tự động:

```bash
npm test
```

Các tình huống được kiểm tra gồm: khởi tạo database; thêm/sửa/xóa, tìm kiếm và lọc công việc; cộng xu khi hoàn thành; ngăn cộng trùng; trừ xu khi hoàn tác/xóa; cho mèo ăn; thống kê và lưu dữ liệu SQLite.

Khi chạy trên máy cá nhân, nên kiểm tra thêm giao diện desktop/mobile và thao tác thực tế với ba trang web.

## 9. Ghi chú và phạm vi

- Ứng dụng hiện phục vụ **một người dùng**, chưa tích hợp tài khoản và đăng nhập.
- Giao diện được thiết kế theo phong cách **Cozy Cat Game** với màu kem, xanh lá pastel, hồng nhạt và vàng bơ.
- Dự án có sử dụng AI/Codex hỗ trợ tạo cấu trúc, viết code và kiểm thử.
- Thư mục `node_modules` và file database được bỏ qua khi đẩy lên GitHub thông qua `.gitignore`.

---


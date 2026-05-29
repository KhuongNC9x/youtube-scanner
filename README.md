# YouTube Top 5 Scanner

Công cụ quét và phân tích top 5 video có lượt xem cao nhất từ danh sách kênh YouTube tùy chọn.

## Tính năng

- Quét nhiều kênh YouTube cùng lúc trong khoảng thời gian tùy chọn (1–30 ngày)
- Hiển thị top 5 video có lượt xem cao nhất
- Phân tích chi tiết từng video: viral score, engagement rate, tiềm năng theo nền tảng (TikTok, Facebook, Instagram, X)
- Gợi ý tối ưu nội dung dựa trên chỉ số thực tế
- Quản lý danh sách kênh: thêm, xóa, bật/tắt
- Giao diện dark/light mode
- Không cần cài đặt — chạy thẳng trên trình duyệt

## Yêu cầu

**YouTube Data API v3 key** — miễn phí, tạo tại [Google Cloud Console](https://console.cloud.google.com/).

Hướng dẫn lấy key:
1. Vào [console.cloud.google.com](https://console.cloud.google.com/) → tạo project mới
2. Vào **APIs & Services** → **Enable APIs** → tìm và bật **YouTube Data API v3**
3. Vào **Credentials** → **Create Credentials** → **API key**
4. Copy key và dán vào ô trong ứng dụng

> Quota miễn phí: 10.000 units/ngày. Mỗi lần quét tốn khoảng 100–300 units tùy số kênh.

## Cách dùng

1. Mở file `YouTube Scanner.html` trên trình duyệt (Chrome/Edge/Firefox)
2. Dán YouTube Data API key vào ô phía trên
3. Kéo thanh trượt để chọn khoảng thời gian cần quét
4. Bật/tắt kênh trong danh sách hoặc thêm kênh mới
5. Nhấn **Bắt đầu quét**
6. Click vào bất kỳ video nào trong kết quả để xem phân tích chi tiết

## Quản lý kênh

| Thao tác | Cách làm |
|---|---|
| Bật/tắt kênh | Gạt công tắc bên trái tên kênh |
| Thêm kênh | Nhấn "+ Thêm kênh mới", nhập handle (@TenKenh) và tên hiển thị |
| Xóa kênh | Nhấn × → xác nhận xóa |

Danh sách kênh được lưu tự động trong trình duyệt.

## Phân tích video

Khi click vào một video trong kết quả, bảng phân tích hiển thị:

- **Chỉ số cơ bản** — lượt xem, lượt thích, bình luận
- **Viral Score (0–100)** — điểm tổng hợp đánh giá khả năng lan truyền
- **So sánh top 5** — vị trí của video so với 4 video còn lại
- **Tiềm năng theo nền tảng** — điểm phù hợp khi đăng lên TikTok / Facebook / Instagram / X
- **Gợi ý tối ưu** — lời khuyên cụ thể dựa trên chỉ số video

### Cách đọc Viral Score

| Điểm | Đánh giá |
|---|---|
| 80–100 | Viral cao — thuật toán đang đẩy mạnh |
| 65–79 | Trend tốt — có tiềm năng nếu chia sẻ đúng thời điểm |
| 45–64 | Khá ổn — cần tối ưu thêm |
| 0–44 | Chưa cao — chưa tạo được nhiều tương tác |

## Kênh mặc định

Ứng dụng đi kèm 7 kênh VietSub/review phim mặc định:

- Bao Bao VietSub
- Ngư Thủ Sư Mạnh Nhất Mỹ VietSub
- Trauma Preview
- Hồng Hót VietSub
- Thiết Review Phim
- Thi Vietsub Phim
- Noan Noan Review

## Công nghệ

Thuần HTML/CSS/JavaScript — không dùng framework, không cần build, không cần server. Toàn bộ nằm trong một file duy nhất.

- Dữ liệu kênh lưu trong `localStorage`
- Gọi trực tiếp YouTube Data API v3
- Font: Be Vietnam Pro (Google Fonts)

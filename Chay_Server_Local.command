#!/bin/bash
# ==========================================================
# Khởi động ZenVibe để dùng trên cả Máy Tính và Điện Thoại
# ==========================================================
cd "$(dirname "$0")"

PORT=8080
while lsof -i :$PORT >/dev/null 2>&1; do
    PORT=$((PORT + 1))
done

IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "localhost")

echo "=========================================================="
echo "  🍃 ZENVIBE - RELAXING SOUNDS (MÁY TÍNH & ĐIỆN THOẠI)    "
echo "=========================================================="
echo ""
echo "👉 1. TRÊN MÁY TÍNH NÀY:"
echo "   Mở: http://localhost:$PORT"
echo ""
echo "👉 2. TRÊN ĐIỆN THOẠI (iPhone / Android) TRONG PHÒNG NGỦ:"
echo "   Mở Safari hoặc Chrome trên điện thoại và truy cập:"
echo ""
echo "   >>>  http://$IP:$PORT  <<<"
echo ""
echo "   (Mẹo: Nhấn nút Chia sẻ trong Safari -> 'Thêm vào MH chính'"
echo "    để nghe thư giãn như một ứng dụng độc lập không có thanh địa chỉ)"
echo ""
echo "=========================================================="
echo "  (Nhấn phím Ctrl + C để dừng khi không dùng nữa)         "
echo "=========================================================="

sleep 1
if [ -d "/Applications/Google Chrome.app" ]; then
    open -a "Google Chrome" "http://localhost:$PORT"
else
    open "http://localhost:$PORT"
fi

/usr/bin/python3 -m http.server $PORT --bind 0.0.0.0

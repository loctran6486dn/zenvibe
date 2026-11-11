#!/bin/bash
# ==========================================================
# Script mở nhanh ZenVibe Relaxing Sounds trên macOS
# ==========================================================
cd "$(dirname "$0")"

echo "=========================================================="
echo "  🍃 Đang mở ZenVibe - Relaxing Ambient Sounds 🍃         "
echo "=========================================================="

# Ưu tiên mở bằng Google Chrome hoặc Safari
if [ -d "/Applications/Google Chrome.app" ]; then
    open -a "Google Chrome" "index.html"
elif [ -d "/Applications/Safari.app" ]; then
    open -a "Safari" "index.html"
else
    open "index.html"
fi

echo "✅ Đã mở ZenVibe trên trình duyệt của bạn!"
sleep 2
exit 0


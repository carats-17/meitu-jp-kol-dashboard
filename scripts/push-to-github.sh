#!/bin/bash
set -e
cd "$(dirname "$0")"

echo "==> 连接 GitHub 仓库..."
git remote remove origin 2>/dev/null || true
git remote add origin https://github.com/carats-17/meitu-jp-kol-dashboard.git
git branch -M main

echo "==> 推送代码（若弹出登录窗口，请用 GitHub 账号登录）..."
git push -u origin main

echo ""
echo "✅ 推送完成！打开检查："
echo "https://github.com/carats-17/meitu-jp-kol-dashboard"
echo ""
echo "下一步：去 https://railway.app 用 GitHub 登录并部署这个仓库。"

# 时序主屏幕图标

以项目现有 `gold-coin-flat.png` 为参考，通过内置 imagegen 编辑生成深绿色背景的立体箭头金币。

- `shixu-gold-master.png`：生成原图。
- `shixu-gold-v1-180.png`：iOS 主屏幕图标，180 × 180，不透明 PNG。
- `apple-touch-icon.png`：同一图标的根路径兼容版本。
- `shixu-gold-v1-32.png`：浏览器标签图标，32 × 32。

所有入口页（包括登录页）由 `site-icons-build.mjs` 统一注入图标链接和名称「时序」。系统负责裁切圆角，因此图像本身保留完整方形背景。已添加的旧图标可能保留缓存；移除旧快捷方式后，从 Safari 重新添加到主屏幕。

## 生成提示词

Preserve the existing distinctive faceted low-poly 3D golden coin with its embossed diagonal upward arrow, same perspective, warm gold faces and orange bevels. Create a square iOS home-screen icon, centered coin approximately 78% of the canvas, fully opaque deep forest green background #103b31, subtle soft shadow, crisp at small sizes. No words, letters, border, pre-rounded corners, phone or mockup.

尺寸导出使用 Sharp 的 resize 和 flatten，构建直接复制已导出的 PNG，不依赖图像生成服务。

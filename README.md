# 个人博客

这是一个基于前后端分离的个人博客项目，支持文章发布、留言、后台管理等功能。适合自用或学习参考。

## 目录结构

```
├── server/         # 后端接口（Node.js/TypeScript）
├── web/            # 前端页面和静态资源
│   ├── images/     # 图片资源
│   ├── videos/     # 视频资源（大文件请勿上传到GitHub）
│   ├── js/         # 前端脚本
│   └── css/        # 样式文件
├── package.json    # 项目依赖
└── README.md       # 项目说明
```

## 快速运行

1. **安装依赖**

   ```bash
   npm install
   ```

2. **启动后端服务**

   ```bash
   # 进入 server 目录（如有 package.json 可单独安装依赖）
   # cd server
   # npm install
   # cd ..
   node server/xxx.js  # 具体入口文件请根据实际情况填写
   ```

3. **访问前端页面**

   直接用浏览器打开 `web/index.html` 即可预览博客主页。

## 背景图片/视频上传说明

- **背景图片/视频请勿直接上传到GitHub仓库！**
- 如果需要自定义背景视频或大图片，请将文件放在 `web/videos/` 或 `web/images/` 目录下，并**确保文件名与前端引用一致**。
- 由于 GitHub 限制，单个文件超过 100MB 无法上传到仓库。你可以：
  - 本地添加大文件，不要提交到 git（已在 `.gitignore` 配置）。
  - 或使用云存储/外链方式，在前端页面中引用。

## 注意事项

- `web/videos/background.mp4` 已被 `.gitignore` 忽略，防止上传失败。
- 如需部署到服务器，请根据实际环境配置后端服务端口和静态资源路径。

## 功能简介

- 文章浏览与发布
- 留言板
- 后台管理（如有 admin.html）
- 支持自定义头像、封面、背景等

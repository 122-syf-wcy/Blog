# Aurora个人博客

这是一个基于HTML、CSS和JavaScript的个人博客前端项目。

## 项目结构

```
web/
  ├── css/
  │   └── style.css         # 主样式文件
  ├── js/
  │   └── main.js           # 主JavaScript文件
  ├── images/               # 图片目录
  ├── videos/               # 视频目录
  ├── index.html            # 首页
  ├── blog.html             # 博客文章列表页
  ├── blog-post.html        # 博客文章详情页
  ├── about.html            # 关于我页面
  ├── message.html          # 留言板页面
  └── README.md             # 项目说明文件
```

## 设置说明

1. 请确保将背景视频文件放置在 `videos/` 目录中，并命名为 `background.mp4`
   - 您可以使用自己的视频文件替换它
   - 推荐使用尺寸为 1920x1080 的视频

2. 需要添加的图片文件：
   - `images/avatar.jpg` - 博主头像（建议尺寸：80x80，圆形）
   - `images/profile.jpg` - 个人形象照（建议尺寸：400x400）
   - `images/about-me.jpg` - 关于我页面的照片（建议尺寸：600x800）
   - `images/post1.jpg` 到 `images/post4.jpg` - 博客文章缩略图（建议尺寸：600x400）
   - `images/post1-banner.jpg` - 博客文章详情页的横幅图（建议尺寸：1200x600）
   - `images/user1.jpg` 到 `images/user7.jpg` - 用户头像（建议尺寸：100x100，圆形）
   - `images/fallback-bg.jpg` - 视频加载失败时的备用背景图（建议尺寸：1920x1080）

## 自定义

### 替换背景视频

将您的视频文件放入 `videos` 目录，并确保在HTML文件中正确引用：

```html
<video autoplay loop muted id="bg-video">
    <source src="videos/background.mp4" type="video/mp4">
</video>
```

您可以替换 `background.mp4` 为您的视频文件名。

### 更改配色方案

您可以在 `css/style.css` 文件中修改颜色变量来自定义网站的配色方案：

```css
:root {
    --primary-color: #6a5acd;     /* 主色调 */
    --secondary-color: #9370db;   /* 次要色调 */
    --accent-color: #ff6b6b;      /* 强调色 */
    /* ... 其他颜色变量 ... */
}
```

## 功能

- 响应式设计，适配不同屏幕尺寸
- 博客文章列表和详情页
- 文章评论系统（前端展示）
- 留言板功能（前端展示）
- 背景视频
- 联系表单

## 注意事项

- 此项目仅包含前端代码，没有后端功能
- 评论、留言和联系表单提交不会被保存，仅作为演示
- 要完成完整的博客功能，需要添加后端服务 
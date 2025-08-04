# 如何添加本地视频到博客

本指南将帮助您将本地视频文件（如 `D:\SteamLibrary\steamapps\workshop\content\431960\3464212308\物语花绫Hanaya60帧.mp4`）添加到博客的背景中。

## 步骤

1. **准备视频文件**
   
   确保您的视频文件格式为MP4，并且尺寸适合作为网页背景（建议1920x1080分辨率）。

2. **复制视频文件到项目目录**
   
   将您的视频文件（例如 `物语花绫Hanaya60帧.mp4`）复制到博客项目的 `web/videos/` 目录下。

3. **重命名或更新引用**
   
   您有两个选择：

   **选项一：重命名视频文件（推荐）**
   
   将您的视频文件重命名为 `background.mp4`，这样就不需要修改代码。
   
   **选项二：修改HTML代码中的引用**
   
   如果您不想重命名文件，可以修改所有HTML文件中视频的引用路径。在每个HTML文件（index.html, blog.html, blog-post.html, about.html, message.html）中找到以下代码：

   ```html
   <video autoplay loop muted id="bg-video">
       <source src="videos/background.mp4" type="video/mp4">
   </video>
   ```

   将其更改为：

   ```html
   <video autoplay loop muted id="bg-video">
       <source src="videos/物语花绫Hanaya60帧.mp4" type="video/mp4">
   </video>
   ```

4. **性能考虑**
   
   如果您的视频文件很大（超过10MB），可能会影响网页加载速度和性能。建议：
   
   - 压缩视频以减小文件大小
   - 考虑使用较低分辨率版本
   - 确保视频长度适中（建议30秒至1分钟，循环播放）

5. **视频无法播放时的后备方案**
   
   我们的代码已经包含了当视频无法加载时使用静态背景图的后备方案。请确保在 `images/` 目录中放置一个名为 `fallback-bg.jpg` 的图片。

## 直接使用绝对路径（不推荐）

虽然技术上可以直接在HTML中使用本地绝对路径，但这不是推荐的做法，因为：

1. 安全限制 - 浏览器可能限制访问本地文件系统
2. 可移植性 - 当博客部署到服务器或分享给他人时会失效
3. 路径问题 - 不同操作系统的路径格式不同

如果您仍想尝试直接引用，可以这样修改：

```html
<video autoplay loop muted id="bg-video">
    <source src="file:///D:/SteamLibrary/steamapps/workshop/content/431960/3464212308/物语花绫Hanaya60帧.mp4" type="video/mp4">
</video>
```

但请注意，这种方法可能只在您的本地计算机上工作，并且存在安全和兼容性问题。

## 故障排除

如果视频不能正常显示：

1. 检查视频文件是否已正确复制到 `videos/` 目录
2. 确认视频格式是MP4且编码兼容Web播放（H.264编码推荐）
3. 检查HTML中的路径是否正确
4. 查看浏览器控制台是否有错误信息
5. 某些浏览器可能会阻止自动播放视频，请检查浏览器设置 
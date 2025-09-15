# 小红书内容生成器

一个用于将评论和视频素材转换为适合小红书发布的图片的工具。

## 功能特性

- 将JSON格式评论转换为美观的图片格式
- 支持主评论和回复的层级结构显示
- 视频素材处理，可截取视频帧生成图片
- 支持均匀和随机两种截图模式
- 图片分组管理，可删除不需要的图片组
- 支持将所有生成的图片打包为ZIP文件下载
- 支持键盘快捷键操作（左右箭头切换图片，ESC关闭预览）
- 支持上传JSON格式的文件

## 文件结构

```
.
├── index.html              # 主页面结构
├── styles.css              # 样式文件
├── constants.js            # 常量配置
├── utils.js                # 通用工具函数
├── comment-parser.js       # 评论解析模块
├── image-generator.js      # 图片生成模块
├── video-processor.js      # 视频处理模块
├── ui-controller.js        # UI控制模块
├── main.js                 # 应用主入口
├── 小红书评论图片生成器.html  # 原始文件(备份)
├── 测试评论.txt
└── 评论.md
```

## 模块说明

### index.html
主页面结构文件，包含所有HTML元素和UI组件。

### styles.css
包含所有自定义样式，包括：
- 加载动画
- 模态框样式
- 视频播放器样式
- 图片组样式

### constants.js
应用常量配置，包括：
- 背景图片数据

### utils.js
通用工具函数，包括：
- HTML转义函数
- 文本换行处理
- SVG转PNG转换器

### comment-parser.js
评论解析模块，负责：
- 解析JSON格式的评论
- 计算评论布局
- 将评论分块以适应图片尺寸

### image-generator.js
图片生成模块，负责：
- 生成SVG格式的评论图片
- 处理评论和回复的视觉布局
- 支持显示评论发布时间

### video-processor.js
视频处理模块，负责：
- 在指定时间截取视频帧
- 生成均匀或随机的截图时间戳

### ui-controller.js
UI控制模块，负责：
- DOM元素管理和缓存
- 事件监听器初始化
- 用户交互处理
- 图片预览和管理
- ZIP打包下载功能
- 自动识别输入格式（仅支持JSON）
- 支持上传JSON文件

### main.js
应用主入口文件，在DOM加载完成后初始化UI控制器。

## 使用说明

1. 打开 `index.html` 文件
2. 在左侧面板输入评论内容或上传.json文件
3. 点击"生成评论图"按钮生成图片
4. 可上传视频文件并截取视频帧生成图片
5. 在右侧预览区域查看生成的图片
6. 点击图片可放大预览
7. 使用"全部下载为.zip"按钮打包下载所有图片

## 评论格式

### JSON格式
支持直接粘贴JSON格式的评论数据，系统会自动识别并解析。JSON格式支持以下字段：
- author: 用户名
- text: 评论内容
- like_count: 点赞数
- datetime: 评论时间
- replies: 回复列表

系统会自动过滤掉不需要的字段（如id、parent、author_id等）。

## 技术栈

- HTML5
- CSS3 (Tailwind CSS)
- JavaScript (ES6+)
- JSZip (用于打包下载)

## 浏览器兼容性

支持所有现代浏览器（Chrome, Firefox, Safari, Edge等）。

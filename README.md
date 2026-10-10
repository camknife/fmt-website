# 国际筋膜整复学院 · 官网

`fmt-fascia.cn` 的站点源码。纯静态 HTML5 + CSS3 + 原生 JavaScript —— **无框架、无构建步骤、无 package.json**。

## 目录结构

```
.
├── website/              站点文件（部署时上传的就是这里）
│   ├── index.html        首页
│   ├── courses.html      课程体系
│   ├── gallery.html      往期课程
│   ├── library.html      学习资源
│   ├── verify.html       认证查询（仅样式展示，无查询接口）
│   ├── contact.html      联系我们
│   ├── apply.html        立即报名
│   ├── css/style.css
│   ├── js/main.js
│   ├── robots.txt / sitemap.xml
│   ├── llms.txt / llms-full.txt         AI 爬虫用
│   ├── .well-known/ai.txt                AI 爬虫权限声明
│   └── ai/summary.json, ai/faq.json      结构化站点摘要
├── deploy.py             部署脚本（凭据从 .env 读取）
└── .env.example          凭据模板
```

**素材不在本仓库。** 图片、视频、PDF 全部托管在阿里云 OSS（`fmt-website` 桶，北京），
页面里是绝对 URL 引用。本地没有 `images/` `videos/` `docs/` 目录也能正常渲染。

## 部署

```bash
pip install paramiko scp
cp .env.example .env      # 填入服务器 IP / 密码 / 站点根目录
python deploy.py          # 上传白名单内的全部文件
python deploy.py index.html css/style.css   # 或只上传指定文件
```

脚本会把 `website/` 下的文件 SCP 到 `ECS_REMOTE_DIR`（默认 `/www/wwwroot/fmt-fascia.cn`），
上传前后各打印一次远端 MD5，并与本地对照。

## 架构

| 部分 | 位置 |
|---|---|
| 页面 | ECS 服务器 `ECS_REMOTE_DIR`，由 Nginx 直接托管 |
| 素材 | 阿里云 OSS 桶 `fmt-website`（`fmt-website.oss-cn-beijing.aliyuncs.com`） |
| 表单后端 | 服务器 `/www/fmt-api/`（Node），把「在线留言」「立即报名」写入企业微信智能表格 |

## 改代码时务必注意

**1. 保持 CRLF 换行。** `website/` 下的 HTML/CSS 是 CRLF 换行。用文本模式读写会把它整篇转成 LF，
导致 diff 爆掉、仓库历史不可读。改文件时用二进制模式或显式指定 `newline=''`。

**2. 静态资源有 30 天缓存，且文件名无版本号。** Nginx 对 CSS/JS/图片设了 `expires 30d`，
而引用永远是 `css/style.css`。改完样式后老访客刷新看不到变化 —— 验收要用 `Ctrl+Shift+R` 强刷。
（若要根治，给引用加 `?v=日期` 查询串。）

**3. 不要提交 `.env`。** 本仓库是公开的。

## 待办

- [ ] 静态资源加版本号，解决改版后访客看到旧版的问题
- [ ] 确认 Facebook 链接是否保留（国内网络打不开）
- [ ] 检查香港地址地图在手机小屏上的标注可读性

## 备案

豫ICP备2026002821号-4 · [工信部备案系统](https://beian.miit.gov.cn/)

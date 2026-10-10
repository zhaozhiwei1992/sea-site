# Sea Tools — 纯静态 SEO 工具站（路线 A）

出海工具站验证期项目。纯静态 HTML + 原生 JS，无框架、无构建依赖（node 内置模块即可）。

## 结构

```
build.mjs        # 生成器：读 site.json + src/tools/* → 渲染 dist/（页面 + sitemap + robots + 404）
site.json        # 站点级配置（域名、标题、启用的工具列表）
src/
  partials/      # 公共 header/footer（改一处全局生效）
  templates/     # 页面骨架（index/tool/about/privacy/404）
  assets/style.css
  tools/{slug}/
    meta.json    # SEO 元数据 + FAQ（后期迁 Thymeleaf → DB/yml）
    app.html     # 功能区静态 HTML（爬虫直出，后期 → Thymeleaf 模板片段）
    app.js       # 交互逻辑（后期 → static/ 原样保留）
```

## 用法

```bash
node build.mjs          # 构建 → dist/（可重复执行）
python3 -m http.server 8080 -d dist   # 本地预览

# 可选：jsdom 无头验证工具交互逻辑（改过 app.js 后跑）
npm i jsdom --no-save && node scripts/verify.mjs
```

## 新增一个工具

```bash
mkdir src/tools/my-tool
# 写 meta.json（SEO 数据+FAQ）、app.html（功能区 HTML）、app.js（交互）
# site.json tools 数组加一行 → node build.mjs
```

## 部署 Cloudflare Pages

见 ~/workspace/notes/常用工具/cloudflare实战.org（wrangler CLI 与 Git 集成两种方式都有）。

## 上线后必改

1. `site.json` 的 `domain` 改成真实域名，重新 build（否则 canonical/sitemap 指向占位域名）
2. `index.html` 里 AdSense 广告位开广告后替换占位注释
3. 视频/文章流量起来后按笔记路线迁 Spring Boot + Thymeleaf（本结构 1:1 映射）


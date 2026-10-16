# OC 创作与陪伴平台 · 内测招募 Landing Page

**版本：v1.6** · 2026-10-17 · 介绍页仍是纯 HTML / CSS / 原生 JS。本地工作室用 Docker 跑在同一地址的 `/login`。

> 「栖灵」为品牌暂名，页面标注「品牌暂名 · 概念设计」。客户案例为**用户提供的 IP 形象**；界面、声音、视频、动画与硬件均为**概念 / 应用方向示意**，不代表已交付或已上线能力。
> 「申请内测」会把邮箱、身份、想体验的能力和一句话提交到飞书多维表格。App Secret 只放在 `apply-api` 的环境变量里，不进仓库。

## 目录

```
landing-v1.1/
├── index.html
├── .nojekyll
├── assets/
│   ├── config.js            # ★ 唯一品牌配置 brandName / pageVersion / contactEmail / privacyUrl
│   ├── styles.css · main.js · favicon.svg
│   ├── oc-derivative.mp4    # 用户提供的衍生视频（7.3 MB，1280×720，10 s）
│   └── img/                 # 从用户设计稿裁切的角色素材（2× LANCZOS 放大 + 边缘羽化透明）
│       ├── hero-pair.png girl.png boy.png           # 白狮 少女 / 少年
│       ├── ip-bailion / ip-octopus / ip-teacher / ip-pets.png
│       ├── def-octopus / voice-octopus / anim-1..4.png
│       ├── device-phone.png  cta-group.png
│       └── poster-01s.jpg poster-04s.jpg            # ffmpeg 截帧（0:01 / 0:04）
└── tools/        crop_assets.py · screenshot.js · compare.py
```

对比截图不进仓库（见 `.gitignore`）。

## 页面结构（与设计稿同序）

1. 顶部导航：✦栖灵 · 角色创作 / 内容生成 / 客户案例 / 随身陪伴 · 申请内测
2. 首屏「一个角色，持续生长的内容。」+ 白狮双人形象 + 角色设定 / 专属声音 / 内容一致性 浮签
3. `#create`「先定义 TA，再让 TA 表达。」三步 + 「我的角色」界面概念（3 张角色卡）
4. `#content`「从同一个角色，长出更多内容。」角色定义 → 声音 → 视频（真实视频）→ 动画 + 一致性校准条
5. `#cases`「不同的 IP，都有自己的表达。」4 个 IP 案例卡
6. `#companion`「内容之外，TA 也可以陪在你身边。」手机与电脑 / 随身设备 + 设备与手机示意
7. `#early-access` 深绿 CTA「让你的 IP，开始下一次表达。」+ 全员合影 + 页脚

视频：默认静音自动播放，循环 0:02–0:06（全息房屋片段），海报为 0:04 截帧；点击播放键或「声音：开」从头完整播放（带旁白）；滚出视口暂停；系统“减少动态效果”时不自动播放。

## 更换品牌名

只改 `assets/config.js` 的 `brandName`。所有 `[data-brand]` 与 `<title>` 自动替换（HTML 内的「栖灵」只是无 JS 回退）。`contactEmail` / `privacyUrl` 为 `null` 时不渲染任何链接。

## 本地预览

```bash
cd landing-v1.1 && python3 -m http.server 8000   # http://localhost:8000  （?static 关闭淡入）
```

## 本地 Docker 工作室

介绍页和登录后的创作工作室在同一个容器里。测试账号 `test`，密码 `123456`。角色、试聊和记忆写在容器卷里，不调用外部模型。

```bash
docker compose up --build
# http://localhost:8080        介绍页
# http://localhost:8080/login  工作室
```

清空演示数据：`docker compose down -v`。

## 发布到 GitHub Pages

1. 新建仓库，把 `landing-v1.1/` **目录内的内容**放到仓库根目录（或 `docs/`）。
2. 提交并推送：
   ```bash
   git init && git add . && git commit -m "Landing page v1.1"
   git branch -M main
   git remote add origin git@github.com:<账号>/<仓库>.git
   git push -u origin main
   ```
3. 仓库 **Settings → Pages → Build and deployment**：Source 选 *Deploy from a branch*，Branch 选 `main` / `(root)`（或 `/docs`），Save。
4. 1–2 分钟后访问 `https://<账号>.github.io/<仓库>/`。全部为相对路径，子路径部署无需改动。
5. 品牌与域名未定，**暂不配置 CNAME**。

## 重新生成素材 / 截图（可选）

```bash
python3 tools/crop_assets.py                 # 需 Pillow + numpy；源图路径见脚本顶部
cd tools && npm i puppeteer-core && cd .. && node tools/screenshot.js "$(pwd)" && python3 tools/compare.py
```

## 内测申请

页面把申请 POST 到 `assets/config.js` 的 `applyUrl`。接口在 `apply-api/`：校验邮箱和隐私同意，多选只接受既定选项，再写入飞书表格。同一 IP 十分钟内最多 5 次。还没有邮箱确认、正式隐私说明和撤回渠道。

## 修订记录

| 版本 | 日期 | 说明 |
| --- | --- | --- |
| v1.0 | 2026-10-16 | 首版（线框风格，SVG 示例角色「澄月」，视频未接入）。位于 `../landing/`，保持不变。 |
| v1.1 | 2026-10-16 | 按用户设计稿重做视觉、接入真实角色素材与视频：版式与文案逐区对齐 design-ref.png；衬线标题、奶油底 / 深绿 / 浅绿配色、圆角柔影卡片；从设计稿裁切并 2× 放大角色素材；视频卡片嵌入真实衍生视频（静音循环 + 开声）与 ffmpeg 海报帧；申请内测改为演示对话框；新增设计稿对比图。 |
| v1.2 | 2026-10-16 | 视觉精修：收紧字号与栏宽、首屏人物完整落地、标签在窄屏改排到形象下方、内容管线改为「定义 → 三项产出」、案例卡加色盘、导航当前节与胶囊按钮。文案、素材与演示表单行为不变。 |
| v1.3 | 2026-10-16 | 内容管线改用白狮少女（形象、声音、四段动作）；案例图按原比例放入，不再拉伸。 |
| v1.5 | 2026-10-17 | 导航增加「登录」，连到本地 Docker 工作室。 |
| v1.6 | 2026-10-17 | 申请表写入飞书多维表格。密钥只留在服务端。 |

> 规则：每次修订都需提升版本号，并同步更新 `assets/config.js` 的 `pageVersion` 与本表。

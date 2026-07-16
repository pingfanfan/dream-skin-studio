# Dream Skin Studio

一个独立、非官方、从零编写的开源 Codex 皮肤与桌宠项目。

普通用户只需要说一句话：

> 我要一套温暖的纸艺皮肤和配套桌宠，参考这个链接：https://example.com/reference

Skill 会自动检查素材风险、生成原创版本、制作皮肤包与桌宠、验证文件，然后在本机应用。

> 本项目与 OpenAI 没有隶属、合作、赞助或背书关系。“Codex”仅用于说明兼容对象。

## 第一次使用

> 请安装这个 Skill，安装完成后告诉我：https://github.com/pingfanfan/dream-skin-studio/tree/main/skills/dream-skin-studio

安装完成后，从下一条消息开始直接说需求即可。用户不需要下载 ZIP、寻找脚本或编辑设置。

## 内置原创套装

- **晨雾气泡**：明亮、柔和，配套桌宠是原创云团精灵。
- **夜光苔原**：深色、专注，配套桌宠是原创微光小兽。
- **纸片轨道站**：温暖、手作，配套桌宠是原创纸片机器人。
- **拨号聊天室**：银灰、蓝绿、拨号时代的桌面通讯氛围，配套桌宠是原创信号泡泡。

所有内置画面均由本仓库脚本以基础几何图形程序化生成，不包含第三方角色、Logo、字体、截图或图库素材。

## 它如何工作

1. GitHub Skill 自带全部本机脚本和三套皮肤，不从参考仓库下载代码。
2. 对已有套装，Skill 直接选择并应用。
3. 对“需求＋链接”，默认只提取颜色、氛围、材质、明暗和构图，重新生成原创背景与桌宠。
4. 每个皮肤包必须有许可、来源说明和 SHA-256 文件指纹，否则安装器拒绝使用。
5. 皮肤通过本机回环地址临时注入，不修改官方应用文件、签名或 `app.asar`。
6. 桌宠使用 Codex 本机宠物目录，并且只改动配置里的 `pet` 选择项，可恢复。

## 权利与许可

- 软件代码：[MIT License](./LICENSE)
- 本仓库原创视觉素材：[CC0 1.0](./LICENSE-ASSETS.md)
- 商标与非官方声明：[NOTICE.md](./NOTICE.md)
- 安全报告：[SECURITY.md](./SECURITY.md)
- 素材规则：[rights-safety.md](./skills/dream-skin-studio/references/rights-safety.md)

用户提供的素材不会因使用本项目而被重新许可。用户明确拥有权利的图片可在本机私用，但不会自动加入公共皮肤库。

## 本地验证

```bash
npm test
```

项目不依赖 npm 第三方包。测试会检查 Skill 结构、Shell/JavaScript/Python 语法、素材指纹、许可记录、配置恢复和皮肤包安装。

## 发布

1. 在 GitHub 创建一个空仓库 `dream-skin-studio`。
2. 推送 `main` 分支。
3. 在仓库 Settings → Pages 中选择 GitHub Actions。

之后网页会自动上线，访问者点击按钮即可复制 Skill 安装口令。

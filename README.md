# Dream Skin Studio

一个独立、非官方、从零编写的开源 Codex 皮肤与桌宠项目。它给完全不懂软件的人使用：安装一次，以后换皮肤、换桌宠或恢复原样都只需要对 Codex 说一句话。

> 本项目与 OpenAI 没有隶属、合作、赞助或背书关系。“Codex”仅用于说明兼容对象。

## 三句话就够了

第一次，把这一句话发给 Codex：

> 请安装这个 Skill，安装完成后告诉我：https://github.com/pingfanfan/dream-skin-studio/tree/main/skills/dream-skin-studio

以后直接说：

> 给我换成拨号聊天室皮肤和配套桌宠。

不想用了就说：

> 恢复原样。

用户不需要下载 ZIP、寻找脚本、打开终端、编辑设置，也不用单独挑选桌宠。更多例子见[小白使用说明](./docs/USAGE.md)。

## 真实效果

下面不是设计稿，而是 2026-07-16 在一份刚从 OpenAI 官方地址重新下载的 Codex 临时副本中实际应用后截取的画面。测试使用全新的隔离资料目录，没有打开或修改用户日常使用的 Codex。

![拨号聊天室皮肤在全新 Codex 中的真实效果](./docs/screenshots/dialup-chatroom-codex.png)

配套桌宠是一个真实、透明、置顶、可拖动的独立窗口：

![拨号聊天室配套桌宠的真实窗口截图](./docs/screenshots/dialup-chatroom-pet.png)

## 内置原创套装

- **晨雾气泡**：明亮、柔和，配套桌宠是原创云团精灵。
- **夜光苔原**：深色、专注，配套桌宠是原创微光小兽。
- **纸片轨道站**：温暖、手作，配套桌宠是原创纸片机器人。
- **拨号聊天室**：银灰、蓝绿、拨号时代的桌面通讯氛围，配套桌宠是原创信号泡泡。

所有内置画面均由本仓库脚本以基础几何图形程序化生成，不包含第三方角色、Logo、字体、截图或图库素材。

## 它如何工作

1. GitHub Skill 自带全部本机脚本和四套皮肤，不从参考仓库下载代码。
2. 对已有套装，Skill 直接选择并应用。
3. 对“需求＋链接”，默认只提取颜色、氛围、材质、明暗和构图，重新生成原创背景与桌宠。
4. 每个皮肤包必须有许可、来源说明和 SHA-256 文件指纹，否则安装器拒绝使用。
5. 皮肤通过本机回环地址临时注入，不修改官方应用文件、签名或 `app.asar`。
6. 桌宠是独立的透明置顶动画窗口，不依赖 Codex 未公开配置；可以拖动，并能一键关闭与恢复。

桌宠窗口由 macOS 自带的 `osacompile` 在本机从仓库源码生成，不下载或运行第三方桌宠程序。

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

项目不依赖 npm 第三方包。测试会检查 Skill 结构、Shell/JavaScript/Python 语法、素材指纹、许可记录、动画桌宠资源、恢复流程和皮肤包安装。

0.3.0 已在 macOS 26.0、Codex 26.707.91948 上完成真实闭环测试：重新下载官方 Codex，校验代码签名，在隔离目录中启动，确认皮肤出现在真实页面、桌宠出现在 macOS 窗口系统，最后确认皮肤、桌宠进程、后台服务和临时状态都能恢复清除。

完整证据、命令、哈希值和恢复结果见[真实测试记录](./docs/TESTING.md)。

## 网站

[打开 Dream Skin Studio](https://pingfanfan.github.io/dream-skin-studio/)，选择皮肤后点一下，就能复制要发给 Codex 的那句话。

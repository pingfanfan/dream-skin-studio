# 真实测试记录

## 0.3.0 — 2026-07-16

这不是只检查文件或脚本语法的测试。本次测试重新下载了一份官方 Codex，在临时目录中真实启动应用、应用皮肤、显示桌宠、截图，然后执行“恢复原样”。整个过程没有使用用户平时的 Codex 应用、登录资料或 `~/.codex` 状态。

### 测试对象

- 官方下载地址：`https://persistent.oaistatic.com/codex-app-prod/Codex.dmg`
- 下载文件 SHA-256：`5a2ab9689f4ba38fcb135565246d5ca2f124d539336a0a32afcdb72040d21466`
- 应用版本：`26.707.91948`
- Bundle ID：`com.openai.codex`
- 临时应用：`/private/tmp/DreamSkinStudio-QA/Codex-Test.app`
- 独立资料：`/private/tmp/DreamSkinStudio-QA/profile`
- 独立 HOME：`/private/tmp/DreamSkinStudio-QA/home`
- 独立状态：`/private/tmp/DreamSkinStudio-QA/state`
- 独立调试端口：`19573`

临时应用通过 macOS 完整代码签名检查：`valid on disk`，并满足指定要求。下载后只复制到临时目录运行，没有修改应用包、`app.asar` 或代码签名。

### 实际步骤

1. 从上面的官方地址重新下载 DMG，并计算 SHA-256。
2. 挂载 DMG，将 Codex 复制为临时测试应用，然后卸载 DMG。
3. 为临时应用指定独立 HOME、用户资料、皮肤状态和调试端口。
4. 在临时环境应用内置的“拨号聊天室”皮肤，不自动打开用户日常 Codex。
5. 启动临时 Codex，连接它自己的本机回环调试端口。
6. 验证页面中存在 Dream Skin Studio 样式，实际强调色为 `#1689c9`，注入 CSS 长度为 1900 字符。
7. 验证 macOS 窗口系统中存在独立桌宠窗口：进程名 `DreamSkinPet`，窗口尺寸 `168 × 182`，并且桌宠就绪记录为 `visible: true`。
8. 从这个临时 Codex 页面截取皮肤效果，从真实桌宠窗口截取透明 PNG。
9. 执行“恢复原样”。
10. 再次连接临时 Codex，验证样式为 `present: false`、强调色为空、CSS 长度为 0。
11. 验证桌宠进程退出、`com.pingfanfan.dream-skin-studio.injector` 服务不存在、临时状态目录中不再有活动皮肤或桌宠文件。
12. 退出临时 Codex，删除整套临时测试目录。

### 结果

| 项目 | 结果 | 证据 |
| --- | --- | --- |
| 官方应用真实性 | 通过 | Bundle ID、版本和完整代码签名均通过 |
| 隔离性 | 通过 | 应用、HOME、资料、状态和端口均位于专用临时环境 |
| 皮肤真实生效 | 通过 | 页面报告 `present: true`，强调色为 `#1689c9` |
| 桌宠真实显示 | 通过 | macOS 窗口存在，`visible: true`，尺寸 `168 × 182` |
| 恢复皮肤 | 通过 | 页面报告 `present: false`，CSS 长度为 0 |
| 恢复桌宠 | 通过 | 桌宠进程不存在 |
| 清理后台服务 | 通过 | launchd 查询返回服务不存在 |
| 清理临时状态 | 通过 | 状态目录只剩空目录 |

### 截图

![临时 Codex 中真实生效的拨号聊天室皮肤](./screenshots/dialup-chatroom-codex.png)

![真实透明桌宠窗口](./screenshots/dialup-chatroom-pet.png)

Codex 截图为 `1090 × 760`，没有登录用户资料；桌宠截图为带透明通道的 `168 × 182` PNG。两张图都来自本次真实测试，不是效果稿。

### 发布门槛

仓库规则要求每次发布前同时满足：

1. `npm test` 通过；
2. 使用新下载且签名有效的官方 Codex 临时副本完成真实应用和恢复闭环；
3. 界面变更时更新无个人资料的截图和本记录；
4. 确认没有触碰用户日常 Codex 资料；
5. 以上全部通过后，才允许推送 GitHub 更新。

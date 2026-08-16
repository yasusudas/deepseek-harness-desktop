# Agent Note: 深色模式下匹配 macOS 侧边栏顶部延伸色

Status: implemented

[English](2026-08-16-macos-sidebar-top-extension-dark-mode.md) | 中文

## 问题

切换到深色模式后，Electron 标题栏内边距仍使用整页的 `#fff` 背景，且 `BrowserWindow.backgroundColor` 仍为 `#ffffff`，导致主内容区上方出现 18px 白色条带。

## 决策

注入的拖拽区域脚本根据已解析的应用内外观设置 `--electron-window-background` 和 `BrowserWindow.backgroundColor`。当 `document.body` 带有 `data-ds-dark-theme` 或 `document.documentElement.style.colorScheme === "dark"` 时，深色为 `rgb(21, 21, 23)`（`--dsw-static-neutral-bluish-950`）；浅色为 `#ffffff`。监视这些文档信号的 MutationObserver 会在切换外観时立即更新 18px html 内边距和原生窗口背景。现有侧边栏色块仍复制侧边栏的位置、填充色和边框。

## 曾考虑的替代方案

**把侧边栏的计算背景色复制到整宽内边距。** 已否决：原生 `BrowserWindow.backgroundColor` 和样式回退值 `#fff` 仍会在深色模式下的主内容区内边距露出白条，侧边栏节点尚未出现时也一样。

**只跟随 `nativeTheme` 或 `prefers-color-scheme`。** 已否决：应用内的外観设置可以与系统配色不一致，内边距必须匹配 ThemePresenter 解析后的模式。

## 后果

18px 内边距和原生窗口背景会立即跟随当前文档的颜色模式。侧边栏色块仍只负责位置和边框叠加，不再作为主内容区内边距颜色的来源。

## 验证

源文件已通过 Node 语法和空白检查。接下来会重新构建并安装到 `/Users/ichi/Applications/DeepSeek Harness.app`；需要在深色模式下检查顶部内边距是否统一，并在浅色模式下确认原有的侧边栏宽度追踪仍然正常。

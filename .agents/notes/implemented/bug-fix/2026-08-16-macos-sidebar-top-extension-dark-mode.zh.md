# Agent Note: 深色模式下匹配 macOS 侧边栏顶部延伸色

Status: implemented

[English](2026-08-16-macos-sidebar-top-extension-dark-mode.md) | 中文

## 问题

切换到深色模式后，Electron 标题栏内边距仍使用整页的 `#fff` 背景，导致深色侧边栏旁边出现白色条带。

## 决策

注入的拖拽区域样式现在从 `--electron-window-background` 读取页面背景。每次同步侧边栏时，都从侧边栏的计算背景色更新该变量；现有色块仍继续复制侧边栏的位置、填充色和边框。因此深色侧边栏会把 `rgb(21, 21, 23)` 同样提供给侧边栏外的整宽顶部内边距。

## 验证

源文件已通过 Node 语法和空白检查。接下来会重新构建并安装到 `/Users/ichi/Applications/DeepSeek Harness.app`；需要在深色模式下检查顶部内边距是否统一，并在浅色模式下确认原有的侧边栏宽度追踪仍然正常。

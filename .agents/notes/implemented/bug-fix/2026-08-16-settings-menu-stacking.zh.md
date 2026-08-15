# Agent Note: 修正设置下拉菜单被模态框遮挡

Status: implemented

[English](2026-08-16-settings-menu-stacking.md) | 中文

## 问题

设置模态框为了覆盖macOS标题栏拖拽区域，使用了`z-index:10000`。设置行的下拉菜单通过body portal渲染，但仍使用`z-index:1100`，所以点击后菜单被模态框自身遮挡。

## 决策

在可重复的bundle补丁中，将固定UI bundle的Menu portal层提升到`z-index:11001`。这样菜单仍高于设置模态框，同时保留模态框高于Electron拖拽区域的要求。

## 验证

补丁脚本通过Node语法检查和空白检查；重新打包后，将实际应用安装到`/Users/ichi/Applications/DeepSeek Harness.app`，并通过运行中的macOS应用验证设置菜单可以显示并选择。

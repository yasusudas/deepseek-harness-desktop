# Agent Note: 加宽折叠侧栏以容纳 macOS 交通灯

Status: implemented

[English](2026-08-16-collapsed-sidebar-traffic-lights.md) | 中文

## 问题

macOS 交通灯位于 `x: 16`，三个 12px 按钮加 8px 间距，整组约 52px 宽，右缘约 68px。折叠侧栏轨道为 56px（10px 内边距加 36px 图标），因此绿色按钮会溢出轨道。

## 决策

桌面 bundle 补丁在布局列解析中将折叠轨道加宽到 72px。侧栏外壳对折叠态使用左右各 18px 的等宽内边距（`18 + 36 + 18 = 72`），并在折叠态的 logo、新会话、工作区和搜索座位上使用 `justify-content:center` / `align-self:center`。设置项本来就在底部居中。rail-in 关键帧仍使用 `translate(49px)`，因为该位移相对最终居中的 36px 图标。`prepare-bundle` 会再次应用同一组 `replaceOnce` 标记。

## 曾考虑的替代方案

**把交通灯左移或缩小间距。** 已否决：`TRAFFIC_LIGHT_POSITION` 和系统按钮度量是 macOS 标题栏约定，轨道必须容纳它们。

**保持 56px 轨道并裁剪或隐藏绿色按钮。** 已否决：交通灯必须完整可见且可点击。

**只用左侧偏移躲开交通灯、不加宽轨道。** 已否决：36px 图标会在仍然过窄的轨道中偏左，且仍无法容纳绿色按钮。

## 后果

折叠轨道比上游 56px 紧凑轨道宽 16px，因此侧栏关闭时中心列少 16px。图标保持在一条居中的 36px 列上。该补丁依赖固定 bundle 的编译 class 哈希和 `sidebar === 0 ? 56` 标记；升级 Harness 时必须重新核对这些标记。

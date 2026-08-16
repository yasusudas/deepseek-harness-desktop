# Agent Note: Match the macOS titlebar inset to dark sidebar mode

Status: implemented

English | [中文](2026-08-16-macos-sidebar-top-extension-dark-mode.zh.md)

## Problem

The Electron titlebar inset kept the page-wide `#fff` background and `BrowserWindow.backgroundColor` `#ffffff` after the in-app appearance switched to dark, leaving an 18px white strip on the main-content inset.

## Decision

The injected drag-region script sets `--electron-window-background` and `BrowserWindow.backgroundColor` from the resolved in-app color mode. Dark is `rgb(21, 21, 23)` (`--dsw-static-neutral-bluish-950`) when `document.body` has `data-ds-dark-theme` or `document.documentElement.style.colorScheme === "dark"`; light is `#ffffff`. Mutation observers on those document signals update both the 18px html inset and the native window color when 外観 changes. The existing sidebar cap still copies sidebar geometry, fill, and border.

## Alternatives considered

**Copy the sidebar computed background onto the full-width inset.** Rejected: the native `BrowserWindow.backgroundColor` and the stylesheet fallback `#fff` still show a white strip on the main-content inset in dark mode, including before the sidebar node is available.

**Follow `nativeTheme` or `prefers-color-scheme` only.** Rejected: the in-app 外観 setting can disagree with the OS color scheme, and the inset must match the resolved ThemePresenter mode.

## Consequences

The 18px inset and the native window background follow the live document color mode immediately. The sidebar cap remains a geometry and border overlay and is not the source of the main-content inset color.

## Verification

The source passes Node syntax and whitespace checks. The packaged app will be rebuilt and installed into `/Users/ichi/Applications/DeepSeek Harness.app`; the installed app must be checked in dark mode for a uniform top inset and in light mode for the existing sidebar-width behavior.

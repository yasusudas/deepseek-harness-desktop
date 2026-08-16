# Agent Note: Match the macOS titlebar inset to dark sidebar mode

Status: implemented

English | [中文](2026-08-16-macos-sidebar-top-extension-dark-mode.zh.md)

## Problem

The Electron titlebar inset kept the page-wide `#fff` background after the sidebar switched to dark mode, leaving a white strip beside the dark sidebar fill.

## Decision

The injected drag-region stylesheet now reads its page background from `--electron-window-background`. Each sidebar synchronization updates that variable from the sidebar's computed background color, while the existing cap continues to copy the sidebar geometry, fill, and border. The dark sidebar therefore supplies `rgb(21, 21, 23)` to the full-width inset outside the sidebar as well.

## Verification

The source passes Node syntax and whitespace checks. The packaged app will be rebuilt and installed into `/Users/ichi/Applications/DeepSeek Harness.app`; the installed app must be checked in dark mode for a uniform top inset and in light mode for the existing sidebar-width behavior.

# Agent Note: Fix settings dropdowns hidden behind the modal

Status: implemented

English | [中文](2026-08-16-settings-menu-stacking.zh.md)

## Problem

The settings modal uses `z-index: 10000` so it stays above the macOS titlebar drag region. The settings-row dropdowns render their menu through a body portal that still uses `z-index: 1100`, so the menu opens underneath the modal and appears non-functional.

## Decision

The reproducible bundle patch raises the pinned UI bundle's fixed Menu portal layer to `z-index: 11001`. This keeps the menu above the settings modal while retaining the modal's required precedence over the Electron drag region.

## Verification

The patch script passes Node syntax and whitespace checks. After rebuilding, the packaged app is installed into `/Users/ichi/Applications/DeepSeek Harness.app`, and the running macOS app is used to verify that the settings menus can be shown and selected.

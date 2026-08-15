# Agent Note: Extend the macOS sidebar fill into the titlebar inset

Status: implemented

English | [中文](2026-08-15-macos-sidebar-top-extension.zh.md)

## Problem

The Electron wrapper adds an 18px top inset so the hidden macOS titlebar has room for the traffic lights. The inset used the page-wide white background, leaving a visible horizontal seam above the sidebar after the signal controls moved upward.

## Decision

The injected macOS drag-region script creates a pointer-transparent fixed cap for the sidebar portion of the inset. It reads the shipped sidebar column's position, width, fill, and right border from `[class*="_sidebarCol"]`, then synchronizes those values through `ResizeObserver`, DOM mutations, and window resize events. The cap stays below the drag region and leaves the rest of the inset white.

## Alternatives considered

**Extend the sidebar root with a pseudo-element.** Rejected because the layout's sidebar column and frame both clip overflow, so content positioned above the 18px inset would be clipped.

**Use the sidebar fill as the background for the whole inset.** Rejected because the center and details columns retain a separate page background; a full-width fill would move the seam to the wrong column.

**Hardcode the expanded and collapsed widths.** Rejected because the sidebar is resizable and its grid track animates during collapse and expansion.

## Consequences

The inset above the sidebar uses the same fill and border as the sidebar and follows its width during resize, expansion, and collapse. The selector intentionally depends on the CSS-module suffix shipped by the pinned UI bundle; if that bundle changes its sidebar-column class suffix, the Electron injection must be updated with it.

The injection script passes Node syntax validation, whitespace validation, and a DOM-stub check covering position, width, fill, and border synchronization. The packaged `app.asar` is installed into `/Users/ichi/Applications/DeepSeek Harness.app` with a matching SHA-256, and window captures confirm that the fill reaches the top edge at the expanded width and follows the compact rail after collapse.

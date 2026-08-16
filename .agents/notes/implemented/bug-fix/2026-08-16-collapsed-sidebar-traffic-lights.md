# Agent Note: Fit macOS traffic lights inside the collapsed sidebar rail

Status: implemented

English | [中文](2026-08-16-collapsed-sidebar-traffic-lights.zh.md)

## Problem

The macOS traffic lights sit at `x: 16` with three 12px buttons and 8px gaps, so the cluster is about 52px wide and its right edge is about 68px. The collapsed sidebar rail is 56px (10px padding plus a 36px icon), so the green light overflows the rail.

## Decision

The desktop bundle patch widens the collapsed rail to 72px in the layout column resolver. The sidebar shell uses equal 18px horizontal padding (`18 + 36 + 18 = 72`) and `justify-content:center` / `align-self:center` on the collapsed logo, new-session, workspace, and search seats. Settings already centers in the foot. The rail-in keyframe keeps `translate(49px)` because that travel is relative to the final centered 36px icons. `prepare-bundle` reapplies the same `replaceOnce` markers.

## Alternatives considered

**Move the traffic lights left or shrink their gap.** Rejected: `TRAFFIC_LIGHT_POSITION` and the system button metrics are the macOS titlebar contract; the rail must contain them.

**Keep the 56px rail and clip or hide the green light.** Rejected: the traffic lights must remain fully visible and clickable.

**Use a left-only offset to clear the lights without widening.** Rejected: that would leave the 36px icons off-center in a still-too-narrow rail and would not contain the green light.

## Consequences

The collapsed rail is 16px wider than the upstream 56px compact track, so the expanded layout loses 16px of center column when the sidebar is closed. Icons stay on one 36px centered column. The patch depends on the pinned bundle's compiled class hashes and the `sidebar === 0 ? 56` marker; a Harness upgrade must re-check those markers.

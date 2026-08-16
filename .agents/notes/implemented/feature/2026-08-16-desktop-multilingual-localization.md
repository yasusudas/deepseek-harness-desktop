# Agent Note: Desktop multilingual localization and Auto selection

Status: implemented

English | [中文](2026-08-16-desktop-multilingual-localization.zh.md)

## Problem

The desktop wrapper previously patched one Japanese dictionary into an upstream browser client that ships Simplified Chinese and English. The language row could persist only an explicit locale, its browser detection compared only primary subtags, and the shared UI font stack preferred Simplified Chinese glyphs. Adding Traditional Chinese, Korean, Spanish, Brazilian Portuguese, German, and French by repeating the Japanese patch would duplicate runtime mutation logic, misclassify Chinese regions, and provide no visible distinction between a macOS-derived language and a fixed user choice.

## Decision

The wrapper owns one locale manifest and one build-time patcher. The manifest defines the nine shipped locale identifiers, self-language labels, and locale-specific macOS system font stacks. Each added locale has a keyed dictionary matching `ja.json` and a static-phrase dictionary matching `static-ja.json`; `verify-localizations` rejects missing namespaces, missing or extra keys, empty values, and changed `{placeholder}` sets before the bundle is replaced or downloaded.

The language row adds `auto` as a UI selection, not as a durable `LocaleId`. Selecting Auto removes the Host `preference` field, while an explicit selection writes its locale identifier even when its effective language currently matches Auto. The locale snapshot therefore publishes both the effective `active` locale and the `selection`. This lets the selector render the localized System Settings string with no detected-language interpolation, preserve the difference between automatic and fixed choices, and refresh the row when only that distinction changes.

Auto resolves the ordered browser language list at application startup. `zh-TW`, `zh-HK`, `zh-MO`, and `zh-Hant` variants map to `zh-Hant`; Simplified Chinese variants map to `zh`; only `pt-BR` maps to Brazilian Portuguese; the other shipped languages accept regional variants through their primary subtag. An unsupported list falls back to English. A macOS language change takes effect on the next application launch or browser reload rather than mutating a running session behind the user.

The desktop wrapper uses a versioned local-storage marker to make Auto the initial mode for this release. On the first browser start after installation or upgrade, it clears any legacy Host language preference once; after the marker is written, explicit user selections remain persistent across restarts.

The runtime sets `document.documentElement.lang` for every effective locale. The theme then selects Hiragino Sans for Japanese, PingFang SC for Simplified Chinese, PingFang TC or HK for Traditional Chinese, and Apple SD Gothic Neo for Korean. Latin-script locales retain the existing macOS system stack, and code keeps the existing monospace stack. Static phrase replacement is generalized across the added locales but continues to exclude code, Markdown output, editable content, and conversation bubbles.

## Alternatives considered

**Persist `auto` as another locale identifier.** Rejected: Auto is a preference mode, not a dictionary, and storing it would weaken the Host schema and force every lookup path to special-case a non-language value.

**Resolve Auto once and persist the resulting locale.** Rejected: the application would stop following later macOS language changes and could not show whether the current language was automatic or fixed.

**Map every Portuguese regional tag to `pt-BR`.** Rejected: Brazilian Portuguese is the shipped product locale and silently treating European Portuguese as Brazilian is an incorrect regional choice.

**Bundle third-party web fonts.** Rejected: the target is macOS, whose system fonts cover all shipped scripts with native metrics and no added download, license, or application-size cost.

## Consequences

The desktop language menu now places a dynamic Auto choice before nine explicit locales and can follow the Mac's preferred language on the next launch. A versioned first-launch marker makes a fresh install or upgrade open in Auto without resetting later explicit choices. Build failures expose dictionary drift before mutating the vendored runtime, and one patch path owns locale registration, static phrases, detection, selection state, and font choice. The wrapper still patches a fixed upstream release, so marker checks intentionally fail when upstream compiled output changes; updating the pinned Harness version requires reviewing and adjusting the patch against the new client artifact.

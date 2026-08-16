#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const MODULE_ROOT = path.join(ROOT, 'bundle', 'dsh', 'lib', 'node_modules', '@deepseek-ai');
const LOCALE_ROOT = path.join(MODULE_ROOT, 'dsh-client-locale', 'lib');
const WEB_FRONTEND_ASSETS = path.join(MODULE_ROOT, 'dsh-web-frontend', 'dist', 'assets');
const LOCALIZATION_ROOT = path.join(ROOT, 'localizations');
const locales = JSON.parse(fs.readFileSync(path.join(LOCALIZATION_ROOT, 'locales.json'), 'utf8'));
const localizedIds = locales.map(({ id }) => id).filter((id) => !['zh', 'en'].includes(id));
const staticLocaleIds = locales.map(({ id }) => id).filter((id) => id !== 'en');
const localizedDictionaries = Object.fromEntries(localizedIds.map((id) => [
  id,
  JSON.parse(fs.readFileSync(path.join(LOCALIZATION_ROOT, `${id}.json`), 'utf8')),
]));
const staticDictionaries = Object.fromEntries(staticLocaleIds.map((id) => [
  id,
  JSON.parse(fs.readFileSync(path.join(LOCALIZATION_ROOT, `static-${id}.json`), 'utf8')),
]));
const localeIdsSource = JSON.stringify(locales.map(({ id }) => id));

function replaceOnce(file, from, to, label) {
  const source = fs.readFileSync(file, 'utf8');
  const count = source.split(from).length - 1;
  if (count !== 1) throw new Error(`${label}: expected one marker in ${file}, found ${count}`);
  fs.writeFileSync(file, source.replace(from, to));
}

function patchHostLocale() {
  replaceOnce(
    path.join(LOCALE_ROOT, 'index.js'),
    'const LOCALE_IDS = ["zh", "en"];',
    `const LOCALE_IDS = ${localeIdsSource};`,
    'host locale ids',
  );
  replaceOnce(
    path.join(LOCALE_ROOT, 'types', 'locale-settings.d.ts'),
    'export declare const LOCALE_IDS: readonly ["zh", "en"];',
    `export declare const LOCALE_IDS: readonly ${localeIdsSource};`,
    'locale type ids',
  );
}

function localizationRuntimeSource() {
  return `
\t\tconst LOCALIZED_DICTIONARIES = Object.freeze(${JSON.stringify(localizedDictionaries)});
\t\tconst STATIC_DICTIONARIES = Object.freeze(${JSON.stringify(staticDictionaries)});
\t\tconst STATIC_REPLACEMENT_KEYS = Object.freeze(Object.fromEntries(Object.entries(STATIC_DICTIONARIES).map(([locale, dictionary]) => [locale, Object.keys(dictionary).sort((a, b) => b.length - a.length)])));
\t\tconst STATIC_LOCALE_LABELS = new Set(${JSON.stringify(locales.map(({ label }) => label))});
\t\tconst AUTO_DEFAULT_MARKER = "dsh.desktop.locale-auto-default.v2";
\t\tconst STATIC_ATTRS = ["aria-label", "title", "placeholder", "alt"];
\t\tconst staticOriginalText = new Map();
\t\tconst staticOriginalAttrs = new Map();
\t\tlet staticLocale = "";
\t\tlet staticObserver;
\t\tfunction staticUiExcluded(node) {
\t\t\tconst element = node.nodeType === 1 ? node : node.parentElement;
\t\t\treturn !element || element.closest('pre, code, textarea, input, [contenteditable="true"], [class*="_markdown_"], [class*="_bubble_"]') !== null;
\t\t}
\t\tfunction staticTranslateValue(value, locale = staticLocale) {
\t\t\tconst key = value.trim();
\t\t\tif (STATIC_LOCALE_LABELS.has(key)) return void 0;
\t\t\tconst dictionary = STATIC_DICTIONARIES[locale];
\t\t\tconst translated = dictionary?.[key];
\t\t\tif (translated !== void 0) return value.replace(key, translated);
\t\t\tfor (const source of STATIC_REPLACEMENT_KEYS[locale] ?? []) {
\t\t\t\tif (source !== key && value.includes(source)) return value.replaceAll(source, dictionary[source]);
\t\t\t}
\t\t\treturn void 0;
\t\t}
\t\tfunction initializeAutoDefault(host) {
\t\t\tif (typeof window === "undefined" || window.localStorage === void 0) return;
\t\t\ttry {
\t\t\t\tif (window.localStorage.getItem(AUTO_DEFAULT_MARKER) === "1") return;
\t\t\t\twindow.localStorage.setItem(AUTO_DEFAULT_MARKER, "1");
\t\t\t\thost?.unset(LOCALE_PREFERENCE_FIELD);
\t\t\t} catch (error) {
\t\t\t\tconsole.warn("locale Auto initialization marker unavailable:", error);
\t\t\t}
\t\t}
\t\tfunction staticTranslateText(node) {
\t\t\tif (staticUiExcluded(node)) return;
\t\t\tconst current = node.nodeValue ?? "";
\t\t\tconst original = staticOriginalText.get(node);
\t\t\tif (original !== void 0 && current === staticTranslateValue(original)) return;
\t\t\tconst translated = staticTranslateValue(current);
\t\t\tif (translated === void 0 || translated === current) return;
\t\t\tstaticOriginalText.set(node, current);
\t\t\tnode.nodeValue = translated;
\t\t}
\t\tfunction staticTranslateElement(element) {
\t\t\tif (staticUiExcluded(element)) return;
\t\t\tlet originals = staticOriginalAttrs.get(element);
\t\t\tfor (const name of STATIC_ATTRS) {
\t\t\t\tconst current = element.getAttribute(name);
\t\t\t\tif (current === null) continue;
\t\t\t\tconst original = originals?.get(name);
\t\t\t\tif (original !== void 0 && current === staticTranslateValue(original)) continue;
\t\t\t\tconst translated = staticTranslateValue(current);
\t\t\t\tif (translated === void 0 || translated === current) continue;
\t\t\t\tif (!originals) {
\t\t\t\t\toriginals = new Map();
\t\t\t\t\tstaticOriginalAttrs.set(element, originals);
\t\t\t\t}
\t\t\t\toriginals.set(name, current);
\t\t\t\telement.setAttribute(name, translated);
\t\t\t}
\t\t}
\t\tfunction staticScan(root) {
\t\t\tif (!STATIC_DICTIONARIES[staticLocale] || !root) return;
\t\t\tif (root.nodeType === 3) staticTranslateText(root);
\t\t\tif (root.nodeType === 1) staticTranslateElement(root);
\t\t\tconst walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
\t\t\tfor (let node = walker.nextNode(); node; node = walker.nextNode()) {
\t\t\t\tif (node.nodeType === 3) staticTranslateText(node);
\t\t\t\telse staticTranslateElement(node);
\t\t\t}
\t\t}
\t\tfunction staticRestore() {
\t\t\tfor (const [node, value] of staticOriginalText) if (node.isConnected) node.nodeValue = value;
\t\t\tstaticOriginalText.clear();
\t\t\tfor (const [element, attrs] of staticOriginalAttrs) if (element.isConnected) {
\t\t\t\tfor (const [name, value] of attrs) element.setAttribute(name, value);
\t\t\t}
\t\t\tstaticOriginalAttrs.clear();
\t\t}
\t\tfunction applyStaticLocale(active) {
\t\t\tif (typeof document === "undefined") return;
\t\t\tdocument.documentElement.lang = active;
\t\t\tif (!staticObserver) {
\t\t\t\tstaticObserver = new MutationObserver((mutations) => {
\t\t\t\t\tif (!STATIC_DICTIONARIES[staticLocale]) return;
\t\t\t\t\tfor (const mutation of mutations) {
\t\t\t\t\t\tif (mutation.type === "characterData") staticTranslateText(mutation.target);
\t\t\t\t\t\telse if (mutation.type === "attributes") staticTranslateElement(mutation.target);
\t\t\t\t\t\telse for (const node of mutation.addedNodes) staticScan(node);
\t\t\t\t\t}
\t\t\t\t});
\t\t\t\tstaticObserver.observe(document.documentElement, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: STATIC_ATTRS });
\t\t\t}
\t\t\tif (staticLocale === active) return;
\t\t\tif (STATIC_DICTIONARIES[staticLocale]) staticRestore();
\t\t\tstaticLocale = active;
\t\t\tif (STATIC_DICTIONARIES[active]) staticScan(document.body);
\t\t}
`;
}

function patchClientLocale() {
  const file = path.join(LOCALE_ROOT, 'client.js');
  replaceOnce(file, 'const LOCALE_IDS = ["zh", "en"];', `const LOCALE_IDS = ${localeIdsSource};`, 'client locale ids');
  replaceOnce(
    file,
    '\t\tSchema.object({ [LOCALE_PREFERENCE_FIELD]: Schema.union([...LOCALE_IDS]).required(false) });\n',
    '\t\tSchema.object({ [LOCALE_PREFERENCE_FIELD]: Schema.union([...LOCALE_IDS]).required(false) });\n' + localizationRuntimeSource(),
    'localization runtime insertion',
  );
  replaceOnce(
    file,
    '\t\tconst zh = { "language.title": "语言" };\n\t\t/** English dictionary, checked complete against the zh key set. */\n\t\tconst en = { "language.title": "Language" };',
    '\t\tconst zh = { "language.title": "语言", "language.auto": "系统设置" };\n\t\t/** English dictionary, checked complete against the zh key set. */\n\t\tconst en = { "language.title": "Language", "language.auto": "System Settings" };',
    'Auto locale labels',
  );
  const originalLocales = '\t\tconst LOCALES = Object.freeze([{\n\t\t\tid: "zh",\n\t\t\tlabel: "中文"\n\t\t}, {\n\t\t\tid: "en",\n\t\t\tlabel: "English"\n\t\t}]);';
  const newLocales = `\t\tconst LOCALES = Object.freeze(${JSON.stringify(locales.map(({ id, label }) => ({ id, label })))});`;
  replaceOnce(file, originalLocales, newLocales, 'locale options');
  replaceOnce(
    file,
    '\t\t\t\tthis.provisional = resolveInitialLocale();\n\t\t\t\tthis.snapshot = Object.freeze({\n\t\t\t\t\tactive: this.provisional,\n\t\t\t\t\tlocales: LOCALES,\n\t\t\t\t\trevision: 0\n\t\t\t\t});',
    '\t\t\t\tthis.provisional = resolveInitialLocale();\n\t\t\t\tinitializeAutoDefault(this.host);\n\t\t\t\tthis.snapshot = Object.freeze({\n\t\t\t\t\tactive: this.provisional,\n\t\t\t\t\tselection: "auto",\n\t\t\t\t\tlocales: LOCALES,\n\t\t\t\t\trevision: 0\n\t\t\t\t});\n\t\t\t\tapplyStaticLocale(this.provisional);',
    'initial Auto snapshot',
  );
  replaceOnce(
    file,
    '\t\t\tsetLocale(id) {\n\t\t\t\tconst match = this.snapshot.locales.find((l) => l.id === id);\n\t\t\t\tif (match === void 0) throw new Error(`locale "${id}" is not registered`);\n\t\t\t\tif (this.snapshot.active === match.id) return;\n\t\t\t\tthis.publish(match.id, true);\n\t\t\t\tthis.host?.set(LOCALE_PREFERENCE_FIELD, match.id);\n\t\t\t}',
    '\t\t\tsetLocale(id) {\n\t\t\t\tif (id === "auto") {\n\t\t\t\t\tif (this.snapshot.selection === "auto" && this.snapshot.active === this.provisional) return;\n\t\t\t\t\tthis.publish(this.provisional, true, "auto");\n\t\t\t\t\tthis.host?.unset(LOCALE_PREFERENCE_FIELD);\n\t\t\t\t\treturn;\n\t\t\t\t}\n\t\t\t\tconst match = this.snapshot.locales.find((l) => l.id === id);\n\t\t\t\tif (match === void 0) throw new Error(`locale "${id}" is not registered`);\n\t\t\t\tif (this.snapshot.active === match.id && this.snapshot.selection === match.id) return;\n\t\t\t\tthis.publish(match.id, true, match.id);\n\t\t\t\tthis.host?.set(LOCALE_PREFERENCE_FIELD, match.id);\n\t\t\t}',
    'Auto locale selection',
  );
  replaceOnce(
    file,
    '\t\t\t\tconst section = host.getSnapshot().value;\n\t\t\t\tif (section === void 0) return;\n\t\t\t\tconst target = section.preference ?? this.provisional;\n\t\t\t\tif (this.snapshot.active === target) return;\n\t\t\t\tthis.publish(target, true);',
    '\t\t\t\tconst section = host.getSnapshot().value;\n\t\t\t\tconst selection = section?.preference ?? "auto";\n\t\t\t\tconst target = section?.preference ?? this.provisional;\n\t\t\t\tif (this.snapshot.active === target && this.snapshot.selection === selection) return;\n\t\t\t\tthis.publish(target, true, selection);',
    'Auto settings adoption',
  );
  replaceOnce(
    file,
    '\t\t\tregister(ns, localeOrDicts, dict) {\n\t\t\t\tconst pairs = typeof localeOrDicts === "string" ? [[localeOrDicts, dict]] : Object.entries(localeOrDicts);',
    '\t\t\tregister(ns, localeOrDicts, dict) {\n\t\t\t\tconst pairs = typeof localeOrDicts === "string" ? [[localeOrDicts, dict]] : Object.entries(localeOrDicts);\n\t\t\t\tconst addLocalized = typeof localeOrDicts === "string" ? localeOrDicts === "en" : true;\n\t\t\t\tif (addLocalized) for (const locale of Object.keys(LOCALIZED_DICTIONARIES)) {\n\t\t\t\t\tconst entries = LOCALIZED_DICTIONARIES[locale][ns];\n\t\t\t\t\tif (entries && !pairs.some(([id]) => id === locale)) pairs.push([locale, entries]);\n\t\t\t\t}',
    'localized dictionary injection',
  );
  replaceOnce(
    file,
    '\t\t\tpublish(active, localeChanged) {\n\t\t\t\tthis.snapshot = Object.freeze({\n\t\t\t\t\tactive,\n\t\t\t\t\tlocales: this.snapshot.locales,',
    '\t\t\tpublish(active, localeChanged, selection = this.snapshot.selection) {\n\t\t\t\tapplyStaticLocale(active);\n\t\t\t\tthis.snapshot = Object.freeze({\n\t\t\t\t\tactive,\n\t\t\t\t\tselection,\n\t\t\t\t\tlocales: this.snapshot.locales,',
    'published locale selection',
  );
  replaceOnce(file, '\t\t\treturn detectBrowserLocale() ?? "zh";', '\t\t\treturn detectBrowserLocale() ?? "en";', 'browser fallback');
  replaceOnce(
    file,
    '\t\t\tfor (const tag of [...navigator.languages ?? [], navigator.language]) {\n\t\t\t\tconst primary = tag.toLowerCase().split("-")[0];\n\t\t\t\tconst match = LOCALES.find((locale) => locale.id === primary);\n\t\t\t\tif (match) return match.id;\n\t\t\t}',
    '\t\t\tfor (const tag of [...navigator.languages ?? [], navigator.language]) {\n\t\t\t\tconst normalized = tag.toLowerCase();\n\t\t\t\tif (normalized === "zh-tw" || normalized === "zh-hk" || normalized === "zh-mo" || normalized.startsWith("zh-hant")) return "zh-Hant";\n\t\t\t\tif (normalized === "zh" || normalized === "zh-cn" || normalized === "zh-sg" || normalized.startsWith("zh-hans")) return "zh";\n\t\t\t\tif (normalized === "pt-br") return "pt-BR";\n\t\t\t\tconst primary = normalized.split("-")[0];\n\t\t\t\tconst match = LOCALES.find((locale) => locale.id.toLowerCase() === primary);\n\t\t\t\tif (match) return match.id;\n\t\t\t}',
    'browser locale mapping',
  );
  replaceOnce(
    file,
    '\t\tfunction LanguageRow({ t, setLocale, useStore }) {\n\t\t\tconst active = useStore((s) => s.active);\n\t\t\tconst options = useStore((s) => s.options);\n\t\t\tconst [open, setOpen] = (0, react.useState)(false);\n\t\t\tconst activeLabel = options.find((o) => o.id === active)?.label ?? active;',
    '\t\tfunction LanguageRow({ t, setLocale, useStore }) {\n\t\t\tconst active = useStore((s) => s.active);\n\t\t\tconst selection = useStore((s) => s.selection);\n\t\t\tconst options = useStore((s) => s.options);\n\t\t\tconst [open, setOpen] = (0, react.useState)(false);\n\t\t\tconst activeLabel = options.find((o) => o.id === active)?.label ?? active;\n\t\t\tconst autoLabel = t("language.auto");\n\t\t\tconst selectable = [{ id: "auto", label: autoLabel }, ...options];\n\t\t\tconst selectedLabel = selection === "auto" ? autoLabel : options.find((o) => o.id === selection)?.label ?? activeLabel;',
    'Auto language row state',
  );
  replaceOnce(file, '\t\t\t\t\titems: options.map((o) => ({', '\t\t\t\t\titems: selectable.map((o) => ({', 'Auto menu option');
  replaceOnce(file, '\t\t\t\t\tselectedId: active,', '\t\t\t\t\tselectedId: selection,', 'Auto menu selection');
  replaceOnce(file, '\t\t\t\t\t\tchildren: [activeLabel,', '\t\t\t\t\t\tchildren: [selectedLabel,', 'Auto selector label');
  replaceOnce(
    file,
    '\t\t\t\tinit: () => ({\n\t\t\t\t\tactive: "",\n\t\t\t\t\toptions: [],',
    '\t\t\t\tinit: () => ({\n\t\t\t\t\tactive: "",\n\t\t\t\t\tselection: "auto",\n\t\t\t\t\toptions: [],',
    'language store selection',
  );
  replaceOnce(
    file,
    '\t\t\t\tactions: { sync: (d, active, options, revision) => {\n\t\t\t\t\tif (revision <= d.revision) return;\n\t\t\t\t\td.active = active;\n\t\t\t\t\td.options = options;',
    '\t\t\t\tactions: { sync: (d, active, selection, options, revision) => {\n\t\t\t\t\tif (revision <= d.revision) return;\n\t\t\t\t\td.active = active;\n\t\t\t\t\td.selection = selection;\n\t\t\t\t\td.options = options;',
    'language store sync',
  );
  replaceOnce(file, '\t\t\t\tbound?.sync(snapshot.active, snapshot.locales.map((l) => ({', '\t\t\t\tbound?.sync(snapshot.active, snapshot.selection, snapshot.locales.map((l) => ({', 'language row sync');
}

function patchTypeDeclarations() {
  const clientTypes = path.join(LOCALE_ROOT, 'types', 'client');
  const settingsLocaleFile = path.join(LOCALE_ROOT, 'types', 'locales', 'settings.d.ts');
  replaceOnce(
    settingsLocaleFile,
    "export declare const zh: {\n    'language.title': string;\n};",
    "export declare const zh: {\n    'language.title': string;\n    'language.auto': string;\n};",
    'Simplified Chinese Auto type',
  );
  replaceOnce(
    settingsLocaleFile,
    "export declare const en: {\n    'language.title': string;\n};",
    "export declare const en: {\n    'language.title': string;\n    'language.auto': string;\n};",
    'English Auto type',
  );
  const storeFile = path.join(clientTypes, 'settings-store.d.ts');
  replaceOnce(storeFile, '    /** Selectable locales in display order. */\n    options:', '    /** Auto or an explicit locale id. */\n    selection: string;\n    /** Selectable locales in display order. */\n    options:', 'store selection type');
  replaceOnce(storeFile, 'sync: (draft: LanguageRowState, active: string, options:', 'sync: (draft: LanguageRowState, active: string, selection: string, options:', 'store sync type');
  const runtimeFile = path.join(clientTypes, 'index.d.ts');
  replaceOnce(runtimeFile, '    /** Selectable locales in display order. */\n    locales:', '    /** Auto or an explicit locale id. */\n    selection: LocaleId | "auto";\n    /** Selectable locales in display order. */\n    locales:', 'runtime selection type');
}

function patchLocaleFonts() {
  const file = path.join(MODULE_ROOT, 'dsh-client-ui-theme', 'lib', 'styles', 'base.css');
  const rules = locales.filter(({ font }) => font).map(({ id, font }) => `html[lang="${id}"] { --dsw-font-family: ${font}; }`).join('\n');
  fs.appendFileSync(file, `\n/* Desktop locale-specific macOS system font stacks. */\n${rules}\n`);
}

function patchSettingsOverlayLayer() {
  const file = path.join(MODULE_ROOT, 'dsh-client-ui-settings-general', 'lib', 'client.js');
  replaceOnce(file, '.VOzbGW_overlay{z-index:1000;justify-content:center;', '.VOzbGW_overlay{z-index:10000;justify-content:center;', 'settings overlay stacking order');
}

function patchMenuPortalLayer() {
  const cssFile = fs.readdirSync(WEB_FRONTEND_ASSETS)
    .filter((name) => /^index-[^/]+\.css$/.test(name))
    .map((name) => path.join(WEB_FRONTEND_ASSETS, name))
    .find((file) => fs.readFileSync(file, 'utf8').includes('._portal_19372_43{'));
  if (cssFile === undefined) throw new Error(`menu portal stylesheet not found in ${WEB_FRONTEND_ASSETS}`);
  replaceOnce(cssFile, '._portal_19372_43{position:fixed;top:auto;left:auto;z-index:1100}', '._portal_19372_43{position:fixed;top:auto;left:auto;z-index:11001}', 'menu portal stacking order');
}

function patchCollapsedSidebarGeometry() {
  replaceOnce(
    path.join(MODULE_ROOT, 'dsh-client-ui-layout', 'lib', 'client.js'),
    'const s = sidebar === 0 ? 56 : clampWidth(sidebar, 264, 420);',
    'const s = sidebar === 0 ? 72 : clampWidth(sidebar, 264, 420);',
    'collapsed sidebar column width',
  );
  const sidebarFile = path.join(MODULE_ROOT, 'dsh-client-ui-sidebar', 'lib', 'client.js');
  replaceOnce(
    sidebarFile,
    '.hHd-Xa_root.hHd-Xa_collapsed{padding:18px 10px 6px}',
    '.hHd-Xa_root.hHd-Xa_collapsed{padding:18px 18px 6px}',
    'collapsed sidebar equal padding',
  );
  replaceOnce(
    sidebarFile,
    '.hHd-Xa_collapsed .hHd-Xa_logoRow{justify-content:flex-start;',
    '.hHd-Xa_collapsed .hHd-Xa_logoRow{justify-content:center;',
    'collapsed logo row centering',
  );
  replaceOnce(
    sidebarFile,
    '.hHd-Xa_collapsed .hHd-Xa_newSession{background:0 0;border-color:#0000;align-self:flex-start;',
    '.hHd-Xa_collapsed .hHd-Xa_newSession{background:0 0;border-color:#0000;align-self:center;',
    'collapsed new-session centering',
  );
  replaceOnce(
    sidebarFile,
    'controls enter the 56px rail from the same horizontal offset',
    'controls enter the 72px rail from the same horizontal offset',
    'collapsed rail width comment',
  );
  replaceOnce(
    path.join(MODULE_ROOT, 'dsh-client-ui-workspace', 'lib', 'client.js'),
    '.qDHVXG_rail .qDHVXG_sectionHeader{justify-content:flex-start;',
    '.qDHVXG_rail .qDHVXG_sectionHeader{justify-content:center;',
    'collapsed workspace header centering',
  );
}

patchHostLocale();
patchClientLocale();
patchTypeDeclarations();
patchLocaleFonts();
patchSettingsOverlayLayer();
patchMenuPortalLayer();
patchCollapsedSidebarGeometry();
console.log(`Localizations applied: ${localizedIds.join(', ')}.`);

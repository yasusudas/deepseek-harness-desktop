#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const MODULE_ROOT = path.join(ROOT, 'bundle', 'dsh', 'lib', 'node_modules', '@deepseek-ai');
const LOCALE_ROOT = path.join(MODULE_ROOT, 'dsh-client-locale', 'lib');
const WEB_FRONTEND_ASSETS = path.join(
  MODULE_ROOT,
  'dsh-web-frontend',
  'dist',
  'assets',
);
const jaDictionaries = JSON.parse(fs.readFileSync(path.join(ROOT, 'localizations', 'ja.json'), 'utf8'));
const staticJapanese = JSON.parse(fs.readFileSync(path.join(ROOT, 'localizations', 'static-ja.json'), 'utf8'));

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
    'const LOCALE_IDS = ["zh", "en", "ja"];',
    'host locale ids',
  );
  replaceOnce(
    path.join(LOCALE_ROOT, 'types', 'locale-settings.d.ts'),
    'export declare const LOCALE_IDS: readonly ["zh", "en"];',
    'export declare const LOCALE_IDS: readonly ["zh", "en", "ja"];',
    'locale type ids',
  );
}

function staticLocaleRuntimeSource() {
  return `
\t\tconst JA_DICTIONARIES = Object.freeze(${JSON.stringify(jaDictionaries)});
\t\tconst STATIC_JA = Object.freeze(${JSON.stringify(staticJapanese)});
\t\tconst STATIC_ATTRS = ["aria-label", "title", "placeholder", "alt"];
\t\tconst staticOriginalText = new Map();
\t\tconst staticOriginalAttrs = new Map();
\t\tlet staticLocale = "";
\t\tlet staticObserver;
\t\tfunction staticUiExcluded(node) {
\t\t\tconst element = node.nodeType === 1 ? node : node.parentElement;
\t\t\treturn !element || element.closest('pre, code, textarea, input, [contenteditable="true"], [class*="_markdown_"], [class*="_bubble_"]') !== null;
\t\t}
\t\tfunction staticTranslateValue(value) {
\t\t\tconst key = value.trim();
\t\t\tconst translated = STATIC_JA[key];
\t\t\treturn translated === void 0 ? void 0 : value.replace(key, translated);
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
\t\t\tif (staticLocale !== "ja" || !root) return;
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
\t\t\t\t\tif (staticLocale !== "ja") return;
\t\t\t\t\tfor (const mutation of mutations) {
\t\t\t\t\t\tif (mutation.type === "characterData") staticTranslateText(mutation.target);
\t\t\t\t\t\telse if (mutation.type === "attributes") staticTranslateElement(mutation.target);
\t\t\t\t\t\telse for (const node of mutation.addedNodes) staticScan(node);
\t\t\t\t\t}
\t\t\t\t});
\t\t\t\tstaticObserver.observe(document.documentElement, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: STATIC_ATTRS });
\t\t\t}
\t\t\tif (staticLocale === active) return;
\t\t\tif (staticLocale === "ja") staticRestore();
\t\t\tstaticLocale = active;
\t\t\tif (active === "ja") staticScan(document.body);
\t\t}
`;
}

function patchClientLocale() {
  const file = path.join(LOCALE_ROOT, 'client.js');
  replaceOnce(file, 'const LOCALE_IDS = ["zh", "en"];', 'const LOCALE_IDS = ["zh", "en", "ja"];', 'client locale ids');
  replaceOnce(
    file,
    '\t\tSchema.object({ [LOCALE_PREFERENCE_FIELD]: Schema.union([...LOCALE_IDS]).required(false) });\n',
    '\t\tSchema.object({ [LOCALE_PREFERENCE_FIELD]: Schema.union([...LOCALE_IDS]).required(false) });\n' + staticLocaleRuntimeSource(),
    'Japanese runtime insertion',
  );
  replaceOnce(
    file,
    '\t\t}, {\n\t\t\tid: "en",\n\t\t\tlabel: "English"\n\t\t}]);',
    '\t\t}, {\n\t\t\tid: "en",\n\t\t\tlabel: "English"\n\t\t}, {\n\t\t\tid: "ja",\n\t\t\tlabel: "日本語"\n\t\t}]);',
    'Japanese locale option',
  );
  replaceOnce(
    file,
    '\t\t\tregister(ns, localeOrDicts, dict) {\n\t\t\t\tconst pairs = typeof localeOrDicts === "string" ? [[localeOrDicts, dict]] : Object.entries(localeOrDicts);',
    '\t\t\tregister(ns, localeOrDicts, dict) {\n\t\t\t\tconst pairs = typeof localeOrDicts === "string" ? [[localeOrDicts, dict]] : Object.entries(localeOrDicts);\n\t\t\t\tconst japanese = JA_DICTIONARIES[ns];\n\t\t\t\tconst addJapanese = typeof localeOrDicts === "string" ? localeOrDicts === "en" : !("ja" in localeOrDicts);\n\t\t\t\tif (japanese && addJapanese) pairs.push(["ja", japanese]);',
    'Japanese dictionary injection',
  );
  replaceOnce(
    file,
    '\t\t\t\tthis.snapshot = Object.freeze({\n\t\t\t\t\tactive: this.provisional,\n\t\t\t\t\tlocales: LOCALES,\n\t\t\t\t\trevision: 0\n\t\t\t\t});',
    '\t\t\t\tthis.snapshot = Object.freeze({\n\t\t\t\t\tactive: this.provisional,\n\t\t\t\t\tlocales: LOCALES,\n\t\t\t\t\trevision: 0\n\t\t\t\t});\n\t\t\t\tapplyStaticLocale(this.provisional);',
    'initial document locale',
  );
  replaceOnce(
    file,
    '\t\t\tpublish(active, localeChanged) {\n\t\t\t\tthis.snapshot = Object.freeze({',
    '\t\t\tpublish(active, localeChanged) {\n\t\t\t\tapplyStaticLocale(active);\n\t\t\t\tthis.snapshot = Object.freeze({',
    'locale change document sync',
  );
}

function patchSettingsOverlayLayer() {
  const file = path.join(
    MODULE_ROOT,
    'dsh-client-ui-settings-general',
    'lib',
    'client.js',
  );
  replaceOnce(
    file,
    '.VOzbGW_overlay{z-index:1000;justify-content:center;',
    '.VOzbGW_overlay{z-index:10000;justify-content:center;',
    'settings overlay stacking order',
  );
}

function patchMenuPortalLayer() {
  const cssFile = fs.readdirSync(WEB_FRONTEND_ASSETS)
    .filter((name) => /^index-[^/]+\.css$/.test(name))
    .map((name) => path.join(WEB_FRONTEND_ASSETS, name))
    .find((file) => fs.readFileSync(file, 'utf8').includes('._portal_19372_43{'));
  if (cssFile === undefined) {
    throw new Error(`menu portal stylesheet not found in ${WEB_FRONTEND_ASSETS}`);
  }
  replaceOnce(
    cssFile,
    '._portal_19372_43{position:fixed;top:auto;left:auto;z-index:1100}',
    '._portal_19372_43{position:fixed;top:auto;left:auto;z-index:11001}',
    'menu portal stacking order',
  );
}

patchHostLocale();
patchClientLocale();
patchSettingsOverlayLayer();
patchMenuPortalLayer();
console.log(`Japanese localization applied: ${Object.keys(jaDictionaries).length} namespaces, ${Object.keys(staticJapanese).length} static phrases.`);

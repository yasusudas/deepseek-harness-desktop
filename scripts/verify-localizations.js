#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const LOCALE_ROOT = path.join(ROOT, 'localizations');
const locales = readJson('locales.json');
const reference = readJson('ja.json');
const staticReference = readJson('static-ja.json');
const localizedIds = locales.map(({ id }) => id).filter((id) => !['zh', 'en'].includes(id));
const staticLocaleIds = locales.map(({ id }) => id).filter((id) => id !== 'en');
const errors = [];

function readJson(name) {
  const file = path.join(LOCALE_ROOT, name);
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    throw new Error(`${name}: ${error.message}`);
  }
}

function placeholders(value) {
  return [...value.matchAll(/\{\w+\}/g)].map(([token]) => token).sort().join(',');
}

function compareDictionary(id, actual) {
  const expectedNamespaces = Object.keys(reference).sort();
  const actualNamespaces = Object.keys(actual).sort();
  if (JSON.stringify(actualNamespaces) !== JSON.stringify(expectedNamespaces)) {
    errors.push(`${id}: namespace set differs from ja`);
  }
  for (const namespace of expectedNamespaces) {
    const expected = reference[namespace];
    const received = actual[namespace] ?? {};
    const expectedKeys = Object.keys(expected).sort();
    const receivedKeys = Object.keys(received).sort();
    if (JSON.stringify(receivedKeys) !== JSON.stringify(expectedKeys)) {
      errors.push(`${id}/${namespace}: key set differs from ja`);
      continue;
    }
    for (const key of expectedKeys) {
      if (typeof received[key] !== 'string' || received[key].trim() === '') {
        errors.push(`${id}/${namespace}/${key}: translation is empty`);
      } else if (placeholders(received[key]) !== placeholders(expected[key])) {
        errors.push(`${id}/${namespace}/${key}: placeholders differ from ja`);
      }
    }
  }
}

function compareStaticDictionary(id, actual) {
  if (id === 'zh') {
    for (const key of Object.keys(actual)) {
      if (!Object.hasOwn(staticReference, key)) {
        errors.push(`static-${id}/${key}: source phrase is not registered`);
      } else if (typeof actual[key] !== 'string' || actual[key].trim() === '') {
        errors.push(`static-${id}/${key}: translation is empty`);
      } else if (placeholders(actual[key]) !== placeholders(key)) {
        errors.push(`static-${id}/${key}: placeholders differ from source`);
      }
    }
    return;
  }
  const expectedKeys = Object.keys(staticReference).sort();
  const receivedKeys = Object.keys(actual).sort();
  if (JSON.stringify(receivedKeys) !== JSON.stringify(expectedKeys)) {
    errors.push(`static-${id}: key set differs from static-ja`);
    return;
  }
  for (const key of expectedKeys) {
    if (typeof actual[key] !== 'string' || actual[key].trim() === '') {
      errors.push(`static-${id}/${key}: translation is empty`);
    } else if (placeholders(actual[key]) !== placeholders(key)) {
      errors.push(`static-${id}/${key}: placeholders differ from source`);
    }
  }
}

if (new Set(locales.map(({ id }) => id)).size !== locales.length) errors.push('locales.json: locale ids must be unique');
for (const { id, label } of locales) {
  if (typeof id !== 'string' || typeof label !== 'string' || !id || !label) errors.push('locales.json: every locale requires an id and label');
}
for (const id of localizedIds) {
  compareDictionary(id, readJson(`${id}.json`));
  compareStaticDictionary(id, readJson(`static-${id}.json`));
}
compareStaticDictionary('zh', readJson('static-zh.json'));

if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  const entries = Object.values(reference).reduce((count, dictionary) => count + Object.keys(dictionary).length, 0);
    console.log(`Verified ${localizedIds.length} localized dictionaries and ${staticLocaleIds.length} static overlays: ${entries} keyed and ${Object.keys(staticReference).length} full static phrases.`);
}

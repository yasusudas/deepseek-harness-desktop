#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const BUNDLE = path.join(ROOT, 'bundle', 'dsh');
const NODE_VERSION = process.version.replace(/^v/, '');

function run(cmd, opts = {}) {
  execSync(cmd, { stdio: 'inherit', ...opts });
}

function writeLauncher() {
  const binDir = path.join(BUNDLE, 'bin');
  fs.mkdirSync(binDir, { recursive: true });
  const launcher = `#!/bin/bash
DIR="$(cd "$(dirname "$0")/.." && pwd)"
export PATH="$DIR/node/bin:$PATH"
export DSH_HOME="\${DSH_HOME:-$HOME/Library/Application Support/DeepSeek Harness/dsh-home}"
exec "$DIR/node/bin/node" "$DIR/lib/node_modules/@deepseek-ai/dsh/lib/bin.js" "$@"
`;
  fs.writeFileSync(path.join(binDir, 'dsh'), launcher, { mode: 0o755 });
}

function main() {
  console.log('Preparing DeepSeek Harness bundle...');
  fs.rmSync(BUNDLE, { recursive: true, force: true });
  fs.mkdirSync(BUNDLE, { recursive: true });

  const libDir = path.join(BUNDLE, 'lib');
  console.log('Installing @deepseek-ai/dsh (clean install)...');
  run(`npm install @deepseek-ai/dsh@0.1.0-rc.6 --prefix "${libDir}" --omit=dev`);

  console.log(`Downloading Node.js ${NODE_VERSION}...`);
  const nodeDir = path.join(BUNDLE, 'node');
  fs.mkdirSync(nodeDir, { recursive: true });
  const platform = process.platform === 'darwin' ? 'darwin' : 'linux';
  const arch = process.arch === 'arm64' ? 'arm64' : 'x64';
  const tarball = `node-v${NODE_VERSION}-${platform}-${arch}.tar.gz`;
  const url = `https://nodejs.org/dist/v${NODE_VERSION}/${tarball}`;
  const tmp = path.join(ROOT, 'bundle', tarball);
  run(`curl -fsSL "${url}" -o "${tmp}"`);
  run(`tar -xzf "${tmp}" -C "${nodeDir}" --strip-components=1`);
  fs.rmSync(tmp, { force: true });

  writeLauncher();
  console.log('Applying Japanese localization...');
  run(`node "${path.join(ROOT, 'scripts', 'patch-ja-localization.js')}"`);
  const size = execSync(`du -sh "${BUNDLE}"`, { encoding: 'utf8' }).trim();
  console.log('Bundle ready:', BUNDLE, `(${size})`);
}

main();

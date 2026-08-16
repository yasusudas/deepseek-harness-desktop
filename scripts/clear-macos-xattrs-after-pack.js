const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

module.exports = async function clearMacOSXattrsAfterPack(context) {
  const appPath = path.join(context.appOutDir, `${context.packager.appInfo.productFilename}.app`);
  const cleanAppPath = `${appPath}.clean`;
  fs.rmSync(cleanAppPath, { force: true, recursive: true });
  execFileSync('/usr/bin/ditto', ['--norsrc', '--noextattr', '--noqtn', appPath, cleanAppPath], { stdio: 'inherit' });
  fs.rmSync(appPath, { force: true, recursive: true });
  fs.renameSync(cleanAppPath, appPath);
  execFileSync('/usr/bin/xattr', ['-cr', appPath], { stdio: 'inherit' });
};

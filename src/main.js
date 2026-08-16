const { app, BrowserWindow, shell, dialog, ipcMain, nativeTheme } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const http = require('http');
const net = require('net');

const DEFAULT_PORT = 3080;
const STARTUP_TIMEOUT_MS = 120_000;
const WINDOW_TOP_EXTENSION = 18;
const TRAFFIC_LIGHT_POSITION = { x: 16, y: -6 };
const DARK_WINDOW_BACKGROUND = 'rgb(21, 21, 23)';
const LIGHT_WINDOW_BACKGROUND = '#ffffff';

function windowBackgroundColor(isDark) {
  return isDark ? DARK_WINDOW_BACKGROUND : LIGHT_WINDOW_BACKGROUND;
}

ipcMain.on('desktop:set-window-background-color', function(event, color) {
  if (color !== DARK_WINDOW_BACKGROUND && color !== LIGHT_WINDOW_BACKGROUND) return;
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win && !win.isDestroyed()) win.setBackgroundColor(color);
});

let mainWindow = null;
let dshProcess = null;
let serverPort = DEFAULT_PORT;

function resolveDshCommand() {
  if (process.env.DSH_PATH && fs.existsSync(process.env.DSH_PATH)) {
    return process.env.DSH_PATH;
  }

  const bundled = path.join(process.resourcesPath, 'dsh', 'bin', 'dsh');
  if (app.isPackaged && fs.existsSync(bundled)) {
    return bundled;
  }

  return 'dsh';
}

function resolveDshEnv() {
  const env = { ...process.env };

  if (app.isPackaged) {
    const bundleRoot = path.join(process.resourcesPath, 'dsh');
    const nodeBin = path.join(bundleRoot, 'node', 'bin');
    const dshBin = path.join(bundleRoot, 'bin');
    env.PATH = [nodeBin, dshBin, env.PATH].filter(Boolean).join(path.delimiter);
    env.DSH_HOME = path.join(app.getPath('userData'), 'dsh-home');
  } else if (!env.DSH_HOME) {
    env.DSH_HOME = path.join(app.getPath('userData'), 'dsh-home');
  }

  return env;
}

function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close(() => resolve(true));
    });
    server.listen(port, '127.0.0.1');
  });
}

async function pickPort() {
  if (await isPortAvailable(DEFAULT_PORT)) {
    return DEFAULT_PORT;
  }

  for (let port = DEFAULT_PORT + 1; port < DEFAULT_PORT + 100; port += 1) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }

  throw new Error('利用可能なポートが見つかりませんでした');
}

function waitForServer(port) {
  const deadline = Date.now() + STARTUP_TIMEOUT_MS;
  const url = `http://127.0.0.1:${port}`;

  return new Promise((resolve, reject) => {
    const attempt = () => {
      const req = http.get(url, (res) => {
        res.resume();
        resolve(url);
      });

      req.on('error', () => {
        if (Date.now() > deadline) {
          reject(new Error(`サーバー起動がタイムアウトしました (${url})`));
          return;
        }
        setTimeout(attempt, 500);
      });

      req.setTimeout(1_000, () => {
        req.destroy();
      });
    };

    attempt();
  });
}

function startDshServer(port) {
  const dshCommand = resolveDshCommand();
  const env = resolveDshEnv();
  const logPath = path.join(app.getPath('userData'), 'dsh-server.log');
  const logStream = fs.createWriteStream(logPath, { flags: 'a' });

  logStream.write(`\n--- ${new Date().toISOString()} starting dsh on port ${port} ---\n`);

  dshProcess = spawn(dshCommand, ['web', '--port', String(port)], {
    env,
    cwd: app.getPath('documents'),
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  dshProcess.stdout.pipe(logStream);
  dshProcess.stderr.pipe(logStream);

  dshProcess.on('exit', (code, signal) => {
    logStream.write(`\n--- dsh exited code=${code} signal=${signal} ---\n`);
    logStream.end();
    dshProcess = null;

    if (mainWindow && !mainWindow.isDestroyed()) {
      const message = code === 0
        ? 'DeepSeek Harness サーバーが終了しました。'
        : `DeepSeek Harness サーバーが異常終了しました (code: ${code ?? signal}).\nログ: ${logPath}`;
      dialog.showErrorBox('DeepSeek Harness', message);
      app.quit();
    }
  });

  return waitForServer(port);
}

function stopDshServer() {
  if (!dshProcess) return;

  const proc = dshProcess;
  dshProcess = null;
  proc.kill('SIGTERM');

  setTimeout(() => {
    if (!proc.killed) {
      proc.kill('SIGKILL');
    }
  }, 5_000);
}


const DRAG_REGION_SCRIPT = [
  '(function() {',
  '  if (window.__electronDragRegion) return;',
  '  window.__electronDragRegion = true;',
  '  var HEIGHT = 40;',
  '  var TOP_INSET = ' + WINDOW_TOP_EXTENSION + ';',
  '  var DARK_BG = ' + JSON.stringify(DARK_WINDOW_BACKGROUND) + ';',
  '  var LIGHT_BG = ' + JSON.stringify(LIGHT_WINDOW_BACKGROUND) + ';',
  '  var style = document.createElement("style");',
  '  style.textContent = "html{box-sizing:border-box!important;padding-top:" + TOP_INSET + "px!important;background:var(--electron-window-background,#fff)!important}#electron-drag-region{position:fixed;top:0;left:0;right:0;height:" + HEIGHT + "px;-webkit-app-region:drag;z-index:9998;pointer-events:auto;}";',
  '  document.head.appendChild(style);',
  '  var region = document.createElement("div");',
  '  region.id = "electron-drag-region";',
  '  region.setAttribute("aria-hidden", "true");',
  '  document.body.prepend(region);',
  '  var sidebarCap = document.createElement("div");',
  '  sidebarCap.id = "electron-sidebar-top-extension";',
  '  sidebarCap.setAttribute("aria-hidden", "true");',
  '  sidebarCap.style.cssText = "box-sizing:border-box;position:fixed;top:0;left:0;width:0;height:" + TOP_INSET + "px;pointer-events:none;z-index:9997;";',
  '  document.body.appendChild(sidebarCap);',
  '  var interactive = "button,a,input,select,textarea,[role=button],[role=tab],[role=menuitem],label,summary";',
  '  var markNoDrag = function() {',
  '    document.querySelectorAll(interactive).forEach(function(el) {',
  '      var rect = el.getBoundingClientRect();',
  '      if (rect.top < HEIGHT + 4 && rect.bottom > 0 && rect.width > 0) {',
  '        el.style.setProperty("-webkit-app-region", "no-drag");',
  '        if (el.style.position === "static" || !el.style.position) el.style.position = "relative";',
  '        if (!el.style.zIndex || el.style.zIndex === "auto") el.style.zIndex = "9999";',
  '      }',
  '    });',
  '  };',
  '  var lastWindowBackground = "";',
  '  var isDarkAppearance = function() {',
  '    return (document.body && document.body.hasAttribute("data-ds-dark-theme"))',
  '      || document.documentElement.style.colorScheme === "dark";',
  '  };',
  '  var syncWindowBackground = function() {',
  '    var color = isDarkAppearance() ? DARK_BG : LIGHT_BG;',
  '    document.documentElement.style.setProperty("--electron-window-background", color);',
  '    if (color === lastWindowBackground) return;',
  '    lastWindowBackground = color;',
  '    if (window.deepseekHarness && typeof window.deepseekHarness.setWindowBackgroundColor === "function") {',
  '      window.deepseekHarness.setWindowBackgroundColor(color);',
  '    }',
  '  };',
  '  var observedSidebar = null;',
  '  var sidebarResizeObserver = window.ResizeObserver ? new window.ResizeObserver(function() { syncSidebarCap(); }) : null;',
  '  var syncSidebarCap = function() {',
  '    var sidebar = document.querySelector("[class*=\\"_sidebarCol\\"]");',
  '    if (!sidebar) {',
  '      sidebarCap.style.width = "0px";',
  '      observedSidebar = null;',
  '      if (sidebarResizeObserver) sidebarResizeObserver.disconnect();',
  '      return;',
  '    }',
  '    if (sidebar !== observedSidebar) {',
  '      if (sidebarResizeObserver) {',
  '        sidebarResizeObserver.disconnect();',
  '        sidebarResizeObserver.observe(sidebar);',
  '      }',
  '      observedSidebar = sidebar;',
  '    }',
  '    var rect = sidebar.getBoundingClientRect();',
  '    var computed = getComputedStyle(sidebar);',
  '    sidebarCap.style.left = rect.left + "px";',
  '    sidebarCap.style.width = rect.width + "px";',
  '    sidebarCap.style.backgroundColor = computed.backgroundColor || "#fff";',
  '    sidebarCap.style.borderRight = computed.borderRightWidth + " " + computed.borderRightStyle + " " + computed.borderRightColor;',
  '  };',
  '  markNoDrag();',
  '  syncWindowBackground();',
  '  syncSidebarCap();',
  '  new MutationObserver(function(records) {',
  '    if (records.some(function(record) { return record.target !== sidebarCap; })) {',
  '      markNoDrag();',
  '      syncSidebarCap();',
  '      syncWindowBackground();',
  '    }',
  '  }).observe(document.body, { childList: true, subtree: true, attributes: true });',
  '  new MutationObserver(syncWindowBackground).observe(document.documentElement, { attributes: true, attributeFilter: ["style"] });',
  '  window.addEventListener("resize", syncSidebarCap);',
  '})();',
].join('\n');

function installWindowDragRegion(webContents) {
  if (process.platform !== 'darwin') return;
  webContents.executeJavaScript(DRAG_REGION_SCRIPT).catch(function() {});
}

function createWindow(url) {
  mainWindow = new BrowserWindow({
    show: false,
    width: 1280,
    height: 860,
    minWidth: 900,
    minHeight: 600 + WINDOW_TOP_EXTENSION,
    title: 'DeepSeek Harness',
    backgroundColor: windowBackgroundColor(nativeTheme.shouldUseDarkColors),
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: TRAFFIC_LIGHT_POSITION,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  if (process.platform === 'darwin') {
    const bounds = mainWindow.getBounds();
    mainWindow.setBounds({
      y: bounds.y - WINDOW_TOP_EXTENSION,
      height: bounds.height + WINDOW_TOP_EXTENSION,
    });
    mainWindow.setWindowButtonPosition({
      x: TRAFFIC_LIGHT_POSITION.x,
      y: TRAFFIC_LIGHT_POSITION.y + WINDOW_TOP_EXTENSION,
    });
  }

  mainWindow.loadURL(url);

  mainWindow.once('ready-to-show', function() {
    mainWindow.show();
  });

  mainWindow.webContents.on('did-finish-load', function() {
    installWindowDragRegion(mainWindow.webContents);
  });

  mainWindow.webContents.setWindowOpenHandler(({ url: targetUrl }) => {
    if (targetUrl.startsWith('http://127.0.0.1') || targetUrl.startsWith('http://localhost')) {
      return { action: 'allow' };
    }
    shell.openExternal(targetUrl);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

async function boot() {
  try {
    serverPort = await pickPort();
    const url = await startDshServer(serverPort);
    createWindow(url);
  } catch (error) {
    const logPath = path.join(app.getPath('userData'), 'dsh-server.log');
    dialog.showErrorBox(
      'DeepSeek Harness',
      `${error.message}\n\nログ: ${logPath}\n\ndsh が見つからない場合は:\n  npm install -g @deepseek-ai/dsh`,
    );
    app.quit();
  }
}

const gotLock = app.requestSingleInstanceLock();

if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(boot);

  app.on('window-all-closed', () => {
    stopDshServer();
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('before-quit', () => {
    stopDshServer();
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0 && !dshProcess) {
      boot();
    } else if (mainWindow) {
      mainWindow.focus();
    }
  });
}

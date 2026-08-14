const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('deepseekHarness', {
  platform: process.platform,
});

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('deepseekHarness', {
  platform: process.platform,
  setWindowBackgroundColor: function(color) {
    ipcRenderer.send('desktop:set-window-background-color', color);
  },
});

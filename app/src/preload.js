const { ipcRenderer, clipboard, shell } = require("electron");

window.desktopAPI = {
  // Window controls
  minimize: () => ipcRenderer.invoke("window:minimize"),
  maximize: () => ipcRenderer.invoke("window:maximize"),
  close: () => ipcRenderer.invoke("window:close"),
  isMaximized: () => ipcRenderer.invoke("window:isMaximized"),

  // Dialogs
  selectFolder: (defaultPath) => ipcRenderer.invoke("dialog:selectFolder", defaultPath),
  selectFile: (filters) => ipcRenderer.invoke("dialog:selectFile", filters),

  // Shell
  openPath: (targetPath) => ipcRenderer.invoke("shell:openPath", targetPath),
  showItemInFolder: (fullPath) => ipcRenderer.invoke("shell:showItemInFolder", fullPath),
  openExternal: (url) => ipcRenderer.invoke("shell:openExternal", url),

  // System Paths & Info
  getSystemPaths: () => ipcRenderer.invoke("system:getPaths"),
  platform: process.platform,

  // Clipboard
  readClipboard: () => clipboard.readText(),
  writeClipboard: (text) => clipboard.writeText(text || "")
};

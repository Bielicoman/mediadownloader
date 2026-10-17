const { ipcRenderer } = require("electron");

window.desktopAPI = {
  setDownloadBusy: value=>ipcRenderer.invoke("updates:busy",value),
  onUpdateStatus: callback=>ipcRenderer.on("updates:status",(_,message)=>callback(message)),
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
  readClipboard: () => ipcRenderer.invoke("clipboard:read"),
  writeClipboard: (text) => ipcRenderer.invoke("clipboard:write", text || "")
};

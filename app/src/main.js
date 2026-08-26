const { app, BrowserWindow, ipcMain, dialog, shell, clipboard } = require("electron");
const path = require("path");
const fs = require("fs");

// Set safe userData directory in standard AppData to prevent disk cache permission errors
try {
  const safeUserData = path.join(app.getPath("appData"), "MediaDownloaderPro");
  if (!fs.existsSync(safeUserData)) {
    fs.mkdirSync(safeUserData, { recursive: true });
  }
  app.setPath("userData", safeUserData);
} catch (e) {
  console.warn("Could not set custom userData:", e);
}

let mainWindow = null;

function createWindow() {
  const iconCandidates = [
    path.join(__dirname, "..", "icons", "iconNormal.png"),
    path.join(__dirname, "..", "icons", "logo.png"),
    path.join(__dirname, "..", "favicon.ico")
  ];
  let appIcon = undefined;
  for (const ic of iconCandidates) {
    if (fs.existsSync(ic)) {
      appIcon = ic;
      break;
    }
  }

  mainWindow = new BrowserWindow({
    width: 640,
    height: 800,
    minWidth: 480,
    minHeight: 600,
    frame: false, // Frameless custom Obsidian titlebar
    backgroundColor: "#080a0e",
    center: true,
    show: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: true,
      contextIsolation: false
    },
    icon: appIcon,
    title: "Media Downloader Pro"
  });

  mainWindow.loadFile(path.join(__dirname, "index.html"));

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// IPC Handlers: Window Controls
ipcMain.handle("window:minimize", () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.handle("window:maximize", () => {
  if (!mainWindow) return;
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow.maximize();
  }
});

ipcMain.handle("window:close", () => {
  if (mainWindow) mainWindow.close();
});

ipcMain.handle("window:isMaximized", () => {
  return mainWindow ? mainWindow.isMaximized() : false;
});

// IPC Handlers: Native Folder Picker
ipcMain.handle("dialog:selectFolder", async (event, defaultPath) => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    title: "Selecionar Pasta de Destino dos Downloads",
    defaultPath: defaultPath || app.getPath("videos"),
    properties: ["openDirectory", "createDirectory"]
  });

  if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
    return null;
  }
  return result.filePaths[0];
});

// IPC Handlers: Native File Picker (e.g. cookies.txt)
ipcMain.handle("dialog:selectFile", async (event, filters) => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    title: "Selecionar Arquivo",
    properties: ["openFile"],
    filters: filters || [{ name: "Text Files", extensions: ["txt"] }]
  });

  if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
    return null;
  }
  return result.filePaths[0];
});

// IPC Handlers: Shell / File Explorer
ipcMain.handle("shell:openPath", async (event, targetPath) => {
  if (!targetPath) return false;
  try {
    if (fs.existsSync(targetPath)) {
      const stat = fs.statSync(targetPath);
      if (stat.isFile()) {
        shell.showItemInFolder(targetPath);
      } else {
        await shell.openPath(targetPath);
      }
      return true;
    }
    return false;
  } catch (err) {
    console.error("Erro ao abrir caminho no explorer:", err);
    return false;
  }
});

ipcMain.handle("shell:showItemInFolder", (event, fullPath) => {
  if (fullPath && fs.existsSync(fullPath)) {
    shell.showItemInFolder(fullPath);
    return true;
  }
  return false;
});

ipcMain.handle("shell:openExternal", async (event, url) => {
  if (url) {
    await shell.openExternal(url);
    return true;
  }
  return false;
});

// IPC Handlers: System Info & Paths
ipcMain.handle("system:getPaths", () => {
  const isDev = !app.isPackaged;
  const appPath = isDev ? path.resolve(__dirname, "..") : app.getAppPath();

  const candidateBins = [
    path.join(app.getAppPath(), "bin"),
    path.join(process.resourcesPath, "bin"),
    path.join(process.resourcesPath, "..", "bin"),
    path.join(__dirname, "..", "bin"),
    path.join(process.cwd(), "bin")
  ];

  let localBin = candidateBins[0];
  for (const c of candidateBins) {
    if (fs.existsSync(c)) {
      localBin = c;
      break;
    }
  }

  const defaultDownloadDir = path.join(app.getPath("videos"), "MediaDownloader");

  if (!fs.existsSync(defaultDownloadDir)) {
    try {
      fs.mkdirSync(defaultDownloadDir, { recursive: true });
    } catch (e) {}
  }

  return {
    appPath,
    localBin,
    defaultDownloadDir,
    userData: app.getPath("userData"),
    videos: app.getPath("videos"),
    platform: process.platform,
    isPackaged: app.isPackaged
  };
});

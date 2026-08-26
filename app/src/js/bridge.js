/**
 * bridge.js - Desktop Native Bridge for Electron
 */

(function (window) {
  "use strict";

  var isDesktop = typeof window.desktopAPI !== "undefined";

  var Bridge = {
    isDesktop: isDesktop,

    openFolder: function (filePath) {
      if (isDesktop && window.desktopAPI.openPath) {
        return window.desktopAPI.openPath(filePath);
      }
      return Promise.resolve(false);
    },

    showItemInFolder: function (filePath) {
      if (isDesktop && window.desktopAPI.showItemInFolder) {
        return window.desktopAPI.showItemInFolder(filePath);
      }
      return Promise.resolve(false);
    },

    copyToClipboard: function (text) {
      if (isDesktop && window.desktopAPI.writeClipboard) {
        return Promise.resolve(window.desktopAPI.writeClipboard(text));
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(text);
      }
      return Promise.resolve();
    },

    readClipboard: function () {
      if (isDesktop && window.desktopAPI.readClipboard) {
        return Promise.resolve(window.desktopAPI.readClipboard());
      }
      if (navigator.clipboard && navigator.clipboard.readText) {
        return navigator.clipboard.readText().catch(function () { return ""; });
      }
      return Promise.resolve("");
    },

    selectFolder: function (defaultPath) {
      if (isDesktop && window.desktopAPI.selectFolder) {
        return window.desktopAPI.selectFolder(defaultPath);
      }
      return Promise.resolve(null);
    },

    selectFile: function (filters) {
      if (isDesktop && window.desktopAPI.selectFile) {
        return window.desktopAPI.selectFile(filters);
      }
      return Promise.resolve(null);
    },

    getSystemPaths: function () {
      if (isDesktop && window.desktopAPI.getSystemPaths) {
        return window.desktopAPI.getSystemPaths();
      }
      return Promise.resolve({
        appPath: "",
        localBin: "",
        defaultDownloadDir: "Downloads/MediaDownloader",
        platform: "win32"
      });
    },

    minimizeWindow: function () {
      if (isDesktop && window.desktopAPI.minimize) window.desktopAPI.minimize();
    },

    maximizeWindow: function () {
      if (isDesktop && window.desktopAPI.maximize) window.desktopAPI.maximize();
    },

    closeWindow: function () {
      if (isDesktop && window.desktopAPI.close) window.desktopAPI.close();
    }
  };

  window.Bridge = Bridge;
})(window);

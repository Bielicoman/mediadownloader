/**
 * binManager.js - Binary Manager for MediaDownloader Desktop
 * Detects, validates, and auto-downloads yt-dlp and ffmpeg
 */

(function (window) {
  "use strict";

  var isNode = typeof require !== "undefined";
  var path = isNode ? require("path") : null;
  var fs = isNode ? require("fs") : null;
  var child_process = isNode ? require("child_process") : null;
  var https = isNode ? require("https") : null;
  var http = isNode ? require("http") : null;
  var os = isNode ? require("os") : null;

  var BinManager = {
    cachedYtDlpPath: null,
    cachedFfmpegPath: null,
    cachedAria2Path: null,
    ytDlpVersion: null,
    ffmpegVersion: null,
    aria2Version: null,

    getAppDir: async function () {
      if (window.Bridge && window.Bridge.getSystemPaths) {
        var paths = await window.Bridge.getSystemPaths();
        return paths.appPath || "";
      }
      return process.cwd();
    },

    getLocalBinDir: async function () {
      if (window.Bridge && window.Bridge.getSystemPaths) {
        var paths = await window.Bridge.getSystemPaths();
        if (paths.localBin) {
          if (fs && !fs.existsSync(paths.localBin)) {
            try { fs.mkdirSync(paths.localBin, { recursive: true }); } catch (e) {}
          }
          return paths.localBin;
        }
      }
      var fallback = path ? path.join(process.cwd(), "bin") : "";
      return fallback;
    },

    findYtDlp: async function () {
      if (!isNode) {
        return { found: true, path: "yt-dlp (browser mock)", version: "2026.07.04" };
      }

      var self = this;
      var isWin = process.platform === "win32";

      // 1. Custom saved path
      var customPath = localStorage.getItem("mediadownloader_custom_ytdlp");
      if (customPath && fs.existsSync(customPath)) {
        self.cachedYtDlpPath = customPath;
        var ver = await self.checkBinaryVersion(customPath);
        return { found: true, path: customPath, version: ver, source: "custom" };
      }

      // 2. Local app bin folder
      var localBin = await self.getLocalBinDir();
      if (localBin) {
        var localExe = path.join(localBin, isWin ? "yt-dlp.exe" : "yt-dlp");
        if (fs.existsSync(localExe)) {
          self.cachedYtDlpPath = localExe;
          var ver = await self.checkBinaryVersion(localExe);
          return { found: true, path: localExe, version: ver, source: "local" };
        }
      }

      // 3. System PATH
      return new Promise(function (resolve) {
        var cmd = isWin ? "where yt-dlp" : "which yt-dlp";
        child_process.exec(cmd, function (err, stdout) {
          if (!err && stdout && stdout.trim()) {
            var detectedPath = stdout.trim().split(/\r?\n/)[0];
            self.cachedYtDlpPath = detectedPath;
            self.checkBinaryVersion(detectedPath).then(function (ver) {
              resolve({ found: true, path: detectedPath, version: ver, source: "system" });
            });
            return;
          }

          // 4. Common Windows Paths
          if (isWin) {
            var env = process.env || {};
            var appData = env.APPDATA || "";
            var localAppData = env.LOCALAPPDATA || "";
            var userProfile = env.USERPROFILE || (os ? os.homedir() : "");

            var candidatePaths = [
              path.join(appData, "Python", "Python314", "Scripts", "yt-dlp.exe"),
              path.join(appData, "Python", "Python313", "Scripts", "yt-dlp.exe"),
              path.join(appData, "Python", "Python312", "Scripts", "yt-dlp.exe"),
              path.join(appData, "Python", "Python311", "Scripts", "yt-dlp.exe"),
              path.join(userProfile, "AppData", "Roaming", "Python", "Python314", "Scripts", "yt-dlp.exe"),
              path.join(userProfile, "AppData", "Local", "Programs", "Python", "Python314", "Scripts", "yt-dlp.exe"),
              path.join(localAppData, "Microsoft", "WinGet", "Links", "yt-dlp.exe"),
              "C:\\Program Files\\yt-dlp\\yt-dlp.exe",
              "C:\\Program Files (x86)\\yt-dlp\\yt-dlp.exe"
            ];

            for (var i = 0; i < candidatePaths.length; i++) {
              if (fs.existsSync(candidatePaths[i])) {
                self.cachedYtDlpPath = candidatePaths[i];
                return self.checkBinaryVersion(candidatePaths[i]).then(function (ver) {
                  resolve({ found: true, path: candidatePaths[i], version: ver, source: "common_path" });
                });
              }
            }
          }

          resolve({ found: false, path: null, version: null });
        });
      });
    },

    findFfmpeg: async function () {
      if (!isNode) {
        return { found: true, path: "ffmpeg (browser mock)", version: "9.0" };
      }

      var self = this;
      var isWin = process.platform === "win32";

      // 1. Custom path
      var customPath = localStorage.getItem("mediadownloader_custom_ffmpeg");
      if (customPath && fs.existsSync(customPath)) {
        self.cachedFfmpegPath = customPath;
        var ver = await self.checkBinaryVersion(customPath, true);
        return { found: true, path: customPath, version: ver, source: "custom" };
      }

      // 2. Local app bin folder
      var localBin = await self.getLocalBinDir();
      if (localBin) {
        var localExe = path.join(localBin, isWin ? "ffmpeg.exe" : "ffmpeg");
        if (fs.existsSync(localExe)) {
          self.cachedFfmpegPath = localExe;
          var ver = await self.checkBinaryVersion(localExe, true);
          return { found: true, path: localExe, version: ver, source: "local" };
        }
      }

      // 3. System PATH
      return new Promise(function (resolve) {
        var cmd = isWin ? "where ffmpeg" : "which ffmpeg";
        child_process.exec(cmd, function (err, stdout) {
          if (!err && stdout && stdout.trim()) {
            var detectedPath = stdout.trim().split(/\r?\n/)[0];
            self.cachedFfmpegPath = detectedPath;
            self.checkBinaryVersion(detectedPath, true).then(function (ver) {
              resolve({ found: true, path: detectedPath, version: ver, source: "system" });
            });
            return;
          }

          if (isWin) {
            var env = process.env || {};
            var localAppData = env.LOCALAPPDATA || "";
            var userProfile = env.USERPROFILE || (os ? os.homedir() : "");
            var candidatePaths = [
              path.join(localAppData, "Microsoft", "WinGet", "Links", "ffmpeg.exe"),
              path.join(userProfile, "AppData", "Local", "Microsoft", "WinGet", "Links", "ffmpeg.exe"),
              "C:\\ffmpeg\\bin\\ffmpeg.exe",
              "C:\\Program Files\\ffmpeg\\bin\\ffmpeg.exe"
            ];

            try {
              var wingetPackages = path.join(localAppData || path.join(userProfile, "AppData", "Local"), "Microsoft", "WinGet", "Packages");
              if (fs.existsSync(wingetPackages)) {
                var dirs = fs.readdirSync(wingetPackages);
                for (var d = 0; d < dirs.length; d++) {
                  if (dirs[d].toLowerCase().indexOf("ffmpeg") !== -1) {
                    var pkgDir = path.join(wingetPackages, dirs[d]);
                    var subDirs = fs.readdirSync(pkgDir);
                    for (var s = 0; s < subDirs.length; s++) {
                      var candidate = path.join(pkgDir, subDirs[s], "bin", "ffmpeg.exe");
                      if (fs.existsSync(candidate)) {
                        candidatePaths.unshift(candidate);
                      }
                    }
                  }
                }
              }
            } catch (we) {}

            for (var i = 0; i < candidatePaths.length; i++) {
              if (fs.existsSync(candidatePaths[i])) {
                self.cachedFfmpegPath = candidatePaths[i];
                return self.checkBinaryVersion(candidatePaths[i], true).then(function (ver) {
                  resolve({ found: true, path: candidatePaths[i], version: ver, source: "common_path" });
                });
              }
            }
          }

          resolve({ found: false, path: null, version: null });
        });
      });
    },

    findAria2: async function () {
      if (!isNode) return { found: false, path: null };
      var self = this;
      var isWin = process.platform === "win32";

      var localBin = await self.getLocalBinDir();
      if (localBin) {
        var localExe = path.join(localBin, isWin ? "aria2c.exe" : "aria2c");
        if (fs.existsSync(localExe)) {
          self.cachedAria2Path = localExe;
          return { found: true, path: localExe, source: "local" };
        }
      }

      return new Promise(function (resolve) {
        var cmd = isWin ? "where aria2c" : "which aria2c";
        child_process.exec(cmd, function (err, stdout) {
          if (!err && stdout && stdout.trim()) {
            var detectedPath = stdout.trim().split(/\r?\n/)[0];
            self.cachedAria2Path = detectedPath;
            return resolve({ found: true, path: detectedPath, source: "system" });
          }
          resolve({ found: false, path: null });
        });
      });
    },

    checkBinaryVersion: function (binaryPath, isFfmpeg) {
      if (!isNode) return Promise.resolve("1.0.0");
      return new Promise(function (resolve) {
        var flag = isFfmpeg ? "-version" : "--version";
        child_process.exec('"' + binaryPath + '" ' + flag, { timeout: 4000 }, function (err, stdout) {
          if (err || !stdout) return resolve("Detectado");
          var line = stdout.trim().split(/\r?\n/)[0];
          if (isFfmpeg) {
            var m = line.match(/version\s+([^\s]+)/i);
            resolve(m ? m[1] : line.substring(0, 30));
          } else {
            resolve(line);
          }
        });
      });
    },

    downloadStandaloneYtDlp: async function (onProgress) {
      if (!isNode) return Promise.reject(new Error("Apenas suportado no ambiente Desktop."));

      var self = this;
      var isWin = process.platform === "win32";
      var localBin = await self.getLocalBinDir();
      var targetFile = path.join(localBin, isWin ? "yt-dlp.exe" : "yt-dlp");
      var tempFile = targetFile + ".tmp";
      var url = "https://github.com/yt-dlp/yt-dlp/releases/latest/download/" + (isWin ? "yt-dlp.exe" : "yt-dlp");

      return new Promise(function (resolve, reject) {
        function follow(downloadUrl, redirects) {
          if (redirects > 8) return reject(new Error("Muitos redirecionamentos ao baixar yt-dlp"));

          var isHttps = downloadUrl.startsWith("https");
          var client = isHttps ? https : http;
          var options = {
            headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
            rejectUnauthorized: false
          };

          var req = client.get(downloadUrl, options, function (res) {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
              return follow(res.headers.location, (redirects || 0) + 1);
            }

            if (res.statusCode !== 200) {
              return reject(new Error("HTTP " + res.statusCode + " ao baixar yt-dlp"));
            }

            var total = parseInt(res.headers["content-length"], 10) || 0;
            var received = 0;
            var fileStream = fs.createWriteStream(tempFile);

            res.on("data", function (chunk) {
              received += chunk.length;
              fileStream.write(chunk);
              if (total && onProgress) {
                var pct = Math.round((received / total) * 100);
                onProgress(pct, received, total);
              }
            });

            res.on("end", function () {
              fileStream.end(function () {
                try {
                  if (fs.existsSync(targetFile)) {
                    fs.unlinkSync(targetFile);
                  }
                  fs.renameSync(tempFile, targetFile);
                  self.cachedYtDlpPath = targetFile;
                  self.checkBinaryVersion(targetFile).then(function (v) {
                    resolve({ path: targetFile, version: v });
                  });
                } catch (err) {
                  reject(err);
                }
              });
            });
          });

          req.on("error", function (e) {
            try { if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile); } catch (ex) {}
            reject(e);
          });
        }

        follow(url, 0);
      });
    },

    getStatus: async function () {
      var self = this;
      var ytdlp = await this.findYtDlp();
      var ffmpeg = await this.findFfmpeg();
      var aria2 = await this.findAria2();

      self.ytDlpVersion = ytdlp.version;
      self.ffmpegVersion = ffmpeg.version;
      self.aria2Version = aria2.found ? "OK" : null;

      return {
        ytdlp: ytdlp,
        ffmpeg: ffmpeg,
        aria2: aria2,
        ready: ytdlp.found
      };
    }
  };

  window.BinManager = BinManager;
})(window);

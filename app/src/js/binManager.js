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

    getBinaryCandidates: async function (name) {
      var dirs = [await this.getLocalBinDir()];
      if (window.Bridge && window.Bridge.getSystemPaths) {
        var paths = await window.Bridge.getSystemPaths();
        dirs = dirs.concat(paths.bundledBins || [path.join(paths.appPath, "bin")]);
      }
      if (process.platform === "darwin") dirs = dirs.concat(["/opt/homebrew/bin", "/usr/local/bin", "/opt/local/bin"]);
      return dirs.map(function (dir) { return path.join(dir, name + (process.platform === "win32" ? ".exe" : "")); });
    },


    // A file is usable only after its version command succeeds.
    findValidatedBinary: async function (name, customKey, cacheKey, versionKey) {
      if (!isNode) return { found: false, path: null, version: null };
      var self = this;
      if (self[cacheKey] && self[versionKey] && fs.existsSync(self[cacheKey])) {
        return { found: true, path: self[cacheKey], version: self[versionKey], source: "cache" };
      }
      self[cacheKey] = null;
      self[versionKey] = null;
      var candidates = [];
      var custom = customKey && localStorage.getItem(customKey);
      if (custom) candidates.push({ path: custom, source: "custom" });
      var locals = self.getBinaryCandidates ? await self.getBinaryCandidates(name) : self.candidatosLocais(name);
      locals.forEach(function (p) { candidates.push({ path: p, source: "local" }); });
      var systemPaths = await new Promise(function (resolve) {
        child_process.exec((process.platform === "win32" ? "where " : "which -a ") + name,
          { timeout: 4000, windowsHide: true }, function (err, stdout) {
            resolve(!err && stdout ? stdout.trim().split(/\r?\n/).filter(Boolean) : []);
          });
      });
      systemPaths.forEach(function (p) { candidates.push({ path: p, source: "system" }); });
      if (process.platform === "win32") {
        var env = process.env || {}, home = env.USERPROFILE || os.homedir();
        var local = env.LOCALAPPDATA || path.join(home, "AppData", "Local");
        var roaming = env.APPDATA || path.join(home, "AppData", "Roaming");
        var known = [path.join(local, "Microsoft", "WinGet", "Links", name + ".exe")];
        if (name === "yt-dlp") {
          ["314", "313", "312", "311"].forEach(function (v) {
            known.push(path.join(roaming, "Python", "Python" + v, "Scripts", "yt-dlp.exe"));
            known.push(path.join(local, "Programs", "Python", "Python" + v, "Scripts", "yt-dlp.exe"));
          });
          known.push("C:\\Program Files\\yt-dlp\\yt-dlp.exe", "C:\\Program Files (x86)\\yt-dlp\\yt-dlp.exe");
        }
        if (name === "ffmpeg") {
          known.push("C:\\ffmpeg\\bin\\ffmpeg.exe", "C:\\Program Files\\ffmpeg\\bin\\ffmpeg.exe");
          try {
            var packages = path.join(local, "Microsoft", "WinGet", "Packages");
            fs.readdirSync(packages).filter(function (d) { return /ffmpeg/i.test(d); }).forEach(function (d) {
              var pkg = path.join(packages, d);
              fs.readdirSync(pkg).forEach(function (sub) { known.push(path.join(pkg, sub, "bin", "ffmpeg.exe")); });
            });
          } catch (e) {}
        }
        known.forEach(function (p) { candidates.push({ path: p, source: "common_path" }); });
      }
      var seen = {};
      for (var i = 0; i < candidates.length; i++) {
        var candidate = candidates[i];
        if (seen[candidate.path] || !fs.existsSync(candidate.path)) continue;
        seen[candidate.path] = true;
        var version = await self.checkBinaryVersion(candidate.path, name === "ffmpeg" ? true : name);
        if (!version) continue;
        self[cacheKey] = candidate.path;
        self[versionKey] = version;
        return { found: true, path: candidate.path, version: version, source: candidate.source };
      }
      return { found: false, path: null, version: null };
    },

    findYtDlp: function () {
      return this.findValidatedBinary("yt-dlp", "mediadownloader_custom_ytdlp", "cachedYtDlpPath", "ytDlpVersion");
    },

    findFfmpeg: function () {
      return this.findValidatedBinary("ffmpeg", "mediadownloader_custom_ffmpeg", "cachedFfmpegPath", "ffmpegVersion");
    },

    findAria2: function () {
      return this.findValidatedBinary("aria2c", null, "cachedAria2Path", "aria2Version");
    },

    checkBinaryVersion: function (binaryPath, kind) {
      if (!isNode) return Promise.resolve(null);
      return new Promise(function (resolve) {
        var ff = kind === true || kind === "ffmpeg" || kind === "ffprobe";
        try {
          child_process.execFile(binaryPath, [ff ? "-version" : "--version"], { timeout: 10000, windowsHide: true }, function (err, stdout) {
            if (err || !stdout) return resolve(null);
            var line = stdout.trim().split(/\r?\n/)[0];
            var match = ff ? line.match(kind === "ffprobe" ? /^ffprobe version\s+(\S+)/i : /^ffmpeg version\s+(\S+)/i)
              : (kind === "aria2c" ? line.match(/^aria2 version\s+(\S+)/i) : line.match(/^(\d{4}\.\d{2}\.\d{2}(?:[.\w+-]*)?)$/));
            resolve(match ? match[1] : null);
          });
        } catch (e) { resolve(null); }
      });
    },


    // Trust the bundled public roots plus the Windows roots trusted by this user/OS.
    // Never disable certificate verification or persist certificate material.
    getTrustedCertificateAuthorities: function () {
      if (!isNode) return Promise.resolve(null);
      if (this._trustedCertificateAuthorities) return this._trustedCertificateAuthorities;
      this._trustedCertificateAuthorities = new Promise(function (resolve, reject) {
        var tls = require("tls");
        var bundled = tls.rootCertificates ? Array.prototype.slice.call(tls.rootCertificates) : [];
        if (typeof tls.getCACertificates === "function") {
          try {
            var system = tls.getCACertificates("system");
            if (system && system.length) return resolve(bundled.concat(system));
          } catch (e) {}
        }
        if (process.platform !== "win32") return resolve(bundled.length ? bundled : undefined);
        var powershell = path.join(process.env.SystemRoot || "C:\\Windows", "System32", "WindowsPowerShell", "v1.0", "powershell.exe");
        // This command is fixed source code; no paths, URLs or user text are interpolated.
        var script = "$ErrorActionPreference='Stop'; " +
          "Import-Module (Join-Path $PSHOME 'Modules/Microsoft.PowerShell.Security/Microsoft.PowerShell.Security.psd1'); " +
          "$certs=@(Get-ChildItem -LiteralPath 'Cert:\\CurrentUser\\Root','Cert:\\LocalMachine\\Root'); " +
          "foreach($cert in $certs) { " +
          "Write-Output '-----BEGIN CERTIFICATE-----'; " +
          "Write-Output ([Convert]::ToBase64String($cert.RawData,[Base64FormattingOptions]::InsertLineBreaks)); " +
          "Write-Output '-----END CERTIFICATE-----' }";
        child_process.execFile(powershell, ["-NoProfile", "-NonInteractive", "-Command", script],
          { timeout: 15000, windowsHide: true, maxBuffer: 2097152 }, function (err, stdout) {
            if (err) return reject(new Error("Não foi possível consultar os certificados confiáveis do Windows para atualizar os motores."));
            var certificates = (stdout || "").match(/-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g) || [];
            if (!certificates.length) return reject(new Error("O Windows não retornou certificados confiáveis para atualizar os motores."));
            resolve(bundled.concat(certificates));
          });
      });
      var self = this;
      this._trustedCertificateAuthorities = this._trustedCertificateAuthorities.catch(function (error) {
        self._trustedCertificateAuthorities = null;
        throw error;
      });
      return this._trustedCertificateAuthorities;
    },

    // Download, validate and only then replace. A failed update preserves the current engine.
    downloadValidatedBinary: async function (url, target, kind, onProgress) {
      if (!isNode) return Promise.reject(new Error("Atualização disponível apenas no aplicativo ou painel instalado."));
      var self = this;
      var trustedAuthorities = await self.getTrustedCertificateAuthorities();
      self._activeDownloads = self._activeDownloads || {};
      if (self._activeDownloads[target]) return Promise.reject(new Error("Este motor já está sendo atualizado."));
      self._activeDownloads[target] = true;
      var unique = Date.now() + "-" + Math.random().toString(16).slice(2);
      var temp = target + ".download-" + unique + (process.platform === "win32" ? ".exe" : ".tmp");
      var backup = target + ".backup-" + unique;
      var operation = new Promise(function (resolve, reject) {
        var settled = false, stream = null, response = null;
        function cleanup() { try { if (fs.existsSync(temp)) fs.unlinkSync(temp); } catch (e) {} }
        function fail(error) {
          if (settled) return;
          settled = true;
          if (stream) { stream.on("close", cleanup); stream.destroy(); }
          if (response) response.destroy();
          cleanup();
          reject(error);
        }
        function follow(u, redirects) {
          if (!/^https:\/\//i.test(u)) return fail(new Error("Apenas HTTPS é permitido para baixar motores."));
          if (redirects > 8) return fail(new Error("Muitos redirecionamentos ao baixar motor."));
          var req;
          try {
            req = https.get(u, { headers: { "User-Agent": "MediaDownloader" }, rejectUnauthorized: true, ca: trustedAuthorities }, function (res) {
              if (settled) { res.destroy(); return; }
              if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                res.resume();
                try { follow(new URL(res.headers.location, u).href, redirects + 1); } catch (e) { fail(e); }
                return;
              }
              response = res;
              if (res.statusCode !== 200) return fail(new Error("HTTP " + res.statusCode + " ao baixar motor."));
              var total = Number(res.headers["content-length"]) || 0, received = 0;
              try { stream = fs.createWriteStream(temp, { flags: "wx" }); } catch (e) { return fail(e); }
              stream.on("error", fail);
              res.on("error", fail);
              res.on("aborted", function () { fail(new Error("Download interrompido; tente novamente.")); });
              res.on("data", function (chunk) {
                received += chunk.length;
                if (onProgress) { try { onProgress(received, total); } catch (e) {} }
              });
              res.on("end", function () {
                if (res.complete === false || received === 0 || (total && received !== total)) fail(new Error("Download incompleto; motor anterior preservado."));
              });
              stream.on("close", function () {
                if (settled) return;
                if (!stream.writableFinished) return fail(new Error("Gravação do motor interrompida."));
                Promise.resolve().then(function () {
                  if (process.platform !== "win32") fs.chmodSync(temp, "755");
                  return self.checkBinaryVersion(temp, kind);
                }).then(function (version) {
                  if (settled) return;
                  if (!version) throw new Error("Motor baixado inválido; motor anterior preservado.");
                  var moved = false;
                  try {
                    if (fs.existsSync(target)) { fs.renameSync(target, backup); moved = true; }
                    fs.renameSync(temp, target);
                  } catch (e) {
                    if (moved) {
                      try { fs.renameSync(backup, target); } catch (rollback) {
                        throw new Error("Falha ao atualizar. Motor anterior preservado em " + backup + ": " + rollback.message);
                      }
                    }
                    throw e;
                  }
                  // Backup cleanup failure does not turn a committed update into an error.
                  if (moved) { try { fs.unlinkSync(backup); } catch (e) {} }
                  settled = true;
                  resolve({ path: target, version: version });
                }).catch(fail);
              });
              res.pipe(stream);
            });
            req.on("error", fail);
            req.setTimeout(60000, function () { req.destroy(new Error("Tempo limite ao baixar motor.")); });
          } catch (e) { fail(e); }
        }
        follow(url, 0);
      });
      return operation.then(function (result) { delete self._activeDownloads[target]; return result; }, function (error) { delete self._activeDownloads[target]; throw error; });
    },

    downloadStandaloneYtDlp: async function (onProgress) {
      if (!isNode) throw new Error("Atualização disponível apenas no aplicativo ou painel instalado.");
      var self = this, win = process.platform === "win32";
      var target = path.join(await self.getLocalBinDir(), win ? "yt-dlp.exe" : "yt-dlp");
      var asset = win ? "yt-dlp.exe" : (process.platform === "darwin" ? "yt-dlp_macos" : "yt-dlp_linux");
      var result = await self.downloadValidatedBinary("https://github.com/yt-dlp/yt-dlp/releases/latest/download/" + asset, target, "yt-dlp", function (received, total) {
        if (onProgress && total) onProgress(Math.round(received / total * 100), received, total);
      });
      self.cachedYtDlpPath = result.path;
      self.ytDlpVersion = result.version;
      return result;
    },

    /** ffprobe fica ao lado do ffmpeg em todas as instalacoes suportadas. */
    findFfprobe: function (ffmpegPath) {
      if (!isNode || !ffmpegPath) return null;
      var p = path.join(path.dirname(ffmpegPath), process.platform === "win32" ? "ffprobe.exe" : "ffprobe");
      return fs.existsSync(p) ? p : null;
    },

    resetCache: function () {
      this.cachedYtDlpPath = null;
      this.cachedFfmpegPath = null;
      this.cachedAria2Path = null;
      this.ytDlpVersion = null;
      this.ffmpegVersion = null;
      this.aria2Version = null;
    },

    getStatus: async function () {
      var self = this;
      this.resetCache();
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
        ready: ytdlp.found && ffmpeg.found
      };
    }
  };

  window.BinManager = BinManager;
})(window);

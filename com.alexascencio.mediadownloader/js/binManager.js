/**
 * binManager.js - Manages detection, validation, and auto-download of yt-dlp & ffmpeg binaries
 * Uses verified HTTPS downloads and multi-tier path resolution
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
        ytDlpVersion: null,
        ffmpegVersion: null,

        getExtensionDir: function () {
            if (!isNode) return "";
            try {
                if (window.__adobe_cep__) {
                    var cs = new window.CSInterface();
                    return cs.getSystemPath(window.SystemPath.EXTENSION);
                }
                return path.resolve(__dirname, "..");
            } catch (e) {
                return process.cwd();
            }
        },

        /**
         * Caminhos onde os motores existem no macOS.
         *
         * Necessario porque apps de GUI no macOS nao herdam o PATH do shell:
         * dentro do Premiere, "which ffmpeg" roda com PATH minimo e nao enxerga
         * /opt/homebrew/bin. O primeiro candidato e o app Desktop, que ja traz
         * yt-dlp, ffmpeg e ffprobe assinados dentro do proprio bundle.
         */
        macCandidates: function (name) {
            if (!isNode || process.platform !== "darwin") return [];
            var home = process.env.HOME || "";
            var dentroDoApp = "/Contents/Resources/app/bin/" + name;
            return [
                "/Applications/Media Downloader.app" + dentroDoApp,
                home + "/Applications/Media Downloader.app" + dentroDoApp,
                "/Applications/MediaDownloader.app" + dentroDoApp,
                "/opt/homebrew/bin/" + name,
                "/usr/local/bin/" + name,
                "/opt/local/bin/" + name,
                "/usr/bin/" + name
            ];
        },

        /** No Windows, o app Desktop instalado pelo Instalar.bat tambem traz os motores. */
        winCandidates: function (name) {
            if (!isNode || process.platform !== "win32") return [];
            var local = process.env.LOCALAPPDATA || "";
            return [
                path.join(local, "Programs", "Media Downloader", "resources", "bin", name + ".exe"),
                path.join(process.env.ProgramFiles || "C:\\Program Files", "Media Downloader", "resources", "bin", name + ".exe"),
                path.join(local, "Programs", "Media Downloader", "resources", "app", "bin", name + ".exe"),
                path.join(process.env.ProgramFiles || "C:\\Program Files", "Media Downloader", "resources", "app", "bin", name + ".exe")
            ];
        },

        /** bin/ da extensao primeiro, depois o app Desktop e os caminhos conhecidos do sistema. */
        candidatosLocais: function (name) {
            if (!isNode) return [];
            var exe = process.platform === "win32" ? name + ".exe" : name;
            var lista = [path.join(this.getLocalBinDir(), exe), path.join(this.getExtensionDir(), "bin", exe)];
            return lista.concat(this.winCandidates(name), this.macCandidates(name));
        },

        /** ffprobe fica ao lado do ffmpeg em todas as instalacoes suportadas. */
        findFfprobe: function (ffmpegPath) {
            if (!isNode || !ffmpegPath) return null;
            var p = path.join(path.dirname(ffmpegPath), process.platform === "win32" ? "ffprobe.exe" : "ffprobe");
            return fs.existsSync(p) ? p : null;
        },

        /** Esquece os caminhos achados; usado ao abrir o diagnostico e apos instalar motores. */
        resetCache: function () {
            this.cachedYtDlpPath = null;
            this.cachedFfmpegPath = null;
      this.cachedAria2Path = null;
      this.ytDlpVersion = null;
      this.ffmpegVersion = null;
      this.aria2Version = null;
        },

        getLocalBinDir: function () {
            if (!isNode) return "";
            // Keep updates writable even when CEP was installed system-wide.
            var home = os.homedir();
            var base = process.platform === "win32" ? (process.env.APPDATA || path.join(home, "AppData", "Roaming"))
                : (process.platform === "darwin" ? path.join(home, "Library", "Application Support") : (process.env.XDG_DATA_HOME || path.join(home, ".local", "share")));
            var localBin = path.join(base, "MediaDownloaderPro", "bin");
            if (!fs.existsSync(localBin)) {
                try {
                    fs.mkdirSync(localBin, { recursive: true });
                } catch (e) {}
            }
            return localBin;
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

        /**
         * Baixa um binario unico, seguindo redirecionamentos.
         */
        baixarBinario: function (url, destino, onProgress) {
            var kind = /^ffprobe/i.test(path.basename(destino)) ? "ffprobe" : "ffmpeg";
            return this.downloadValidatedBinary(url, destino, kind, onProgress).then(function (result) { return result.path; });
        },

        /**
         * Baixa ffmpeg e ffprobe estaticos para a pasta bin/ da extensao.
         *
         * O ffmpeg nao e opcional: sem ele o yt-dlp nao consegue juntar os fluxos
         * separados de video e audio do YouTube, o que trava o download nas
         * resolucoes baixas, e a conversao para ProRes e H.264 e pulada.
         *
         * Usa os mesmos binarios estaticos do app Desktop, entao o resultado e
         * identico nas duas plataformas.
         */
        downloadStandaloneFfmpeg: function (onProgress) {
            if (!isNode) return Promise.reject(new Error("Apenas suportado no ambiente Node.js / CEP."));

            var self = this;
            var localBin = self.getLocalBinDir();
            var ext = process.platform === "win32" ? ".exe" : "";
            var alvo = process.platform === "win32"
                ? "win32-x64"
                : (process.arch === "arm64" ? "darwin-arm64" : "darwin-x64");
            var base = "https://github.com/eugeneware/ffmpeg-static/releases/download/b6.1.1/";
            var nomes = ["ffmpeg", "ffprobe"];

            function passo(i) {
                if (i >= nomes.length) {
                    var final = path.join(localBin, "ffmpeg" + ext);
                    return self.checkBinaryVersion(final, true).then(function (v) {
                        if (!v) throw new Error("FFmpeg inválido após atualização.");
                        self.cachedFfmpegPath = final;
                        self.ffmpegVersion = v;
                        return { path: final, version: v };
                    });
                }
                var nome = nomes[i];
                var destino = path.join(localBin, nome + ext);
                return self.baixarBinario(base + nome + "-" + alvo, destino, function (recebido, total) {
                    if (onProgress && total) {
                        onProgress(Math.round((recebido / total) * 100), nome, i + 1, nomes.length);
                    }
                }).then(function () {
                    return passo(i + 1);
                });
            }

            return passo(0);
        },

        getStatus: function () {
            var self = this;
            this.resetCache();
            return Promise.all([this.findYtDlp(), this.findFfmpeg()]).then(function (results) {
                var ytdlp = results[0];
                var ffmpeg = results[1];
                self.ytDlpVersion = ytdlp.version;
                self.ffmpegVersion = ffmpeg.version;

                return {
                    ytdlp: ytdlp,
                    ffmpeg: ffmpeg,
                    // Sem FFmpeg nao ha como juntar video e audio: o painel nao esta pronto.
                    ready: ytdlp.found && ffmpeg.found
                };
            });
        }
    };

    window.BinManager = BinManager;
})(window);

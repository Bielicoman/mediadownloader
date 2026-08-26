/**
 * binManager.js - Manages detection, validation, and auto-download of yt-dlp & ffmpeg binaries
 * Includes SSL proxy bypass (rejectUnauthorized: false) and multi-tier path resolution
 */

(function (window) {
    "use strict";

    var isNode = typeof require !== "undefined";
    var path = isNode ? require("path") : null;
    var fs = isNode ? require("fs") : null;
    var child_process = isNode ? require("child_process") : null;
    var https = isNode ? require("https") : null;
    var http = isNode ? require("http") : null;

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

        /** bin/ da extensao primeiro, depois os caminhos conhecidos de macOS. */
        candidatosLocais: function (name) {
            if (!isNode) return [];
            var lista = [path.join(this.getLocalBinDir(), process.platform === "win32" ? name + ".exe" : name)];
            return lista.concat(this.macCandidates(name));
        },

        getLocalBinDir: function () {
            if (!isNode) return "";
            var extDir = this.getExtensionDir();
            var localBin = path.join(extDir, "bin");
            if (!fs.existsSync(localBin)) {
                try {
                    fs.mkdirSync(localBin, { recursive: true });
                } catch (e) {}
            }
            return localBin;
        },

        findYtDlp: function () {
            if (!isNode) {
                return Promise.resolve({ found: true, path: "yt-dlp (browser mock)", version: "2026.07.04" });
            }

            var self = this;
            return new Promise(function (resolve) {
                // 1. Verifica configuração customizada salva
                var customPath = localStorage.getItem("mediadownloader_custom_ytdlp");
                if (customPath && fs.existsSync(customPath)) {
                    self.cachedYtDlpPath = customPath;
                    return self.checkBinaryVersion(customPath).then(function (ver) {
                        resolve({ found: true, path: customPath, version: ver, source: "custom" });
                    });
                }

                // 2. Verifica pasta bin/ local da extensão
                var locais = self.candidatosLocais("yt-dlp");
                for (var L = 0; L < locais.length; L++) {
                    if (fs.existsSync(locais[L])) {
                        var achado = locais[L];
                        self.cachedYtDlpPath = achado;
                        return self.checkBinaryVersion(achado).then(function (ver) {
                            resolve({ found: true, path: achado, version: ver, source: "local" });
                        });
                    }
                }

                // 3. Procura no PATH do sistema
                var cmd = process.platform === "win32" ? "where yt-dlp" : "which yt-dlp";
                child_process.exec(cmd, function (err, stdout) {
                    if (!err && stdout && stdout.trim()) {
                        var detectedPath = stdout.trim().split(/\r?\n/)[0];
                        self.cachedYtDlpPath = detectedPath;
                        self.checkBinaryVersion(detectedPath).then(function (ver) {
                            resolve({ found: true, path: detectedPath, version: ver, source: "system" });
                        });
                        return;
                    }

                    // 4. Procura em caminhos padrão no Windows
                    if (process.platform === "win32") {
                        var appData = process.env.APPDATA || "";
                        var localAppData = process.env.LOCALAPPDATA || "";
                        var userProfile = process.env.USERPROFILE || "";

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

        findFfmpeg: function () {
            if (!isNode) {
                return Promise.resolve({ found: true, path: "ffmpeg (browser mock)", version: "9.0" });
            }

            var self = this;
            return new Promise(function (resolve) {
                var customPath = localStorage.getItem("mediadownloader_custom_ffmpeg");
                if (customPath && fs.existsSync(customPath)) {
                    self.cachedFfmpegPath = customPath;
                    return self.checkBinaryVersion(customPath, true).then(function (ver) {
                        resolve({ found: true, path: customPath, version: ver, source: "custom" });
                    });
                }

                var locaisF = self.candidatosLocais("ffmpeg");
                for (var F = 0; F < locaisF.length; F++) {
                    if (fs.existsSync(locaisF[F])) {
                        var achadoF = locaisF[F];
                        self.cachedFfmpegPath = achadoF;
                        return self.checkBinaryVersion(achadoF, true).then(function (ver) {
                            resolve({ found: true, path: achadoF, version: ver, source: "local" });
                        });
                    }
                }

                var cmd = process.platform === "win32" ? "where ffmpeg" : "which ffmpeg";
                child_process.exec(cmd, function (err, stdout) {
                    if (!err && stdout && stdout.trim()) {
                        var detectedPath = stdout.trim().split(/\r?\n/)[0];
                        self.cachedFfmpegPath = detectedPath;
                        self.checkBinaryVersion(detectedPath, true).then(function (ver) {
                            resolve({ found: true, path: detectedPath, version: ver, source: "system" });
                        });
                        return;
                    }

                    if (process.platform === "win32") {
                        var localAppData = process.env.LOCALAPPDATA || "";
                        var userProfile = process.env.USERPROFILE || "";
                        var candidatePaths = [
                            path.join(localAppData, "Microsoft", "WinGet", "Links", "ffmpeg.exe"),
                            path.join(userProfile, "AppData", "Local", "Microsoft", "WinGet", "Links", "ffmpeg.exe"),
                            "C:\\ffmpeg\\bin\\ffmpeg.exe",
                            "C:\\Program Files\\ffmpeg\\bin\\ffmpeg.exe"
                        ];

                        // Busca automática em pastas de pacotes WinGet
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

        findAria2: function () {
            if (!isNode) return Promise.resolve({ found: false, path: null });
            var locaisA = this.candidatosLocais("aria2c");
            for (var A = 0; A < locaisA.length; A++) {
                if (fs.existsSync(locaisA[A])) {
                    return Promise.resolve({ found: true, path: locaisA[A], source: "local" });
                }
            }
            return new Promise(function (resolve) {
                var cmd = process.platform === "win32" ? "where aria2c" : "which aria2c";
                child_process.exec(cmd, function (err, stdout) {
                    if (!err && stdout && stdout.trim()) {
                        return resolve({ found: true, path: stdout.trim().split(/\r?\n/)[0], source: "system" });
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
                    if (err || !stdout) return resolve("Desconhecida");
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

        /**
         * Baixa o yt-dlp.exe com bypass de proxy / SSL self-signed certificates
         */
        downloadStandaloneYtDlp: function (onProgress) {
            if (!isNode) return Promise.reject(new Error("Apenas suportado no ambiente Node.js / CEP."));

            var self = this;
            var localBin = self.getLocalBinDir();
            var targetFile = path.join(localBin, process.platform === "win32" ? "yt-dlp.exe" : "yt-dlp");
            var tempFile = targetFile + ".tmp";
            var url = "https://github.com/yt-dlp/yt-dlp/releases/latest/download/" + (process.platform === "win32" ? "yt-dlp.exe" : "yt-dlp");

            // Permite download mesmo com certificados intermediários corporativos/antivírus
            var agent = new https.Agent({ rejectUnauthorized: false });

            return new Promise(function (resolve, reject) {
                function follow(downloadUrl, redirects) {
                    if (redirects > 6) return reject(new Error("Muitos redirecionamentos ao baixar yt-dlp"));

                    var isHttps = downloadUrl.startsWith("https");
                    var client = isHttps ? https : http;
                    var options = {
                        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
                        agent: isHttps ? agent : undefined,
                        rejectUnauthorized: false
                    };

                    var req = client.get(downloadUrl, options, function (res) {
                        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                            return follow(res.headers.location, (redirects || 0) + 1);
                        }

                        if (res.statusCode !== 200) {
                            return reject(new Error("HTTP Error " + res.statusCode + " ao baixar yt-dlp"));
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
                                    if (process.platform !== "win32") {
                                        fs.chmodSync(targetFile, "755");
                                    }
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

        /**
         * Baixa um binario unico, seguindo redirecionamentos.
         */
        baixarBinario: function (url, destino, onProgress) {
            var agent = new https.Agent({ rejectUnauthorized: false });
            var temp = destino + ".tmp";

            return new Promise(function (resolve, reject) {
                function follow(u, redirects) {
                    if (redirects > 6) {
                        return reject(new Error("Muitos redirecionamentos ao baixar " + path.basename(destino)));
                    }
                    var isHttps = u.indexOf("https") === 0;
                    var client = isHttps ? https : http;
                    var options = {
                        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
                        agent: isHttps ? agent : undefined,
                        rejectUnauthorized: false
                    };

                    var req = client.get(u, options, function (res) {
                        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                            return follow(res.headers.location, (redirects || 0) + 1);
                        }
                        if (res.statusCode !== 200) {
                            return reject(new Error("HTTP " + res.statusCode + " ao baixar " + path.basename(destino)));
                        }

                        var total = parseInt(res.headers["content-length"], 10) || 0;
                        var recebido = 0;
                        var fileStream = fs.createWriteStream(temp);

                        res.on("data", function (chunk) {
                            recebido += chunk.length;
                            fileStream.write(chunk);
                            if (onProgress) onProgress(recebido, total);
                        });

                        res.on("end", function () {
                            fileStream.end(function () {
                                try {
                                    if (fs.existsSync(destino)) fs.unlinkSync(destino);
                                    fs.renameSync(temp, destino);
                                    if (process.platform !== "win32") {
                                        fs.chmodSync(destino, "755");
                                    }
                                    resolve(destino);
                                } catch (err) {
                                    reject(err);
                                }
                            });
                        });
                    });

                    req.on("error", function (e) {
                        try { if (fs.existsSync(temp)) fs.unlinkSync(temp); } catch (ex) {}
                        reject(e);
                    });
                }

                follow(url, 0);
            });
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
                    self.cachedFfmpegPath = final;
                    return self.checkBinaryVersion(final, true).then(function (v) {
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
            return Promise.all([this.findYtDlp(), this.findFfmpeg()]).then(function (results) {
                var ytdlp = results[0];
                var ffmpeg = results[1];
                self.ytDlpVersion = ytdlp.version;
                self.ffmpegVersion = ffmpeg.version;

                return {
                    ytdlp: ytdlp,
                    ffmpeg: ffmpeg,
                    ready: ytdlp.found
                };
            });
        }
    };

    window.BinManager = BinManager;
})(window);

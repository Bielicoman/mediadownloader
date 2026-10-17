/**
 * downloader.js - Motor de download do Media Downloader.
 *
 * O MESMO arquivo e usado pela extensao do Premiere (com.alexascencio.mediadownloader/js)
 * e pelo app Desktop (app/src/js). Edite aqui e rode `node sync-engine.js`.
 *
 * Estrategia, medida em 2026-10-14 com Big Buck Bunny 4K60 (YouTube aqz-KE-bpKQ):
 *  - Ate 1080p o YouTube entrega H.264 + AAC. Baixar esses fluxos e so juntar e
 *    o original bit a bit, sem perda e sem tempo de conversao.
 *  - Acima de 1080p so existem VP9 e AV1. O seletor padrao do yt-dlp prefere AV1,
 *    que o FFmpeg empacotado decodifica a 1,2x tempo real (libaom). VP9 decodifica
 *    a ~3,5x. Por isso a ordenacao prefere VP9 quando nao ha H.264.
 *  - Conversao para H.264 acontece no maximo uma vez, na GPU quando disponivel
 *    (NVENC 1,8x tempo real em 4K60 com SSIM 0,9934; x264 ultrafast 1,3x, SSIM 0,9917).
 *  - O progresso da conversao vem do proprio FFmpeg (-progress), nunca estimado.
 */

(function (window) {
    "use strict";

    var isNode = typeof require !== "undefined";
    var child_process = isNode ? require("child_process") : null;
    var path = isNode ? require("path") : null;
    var fs = isNode ? require("fs") : null;
    var os = isNode ? require("os") : null;
    var https = isNode ? require("https") : null;
    var StringDecoder = isNode ? require("string_decoder").StringDecoder : null;

    var isCEP = typeof window.__adobe_cep__ !== "undefined";
    var activeJobs = {};
    var infoCache = {};
    var encoderPromise = null;

    var INFO_TTL_MS = 20 * 60 * 1000;
    var AUDIO_EXT = [".wav", ".mp3", ".aac", ".m4a", ".ogg", ".opus", ".flac"];

    // Altura maxima por preset. null = sem limite.
    var PRESET_HEIGHT = { best: null, "4320p": 4320, "2160p": 2160, "1440p": 1440, "1080p": 1080, "720p": 720, "480p": 480, "360p": 360, prores: null };

    function pad2(n) { return n < 10 ? "0" + n : String(n); }

    function formatDuration(sec) {
        sec = Math.floor(sec || 0);
        var h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
        return h > 0 ? h + ":" + pad2(m) + ":" + pad2(s) : pad2(m) + ":" + pad2(s);
    }

    function formatBytes(b) {
        if (!b || b <= 0) return "";
        if (b >= 1073741824) return (b / 1073741824).toFixed(2) + " GB";
        if (b >= 1048576) return (b / 1048576).toFixed(1) + " MB";
        return Math.round(b / 1024) + " KB";
    }

    function formatSpeed(bps) {
        if (!bps || bps <= 0) return "--";
        return (bps / 1048576).toFixed(1) + " MB/s";
    }

    function cacheDir() {
        var d = path.join(os.tmpdir(), "mediadownloader-cache");
        try { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); } catch (e) {}
        return d;
    }

    /** Mata o processo e os filhos. O yt-dlp.exe (PyInstaller) roda num processo filho. */
    function killTree(proc) {
        if (!proc || proc.exitCode !== null) return;
        try {
            if (process.platform === "win32") {
                child_process.execFile("taskkill", ["/pid", String(proc.pid), "/T", "/F"], { windowsHide: true }, function () {});
            } else {
                proc.kill("SIGKILL");
            }
        } catch (e) {}
    }

    function httpGetJson(url, timeoutMs) {
        return new Promise(function (resolve) {
            try {
                var req = https.get(url, { timeout: timeoutMs }, function (res) {
                    if (res.statusCode !== 200) { res.resume(); return resolve(null); }
                    var body = "";
                    res.on("data", function (c) { body += c; });
                    res.on("end", function () {
                        try { resolve(JSON.parse(body)); } catch (e) { resolve(null); }
                    });
                });
                req.on("timeout", function () { req.destroy(); resolve(null); });
                req.on("error", function () { resolve(null); });
            } catch (e) { resolve(null); }
        });
    }

    function friendlyError(stderr, code) {
        var s = stderr || "";
        if (s.indexOf("Sign in to confirm your age") !== -1 || s.indexOf("inappropriate for some users") !== -1) {
            return "Vídeo com restrição de idade. Selecione um cookies.txt nas Configurações para baixar.";
        }
        if (s.indexOf("Private video") !== -1 || s.indexOf("members-only") !== -1 || s.indexOf("Join this channel") !== -1) {
            return "Vídeo privado ou só para membros. Selecione um cookies.txt de uma conta com acesso nas Configurações.";
        }
        if (s.indexOf("Sign in to confirm you") !== -1) {
            return "O YouTube pediu verificação de robô para esta rede. Selecione um cookies.txt nas Configurações ou tente mais tarde.";
        }
        if (s.indexOf("HTTP Error 403") !== -1) {
            return "O servidor recusou a conexão (HTTP 403). Atualize o yt-dlp nas Configurações e tente de novo.";
        }
        if (s.indexOf("Unsupported URL") !== -1) {
            return "Este link não é suportado. Confira se é o link da página do vídeo.";
        }
        if (s.indexOf("getaddrinfo") !== -1 || s.indexOf("Unable to download webpage") !== -1) {
            return "Sem conexão com o site. Verifique a internet.";
        }
        var lines = s.split(/\r?\n/).filter(function (l) { return l.indexOf("ERROR:") !== -1; });
        if (lines.length) return lines.join(" ").replace(/ERROR:\s*/g, "").substring(0, 300);
        return "Falha no download (código " + code + ").";
    }

    var Downloader = {
        formatDuration: formatDuration,
        formatBytes: formatBytes,

        detectPlatform: function (url) {
            if (!url || typeof url !== "string") {
                return { id: "unknown", name: "Link Direto", icon: "link", color: "#64748b" };
            }
            var u = url.trim().toLowerCase();

            if (u.indexOf("youtube.com/playlist") !== -1 || u.indexOf("&list=") !== -1) {
                return { id: "youtube_playlist", name: "YouTube Playlist", icon: "playlist", color: "#ef4444", badge: "Playlist", isPlaylist: true };
            }
            if (u.indexOf("youtube.com/@") !== -1 || u.indexOf("youtube.com/channel/") !== -1 || u.indexOf("youtube.com/c/") !== -1 || u.indexOf("youtube.com/user/") !== -1) {
                return { id: "youtube_channel", name: "YouTube Canal", icon: "channel", color: "#ef4444", badge: "Canal", isChannel: true };
            }
            if (u.indexOf("youtube.com/shorts") !== -1) {
                return { id: "youtube_shorts", name: "YouTube Shorts", icon: "youtube", color: "#ef4444", badge: "Shorts" };
            }
            if (u.indexOf("youtube.com") !== -1 || u.indexOf("youtu.be") !== -1) {
                return { id: "youtube", name: "YouTube", icon: "youtube", color: "#ef4444", badge: "YouTube" };
            }
            if (u.indexOf("instagram.com/reel") !== -1) {
                return { id: "instagram_reels", name: "Instagram Reels", icon: "instagram", color: "#f97316", badge: "Reels" };
            }
            if (u.indexOf("instagram.com") !== -1) {
                return { id: "instagram", name: "Instagram", icon: "instagram", color: "#e1306c", badge: "Instagram" };
            }
            if (u.indexOf("tiktok.com") !== -1) {
                return { id: "tiktok", name: "TikTok", icon: "tiktok", color: "#06b6d4", badge: "TikTok" };
            }
            if (u.indexOf("twitter.com") !== -1 || u.indexOf("x.com/") !== -1) {
                return { id: "twitter", name: "X (Twitter)", icon: "twitter", color: "#38bdf8", badge: "X" };
            }
            if (u.indexOf("facebook.com") !== -1 || u.indexOf("fb.watch") !== -1) {
                return { id: "facebook", name: "Facebook", icon: "facebook", color: "#2563eb", badge: "Facebook" };
            }
            if (u.indexOf("twitch.tv") !== -1) {
                return { id: "twitch", name: "Twitch", icon: "twitch", color: "#818cf8", badge: "Twitch" };
            }
            if (u.indexOf("pinterest.com") !== -1 || u.indexOf("pin.it") !== -1) {
                return { id: "pinterest", name: "Pinterest", icon: "pinterest", color: "#e11d48", badge: "Pinterest" };
            }
            if (u.indexOf("vimeo.com") !== -1) {
                return { id: "vimeo", name: "Vimeo", icon: "vimeo", color: "#0ea5e9", badge: "Vimeo" };
            }
            return { id: "web", name: "Web", icon: "globe", color: "#3b82f6", badge: "Web" };
        },

        /**
         * Pasta padrao. Na extensao, com projeto salvo, usa <pasta do projeto>/<nome do bin>.
         */
        getDefaultDownloadDir: function (projectFolder) {
            if (!isNode) return "";

            if (projectFolder && typeof projectFolder === "string" && projectFolder.length > 2) {
                try {
                    if (fs.existsSync(projectFolder)) {
                        var binName = localStorage.getItem("mediadownloader_bin_name") || "_Downloads";
                        var projectDir = path.join(projectFolder, binName);
                        if (!fs.existsSync(projectDir)) fs.mkdirSync(projectDir, { recursive: true });
                        return projectDir;
                    }
                } catch (pe) {}
            }

            var saved = localStorage.getItem("mediadownloader_download_dir");
            if (saved && fs.existsSync(saved)) return saved;

            // No macOS a pasta de video e ~/Movies; ~/Videos nao existe.
            var sub = isCEP ? "PremiereDownloads" : "MediaDownloader";
            var dir = path.join(os.homedir(), process.platform === "darwin" ? "Movies" : "Videos", sub);
            try { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); } catch (e) {}
            return dir;
        },

        getInstantPreview: function (url) {
            if (!url) return null;
            var platform = this.detectPlatform(url);
            if (platform.id === "youtube" || platform.id === "youtube_shorts") {
                var m = url.trim().match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/\s]{11})/i);
                if (m && m[1]) {
                    return {
                        id: m[1], url: url, title: "Vídeo do YouTube", uploader: "YouTube",
                        durationFormatted: "--:--", thumbnail: "https://i.ytimg.com/vi/" + m[1] + "/hqdefault.jpg",
                        platform: platform, isInstant: true
                    };
                }
            }
            return {
                id: "", url: url, title: "Mídia (" + platform.name + ")", uploader: platform.name,
                durationFormatted: "--:--", thumbnail: "", platform: platform, isInstant: true
            };
        },

        _cookiesArgs: function () {
            var p = localStorage.getItem("mediadownloader_cookies_path");
            if (!p && isCEP && window.BinManager && window.BinManager.getExtensionDir) {
                var ext = path.join(window.BinManager.getExtensionDir(), "cookies.txt");
                if (fs.existsSync(ext)) p = ext;
            }
            return (p && fs.existsSync(p)) ? ["--cookies", p] : [];
        },

        /**
         * Extrai os metadados uma vez e guarda o JSON. O download reaproveita esse
         * JSON (--load-info-json) e pula a segunda extracao, que custava 5 a 7 s.
         */
        _extractInfo: function (url) {
            var cached = infoCache[url];
            if (cached && (Date.now() - cached.time) < INFO_TTL_MS) return cached.promise;

            var self = this;
            var promise = window.BinManager.findYtDlp().then(function (ytdlp) {
                if (!ytdlp.found) throw new Error("yt-dlp não encontrado. Abra as Configurações e clique em Instalar motores.");
                return new Promise(function (resolve, reject) {
                    var args = ["--encoding", "utf-8", "-J", "--no-playlist", "--no-warnings",
                        "--socket-timeout", "15", "--cache-dir", cacheDir()].concat(self._cookiesArgs(), [url]);
                    var child = child_process.spawn(ytdlp.path, args, { windowsHide: true });
                    var out = [], err = "";
                    child.stdout.on("data", function (d) { out.push(d); });
                    child.stderr.on("data", function (d) { err += d.toString("utf8"); });
                    child.on("error", reject);
                    child.on("close", function (code) {
                        if (code !== 0) return reject(new Error(friendlyError(err, code)));
                        try {
                            var text = Buffer.concat(out).toString("utf8");
                            resolve({ text: text, info: JSON.parse(text) });
                        } catch (e) {
                            reject(new Error("Resposta inválida do yt-dlp: " + e.message));
                        }
                    });
                });
            });

            infoCache[url] = { time: Date.now(), promise: promise };
            promise.catch(function () { delete infoCache[url]; });
            return promise;
        },

        /**
         * Metadados do link. onQuick recebe o titulo pelo oEmbed do YouTube em
         * ~300 ms, antes da extracao completa terminar.
         */
        fetchMetadata: function (url, onQuick) {
            if (!isNode) return Promise.reject(new Error("Disponível apenas dentro do Premiere ou do app Desktop."));
            var self = this;
            var platform = this.detectPlatform(url);
            var instant = this.getInstantPreview(url);

            if (onQuick && (platform.id === "youtube" || platform.id === "youtube_shorts")) {
                httpGetJson("https://www.youtube.com/oembed?format=json&url=" + encodeURIComponent(url), 3000).then(function (o) {
                    if (o && o.title) {
                        onQuick({
                            id: instant.id, url: url, title: o.title, uploader: o.author_name || "YouTube",
                            durationFormatted: "--:--", thumbnail: instant.thumbnail || o.thumbnail_url || "",
                            platform: platform, isInstant: true
                        });
                    }
                });
            }

            return this._extractInfo(url).then(function (r) {
                var info = r.info;
                return {
                    id: info.id,
                    url: url,
                    title: info.title || "Mídia sem título",
                    uploader: info.uploader || info.channel || info.creator || platform.name,
                    duration: info.duration || 0,
                    durationFormatted: info.duration ? formatDuration(info.duration) : "--:--",
                    thumbnail: info.thumbnail || (instant ? instant.thumbnail : ""),
                    platform: platform,
                    maxHeight: (info.formats || []).reduce(function (mx, f) { return Math.max(mx, f.height || 0); }, 0),
                    technical: window.MediaInfo ? window.MediaInfo.source(info) : null,
                    webpageUrl: info.webpage_url || url
                };
            });
        },

        inspectFile: function(file) {
            var self=this;
            return window.BinManager.findFfmpeg().then(function(ff){var probe=window.BinManager.findFfprobe(ff.path);if(!probe)throw new Error("FFprobe não encontrado.");return self._probe(probe,file);});
        },
        fetchPlaylistOrChannel: function (url, onProgressStatus) {
            if (!isNode) return Promise.reject(new Error("Disponível apenas no app Desktop."));
            var self = this;
            var platform = this.detectPlatform(url);
            if (onProgressStatus) onProgressStatus("Lendo a lista de vídeos...");

            return window.BinManager.findYtDlp().then(function (ytdlp) {
                if (!ytdlp.found) throw new Error("yt-dlp não encontrado.");
                return new Promise(function (resolve, reject) {
                    var args = ["--encoding", "utf-8", "--flat-playlist", "-J", "--no-warnings",
                        "--socket-timeout", "20", "--cache-dir", cacheDir()].concat(self._cookiesArgs(), [url]);
                    var child = child_process.spawn(ytdlp.path, args, { windowsHide: true });
                    var out = [], err = "";
                    child.stdout.on("data", function (d) { out.push(d); });
                    child.stderr.on("data", function (d) { err += d.toString("utf8"); });
                    child.on("error", reject);
                    child.on("close", function (code) {
                        if (code !== 0) return reject(new Error(friendlyError(err, code)));
                        try {
                            var info = JSON.parse(Buffer.concat(out).toString("utf8"));
                            var items = (info.entries || []).map(function (it, idx) {
                                it=it||{};var unavailable=(!it.id&&!it.url)||/\[(?:Private|Deleted) video\]/i.test(it.title||"");
                                var thumb = it.thumbnail || (it.thumbnails && it.thumbnails.length ? it.thumbnails[it.thumbnails.length - 1].url : "");
                                if (!thumb && it.id) thumb = "https://i.ytimg.com/vi/" + it.id + "/hqdefault.jpg";
                                return {
                                    id: it.id || "item_" + idx,
                                    index: idx + 1,
                                    url: it.url || (it.id ? "https://www.youtube.com/watch?v=" + it.id : url),
                                    title: it.title || ("Vídeo " + (idx + 1)),
                                    uploader: it.uploader || it.channel || info.title || "YouTube",
                                    durationFormatted: it.duration ? formatDuration(it.duration) : "--:--",
                                    thumbnail: thumb,
                                    unavailable: unavailable,
                                    selected: !unavailable
                                };
                            });
                            resolve({
                                title: info.title || platform.name,
                                uploader: info.uploader || info.channel || "YouTube",
                                platform: platform,
                                itemsCount: items.length,
                                items: items
                            });
                        } catch (pe) {
                            reject(new Error("Falha ao ler a playlist: " + pe.message));
                        }
                    });
                });
            });
        },

        /**
         * Testa de verdade (codifica 3 quadros) qual codificador H.264 por hardware
         * funciona nesta maquina. Estar listado no FFmpeg nao garante GPU presente.
         */
        detectEncoder: function () {
            if (encoderPromise) return encoderPromise;
            encoderPromise = window.BinManager.findFfmpeg().then(function (ff) {
                if (!ff.found) return "libx264";
                var key = "mediadownloader_encoder_" + ff.path;
                var saved = localStorage.getItem(key);
                if (saved) return saved;

                var candidates = process.platform === "darwin" ? ["h264_videotoolbox"] : ["h264_nvenc", "h264_amf"];
                function tryNext(i) {
                    if (i >= candidates.length) return Promise.resolve("libx264");
                    return new Promise(function (resolve) {
                        child_process.execFile(ff.path, ["-hide_banner", "-loglevel", "error", "-f", "lavfi",
                            "-i", "color=black:s=1920x1080:r=30", "-frames:v", "3", "-c:v", candidates[i], "-f", "null", "-"],
                            { timeout: 10000, windowsHide: true }, function (err) { resolve(!err); });
                    }).then(function (ok) { return ok ? candidates[i] : tryNext(i + 1); });
                }
                return tryNext(0).then(function (enc) {
                    try { localStorage.setItem(key, enc); } catch (e) {}
                    return enc;
                });
            });
            return encoderPromise;
        },

        _probe: function (ffprobePath, file) {
            return new Promise(function (resolve) {
                child_process.execFile(ffprobePath, ["-v", "error", "-print_format", "json", "-show_streams", "-show_format", file],
                    { windowsHide: true, maxBuffer: 8 * 1024 * 1024 }, function (err, stdout) {
                        if (err) return resolve(null);
                        try { resolve(JSON.parse(stdout)); } catch (e) { resolve(null); }
                    });
            });
        },

        /** Roda o FFmpeg reportando o percentual real a partir de out_time_us. */
        _runFfmpeg: function (job, ffmpegPath, args, durationSec, label, onProgress) {
            return new Promise(function (resolve) {
                if (job.cancelled) return resolve({ ok: false, err: "Download cancelado." });
                var full = ["-hide_banner", "-nostats", "-loglevel", "error", "-progress", "pipe:1", "-y"].concat(args);
                var child = child_process.spawn(ffmpegPath, full, { windowsHide: true });
                job.procs.push(child);
                var err = "", buf = "", started = Date.now();
                child.stdout.on("data", function (d) {
                    buf += d.toString("utf8");
                    var lines = buf.split(/\r?\n/);
                    buf = lines.pop();
                    for (var i = 0; i < lines.length; i++) {
                        var m = lines[i].match(/^out_time_us=(\d+)/);
                        if (m && durationSec > 0 && onProgress) {
                            var done = parseInt(m[1], 10) / 1e6;
                            var pct = Math.min(99.5, (done / durationSec) * 100);
                            var elapsed = (Date.now() - started) / 1000;
                            var eta = pct > 1 ? elapsed * (100 - pct) / pct : 0;
                            onProgress({
                                percent: pct, speed: elapsed > 0 ? (done / elapsed).toFixed(1) + "x" : "--",
                                eta: pct > 1 ? formatDuration(eta) : "--", size: "", stage: "convert",
                                status: label + " — " + Math.round(pct) + "%"
                            });
                        }
                    }
                });
                child.stderr.on("data", function (d) { err += d.toString("utf8"); });
                child.on("error", function (e) { resolve({ ok: false, err: e.message }); });
                child.on("close", function (code) { resolve({ ok: code === 0 && !job.cancelled, err: err }); });
            });
        },

        _videoEncodeArgs: function (encoder, v) {
            var fps = 30;
            if (v.r_frame_rate && v.r_frame_rate.indexOf("/") !== -1) {
                var p = v.r_frame_rate.split("/");
                fps = (parseFloat(p[0]) / parseFloat(p[1])) || 30;
            }
            var pixels = (v.width || 1920) * (v.height || 1080);
            var bitrate = Math.round(pixels * fps * 0.12 / 1000000);

            if (encoder === "h264_nvenc") {
                return ["-c:v", "h264_nvenc", "-preset", "p4", "-tune", "hq", "-rc", "vbr", "-cq", "18", "-b:v", "0",
                    "-maxrate", "250M", "-bufsize", "500M", "-profile:v", "high"];
            }
            if (encoder === "h264_amf") {
                return ["-c:v", "h264_amf", "-quality", "quality", "-rc", "cqp", "-qp_i", "18", "-qp_p", "20", "-profile:v", "high", "-pix_fmt", "yuv420p"];
            }
            if (encoder === "h264_videotoolbox") {
                return ["-c:v", "h264_videotoolbox", "-b:v", bitrate + "M", "-maxrate", Math.round(bitrate * 1.5) + "M", "-profile:v", "high", "-pix_fmt", "yuv420p"];
            }
            return ["-c:v", "libx264", "-preset", "ultrafast", "-crf", "17", "-pix_fmt", "yuv420p"];
        },

        /**
         * Garante que o arquivo abre no Premiere sem perder qualidade a toa:
         *  - H.264 8-bit + AAC em MP4: nada a fazer.
         *  - H.264 com outro audio ou outro conteiner: so remux / converte o audio.
         *  - VP9, AV1, HEVC: converte o video uma vez (GPU se houver).
         *  - ProRes: uma unica codificacao para MOV ProRes 422 HQ + PCM 24-bit.
         */
        _conform: function (job, filePath, preset, ffmpegPath, ffprobePath, onProgress) {
            var self = this;
            if (!filePath || !fs.existsSync(filePath)) return Promise.resolve(filePath);
            var ext = path.extname(filePath).toLowerCase();
            if (preset.indexOf("audio_") === 0 || preset === "thumbnail" || AUDIO_EXT.indexOf(ext) !== -1) {
                return Promise.resolve(filePath);
            }
            if (!ffprobePath) return Promise.resolve(filePath);

            return this._probe(ffprobePath, filePath).then(function (probe) {
                if (!probe || !probe.streams) return filePath;
                var v = null, a = null;
                probe.streams.forEach(function (s) {
                    if (s.codec_type === "video" && !v && !(s.disposition && s.disposition.attached_pic)) v = s;
                    if (s.codec_type === "audio" && !a) a = s;
                });
                if (!v) return filePath;

                var duration = parseFloat((probe.format && probe.format.duration) || v.duration || 0);
                var base = filePath.substring(0, filePath.length - ext.length);
                var audioIsAac = !a || a.codec_name === "aac";
                var audioArgs = !a ? [] : (audioIsAac ? ["-c:a", "copy"] : ["-c:a", "aac", "-b:a", "320k", "-ar", "48000"]);
                var maps = ["-map", "0:v:0"].concat(a ? ["-map", "0:a:0"] : []);

                if (preset === "prores") {
                    var movOut = base + ".mov";
                    var tmpMov = base + ".conform.mov";
                    var proArgs = ["-i", filePath].concat(maps, ["-c:v", "prores_ks", "-profile:v", "3", "-vendor", "apl0",
                        "-pix_fmt", "yuv422p10le"], a ? ["-c:a", "pcm_s24le", "-ar", "48000"] : [], [tmpMov]);
                    return self._runFfmpeg(job, ffmpegPath, proArgs, duration, "Convertendo para ProRes 422 HQ", onProgress).then(function (r) {
                        return self._swap(r, tmpMov, filePath, movOut);
                    });
                }

                var videoOk = v.codec_name === "h264" && (v.pix_fmt === "yuv420p" || v.pix_fmt === "yuvj420p");
                if (videoOk && audioIsAac && ext === ".mp4") return filePath;

                var mp4Out = base + ".mp4";
                var tmp = base + ".conform.mp4";

                if (videoOk) {
                    var remux = ["-i", filePath].concat(maps, ["-c:v", "copy"], audioArgs, [tmp]);
                    return self._runFfmpeg(job, ffmpegPath, remux, duration, "Ajustando áudio para o Premiere", onProgress).then(function (r) {
                        return self._swap(r, tmp, filePath, mp4Out);
                    });
                }

                return self.detectEncoder().then(function (encoder) {
                    var tenBit = /10|12/.test(v.pix_fmt || "");
                    function build(enc) {
                        var pre = [];
                        if (enc === "h264_nvenc") {
                            pre = tenBit ? ["-hwaccel", "cuda"] : ["-hwaccel", "cuda", "-hwaccel_output_format", "cuda"];
                        }
                        var encArgs = self._videoEncodeArgs(enc, v);
                        if (enc === "h264_nvenc" && tenBit) encArgs = encArgs.concat(["-pix_fmt", "yuv420p"]);
                        return pre.concat(["-i", filePath], maps, encArgs, audioArgs, [tmp]);
                    }
                    var label = "Convertendo " + String(v.codec_name).toUpperCase() + " para H.264" +
                        (encoder === "libx264" ? "" : " (GPU)");
                    return self._runFfmpeg(job, ffmpegPath, build(encoder), duration, label, onProgress).then(function (r) {
                        if (r.ok || job.cancelled || encoder === "libx264") return r;
                        // GPU falhou (driver, resolucao acima do limite do codificador): refaz no processador.
                        try { if (fs.existsSync(tmp)) fs.unlinkSync(tmp); } catch (e) {}
                        return self._runFfmpeg(job, ffmpegPath, build("libx264"), duration, "Convertendo para H.264", onProgress);
                    }).then(function (r) {
                        return self._swap(r, tmp, filePath, mp4Out);
                    });
                });
            });
        },

        /** Commit with rollback: retain source until conversion is safely installed. */
        _swap: function (result, tmp, original, finalPath) {
            if (!result.ok || !fs.existsSync(tmp) || fs.statSync(tmp).size < 1000) {
                try { if (fs.existsSync(tmp)) fs.unlinkSync(tmp); } catch (e) {}
                throw new Error("Falha na conversão. O arquivo original foi preservado. " + (result.err || "Saída inválida").substring(0, 300));
            }
            var backup = finalPath + ".md-backup-" + Date.now() + "-" + Math.random().toString(36).slice(2);
            var hadFinal = fs.existsSync(finalPath);
            try {
                if (hadFinal) fs.renameSync(finalPath, backup);
                fs.renameSync(tmp, finalPath);
            } catch (e) {
                if (hadFinal && fs.existsSync(backup)) {
                    try { fs.renameSync(backup, finalPath); } catch (rollback) {
                        throw new Error("Falha ao salvar conversão; original preservado em " + backup);
                    }
                }
                throw new Error("Falha ao salvar conversão; original preservado: " + e.message);
            }
            // Cleanup only after commit. A locked source is harmless and must remain intact.
            try { if (original !== finalPath && fs.existsSync(original)) fs.unlinkSync(original); } catch (e) {}
            try { if (hadFinal) fs.unlinkSync(backup); } catch (e) {}
            return finalPath;
        },

        _formatArgs: function (preset) {
            switch (preset) {
                case "audio_wav":
                    return ["-f", "ba/b", "-x", "--audio-format", "wav", "--postprocessor-args", "ExtractAudio:-ar 48000 -acodec pcm_s24le"];
                case "audio_mp3":
                    return ["-f", "ba/b", "-x", "--audio-format", "mp3", "--audio-quality", "320K", "--postprocessor-args", "ExtractAudio:-ar 48000"];
                case "audio_flac":
                    return ["-f", "ba/b", "-x", "--audio-format", "flac"];
                case "audio_m4a":
                    return ["-f", "ba[ext=m4a]/ba/b", "-x", "--audio-format", "m4a", "--audio-quality", "0"];
                case "audio_original":
                    return ["-f", "ba/b", "-x", "--audio-format", "best"];
                case "thumbnail":
                    return ["--skip-download", "--write-thumbnail", "--convert-thumbnails", "png"];
                default:
                    var h = PRESET_HEIGHT.hasOwnProperty(preset) ? PRESET_HEIGHT[preset] : null;
                    // Ordem medida: maior resolucao e fps; SDR; H.264 > VP9 > AV1; AAC.
                    var sort = (h ? "res:" + h : "res") + ",fps,hdr:SDR,vcodec:h264,acodec:aac";
                    var format = h ? "bv*[height<=" + h + "]+ba/b[height<=" + h + "]" : "bv*+ba/b";
                    return ["-f", format, "-S", sort, "--merge-output-format", "mp4/mkv"];
            }
        },

        /**
         * Baixa e entrega um arquivo pronto para o Premiere.
         * A promessa devolvida tem .downloadId para cancelDownload().
         */
        startDownload: function (options, onProgress, onStatus) {
            var self = this;
            var downloadId = "dl_" + Date.now() + "_" + Math.random().toString(36).substr(2, 6);
            var job = { id: downloadId, procs: [], cancelled: false };

            var promise = new Promise(function (resolve, reject) {
                if (!isNode) return reject(new Error("Disponível apenas dentro do Premiere ou do app Desktop."));

                var url = options.url;
                var preset = options.preset || "best";
                var outputDir = options.outputDir || self.getDefaultDownloadDir();
                try { if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true }); } catch (e) {}

                activeJobs[downloadId] = job;
                function done(fn, val) { delete activeJobs[downloadId]; fn(val); }

                Promise.all([window.BinManager.findYtDlp(), window.BinManager.findFfmpeg()]).then(function (bins) {
                    var ytdlp = bins[0], ffmpeg = bins[1];
                    if (!ytdlp.found) throw new Error("yt-dlp não encontrado. Abra as Configurações e clique em Instalar motores.");
                    if (!ffmpeg.found) throw new Error("FFmpeg não encontrado. Abra as Configurações e clique em Instalar motores.");
                    var ffprobe = window.BinManager.findFfprobe(ffmpeg.path);

                    if (onStatus) onStatus("Lendo informações do vídeo...");
                    // Reaproveita a extracao feita no preview; se falhar, baixa direto pelo link.
                    return self._extractInfo(url).then(function (r) { return r; }, function () { return null; }).then(function (extracted) {
                        if (job.cancelled) throw new Error("Download cancelado.");
                        return { ytdlp: ytdlp, ffmpeg: ffmpeg, ffprobe: ffprobe, extracted: extracted };
                    });
                }).then(function (ctx) {
                    var info = ctx.extracted ? ctx.extracted.info : null;
                    var videoId = options.id || (info && info.id) || "";

                    // Arquivo com o mesmo ID aberto no Premiere: grava com sufixo para evitar WinError 32.
                    var locked = false;
                    if (videoId) {
                        try {
                            fs.readdirSync(outputDir).forEach(function (f) {
                                if (locked || f.indexOf("[" + videoId + "]") === -1) return;
                                try { fs.closeSync(fs.openSync(path.join(outputDir, f), "r+")); } catch (le) { locked = true; }
                            });
                        } catch (se) {}
                    }
                    var name = locked ? "%(title).70B [%(id)s]_" + Date.now().toString().slice(-4) : "%(title).80B [%(id)s]";
                    var tempDir = path.join(outputDir, ".md-temp");

                    var args = [
                        "--encoding", "utf-8",
                        "--no-playlist", "--no-warnings", "--no-mtime",
                        "--newline", "--progress",
                        "--progress-template", "download:MDP|%(progress.downloaded_bytes)s|%(progress.total_bytes)s|%(progress.total_bytes_estimate)s|%(progress.speed)s|%(progress.eta)s|%(info.format_id)s",
                        "--progress-template", "postprocess:MDPP|%(progress.status)s|%(progress.postprocessor)s",
                        "--print", "after_move:MDFILE|%(filepath)s",
                        "--concurrent-fragments", "8",
                        "--http-chunk-size", "10M",
                        "--socket-timeout", "20",
                        "--retries", "10", "--fragment-retries", "10",
                        "--ffmpeg-location", path.dirname(ctx.ffmpeg.path),
                        "--cache-dir", cacheDir(),
                        "-P", outputDir, "-P", "temp:" + tempDir,
                        "-o", name + ".%(ext)s",
                        "-o", "thumbnail:" + name + ".%(ext)s"
                    ].concat(self._cookiesArgs(), self._formatArgs(preset));

                    var infoFile = null;
                    if (ctx.extracted) {
                        infoFile = path.join(cacheDir(), downloadId + ".info.json");
                        try { fs.writeFileSync(infoFile, ctx.extracted.text); } catch (we) { infoFile = null; }
                    }

                    function run(useInfo) {
                        var finalArgs = args.concat(useInfo ? ["--load-info-json", infoFile] : [url]);
                        return self._runYtDlp(job, ctx.ytdlp.path, finalArgs, preset, onProgress, onStatus);
                    }

                    var startedAt = Date.now();
                    var attempt = infoFile ? run(true).catch(function (e) {
                        if (job.cancelled) throw e;
                        // URLs do JSON expiram em algumas horas: tenta de novo extraindo do zero.
                        delete infoCache[url];
                        if (onStatus) onStatus("Reconectando ao servidor...");
                        return run(false);
                    }) : run(false);

                    return attempt.then(function (filePath) {
                        try { if (infoFile) fs.unlinkSync(infoFile); } catch (e) {}
                        try { fs.rmdirSync(tempDir); } catch (e) {}
                        if (!filePath || !fs.existsSync(filePath)) filePath = self._findNewest(outputDir, videoId, startedAt);
                        if (!filePath) throw new Error("O download terminou mas o arquivo não foi encontrado em " + outputDir);
                        return self._conform(job, filePath, preset, ctx.ffmpeg.path, ctx.ffprobe, onProgress);
                    });
                }).then(function (finalPath) {
                    if (job.cancelled) throw new Error("Download cancelado.");
                    if (onProgress) onProgress({ percent: 100, speed: "", eta: "", size: "", stage: "done", status: "Concluído" });
                    done(resolve, {
                        downloadId: downloadId,
                        success: true,
                        filePath: finalPath,
                        title: options.title || path.basename(finalPath),
                        preset: preset,
                        outputDir: outputDir
                    });
                }).catch(function (err) {
                    done(reject, job.cancelled ? new Error("Download cancelado.") : err);
                });
            });

            promise.downloadId = downloadId;
            return promise;
        },

        _runYtDlp: function (job, ytdlpPath, args, preset, onProgress, onStatus) {
            return new Promise(function (resolve, reject) {
                if (onStatus) onStatus("Conectando...");
                var child = child_process.spawn(ytdlpPath, args, { windowsHide: true });
                job.procs.push(child);

                var finalPath = null, stderr = "";
                var stdoutDecoder = new StringDecoder("utf8"), stderrDecoder = new StringDecoder("utf8");
                var buffers = { stdout: "", stderr: "" };
                var streams = [];   // ordem de chegada dos format_id: video primeiro, audio depois

                function parseLine(line) {
                    line = line.trim();
                    if (line.indexOf("MDFILE|") === 0) {
                        finalPath = line.substring(7).trim();
                    } else if (line.indexOf("MDPP|") === 0) {
                        var pp = line.split("|");
                        if (pp[1] === "started" && onProgress) {
                            var what = pp[2] === "Merger" ? "Juntando vídeo e áudio"
                                : pp[2] === "ExtractAudio" ? "Convertendo o áudio"
                                : pp[2] === "FFmpegThumbnailsConvertor" ? "Convertendo a capa" : "Finalizando";
                            onProgress({ percent: 100, speed: "", eta: "", size: "", stage: "post", status: what + "..." });
                        }
                    } else if (line.indexOf("MDP|") === 0 && onProgress) {
                        var p = line.split("|");
                        var got = parseFloat(p[1]) || 0;
                        var total = parseFloat(p[2]) || parseFloat(p[3]) || 0;
                        var fmt = p[6] || "";
                        if (streams.indexOf(fmt) === -1) streams.push(fmt);
                        var idx = streams.indexOf(fmt);
                        var pct = total > 0 ? Math.min(100, got / total * 100) : 0;
                        var label = preset.indexOf("audio_") === 0 ? "Baixando áudio"
                            : streams.length > 1 || idx > 0 ? (idx === 0 ? "Baixando vídeo" : "Baixando áudio") : "Baixando";
                        var eta = parseFloat(p[5]);
                        onProgress({
                            percent: pct,
                            speed: formatSpeed(parseFloat(p[4])),
                            eta: isFinite(eta) ? formatDuration(eta) : "--",
                            size: formatBytes(total),
                            stage: "download",
                            status: label + (total ? " (" + formatBytes(total) + ")" : "")
                        });
                    }
                }

                function consume(stream, text, flush) {
                    if (stream === "stderr") {
                        stderr += text;
                        if (stderr.length > 40000) stderr = stderr.substring(stderr.length - 40000);
                    }
                    buffers[stream] += text;
                    var lines = buffers[stream].split(/\r?\n/);
                    buffers[stream] = lines.pop();
                    lines.forEach(parseLine);
                    if (flush && buffers[stream]) {
                        parseLine(buffers[stream]);
                        buffers[stream] = "";
                    }
                }
                child.stdout.on("data", function (data) { consume("stdout", stdoutDecoder.write(data), false); });
                child.stderr.on("data", function (data) { consume("stderr", stderrDecoder.write(data), false); });
                child.on("error", reject);
                child.on("close", function (code) {
                    consume("stdout", stdoutDecoder.end(), true);
                    consume("stderr", stderrDecoder.end(), true);
                    if (job.cancelled) return reject(new Error("Download cancelado."));
                    if (code !== 0) return reject(new Error(friendlyError(stderr, code)));
                    resolve(finalPath);
                });
            });
        },

        /** Plano B para achar o arquivo (ex.: capa PNG, que nao passa pelo after_move). */
        _findNewest: function (dir, videoId, since) {
            try {
                var files = fs.readdirSync(dir).map(function (f) {
                    var full = path.join(dir, f);
                    var st = fs.statSync(full);
                    return { full: full, name: f, time: st.mtime.getTime(), isFile: st.isFile() };
                }).filter(function (f) {
                    return f.isFile && f.time >= since - 2000 && !/\.(part|ytdl|tmp|json)$/i.test(f.name) &&
                        (!videoId || f.name.indexOf(videoId) !== -1);
                }).sort(function (a, b) { return b.time - a.time; });
                return files.length ? files[0].full : null;
            } catch (e) {
                return null;
            }
        },

        cancelDownload: function (downloadId) {
            var job = activeJobs[downloadId];
            if (!job) return false;
            job.cancelled = true;
            job.procs.forEach(killTree);
            delete activeJobs[downloadId];
            return true;
        }
    };

    window.Downloader = Downloader;

    // Descobre o codificador de GPU em segundo plano, para nao atrasar o primeiro download.
    if (isNode && window.BinManager) {
        setTimeout(function () { Downloader.detectEncoder().catch(function () {}); }, 1500);
    }
})(window);

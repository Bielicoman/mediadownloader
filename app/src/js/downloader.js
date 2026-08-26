/**
 * downloader.js - Core Media Downloader Engine for MediaDownloader Desktop
 * Direct Node.js native execution
 */

(function (window) {
  "use strict";

  var isNode = typeof require !== "undefined";
  var path = isNode ? require("path") : null;
  var fs = isNode ? require("fs") : null;
  var child_process = isNode ? require("child_process") : null;
  var https = isNode ? require("https") : null;
  var os = isNode ? require("os") : null;

  var activeDownloads = {};

  var Downloader = {
    detectPlatform: function (url) {
      if (!url || typeof url !== "string") {
        return { id: "unknown", name: "Link Direto", icon: "link", color: "#64748b" };
      }

      var cleanUrl = url.trim().toLowerCase();

      if (cleanUrl.indexOf("youtube.com/playlist") !== -1 || cleanUrl.indexOf("&list=") !== -1) {
        return { id: "youtube_playlist", name: "YouTube Playlist", icon: "playlist", color: "#ef4444", badge: "Playlist", isPlaylist: true };
      }
      if (cleanUrl.indexOf("youtube.com/@") !== -1 || cleanUrl.indexOf("youtube.com/channel/") !== -1 || cleanUrl.indexOf("youtube.com/c/") !== -1 || cleanUrl.indexOf("youtube.com/user/") !== -1) {
        return { id: "youtube_channel", name: "YouTube Canal", icon: "channel", color: "#ef4444", badge: "Canal", isChannel: true };
      }
      if (cleanUrl.indexOf("youtube.com/shorts") !== -1) {
        return { id: "youtube_shorts", name: "YouTube Shorts", icon: "youtube", color: "#ef4444", badge: "Shorts" };
      }
      if (cleanUrl.indexOf("youtube.com") !== -1 || cleanUrl.indexOf("youtu.be") !== -1) {
        return { id: "youtube", name: "YouTube", icon: "youtube", color: "#ef4444", badge: "YouTube" };
      }
      if (cleanUrl.indexOf("instagram.com/reel") !== -1) {
        return { id: "instagram_reels", name: "Instagram Reels", icon: "instagram", color: "#f97316", badge: "Reels" };
      }
      if (cleanUrl.indexOf("instagram.com") !== -1) {
        return { id: "instagram", name: "Instagram", icon: "instagram", color: "#e1306c", badge: "Instagram" };
      }
      if (cleanUrl.indexOf("tiktok.com") !== -1) {
        return { id: "tiktok", name: "TikTok", icon: "tiktok", color: "#06b6d4", badge: "TikTok" };
      }
      if (cleanUrl.indexOf("twitter.com") !== -1 || cleanUrl.indexOf("x.com") !== -1) {
        return { id: "twitter", name: "X (Twitter)", icon: "twitter", color: "#38bdf8", badge: "X" };
      }
      if (cleanUrl.indexOf("facebook.com") !== -1 || cleanUrl.indexOf("fb.watch") !== -1) {
        return { id: "facebook", name: "Facebook", icon: "facebook", color: "#2563eb", badge: "Facebook" };
      }
      if (cleanUrl.indexOf("twitch.tv") !== -1) {
        return { id: "twitch", name: "Twitch", icon: "twitch", color: "#818cf8", badge: "Twitch" };
      }
      if (cleanUrl.indexOf("pinterest.com") !== -1 || cleanUrl.indexOf("pin.it") !== -1) {
        return { id: "pinterest", name: "Pinterest", icon: "pinterest", color: "#e11d48", badge: "Pinterest" };
      }
      if (cleanUrl.indexOf("vimeo.com") !== -1) {
        return { id: "vimeo", name: "Vimeo", icon: "vimeo", color: "#0ea5e9", badge: "Vimeo" };
      }

      return { id: "web", name: "Web / CDN", icon: "globe", color: "#3b82f6", badge: "Vídeo Web" };
    },

    getDefaultDownloadDir: function () {
      var saved = localStorage.getItem("mediadownloader_download_dir");
      if (saved && fs && fs.existsSync(saved)) {
        return saved;
      }

      if (!isNode) return "C:/Users/Editor/Videos/MediaDownloader";

      var home = os ? os.homedir() : process.env.USERPROFILE;
      // No macOS a pasta padrao de video e ~/Movies; ~/Videos nao existe.
      var videosDir = path.join(home, process.platform === "darwin" ? "Movies" : "Videos", "MediaDownloader");
      if (!fs.existsSync(videosDir)) {
        try { fs.mkdirSync(videosDir, { recursive: true }); } catch (e) {}
      }
      return videosDir;
    },

    getInstantPreview: function (url) {
      if (!url) return null;
      var platform = this.detectPlatform(url);
      var cleanUrl = url.trim();

      if (platform.id === "youtube" || platform.id === "youtube_shorts") {
        var ytMatch = cleanUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/\s]{11})/i);
        if (ytMatch && ytMatch[1]) {
          var videoId = ytMatch[1];
          return {
            id: videoId,
            url: url,
            title: "Vídeo do YouTube",
            uploader: "YouTube",
            durationFormatted: "--:--",
            thumbnail: "https://i.ytimg.com/vi/" + videoId + "/hqdefault.jpg",
            platform: platform,
            isInstant: true
          };
        }
      }

      return {
        id: "instant_" + Date.now(),
        url: url,
        title: "Mídia Online (" + platform.name + ")",
        uploader: platform.name,
        durationFormatted: "--:--",
        thumbnail: "",
        platform: platform,
        isInstant: true
      };
    },

    fetchMetadata: async function (url) {
      var self = this;
      var platform = self.detectPlatform(url);
      var instant = self.getInstantPreview(url);

      if (!isNode) {
        return new Promise(function (resolve) {
          setTimeout(function () {
            resolve(instant || {
              id: "mock_" + Date.now(),
              url: url,
              title: "Vídeo Demonstrativo (" + platform.name + ")",
              uploader: platform.name,
              durationFormatted: "03:15",
              thumbnail: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80",
              platform: platform
            });
          }, 150);
        });
      }

      var ytdlp = await window.BinManager.findYtDlp();
      if (!ytdlp.found || !ytdlp.path) {
        if (instant) return instant;
        throw new Error("yt-dlp não encontrado. Verifique as configurações.");
      }

      return new Promise(function (resolve, reject) {
        var args = [
          "--dump-single-json",
          "--no-playlist",
          "--no-warnings",
          "--no-check-certificates",
          "--socket-timeout", "15"
        ];

        var cookiesPath = localStorage.getItem("mediadownloader_cookies_path");
        if (cookiesPath && fs.existsSync(cookiesPath)) {
          args.push("--cookies", cookiesPath);
        }

        args.push(url);

        var child = child_process.spawn(ytdlp.path, args, {
          cwd: self.getDefaultDownloadDir(),
          windowsHide: true
        });

        var stdoutData = "";
        var stderrData = "";

        child.stdout.on("data", function (data) { stdoutData += data.toString("utf8"); });
        child.stderr.on("data", function (data) { stderrData += data.toString("utf8"); });

        child.on("close", function (code) {
          if (code !== 0) {
            var errMsg = stderrData || "Não foi possível extrair metadados.";
            var cleanedMsg = errMsg.split(/\r?\n/).filter(function (l) {
              return l.indexOf("ERROR:") !== -1 || (l.indexOf("WARNING:") === -1 && l.trim().length > 0);
            }).join(" ").substring(0, 300);
            return reject(new Error(cleanedMsg || "Erro ao processar link"));
          }

          try {
            var info = JSON.parse(stdoutData);
            var durationSec = info.duration || 0;
            var mins = Math.floor(durationSec / 60);
            var secs = Math.floor(durationSec % 60);
            var durFmt = (mins < 10 ? "0" + mins : mins) + ":" + (secs < 10 ? "0" + secs : secs);
            if (mins >= 60) {
              var hrs = Math.floor(mins / 60);
              mins = mins % 60;
              durFmt = hrs + ":" + (mins < 10 ? "0" + mins : mins) + ":" + (secs < 10 ? "0" + secs : secs);
            }

            resolve({
              id: info.id,
              url: url,
              title: info.title || "Mídia sem título",
              uploader: info.uploader || info.channel || info.creator || platform.name,
              duration: durationSec,
              durationFormatted: durFmt,
              thumbnail: info.thumbnail || (instant ? instant.thumbnail : ""),
              platform: platform,
              viewCount: info.view_count || null,
              webpageUrl: info.webpage_url || url,
              rawInfo: info
            });
          } catch (parseErr) {
            reject(new Error("Falha ao interpretar metadados do vídeo: " + parseErr.message));
          }
        });

        child.on("error", reject);
      });
    },

    fetchPlaylistOrChannel: async function (url, onProgressStatus) {
      var self = this;
      var platform = self.detectPlatform(url);

      if (!isNode) {
        return new Promise(function (resolve) {
          setTimeout(function () {
            var mockVideos = [];
            for (var i = 1; i <= 8; i++) {
              mockVideos.push({
                id: "mock_pl_" + i,
                url: "https://www.youtube.com/watch?v=mock" + i,
                title: "Vídeo " + i + " da Coleção - Edição Profissional 4K",
                uploader: "Canal Criativo Pro",
                durationFormatted: "04:2" + i,
                thumbnail: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=80",
                selected: true
              });
            }
            resolve({
              title: "Playlist de Exemplo (8 vídeos)",
              uploader: "Canal Criativo Pro",
              platform: platform,
              itemsCount: mockVideos.length,
              items: mockVideos
            });
          }, 300);
        });
      }

      var ytdlp = await window.BinManager.findYtDlp();
      if (!ytdlp.found || !ytdlp.path) {
        throw new Error("yt-dlp não encontrado.");
      }

      if (onProgressStatus) onProgressStatus("Indexando lista de vídeos da playlist/canal...");

      return new Promise(function (resolve, reject) {
        var args = [
          "--flat-playlist",
          "--dump-single-json",
          "--no-warnings",
          "--no-check-certificates",
          "--socket-timeout", "20"
        ];

        var cookiesPath = localStorage.getItem("mediadownloader_cookies_path");
        if (cookiesPath && fs.existsSync(cookiesPath)) {
          args.push("--cookies", cookiesPath);
        }

        args.push(url);

        var child = child_process.spawn(ytdlp.path, args, {
          cwd: self.getDefaultDownloadDir(),
          windowsHide: true
        });

        var stdoutData = "";
        var stderrData = "";

        child.stdout.on("data", function (data) { stdoutData += data.toString("utf8"); });
        child.stderr.on("data", function (data) { stderrData += data.toString("utf8"); });

        child.on("close", function (code) {
          if (code !== 0) {
            var errMsg = stderrData || "Não foi possível carregar a playlist.";
            return reject(new Error(errMsg.split(/\r?\n/).filter(function (l) { return l.indexOf("ERROR:") !== -1; }).join(" ") || "Erro ao ler playlist"));
          }

          try {
            var info = JSON.parse(stdoutData);
            var entries = info.entries || [];
            var items = entries.map(function (item, idx) {
              var durSec = item.duration || 0;
              var mins = Math.floor(durSec / 60);
              var secs = Math.floor(durSec % 60);
              var durFmt = durSec > 0 ? (mins < 10 ? "0" + mins : mins) + ":" + (secs < 10 ? "0" + secs : secs) : "--:--";

              var itemUrl = item.url || (item.id ? "https://www.youtube.com/watch?v=" + item.id : url);
              var thumb = item.thumbnail || (item.thumbnails && item.thumbnails.length > 0 ? item.thumbnails[item.thumbnails.length - 1].url : "");
              if (!thumb && item.id) {
                thumb = "https://i.ytimg.com/vi/" + item.id + "/hqdefault.jpg";
              }

              return {
                id: item.id || "item_" + idx,
                index: idx + 1,
                url: itemUrl,
                title: item.title || ("Vídeo " + (idx + 1)),
                uploader: item.uploader || item.channel || info.title || "YouTube",
                durationFormatted: durFmt,
                thumbnail: thumb,
                selected: true
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
            reject(new Error("Falha ao processar índice da playlist: " + pe.message));
          }
        });

        child.on("error", reject);
      });
    },

    startDownload: async function (options, onProgress, onStatus) {
      var self = this;
      var downloadId = "dl_" + Date.now() + "_" + Math.random().toString(36).substr(2, 6);

      var url = options.url;
      var preset = options.preset || "best";
      var outputDir = options.outputDir || self.getDefaultDownloadDir();

      if (!isNode) {
        return new Promise(function (resolve) {
          var p = 0;
          var interval = setInterval(function () {
            p += 25;
            if (onProgress) {
              onProgress({
                percent: Math.min(p, 100),
                speed: "12.4 MB/s",
                eta: "00:01",
                size: "68.5 MB",
                status: p < 100 ? "Baixando fluxos de alta fidelidade..." : "Recodificando para MP4 Master..."
              });
            }
            if (p >= 100) {
              clearInterval(interval);
              resolve({
                downloadId: downloadId,
                success: true,
                filePath: "C:/Users/Editor/Videos/MediaDownloader/video_mock.mp4",
                title: options.title || "Video Baixado",
                preset: preset,
                outputDir: outputDir
              });
            }
          }, 250);
        });
      }

      if (!fs.existsSync(outputDir)) {
        try { fs.mkdirSync(outputDir, { recursive: true }); } catch (e) {}
      }

      var results = await Promise.all([
        window.BinManager.findYtDlp(),
        window.BinManager.findFfmpeg(),
        window.BinManager.findAria2()
      ]);

      var ytdlp = results[0];
      var ffmpeg = results[1];
      var aria2 = results[2];

      if (!ytdlp.found || !ytdlp.path) {
        throw new Error("yt-dlp não encontrado no sistema.");
      }

      var candidateId = options.id || "";
      if (!candidateId) {
        var idMatch = url.match(/(?:v=|youtu\.be\/|shorts\/|reel\/|video\/)([^&?\/]+)/i);
        if (idMatch) candidateId = idMatch[1];
      }

      var isFileLocked = false;
      if (candidateId && fs.existsSync(outputDir)) {
        try {
          var existingFiles = fs.readdirSync(outputDir);
          for (var f = 0; f < existingFiles.length; f++) {
            if (existingFiles[f].indexOf(candidateId) !== -1) {
              var fullCand = path.join(outputDir, existingFiles[f]);
              try {
                var fd = fs.openSync(fullCand, "r+");
                fs.closeSync(fd);
              } catch (lockErr) {
                isFileLocked = true;
                break;
              }
            }
          }
        } catch (scanE) {}
      }

      var outputTemplate = isFileLocked
        ? path.join(outputDir, "%(title).70B [%(id)s]_" + Date.now().toString().slice(-4) + ".%(ext)s")
        : path.join(outputDir, "%(title).80B [%(id)s].%(ext)s");

      var args = [
        "--no-playlist",
        "--no-warnings",
        "--no-check-certificates",
        "--newline",
        "--concurrent-fragments", "16",
        "--http-chunk-size", "10M",
        "--buffer-size", "1M",
        "-o", outputTemplate
      ];

      var cookiesPath = localStorage.getItem("mediadownloader_cookies_path");
      if (cookiesPath && fs.existsSync(cookiesPath)) {
        args.push("--cookies", cookiesPath);
      }

      if (aria2 && aria2.found && aria2.path) {
        args.push(
          "--downloader", aria2.path,
          "--downloader-args", "aria2c:-s 16 -x 16 -k 1M -j 16 --min-split-size=1M --file-allocation=none"
        );
      } else {
        args.push("--downloader-args", "ffmpeg_i:-reconnect 1 -reconnect_streamed 1 -reconnect_delay_max 5");
      }

      if (ffmpeg.found && ffmpeg.path) {
        var ffmpegDir = path.dirname(ffmpeg.path);
        args.push("--ffmpeg-location", ffmpegDir);
      }

      switch (preset) {
        case "best":
          args.push(
            "-f", "bestvideo+bestaudio/best",
            "--recode-video", "mp4",
            "--postprocessor-args", "VideoConvertor:-c:v libx264 -crf 17 -preset ultrafast -threads 0 -pix_fmt yuv420p -c:a aac -b:a 320k -ar 48000"
          );
          break;

        case "1440p":
          args.push(
            "-f", "bestvideo[height<=1440]+bestaudio/best[height<=1440]/best",
            "--recode-video", "mp4",
            "--postprocessor-args", "VideoConvertor:-c:v libx264 -crf 17 -preset ultrafast -threads 0 -pix_fmt yuv420p -c:a aac -b:a 320k -ar 48000"
          );
          break;

        case "1080p":
          args.push(
            "-f", "bestvideo[height<=1080]+bestaudio/best[height<=1080]/best",
            "--recode-video", "mp4",
            "--postprocessor-args", "VideoConvertor:-c:v libx264 -crf 18 -preset ultrafast -threads 0 -pix_fmt yuv420p -c:a aac -b:a 320k -ar 48000"
          );
          break;

        case "720p":
          args.push(
            "-f", "bestvideo[height<=720]+bestaudio/best[height<=720]/best",
            "--recode-video", "mp4",
            "--postprocessor-args", "VideoConvertor:-c:v libx264 -crf 20 -preset ultrafast -threads 0 -pix_fmt yuv420p -c:a aac -b:a 192k -ar 48000"
          );
          break;

        case "prores":
          args.push(
            "-f", "bestvideo+bestaudio/best",
            "--recode-video", "mov",
            "--postprocessor-args", "VideoConvertor:-c:v prores_ks -profile:v 3 -pix_fmt yuv422p10le -c:a pcm_s24le -ar 48000 -threads 0"
          );
          break;

        case "audio_wav":
          args.push(
            "-x",
            "--audio-format", "wav",
            "--postprocessor-args", "ExtractAudio:-ar 48000 -acodec pcm_s24le"
          );
          break;

        case "audio_mp3":
          args.push(
            "-x",
            "--audio-format", "mp3",
            "--audio-quality", "320k",
            "--postprocessor-args", "ExtractAudio:-ar 48000"
          );
          break;

        case "thumbnail":
          args.push(
            "--write-thumbnail",
            "--skip-download",
            "--convert-thumbnails", "png"
          );
          break;

        default:
          args.push(
            "-f", "bestvideo+bestaudio/best",
            "--recode-video", "mp4",
            "--postprocessor-args", "VideoConvertor:-c:v libx264 -crf 18 -preset fast -pix_fmt yuv420p -c:a aac -b:a 320k -ar 48000 -movflags +faststart"
          );
          break;
      }

      var tempDir = path.join(outputDir, ".temp");
      if (!fs.existsSync(tempDir)) {
        try { fs.mkdirSync(tempDir, { recursive: true }); } catch (e) {}
      }

      args.push("--paths", "home:" + outputDir);
      args.push("--paths", "temp:" + tempDir);
      args.push("--cache-dir", path.join(outputDir, ".cache"));
      args.push(url);

      if (onStatus) onStatus("Conectando aos servidores de mídia...");

      return new Promise(function (resolve, reject) {
        var child = child_process.spawn(ytdlp.path, args, {
          cwd: outputDir,
          windowsHide: true
        });
        activeDownloads[downloadId] = child;

        var finalDestinationPath = null;
        var lastErrorOutput = "";

        var regexMerging = /\[Merger\]\s+Merging formats into\s+"?([^"\r\n]+)"?/i;
        var regexRecode = /\[VideoConvertor\]\s+Converting video.*to\s+"?([^"\r\n]+)"?/i;
        var regexDestination = /\[(?:download|Merger|ExtractAudio|VideoConvertor)\]\s+(?:Destination:\s+|Converting video from\s+.*?to\s+)?["']?([^"'\r\n]+)["']?/i;

        child.stdout.on("data", function (data) {
          var lines = data.toString("utf8").split(/\r?\n/);
          for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim();
            if (!line) continue;

            var matchPct = line.match(/([0-9]{1,3}(?:\.[0-9]+)?)%/);
            if (matchPct) {
              var pct = parseFloat(matchPct[1]) || 0;
              var matchSpeed = line.match(/at\s+([0-9\.]+\s*[KMG]?i?B\/s)/i) || line.match(/DL:([0-9\.]+\s*[KMG]?i?B(?:\/s)?)/i);
              var matchEta = line.match(/ETA\s*:?\s*([0-9\:]+)/i);
              var matchSize = line.match(/of\s+~?\s*([0-9\.]+\s*[KMG]?i?B)/i) || line.match(/\/([0-9\.]+\s*[KMG]?i?B)/i);

              var speed = matchSpeed ? matchSpeed[1] : "--";
              var eta = matchEta ? matchEta[1] : "--";
              var size = matchSize ? matchSize[1] : "";

              if (onProgress) {
                onProgress({
                  percent: pct,
                  speed: speed,
                  eta: eta,
                  size: size,
                  status: pct < 100 ? "Baixando dados (" + (size || Math.round(pct) + "%") + ")..." : "Processando áudio e vídeo..."
                });
              }
            }

            var matchMerge = line.match(regexMerging);
            if (matchMerge) {
              finalDestinationPath = matchMerge[1].trim();
              if (onProgress) {
                onProgress({
                  percent: 96,
                  speed: "FFmpeg",
                  eta: "00:01",
                  size: "",
                  status: "Mesclando faixas em MP4 compatível..."
                });
              }
            }

            var matchRecode = line.match(regexRecode);
            if (matchRecode) {
              finalDestinationPath = matchRecode[1].trim();
            }

            var matchDest = line.match(regexDestination);
            if (matchDest && !finalDestinationPath) {
              var pCandidate = matchDest[1].trim();
              if (pCandidate.indexOf(".") !== -1) {
                finalDestinationPath = pCandidate;
              }
            }
          }
        });

        child.stderr.on("data", function (data) {
          lastErrorOutput += data.toString("utf8");
        });

        child.on("close", function (code) {
          delete activeDownloads[downloadId];

          if (code !== 0) {
            if (lastErrorOutput.indexOf("Sign in to confirm your age") !== -1 || lastErrorOutput.indexOf("inappropriate for some users") !== -1) {
              return reject(new Error("🔞 Vídeo com Restrição de Idade (18+). Adicione seu cookies.txt nas Configurações (⚙️)."));
            }
            if (lastErrorOutput.indexOf("Private video") !== -1 || lastErrorOutput.indexOf("members-only") !== -1) {
              return reject(new Error("🔒 Vídeo Privado ou Apenas para Membros. Adicione seu cookies.txt nas Configurações (⚙️)."));
            }

            var cleanErr = lastErrorOutput.split(/\r?\n/).filter(function (l) {
              return l.indexOf("ERROR:") !== -1;
            }).join(" ");
            return reject(new Error(cleanErr || "Falha no download (Código " + code + ")"));
          }

          try {
            var files = fs.readdirSync(outputDir).map(function (f) {
              var full = path.join(outputDir, f);
              return { name: full, time: fs.statSync(full).mtime.getTime(), ext: path.extname(full).toLowerCase() };
            }).filter(function (f) {
              return f.ext !== ".part" && f.ext !== ".ytdl" && f.ext !== ".tmp";
            }).sort(function (a, b) { return b.time - a.time; });

            if (files.length > 0) {
              finalDestinationPath = files[0].name;
            }
          } catch (scanErr) {}

          Downloader._ensurePremiereCompatibility(finalDestinationPath, ffmpeg.path, preset, onProgress).then(function (validatedPath) {
            if (validatedPath) finalDestinationPath = validatedPath;

            if (onProgress) {
              onProgress({
                percent: 100,
                speed: "Pronto",
                eta: "00:00",
                size: "",
                status: "Download concluído com sucesso!"
              });
            }

            resolve({
              downloadId: downloadId,
              success: true,
              filePath: finalDestinationPath,
              title: options.title || (finalDestinationPath ? path.basename(finalDestinationPath) : "Mídia Baixada"),
              preset: preset,
              outputDir: outputDir
            });
          }).catch(function () {
            resolve({
              downloadId: downloadId,
              success: true,
              filePath: finalDestinationPath,
              title: options.title || (finalDestinationPath ? path.basename(finalDestinationPath) : "Mídia Baixada"),
              preset: preset,
              outputDir: outputDir
            });
          });
        });

        child.on("error", function (err) {
          delete activeDownloads[downloadId];
          reject(err);
        });
      });
    },

    _ensurePremiereCompatibility: function (filePath, ffmpegPath, preset, onProgress) {
      return new Promise(function (resolveComp) {
        if (!filePath || !fs.existsSync(filePath) || !ffmpegPath) {
          return resolveComp(filePath);
        }

        if (preset === "audio_wav" || preset === "audio_mp3" || preset === "thumbnail") {
          return resolveComp(filePath);
        }

        var inspectChild = child_process.spawn(ffmpegPath, ["-i", filePath], { windowsHide: true });
        var inspectOut = "";
        inspectChild.stderr.on("data", function (d) { inspectOut += d.toString("utf8"); });
        inspectChild.on("close", function () {
          var isVP9orAV1 = /Video:\s*(vp9|vp09|av1|av01|vp8|hevc|h265)/i.test(inspectOut);
          var isNonStandardAudio = /Audio:\s*(opus|vorbis|flac)/i.test(inspectOut);
          var isH264 = /Video:\s*h264/i.test(inspectOut);

          if (isH264 && !isNonStandardAudio && preset !== "prores") {
            return resolveComp(filePath);
          }

          if (onProgress) {
            onProgress({
              percent: 99,
              speed: "FFmpeg Turbo",
              eta: "00:02",
              size: "",
              status: "Otimizando compatibilidade de vídeo e áudio..."
            });
          }

          var dir = path.dirname(filePath);
          var ext = path.extname(filePath);
          var base = path.basename(filePath, ext);
          var tempOut = path.join(dir, base + "_h264_temp.mp4");

          var convArgs = ["-y", "-i", filePath];

          if (isH264 && isNonStandardAudio) {
            convArgs.push("-c:v", "copy", "-c:a", "aac", "-b:a", "320k", "-ar", "48000", "-movflags", "+faststart", tempOut);
          } else {
            convArgs.push(
              "-c:v", "libx264",
              "-crf", "17",
              "-preset", "ultrafast",
              "-threads", "0",
              "-pix_fmt", "yuv420p",
              "-c:a", "aac",
              "-b:a", "320k",
              "-ar", "48000",
              "-movflags", "+faststart",
              tempOut
            );
          }

          if (preset === "prores") {
            tempOut = path.join(dir, base + "_prores_temp.mov");
            convArgs = [
              "-y",
              "-i", filePath,
              "-c:v", "prores_ks",
              "-profile:v", "3",
              "-pix_fmt", "yuv422p10le",
              "-c:a", "pcm_s24le",
              "-ar", "48000",
              "-threads", "0",
              tempOut
            ];
          }

          var convChild = child_process.spawn(ffmpegPath, convArgs, { windowsHide: true });
          convChild.on("close", function (cCode) {
            if (cCode === 0 && fs.existsSync(tempOut) && fs.statSync(tempOut).size > 1000) {
              try {
                fs.unlinkSync(filePath);
                fs.renameSync(tempOut, filePath);
                return resolveComp(filePath);
              } catch (renErr) {
                return resolveComp(tempOut);
              }
            }
            resolveComp(filePath);
          });
          convChild.on("error", function () {
            resolveComp(filePath);
          });
        });
      });
    },

    cancelDownload: function (downloadId) {
      if (activeDownloads[downloadId]) {
        try {
          activeDownloads[downloadId].kill("SIGKILL");
        } catch (e) {}
        delete activeDownloads[downloadId];
        return true;
      }
      return false;
    }
  };

  window.Downloader = Downloader;
})(window);

/**
 * app.js - Main UI controller for MediaDownloader Pro CEP Extension
 */

(function (window, document) {
    "use strict";

    // DOM Elements
    var elUrlInput = document.getElementById("urlInput");
    var elBtnPaste = document.getElementById("btnPaste");
    var elInputPlatformIcon = document.getElementById("inputPlatformIcon");
    var elPreviewBox = document.getElementById("previewBox");
    var elPreviewThumb = document.getElementById("previewThumb");
    var elPreviewDuration = document.getElementById("previewDuration");
    var elPreviewTitle = document.getElementById("previewTitle");
    var elPreviewMeta = document.getElementById("previewMeta");
    var elPreviewPlatform = document.getElementById("previewPlatform");
    
    var elSelectPreset = document.getElementById("selectPreset");
    var elDefaultPreset = document.getElementById("selectDefaultPreset");
    var elToggleImportBin = document.getElementById("toggleImportBin");
    var elToggleInsertTimeline = document.getElementById("toggleInsertTimeline");
    var elBtnDownload = document.getElementById("btnDownload");
    
    var elProgressCard = document.getElementById("progressCard");
    var elProgressTitle = document.getElementById("progressTitle");
    var elProgressPercent = document.getElementById("progressPercent");
    var elProgressBarFill = document.getElementById("progressBarFill");
    var elProgressStatus = document.getElementById("progressStatus");
    var elProgressSpeed = document.getElementById("progressSpeed");
    var elProgressEta = document.getElementById("progressEta");
    var elBtnCancelDownload = document.getElementById("btnCancelDownload");
    
    var elHistoryList = document.getElementById("historyList");
    var elHistoryCount = document.getElementById("historyCount");
    var elBtnClearHistory = document.getElementById("btnClearHistory");
    var elSystemStatusDot = document.getElementById("systemStatusDot");
    
    var elBtnSettings = document.getElementById("btnSettings");
    var elBtnRefresh = document.getElementById("btnRefresh");
    var elModalSettings = document.getElementById("modalSettings");
    var elBtnCloseSettings = document.getElementById("btnCloseSettings");
    var elYtDlpStatus = document.getElementById("ytDlpStatus");
    var elFfmpegStatus = document.getElementById("ffmpegStatus");
    var elBtnInstallFfmpeg = document.getElementById("btnInstallFfmpeg");
    var elBtnUpdateYtDlp = document.getElementById("btnUpdateYtDlp");
    var elInputDownloadDir = document.getElementById("inputDownloadDir");
    var elInputBinName = document.getElementById("inputBinName");
    var elInputCookiesPath = document.getElementById("inputCookiesPath");
    var elFileCookiesPicker = document.getElementById("fileCookiesPicker");
    var elBtnSaveSettings = document.getElementById("btnSaveSettings");
    var elToastContainer = document.getElementById("toastContainer");

    // State
    var currentMetadata = null;
    var currentDownloadId = null;
    var isFetchingMeta = false;
    var isDownloading = false;
    var downloadGeneration = 0;
    var historyItems = [];

    // ==========================================
    // 1. TOAST NOTIFICATIONS
    // ==========================================
    function showToast(message, type) {
        if (!elToastContainer) return;
        var toast = document.createElement("div");
        toast.className = "toast " + (type || "info");
        toast.textContent = message;
        elToastContainer.appendChild(toast);

        setTimeout(function () {
            toast.style.opacity = "0";
            toast.style.transform = "translateY(8px)";
            toast.style.transition = "all 0.2s ease";
            setTimeout(function () {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 200);
        }, 3200);
    }

    // ==========================================
    // 2. INITIALIZATION & SYSTEM CHECK
    // ==========================================
    var isAfterEffects = window.Bridge && window.Bridge.hostId === "AEFT";
    var hostName = isAfterEffects ? "After Effects" : "Premiere Pro";
    var folderTerm = isAfterEffects ? "na pasta" : "no bin";
    function configureHostUI() {
        if (isAfterEffects) {
            document.getElementById("hostImportLabel").textContent = "Importar no projeto";
            document.getElementById("hostInsertLabel").textContent = "Inserir na composição";
            document.getElementById("hostFolderLabel").textContent = "Pasta no projeto do After Effects";
            elToggleImportBin.closest("label").title = "Importa para uma pasta no painel Projeto";
            elToggleInsertTimeline.closest("label").title = "Cria uma nova camada na composição ativa, no tempo atual, sem alterar as camadas existentes";
        }
    }
    function init() {
        configureHostUI();
        loadSettings();
        loadHistory();
        checkEnvironment();
        setupEventListeners();
    }

    var elEngineCard = document.getElementById("engineCard");
    var elEngineCardText = document.getElementById("engineCardText");
    var elBtnInstallEngines = document.getElementById("btnInstallEngines");
    var elEncoderStatus = document.getElementById("encoderStatus");
    var lastStatus = null;

    var ENCODER_NAMES = {
        h264_nvenc: "GPU NVIDIA (NVENC)",
        h264_amf: "GPU AMD (AMF)",
        h264_videotoolbox: "VideoToolbox (Apple)",
        libx264: "Processador (x264)"
    };

    function checkEnvironment() {
        return window.BinManager.getStatus().then(function (status) {
            lastStatus = status;
            if (elYtDlpStatus) {
                elYtDlpStatus.textContent = status.ytdlp.found ? (status.ytdlp.version || "Pronto") : "Não encontrado";
                elYtDlpStatus.style.color = status.ytdlp.found ? "var(--accent-emerald)" : "var(--accent-rose)";
            }
            if (elFfmpegStatus) {
                elFfmpegStatus.textContent = status.ffmpeg.found ? (status.ffmpeg.version || "Pronto") : "Não encontrado";
                elFfmpegStatus.style.color = status.ffmpeg.found ? "var(--accent-emerald)" : "var(--accent-rose)";
            }
            if (elEncoderStatus) {
                if (status.ffmpeg.found) {
                    window.Downloader.detectEncoder().then(function (enc) {
                        elEncoderStatus.textContent = ENCODER_NAMES[enc] || enc;
                        elEncoderStatus.style.color = "var(--text-secondary)";
                    });
                } else {
                    elEncoderStatus.textContent = "--";
                }
            }

            if (elEngineCard) {
                var missing = [];
                if (!status.ytdlp.found) missing.push("yt-dlp");
                if (!status.ffmpeg.found) missing.push("FFmpeg");
                if (missing.length) {
                    elEngineCardText.innerHTML = "Falta <b>" + missing.join(" e ") + "</b> para baixar. " +
                        "Instale aqui (~" + (status.ffmpeg.found ? "18" : "160") + " MB, uma vez) ou instale o app Desktop do Media Downloader, que a extensão usa automaticamente.";
                    elEngineCard.className = "engine-card active";
                } else {
                    elEngineCard.className = "engine-card";
                }
            }

            if (elSystemStatusDot) {
                var color = status.ready ? "var(--accent-emerald)" : "var(--accent-amber)";
                elSystemStatusDot.style.background = color;
                elSystemStatusDot.style.boxShadow = "0 0 8px " + color;
                elSystemStatusDot.title = status.ready ? "Motores prontos" : "Faltam motores de download";
            }
            return status;
        });
    }

    /** Instala o que faltar: yt-dlp primeiro, depois FFmpeg. */
    function installEngines() {
        if (!lastStatus) return;
        elBtnInstallEngines.disabled = true;
        var chain = Promise.resolve();
        if (!lastStatus.ytdlp.found) {
            chain = chain.then(function () {
                return window.BinManager.downloadStandaloneYtDlp(function (pct) {
                    elBtnInstallEngines.textContent = "Baixando yt-dlp: " + pct + "%";
                });
            });
        }
        if (!lastStatus.ffmpeg.found) {
            chain = chain.then(function () {
                return window.BinManager.downloadStandaloneFfmpeg(function (pct, nome, i, total) {
                    elBtnInstallEngines.textContent = "Baixando " + nome + " (" + i + "/" + total + "): " + pct + "%";
                });
            });
        }
        chain.then(function () {
            showToast("Motores instalados.", "success");
        }).catch(function (err) {
            showToast("Falha ao instalar: " + err.message, "error");
        }).then(function () {
            elBtnInstallEngines.disabled = false;
            elBtnInstallEngines.textContent = "Instalar motores";
            checkEnvironment();
        });
    }

    function validDefaultPreset(value) {
      return elDefaultPreset && Array.prototype.some.call(elDefaultPreset.options, function (option) { return option.value === value; }) ? value : "best";
    }

    function loadDefaultPreset() {
      var preset = validDefaultPreset(localStorage.getItem("mediadownloader_default_preset"));
      if (elDefaultPreset) elDefaultPreset.value = preset;
      document.querySelectorAll(".custom-select-wrapper").forEach(function (wrapper) {
        var input = wrapper.querySelector('input[type="hidden"]');
        var selected = wrapper.querySelector('.select-option[data-value="' + preset + '"]');
        if (!input || !selected) return;
        input.value = preset;
        wrapper.querySelector(".opt-label").textContent = selected.getAttribute("data-label");
        wrapper.querySelectorAll(".select-option").forEach(function (option) { option.classList.toggle("active", option === selected); });
        var currentIcon = wrapper.querySelector(".custom-select-trigger .opt-icon");
        var selectedIcon = selected.querySelector(".opt-icon");
        if (currentIcon && selectedIcon) currentIcon.innerHTML = selectedIcon.innerHTML;
      });
    }

    function loadSettings() {
      loadDefaultPreset();
        var savedDir = localStorage.getItem("mediadownloader_download_dir");
        if (elInputDownloadDir) {
            elInputDownloadDir.value = savedDir || window.Downloader.getDefaultDownloadDir();
        }

        var savedBinName = localStorage.getItem("mediadownloader_bin_name");
        if (elInputBinName) {
            elInputBinName.value = savedBinName || "_Downloads";
        }

        var savedCookies = localStorage.getItem("mediadownloader_cookies_path");
        if (elInputCookiesPath) {
            elInputCookiesPath.value = savedCookies || "";
        }

        var savedBin = localStorage.getItem("mediadownloader_import_bin");
        if (elToggleImportBin) {
            elToggleImportBin.checked = savedBin !== null ? (savedBin === "true") : true;
        }

        var savedTimeline = localStorage.getItem("mediadownloader_insert_timeline");
        if (elToggleInsertTimeline) {
            elToggleInsertTimeline.checked = savedTimeline !== null ? (savedTimeline === "true") : true;
        }
    }

    function saveSettings() {
      if (elDefaultPreset) localStorage.setItem("mediadownloader_default_preset", validDefaultPreset(elDefaultPreset.value));
        if (elInputDownloadDir) {
            localStorage.setItem("mediadownloader_download_dir", elInputDownloadDir.value.trim());
        }
        if (elInputBinName) {
            localStorage.setItem("mediadownloader_bin_name", elInputBinName.value.trim() || "_Downloads");
        }
        if (elInputCookiesPath) {
            localStorage.setItem("mediadownloader_cookies_path", elInputCookiesPath.value.trim());
        }
        if (elToggleImportBin) {
            localStorage.setItem("mediadownloader_import_bin", elToggleImportBin.checked ? "true" : "false");
        }
        if (elToggleInsertTimeline) {
            localStorage.setItem("mediadownloader_insert_timeline", elToggleInsertTimeline.checked ? "true" : "false");
        }
        showToast("Configurações salvas!", "success");
        closeSettings();
    }

    // ==========================================
    // 3. CLIPBOARD & URL INPUT HANDLING
    // ==========================================
    function handlePasteClick() {
        if (elUrlInput) {
            elUrlInput.focus();
            try {
                var pasted = document.execCommand("paste");
                if (pasted && elUrlInput.value && (elUrlInput.value.startsWith("http://") || elUrlInput.value.startsWith("https://"))) {
                    handleUrlChange(elUrlInput.value.trim());
                    return;
                }
            } catch (e) {}
        }

        window.Bridge.readClipboard().then(function (text) {
            if (text && (text.startsWith("http://") || text.startsWith("https://"))) {
                if (elUrlInput) elUrlInput.value = text.trim();
                handleUrlChange(text.trim());
            } else if (text) {
                if (elUrlInput) elUrlInput.value = text.trim();
                showToast("Texto colado da área de transferência.", "info");
            } else {
                showToast("Nenhum link encontrado na área de transferência.", "info");
            }
        }).catch(function () {
            showToast("Nenhum link encontrado na área de transferência.", "info");
        });
    }

    var debounceTimer = null;
    function handleUrlInput() {
        var url = elUrlInput.value.trim();
        clearTimeout(debounceTimer);
        if (!url || (!url.startsWith("http://") && !url.startsWith("https://"))) {
            hidePreview();
            return;
        }

        debounceTimer = setTimeout(function () {
            handleUrlChange(url);
        }, 400);
    }

    var singlePlaylistPending='';
    function handleUrlChange(url) {
      if(window.MediaCollections&&window.MediaCollections.playlistUrl(url)){clearTimeout(debounceTimer);if(singlePlaylistPending===url)return;singlePlaylistPending=url;window.MediaCollections.askPlaylist(elUrlInput.closest('.input-capsule')||elUrlInput,url).then(async function(choice){if(elUrlInput.value.trim()!==url)return;if(choice==='playlist'){if(window.CepCollectionUI)window.CepCollectionUI.openPlaylist(url);}else if(choice==='video'){var links=await window.MediaCollections.expandLinks(url,{choose:async function(){return 'video';}});if(links[0]){elUrlInput.value=links[0];handleUrlChange(links[0]);}}}).catch(function(e){showToast(e.message,'error');}).finally(function(){singlePlaylistPending='';});return;}

    var thumbnailLink = String(url || "").match(/^https?:\/\/(?:i|img)\.ytimg\.com\/(?:vi|vi_webp)\/([A-Za-z0-9_-]{11})(?:\/|$)/i);
    if (thumbnailLink) { url = "https://www.youtube.com/watch?v=" + thumbnailLink[1]; if (elUrlInput) elUrlInput.value = url; }
        if (!url || (!url.startsWith("http://") && !url.startsWith("https://"))) return;

        var platform = window.Downloader.detectPlatform(url);
        var instant = window.Downloader.getInstantPreview(url);

        // Atualiza o ícone da plataforma no campo de input
        if (elInputPlatformIcon) {
            if (platform.id === "youtube" || platform.id === "youtube_shorts") {
                elInputPlatformIcon.innerHTML = '<svg viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>';
                elInputPlatformIcon.style.color = "#ff0000";
            } else if (platform.id === "instagram" || platform.id === "instagram_reels") {
                elInputPlatformIcon.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>';
                elInputPlatformIcon.style.color = "#f97316";
            } else if (platform.id === "tiktok") {
                elInputPlatformIcon.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>';
                elInputPlatformIcon.style.color = "#ffb020";
            } else {
                elInputPlatformIcon.innerHTML = '<svg viewBox="0 0 24 24"><path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/></svg>';
                elInputPlatformIcon.style.color = "var(--accent-cyan)";
            }
        }

        // ETAPA 1: Exibe Thumbnail Instantânea (0ms) imediatamente ao colar/digitar o link
        if (instant && instant.thumbnail) {
            currentMetadata = instant;
            displayPreview(instant);
        } else {
            showPreviewLoading(platform, url);
        }

        // ETAPA 2: Busca metadados refinados em segundo plano sem travar a interface
        isFetchingMeta = true;
        window.Downloader.fetchMetadata(url, function (quick) {
            if (elUrlInput.value.trim() !== url) return;
            if (!currentMetadata || currentMetadata.isInstant) {
                currentMetadata = quick;
                displayPreview(quick);
            }
        }).then(function (meta) {
            isFetchingMeta = false;
            if (elUrlInput.value.trim() !== url) return;
            currentMetadata = meta;
            displayPreview(meta);
        }).catch(function (err) {
            isFetchingMeta = false;
            if (!currentMetadata || !currentMetadata.thumbnail) {
                currentMetadata = instant || {
                    url: url,
                    title: "Mídia Online (" + platform.name + ")",
                    uploader: platform.name,
                    durationFormatted: "--:--",
                    thumbnail: "",
                    platform: platform
                };
                displayPreview(currentMetadata);
            }
        });
    }

    function showPreviewLoading(platform, url) {
        elPreviewBox.className = "preview-box active";
        elPreviewThumb.src = "";
        elPreviewDuration.textContent = "--:--";
        elPreviewTitle.textContent = "Obtendo dados do vídeo...";
        elPreviewMeta.textContent = "Conectando ao " + platform.name + "...";
        elPreviewPlatform.textContent = platform.badge || platform.name;
        elPreviewPlatform.style.background = platform.color;
        elPreviewPlatform.style.color = "#ffffff";
    }

    function displayPreview(meta) {
        if(window.MediaInfo)window.MediaInfo.render(document.getElementById("mediaDetails"),meta.technical||window.MediaInfo.source({title:meta.title,uploader:meta.uploader}),"icons/editors/");
        elPreviewBox.className = "preview-box active";
        if (meta.thumbnail) {
            if (window.MediaThumbnails) window.MediaThumbnails.set(elPreviewThumb, { url: meta.url || elUrlInput.value, thumbnail: meta.thumbnail });
            else elPreviewThumb.src = meta.thumbnail;
            elPreviewThumb.style.display = "block";
        } else {
            elPreviewThumb.style.display = "none";
        }
        elPreviewDuration.textContent = meta.durationFormatted || "--:--";
        elPreviewTitle.textContent = meta.title || "Mídia sem título";
        elPreviewMeta.textContent = meta.uploader || meta.platform.name;
        elPreviewPlatform.textContent = meta.platform.badge || meta.platform.name;
        elPreviewPlatform.style.background = meta.platform.color;
        elPreviewPlatform.style.color = "#ffffff";
    }

    function hidePreview() {
        elPreviewBox.className = "preview-box";
        currentMetadata = null;
        if (elInputPlatformIcon) {
            elInputPlatformIcon.innerHTML = '<svg viewBox="0 0 24 24"><path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/></svg>';
            elInputPlatformIcon.style.color = "var(--text-dim)";
        }
    }

    // ==========================================
    // 4. DOWNLOAD ORCHESTRATION
    // ==========================================
    function startDownload() {
        if(singlePlaylistPending){showToast("Escolha este vídeo ou a playlist antes de baixar.","info");return;}
        var url = elUrlInput.value.trim();
        if (!url || (!url.startsWith("http://") && !url.startsWith("https://"))) {
            showToast("Cole um link válido para iniciar o download.", "error");
            elUrlInput.focus();
            return;
        }
        if (isDownloading) {
            showToast("Um download já está em andamento.", "info");
            return;
        }
        if (lastStatus && !lastStatus.ready) {
            showToast("Instale os motores antes de baixar (aviso no topo do painel).", "error");
            return;
        }

        isDownloading = true;
        var generation = ++downloadGeneration;
        elBtnDownload.disabled = true;
        elProgressCard.className = "progress-card active";
        elProgressTitle.textContent = currentMetadata && !currentMetadata.isInstant ? currentMetadata.title : "Preparando...";
        elProgressPercent.textContent = "0%";
        elProgressBarFill.style.width = "0%";
        elProgressStatus.textContent = "Localizando a pasta do projeto...";
        elProgressSpeed.textContent = "--";
        elProgressEta.textContent = "";
        elBtnCancelDownload.textContent = "Cancelar";

        var preset = elSelectPreset ? elSelectPreset.value : "best";
        var meta = currentMetadata;

        // Projeto salvo: grava em <pasta do projeto>/<bin>. Sem projeto: pasta das Configurações.
        return window.Bridge.getProjectInfo().then(function (info) {
            return info && info.projectFolder ? info.projectFolder : null;
        }, function () {
            return null;
        }).then(function (projectFolder) {
            if (generation !== downloadGeneration) throw new Error("Download cancelado");
            var job = window.Downloader.startDownload({
                url: url,
                preset: preset,
                outputDir: window.Downloader.getDefaultDownloadDir(projectFolder),
                title: meta && !meta.isInstant ? meta.title : null,
                id: meta && meta.id ? meta.id : null
            }, function (progress) {
                if (generation !== downloadGeneration) return;
                if (progress.percent !== undefined) {
                    elProgressPercent.textContent = Math.round(progress.percent) + "%";
                    elProgressBarFill.style.width = Math.min(progress.percent, 100) + "%";
                }
                if (progress.status) elProgressStatus.textContent = progress.status;
                elProgressSpeed.textContent = progress.speed || "";
                elProgressEta.textContent = progress.eta && progress.eta !== "--" ? "faltam " + progress.eta : "";
            }, function (statusMsg) {
                if (generation !== downloadGeneration) return;
                elProgressStatus.textContent = statusMsg;
            });
            currentDownloadId = job.downloadId;
            return job;
        }).then(function (result) {
            if (generation !== downloadGeneration) return;
            return Promise.resolve(handlePostDownload(result, meta)).then(function(){finishDownloadState();return result;});
        }).catch(function (err) {
            if (generation !== downloadGeneration) return;
            var cancelled = /cancelado/i.test(err.message);
            finishDownloadState();
            if (cancelled) {
                elProgressCard.className = "progress-card";
                return;
            }
            elProgressCard.className = "progress-card active error";
            elBtnCancelDownload.textContent = "Fechar";
            elProgressStatus.textContent = err.message;
            elProgressSpeed.textContent = "";
            elProgressEta.textContent = "";
            showToast("Falha no download: " + err.message, "error");
        });
    }

    function finishDownloadState() {
        isDownloading = false;
        currentDownloadId = null;
        elBtnDownload.disabled = false;
    }

    function handlePostDownload(result, meta) {
        var filePath = result.filePath;
        if(window.Downloader.inspectFile)window.Downloader.inspectFile(filePath).then(function(info){if(window.MediaInfo)window.MediaInfo.render(document.getElementById("mediaDetails"),window.MediaInfo.probe(info,filePath.split(/[\\/]/).pop()),"icons/editors/");}).catch(function(){});
        if (!filePath) return;
        var delivery=Promise.resolve();

        var binName = localStorage.getItem("mediadownloader_bin_name") || "_Downloads";
        var shouldInsert = elToggleInsertTimeline ? elToggleInsertTimeline.checked : true;
        var shouldImport = elToggleImportBin ? elToggleImportBin.checked : true;
        var fileName = filePath.split(/[\\/]/).pop();

        // Inserir na timeline exige importar; "Importar no bin" sozinho so importa.
        if (shouldInsert) {
            delivery=window.Bridge.insertMediaToTimeline(filePath, binName).then(function (res) {
                showToast(res && res.inserted ? "Inserido " + (isAfterEffects ? "na composição e na pasta " : "na timeline e no bin ") + binName + "." :
                    "Importado " + folderTerm + " " + binName + ". " + ((res && (res.note || res.warning)) || ""), "success");
            }).catch(function (err) {
                showToast("Baixado, mas o " + hostName + " recusou a importação: " + err.message, "error");
            });
        } else if (shouldImport) {
            delivery=window.Bridge.importMediaFile(filePath, binName).then(function () {
                showToast("Importado " + folderTerm + " " + binName + ".", "success");
            }).catch(function (err) {
                showToast("Baixado, mas o " + hostName + " recusou a importação: " + err.message, "error");
            });
        } else {
            showToast("Salvo em " + result.outputDir, "success");
        }

        addToHistory({
            id: "hist_" + Date.now(),
            title: result.title || fileName,
            filePath: filePath,
            preset: result.preset,
            thumbnail: meta ? meta.thumbnail : "",
            platform: meta ? meta.platform : window.Downloader.detectPlatform(""),
            timestamp: Date.now()
        });

        elUrlInput.value = "";
        hidePreview();
        elProgressStatus.textContent = "Concluído: " + fileName;
        setTimeout(function () {
            if (!isDownloading) {
                elProgressCard.className = "progress-card";
                elProgressBarFill.style.width = "0%";
            }
        }, 4000);
        return delivery;
    }

    function cancelDownload() {
        downloadGeneration++;
        if (currentDownloadId) {
            window.Downloader.cancelDownload(currentDownloadId);
        }
        finishDownloadState();
        elProgressCard.className = "progress-card";
        showToast("Download cancelado.", "info");
    }

    // ==========================================
    // 5. HISTORY & DRAG-AND-DROP
    // ==========================================
    function loadHistory() {
        try {
            var raw = localStorage.getItem("mediadownloader_history");
            var parsed = raw ? JSON.parse(raw) : [];
            historyItems = Array.isArray(parsed) ? parsed.filter(function (item) { return item && typeof item === "object" && typeof item.filePath === "string"; }).slice(0, 50) : [];
        } catch (e) {
            historyItems = [];
        }
        renderHistory();
    }

    function saveHistory() {
        try {
            localStorage.setItem("mediadownloader_history", JSON.stringify(historyItems.slice(0, 50)));
        } catch (e) {}
    }

    function addToHistory(item) {
        historyItems.unshift(item);
        if (historyItems.length > 50) historyItems.pop();
        saveHistory();
        renderHistory();
    }

    function removeFromHistory(id, e) {
        if (e) e.stopPropagation();
        historyItems = historyItems.filter(function (it) { return it.id !== id; });
        saveHistory();
        renderHistory();
    }

    function clearHistory() {
        historyItems = [];
        saveHistory();
        renderHistory();
        showToast("Histórico limpo.", "info");
    }

    function renderHistory() {
        if (!elHistoryList) return;
        elHistoryList.innerHTML = "";
        if (elHistoryCount) elHistoryCount.textContent = historyItems.length;

        if (historyItems.length === 0) {
            elHistoryList.innerHTML = '\
                <div class="empty-history">\
                    <svg viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>\
                    <div style="font-weight:700;">Nenhum download recente</div>\
                    <div style="font-size:9px; color:var(--text-dim)">Os vídeos baixados aparecerão aqui com suporte a arrastar para a Timeline ou Projeto.</div>\
                </div>';
            return;
        }

        historyItems.forEach(function (item) {
            var card = document.createElement("div");
            card.className = "history-item";
            card.setAttribute("draggable", "true");
            card.title = "Arrastar para o painel de Projeto: " + item.filePath;

            // Drag-and-Drop Nativo do Adobe CEP
            card.addEventListener("dragstart", function (e) {
                if (item.filePath) {
                    e.dataTransfer.setData("com.adobe.cep.dnd.file.0", typeof process !== "undefined" && process.platform === "win32" ? item.filePath.replace(/\//g, "\\") : item.filePath);
                }
            });

            // External metadata must never become markup or event-handler attributes.
            var thumbHtml = '<div class="history-thumb" style="display:flex;align-items:center;justify-content:center;color:#666;"><svg style="width:14px;height:14px;fill:currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></div>';
            var badges = { best: "Máxima · MP4", "4320p": "Até 8K", "2160p": "Até 4K", "1440p": "Até 1440p", "1080p": "Até 1080p", "720p": "Até 720p", "480p": "Até 480p", "360p": "Até 360p", prores: "ProRes 422 HQ", audio_wav: "WAV 24-bit", audio_flac: "FLAC", audio_mp3: "MP3", audio_m4a: "M4A", audio_original: "Áudio original", thumbnail: "PNG" };
            var badgeText = badges[item.preset] || "Mídia";

            card.innerHTML = '\
                ' + thumbHtml + '\
                <div class="history-info">\
                    <div class="history-title">' + escapeHtml(item.title) + '</div>\
                    <div class="history-sub">\
                        <span class="platform-pill ' + (item.platform ? String(item.platform.id || "x").replace(/[^a-z0-9_-]/gi, "") : "x") + '" style="font-size:8px; padding:1px 4px;">' + escapeHtml(item.platform ? item.platform.badge || item.platform.name : "Vídeo") + '</span>\
                        <span class="history-format-badge">' + badgeText + '</span>\
                    </div>\
                </div>\
                <div class="history-actions">\
                    <button class="action-btn-3d btn-timeline" title="Inserir no tempo atual do editor">\
                        <svg viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>\
                    </button>\
                    <button class="action-btn-3d btn-folder" title="Mostrar o arquivo na pasta">\
                        <svg viewBox="0 0 24 24"><path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></svg>\
                    </button>\
                    <button class="action-btn-3d btn-copy" title="Copiar caminho do arquivo">\
                        <svg viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>\
                    </button>\
                    <button class="action-btn-3d btn-delete" title="Remover do histórico">\
                        <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>\
                    </button>\
                </div>';

            if (typeof item.thumbnail === "string" && /^(https?:\/\/|file:\/\/\/)/i.test(item.thumbnail)) {
                var thumbnail = document.createElement("img");
                thumbnail.className = "history-thumb";
                thumbnail.alt = "Capa da mídia";
                thumbnail.src = item.thumbnail;
                var placeholder = card.querySelector(".history-thumb");
                placeholder.parentNode.replaceChild(thumbnail, placeholder);
            }

            var btnInsert = card.querySelector(".btn-timeline");
            btnInsert.addEventListener("click", function (e) {
                e.stopPropagation();
                var hb = localStorage.getItem("mediadownloader_bin_name") || "_Downloads";
                window.Bridge.insertMediaToTimeline(item.filePath, hb).then(function (res) {
                    showToast(res && res.inserted ? isAfterEffects ? "Inserido na composição." : "Inserido na timeline." : "Importado " + folderTerm + " " + hb + " (sem destino ativo).", "success");
                }).catch(function (err) {
                    showToast("Erro ao inserir: " + err.message, "error");
                });
            });

            var btnFolder = card.querySelector(".btn-folder");
            btnFolder.addEventListener("click", function (e) {
                e.stopPropagation();
                window.Bridge.openFolder(item.filePath);
            });

            var btnCopy = card.querySelector(".btn-copy");
            btnCopy.addEventListener("click", function (e) {
                e.stopPropagation();
                window.Bridge.copyToClipboard(item.filePath).then(function () {
                    showToast("Caminho copiado para a área de transferência!", "success");
                });
            });

            var btnDelete = card.querySelector(".btn-delete");
            btnDelete.addEventListener("click", function (e) {
                removeFromHistory(item.id, e);
            });

            elHistoryList.appendChild(card);
        });
    }

    function escapeHtml(str) {
        if (!str) return "";
        return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }

    // ==========================================
    // 6. SETTINGS MODAL & BINARY UPDATER
    // ==========================================
    function openSettings() {
        if (elModalSettings) elModalSettings.className = "modal-backdrop active";
        checkEnvironment();
    }

    function closeSettings() {
        if (elModalSettings) elModalSettings.className = "modal-backdrop";
    }

    function updateYtDlp() {
        if (elBtnUpdateYtDlp) elBtnUpdateYtDlp.disabled = true;
        showToast("Baixando yt-dlp atualizado do GitHub...", "info");

        window.BinManager.downloadStandaloneYtDlp(function (pct) {
            if (elYtDlpStatus) elYtDlpStatus.textContent = "Baixando: " + pct + "%";
        }).then(function (res) {
            if (elBtnUpdateYtDlp) elBtnUpdateYtDlp.disabled = false;
            showToast("yt-dlp instalado com sucesso na extensão!", "success");
            checkEnvironment();
        }).catch(function (err) {
            if (elBtnUpdateYtDlp) elBtnUpdateYtDlp.disabled = false;
            showToast("Erro ao baixar yt-dlp: " + err.message, "error");
            checkEnvironment();
        });
    }

    function installFfmpeg() {
        if (elBtnInstallFfmpeg) elBtnInstallFfmpeg.disabled = true;
        showToast("Baixando FFmpeg e ffprobe (cerca de 160 MB)...", "info");

        window.BinManager.downloadStandaloneFfmpeg(function (pct, nome, i, total) {
            if (elFfmpegStatus) {
                elFfmpegStatus.textContent = "Baixando " + nome + " (" + i + "/" + total + "): " + pct + "%";
            }
        }).then(function () {
            if (elBtnInstallFfmpeg) elBtnInstallFfmpeg.disabled = false;
            showToast("FFmpeg instalado na extensão!", "success");
            checkEnvironment();
        }).catch(function (err) {
            if (elBtnInstallFfmpeg) elBtnInstallFfmpeg.disabled = false;
            showToast("Erro ao baixar FFmpeg: " + err.message, "error");
            checkEnvironment();
        });
    }

    // ==========================================
    // 7. EVENT LISTENERS SETUP
    // ==========================================
    function setupEventListeners() {
        if (elBtnPaste) elBtnPaste.addEventListener("click", handlePasteClick);
        if (elBtnInstallFfmpeg) elBtnInstallFfmpeg.addEventListener("click", installFfmpeg);
        if (elBtnInstallEngines) elBtnInstallEngines.addEventListener("click", installEngines);
        if (elUrlInput) elUrlInput.addEventListener("input", handleUrlInput);
        if (elBtnDownload) elBtnDownload.addEventListener("click", startDownload);
        if (elBtnCancelDownload) elBtnCancelDownload.addEventListener("click", cancelDownload);

        if (elBtnSettings) elBtnSettings.addEventListener("click", openSettings);
        if (elBtnCloseSettings) elBtnCloseSettings.addEventListener("click", closeSettings);
        if (elBtnSaveSettings) elBtnSaveSettings.addEventListener("click", saveSettings);
        if (elBtnUpdateYtDlp) elBtnUpdateYtDlp.addEventListener("click", updateYtDlp);
        if (elBtnClearHistory) elBtnClearHistory.addEventListener("click", clearHistory);
        if (elBtnRefresh) elBtnRefresh.addEventListener("click", function () {
            checkEnvironment();
            showToast("Verificando ambiente e atualizações...", "info");
            if (window.AscencioUpdater) {
                window.AscencioUpdater.checkNow();
            }
        });

        if (elFileCookiesPicker) {
            elFileCookiesPicker.addEventListener("change", function (e) {
                if (e.target.files && e.target.files.length > 0) {
                    var f = e.target.files[0];
                    if (f.path) {
                        if (elInputCookiesPath) elInputCookiesPath.value = f.path;
                    } else if (f.name) {
                        if (elInputCookiesPath) elInputCookiesPath.value = f.name;
                    }
                }
            });
        }

        // Custom 3D Select Dropdown (Zero Emojis)
        var customSelectWrapper = document.getElementById("customSelectWrapper");
        var customSelectTrigger = document.getElementById("customSelectTrigger");
        var currentOptionLabel = document.getElementById("currentOptionLabel");
        var selectOptions = document.querySelectorAll(".select-option");

        if (customSelectTrigger && customSelectWrapper) {
            customSelectTrigger.addEventListener("click", function (e) {
                e.stopPropagation();
                customSelectWrapper.classList.toggle("open");
                customSelectTrigger.setAttribute("aria-expanded", customSelectWrapper.classList.contains("open") ? "true" : "false");
            });

            for (var i = 0; i < selectOptions.length; i++) {
                (function (opt) {
                    opt.addEventListener("click", function (e) {
                        e.stopPropagation();
                        var val = opt.getAttribute("data-value");
                        var label = opt.getAttribute("data-label");
                        if (elSelectPreset) elSelectPreset.value = val;
                        if (currentOptionLabel) currentOptionLabel.textContent = label;

                        var optIcon = opt.querySelector(".opt-icon");
                        var currentIcon = customSelectTrigger.querySelector(".select-current-option .opt-icon");
                        if (optIcon && currentIcon) {
                            currentIcon.innerHTML = optIcon.innerHTML;
                        }

                        for (var j = 0; j < selectOptions.length; j++) {
                            selectOptions[j].classList.remove("active");
                        }
                        opt.classList.add("active");
                        customSelectWrapper.classList.remove("open");
                        customSelectTrigger.setAttribute("aria-expanded", "false");
                    });
                })(selectOptions[i]);
            }

            document.addEventListener("click", function () {
                customSelectWrapper.classList.remove("open");
                customSelectTrigger.setAttribute("aria-expanded", "false");
            });
        }

        if (elUrlInput) {
            elUrlInput.addEventListener("keydown", function (e) {
                if (e.key === "Enter") {
                    e.preventDefault();
                    startDownload();
                }
            });
        }

        window.addEventListener("focus", function () {
            if (!elUrlInput.value.trim() && !isDownloading) {
                // Leitura barata: sem abrir PowerShell a cada vez que o painel ganha foco.
                window.Bridge.readClipboard(true).then(function (text) {
                    if (text && (text.startsWith("http://") || text.startsWith("https://"))) {
                        var platform = window.Downloader.detectPlatform(text);
                        if (platform.id !== "web" && platform.id !== "unknown") {
                            elUrlInput.value = text.trim();
                            handleUrlChange(text.trim());
                        }
                    }
                }).catch(function () {});
            }
        });
    }

    window.CepCollectionHost={busy:function(){return isDownloading;},cancel:cancelDownload,download:function(item){elUrlInput.value=item.url;currentMetadata=item;return startDownload();}};
    document.addEventListener("DOMContentLoaded", init);
})(window, document);

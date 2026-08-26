/**
 * app.js - Main UI Controller for MediaDownloader Desktop
 */

(function (window, document) {
  "use strict";

  // Elements: Window Controls
  var elBtnWinMinimize = document.getElementById("btnWinMinimize");
  var elBtnWinMaximize = document.getElementById("btnWinMaximize");
  var elBtnWinClose = document.getElementById("btnWinClose");
  var elSystemStatusDot = document.getElementById("systemStatusDot");

  // Elements: Directory Bar
  var elCurrentDownloadDirPath = document.getElementById("currentDownloadDirPath");
  var elBtnChangeDir = document.getElementById("btnChangeDir");
  var elBtnOpenCurrentDir = document.getElementById("btnOpenCurrentDir");

  // Elements: Tabs
  var navTabs = document.querySelectorAll(".nav-tab");
  var tabContents = document.querySelectorAll(".tab-content");

  // Elements: Single Video Tab
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
  var elCustomSelectWrapper = document.getElementById("customSelectWrapper");
  var elCustomSelectTrigger = document.getElementById("customSelectTrigger");
  var elCurrentOptionLabel = document.getElementById("currentOptionLabel");
  var elCustomSelectDropdown = document.getElementById("customSelectDropdown");
  var elBtnDownload = document.getElementById("btnDownload");

  // Elements: Playlist Tab
  var elPlaylistUrlInput = document.getElementById("playlistUrlInput");
  var elBtnIndexPlaylist = document.getElementById("btnIndexPlaylist");
  var elPlaylistContainer = document.getElementById("playlistContainer");
  var elPlaylistTitle = document.getElementById("playlistTitle");
  var elPlaylistStats = document.getElementById("playlistStats");
  var elBtnToggleSelectAll = document.getElementById("btnToggleSelectAll");
  var elBtnDownloadPlaylist = document.getElementById("btnDownloadPlaylist");
  var elSelectedCountBadge = document.getElementById("selectedCountBadge");
  var elPlaylistItemsList = document.getElementById("playlistItemsList");

  // Elements: Batch Tab
  var elBatchTextarea = document.getElementById("batchTextarea");
  var elBatchCountLabel = document.getElementById("batchCountLabel");
  var elBtnStartBatch = document.getElementById("btnStartBatch");

  // Elements: Progress Card
  var elProgressCard = document.getElementById("progressCard");
  var elProgressTitle = document.getElementById("progressTitle");
  var elProgressPercent = document.getElementById("progressPercent");
  var elProgressBarFill = document.getElementById("progressBarFill");
  var elProgressStatus = document.getElementById("progressStatus");
  var elProgressSpeed = document.getElementById("progressSpeed");
  var elProgressEta = document.getElementById("progressEta");
  var elBtnCancelDownload = document.getElementById("btnCancelDownload");

  // Elements: History
  var elHistoryList = document.getElementById("historyList");
  var elHistoryCount = document.getElementById("historyCount");
  var elBtnClearHistory = document.getElementById("btnClearHistory");

  // Elements: Settings Modal
  var elBtnOpenSettings = document.getElementById("btnOpenSettings");
  var elModalSettings = document.getElementById("modalSettings");
  var elBtnCloseSettings = document.getElementById("btnCloseSettings");
  var elInputSettingDownloadDir = document.getElementById("inputSettingDownloadDir");
  var elBtnBrowseSettingDir = document.getElementById("btnBrowseSettingDir");
  var elInputCookiesPath = document.getElementById("inputCookiesPath");
  var elBtnBrowseCookies = document.getElementById("btnBrowseCookies");
  var elYtDlpStatus = document.getElementById("ytDlpStatus");
  var elFfmpegStatus = document.getElementById("ffmpegStatus");
  var elAria2Status = document.getElementById("aria2Status");
  var elBtnUpdateYtDlp = document.getElementById("btnUpdateYtDlp");
  var elBtnSaveSettings = document.getElementById("btnSaveSettings");
  var elToastContainer = document.getElementById("toastContainer");

  // State
  var currentMetadata = null;
  var currentDownloadId = null;
  var isDownloading = false;
  var playlistData = null;
  var historyItems = [];

  // 1. Toast Notification
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
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 200);
    }, 3200);
  }

  // 2. Initialization
  async function init() {
    setupWindowControls();
    setupTabs();
    setupDropdown();
    setupEventListeners();
    await loadSettings();
    loadHistory();
    checkEnvironment();
  }

  function setupWindowControls() {
    if (elBtnWinMinimize) {
      elBtnWinMinimize.addEventListener("click", function () {
        window.Bridge.minimizeWindow();
      });
    }
    if (elBtnWinMaximize) {
      elBtnWinMaximize.addEventListener("click", function () {
        window.Bridge.maximizeWindow();
      });
    }
    if (elBtnWinClose) {
      elBtnWinClose.addEventListener("click", function () {
        window.Bridge.closeWindow();
      });
    }
  }

  function setupTabs() {
    navTabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        var targetTab = tab.getAttribute("data-tab");
        navTabs.forEach(function (t) { t.classList.remove("active"); });
        tabContents.forEach(function (c) { c.classList.remove("active"); });

        tab.classList.add("active");
        var activeContent = document.getElementById(targetTab);
        if (activeContent) activeContent.classList.add("active");
      });
    });
  }

  function setupDropdown() {
    if (elCustomSelectTrigger && elCustomSelectWrapper) {
      elCustomSelectTrigger.addEventListener("click", function (e) {
        e.stopPropagation();
        elCustomSelectWrapper.classList.toggle("open");
      });

      var options = elCustomSelectDropdown.querySelectorAll(".select-option");
      options.forEach(function (opt) {
        opt.addEventListener("click", function (e) {
          e.stopPropagation();
          options.forEach(function (o) { o.classList.remove("active"); });
          opt.classList.add("active");

          var val = opt.getAttribute("data-value");
          var label = opt.getAttribute("data-label");
          elSelectPreset.value = val;
          elCurrentOptionLabel.textContent = label;
          elCustomSelectWrapper.classList.remove("open");
        });
      });

      document.addEventListener("click", function () {
        elCustomSelectWrapper.classList.remove("open");
      });
    }
  }

  async function loadSettings() {
    var savedDir = localStorage.getItem("mediadownloader_download_dir");
    if (!savedDir) {
      savedDir = window.Downloader.getDefaultDownloadDir();
    }
    if (elCurrentDownloadDirPath) elCurrentDownloadDirPath.textContent = savedDir;
    if (elInputSettingDownloadDir) elInputSettingDownloadDir.value = savedDir;

    var savedCookies = localStorage.getItem("mediadownloader_cookies_path");
    if (elInputCookiesPath) elInputCookiesPath.value = savedCookies || "";
  }

  function saveSettings() {
    if (elInputSettingDownloadDir) {
      var dir = elInputSettingDownloadDir.value.trim();
      localStorage.setItem("mediadownloader_download_dir", dir);
      if (elCurrentDownloadDirPath) elCurrentDownloadDirPath.textContent = dir;
    }
    if (elInputCookiesPath) {
      localStorage.setItem("mediadownloader_cookies_path", elInputCookiesPath.value.trim());
    }
    showToast("Configurações salvas!", "success");
    closeSettings();
  }

  async function checkEnvironment() {
    var status = await window.BinManager.getStatus();

    if (elYtDlpStatus) {
      if (status.ytdlp.found) {
        elYtDlpStatus.textContent = "✅ Pronto (" + (status.ytdlp.version || "OK") + ")";
        elYtDlpStatus.style.color = "var(--accent-emerald)";
      } else {
        elYtDlpStatus.textContent = "❌ Não detectado (clique em Atualizar)";
        elYtDlpStatus.style.color = "var(--accent-rose)";
      }
    }

    if (elFfmpegStatus) {
      if (status.ffmpeg.found) {
        elFfmpegStatus.textContent = "✅ Pronto (" + (status.ffmpeg.version || "OK") + ")";
        elFfmpegStatus.style.color = "var(--accent-emerald)";
      } else {
        elFfmpegStatus.textContent = "⚠️ Opcional (usado para remux H.264/ProRes)";
        elFfmpegStatus.style.color = "var(--accent-amber)";
      }
    }

    if (elAria2Status) {
      if (status.aria2 && status.aria2.found) {
        elAria2Status.textContent = "✅ Ativo (Aceleração Turbo)";
        elAria2Status.style.color = "var(--accent-emerald)";
      } else {
        elAria2Status.textContent = "ℹ️ Padrão";
        elAria2Status.style.color = "var(--text-muted)";
      }
    }

    if (elSystemStatusDot) {
      if (status.ready) {
        elSystemStatusDot.style.background = "var(--accent-emerald)";
        elSystemStatusDot.style.boxShadow = "0 0 8px var(--accent-emerald)";
      } else {
        elSystemStatusDot.style.background = "var(--accent-amber)";
        elSystemStatusDot.style.boxShadow = "0 0 8px var(--accent-amber)";
      }
    }
  }

  function openSettings() {
    if (elModalSettings) elModalSettings.classList.add("active");
    checkEnvironment();
  }

  function closeSettings() {
    if (elModalSettings) elModalSettings.classList.remove("active");
  }

  // 3. Single Video Event Handlers
  var debounceTimer = null;
  function handleUrlChange(url) {
    if (!url) {
      if (elPreviewBox) elPreviewBox.classList.remove("active");
      currentMetadata = null;
      return;
    }

    var platform = window.Downloader.detectPlatform(url);
    updatePlatformIcon(platform);

    // Instant Preview
    var instant = window.Downloader.getInstantPreview(url);
    if (instant && instant.thumbnail) {
      renderPreview(instant);
    }

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async function () {
      try {
        var meta = await window.Downloader.fetchMetadata(url);
        currentMetadata = meta;
        renderPreview(meta);
      } catch (err) {
        console.warn("Metadados não resolvidos:", err.message);
      }
    }, 400);
  }

  function updatePlatformIcon(platform) {
    if (!elInputPlatformIcon) return;
    elInputPlatformIcon.style.color = platform.color || "var(--text-dim)";
  }

  function renderPreview(meta) {
    if (!elPreviewBox) return;
    elPreviewBox.classList.add("active");
    if (elPreviewThumb) elPreviewThumb.src = meta.thumbnail || "";
    if (elPreviewDuration) elPreviewDuration.textContent = meta.durationFormatted || "--:--";
    if (elPreviewTitle) elPreviewTitle.textContent = meta.title || "Vídeo Online";
    if (elPreviewMeta) elPreviewMeta.textContent = meta.uploader || "Mídia Web";
    if (elPreviewPlatform) {
      elPreviewPlatform.textContent = meta.platform.badge || meta.platform.name;
      elPreviewPlatform.style.color = meta.platform.color;
    }
  }

  async function handlePaste() {
    var text = await window.Bridge.readClipboard();
    if (text && (text.startsWith("http://") || text.startsWith("https://"))) {
      if (elUrlInput) {
        elUrlInput.value = text.trim();
        handleUrlChange(text.trim());
      }
    } else if (text) {
      if (elUrlInput) elUrlInput.value = text.trim();
      showToast("Texto colado.", "info");
    } else {
      showToast("Nenhum link na área de transferência.", "info");
    }
  }

  // 4. Download Handlers
  async function startSingleDownload() {
    var url = elUrlInput.value.trim();
    if (!url) {
      showToast("Insira um link válido para baixar.", "error");
      return;
    }

    if (isDownloading) {
      showToast("Já existe um download em andamento.", "error");
      return;
    }

    var preset = elSelectPreset.value;
    var outputDir = localStorage.getItem("mediadownloader_download_dir") || window.Downloader.getDefaultDownloadDir();

    isDownloading = true;
    showProgressCard(true, currentMetadata ? currentMetadata.title : "Baixando mídia...");

    try {
      var result = await window.Downloader.startDownload({
        url: url,
        preset: preset,
        outputDir: outputDir,
        title: currentMetadata ? currentMetadata.title : null,
        id: currentMetadata ? currentMetadata.id : null
      }, function (prog) {
        updateProgress(prog);
      }, function (status) {
        if (elProgressStatus) elProgressStatus.textContent = status;
      });

      showToast("Download concluído com sucesso!", "success");
      addToHistory({
        title: result.title,
        filePath: result.filePath,
        preset: result.preset,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        thumbnail: currentMetadata ? currentMetadata.thumbnail : ""
      });

      // Clear input
      elUrlInput.value = "";
      if (elPreviewBox) elPreviewBox.classList.remove("active");
      currentMetadata = null;
    } catch (err) {
      showToast("Erro: " + err.message, "error");
    } finally {
      isDownloading = false;
      setTimeout(function () {
        showProgressCard(false);
      }, 1500);
    }
  }

  function showProgressCard(show, title) {
    if (!elProgressCard) return;
    if (show) {
      elProgressCard.classList.add("active");
      if (title && elProgressTitle) elProgressTitle.textContent = title;
      if (elProgressBarFill) elProgressBarFill.style.width = "0%";
      if (elProgressPercent) elProgressPercent.textContent = "0%";
    } else {
      elProgressCard.classList.remove("active");
    }
  }

  function updateProgress(prog) {
    if (elProgressBarFill) elProgressBarFill.style.width = prog.percent + "%";
    if (elProgressPercent) elProgressPercent.textContent = Math.round(prog.percent) + "%";
    if (elProgressStatus) elProgressStatus.textContent = prog.status || "Baixando...";
    if (elProgressSpeed) elProgressSpeed.textContent = prog.speed || "-- MB/s";
    if (elProgressEta) elProgressEta.textContent = "ETA " + (prog.eta || "--:--");
  }

  // 5. Playlist & Channel Handlers
  async function handleIndexPlaylist() {
    var url = elPlaylistUrlInput.value.trim();
    if (!url) {
      showToast("Cole o link de uma playlist ou canal do YouTube.", "error");
      return;
    }

    elBtnIndexPlaylist.textContent = "Indexando...";
    elBtnIndexPlaylist.disabled = true;

    try {
      var pl = await window.Downloader.fetchPlaylistOrChannel(url, function (status) {
        showToast(status, "info");
      });

      playlistData = pl;
      renderPlaylistUI(pl);
      showToast(pl.itemsCount + " vídeos indexados na playlist!", "success");
    } catch (err) {
      showToast("Erro: " + err.message, "error");
    } finally {
      elBtnIndexPlaylist.textContent = "Indexar Vídeos";
      elBtnIndexPlaylist.disabled = false;
    }
  }

  function renderPlaylistUI(pl) {
    if (!elPlaylistContainer || !elPlaylistItemsList) return;
    elPlaylistContainer.style.display = "flex";
    if (elPlaylistTitle) elPlaylistTitle.textContent = pl.title;
    if (elPlaylistStats) elPlaylistStats.textContent = pl.itemsCount + " vídeos · " + pl.uploader;

    elPlaylistItemsList.innerHTML = "";
    pl.items.forEach(function (item, idx) {
      var row = document.createElement("div");
      row.className = "playlist-item-row" + (item.selected ? "" : " unselected");

      var chk = document.createElement("input");
      chk.type = "checkbox";
      chk.className = "playlist-item-checkbox";
      chk.checked = item.selected;
      chk.addEventListener("change", function () {
        item.selected = chk.checked;
        row.className = "playlist-item-row" + (item.selected ? "" : " unselected");
        updateSelectedCountBadge();
      });

      var thumb = document.createElement("img");
      thumb.className = "playlist-item-thumb";
      thumb.src = item.thumbnail || "";

      var title = document.createElement("span");
      title.className = "playlist-item-title";
      title.textContent = (idx + 1) + ". " + item.title;

      var dur = document.createElement("span");
      dur.className = "playlist-item-dur";
      dur.textContent = item.durationFormatted || "--:--";

      row.appendChild(chk);
      row.appendChild(thumb);
      row.appendChild(title);
      row.appendChild(dur);
      elPlaylistItemsList.appendChild(row);
    });

    updateSelectedCountBadge();
  }

  function updateSelectedCountBadge() {
    if (!playlistData) return;
    var count = playlistData.items.filter(function (i) { return i.selected; }).length;
    if (elSelectedCountBadge) elSelectedCountBadge.textContent = count;
  }

  function toggleSelectAllPlaylist() {
    if (!playlistData) return;
    var allSelected = playlistData.items.every(function (i) { return i.selected; });
    var newState = !allSelected;

    playlistData.items.forEach(function (i) { i.selected = newState; });
    renderPlaylistUI(playlistData);
    if (elBtnToggleSelectAll) {
      elBtnToggleSelectAll.textContent = newState ? "Desmarcar Todos" : "Selecionar Todos";
    }
  }

  async function startPlaylistDownload() {
    if (!playlistData) return;
    var selected = playlistData.items.filter(function (i) { return i.selected; });
    if (selected.length === 0) {
      showToast("Nenhum vídeo selecionado.", "error");
      return;
    }

    if (isDownloading) {
      showToast("Aguarde o download atual terminar.", "error");
      return;
    }

    var preset = elSelectPreset.value;
    var outputDir = localStorage.getItem("mediadownloader_download_dir") || window.Downloader.getDefaultDownloadDir();

    isDownloading = true;
    showToast("Iniciando download de " + selected.length + " vídeos...", "info");

    for (var i = 0; i < selected.length; i++) {
      var item = selected[i];
      showProgressCard(true, "(" + (i + 1) + "/" + selected.length + ") " + item.title);

      try {
        var res = await window.Downloader.startDownload({
          url: item.url,
          preset: preset,
          outputDir: outputDir,
          title: item.title,
          id: item.id
        }, function (prog) {
          updateProgress(prog);
        });

        addToHistory({
          title: res.title,
          filePath: res.filePath,
          preset: res.preset,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          thumbnail: item.thumbnail
        });
      } catch (err) {
        showToast("Falha em (" + item.title + "): " + err.message, "error");
      }
    }

    isDownloading = false;
    showProgressCard(false);
    showToast("Download da playlist concluído!", "success");
  }

  // 6. Batch Downloads
  function handleBatchInput() {
    var text = elBatchTextarea.value.trim();
    if (!text) {
      if (elBatchCountLabel) elBatchCountLabel.textContent = "0 links detectados";
      return;
    }
    var lines = text.split(/\r?\n/).map(function (l) { return l.trim(); }).filter(function (l) {
      return l.startsWith("http://") || l.startsWith("https://");
    });
    if (elBatchCountLabel) elBatchCountLabel.textContent = lines.length + " links válidos detectados";
  }

  async function startBatchDownload() {
    var text = elBatchTextarea.value.trim();
    var urls = text.split(/\r?\n/).map(function (l) { return l.trim(); }).filter(function (l) {
      return l.startsWith("http://") || l.startsWith("https://");
    });

    if (urls.length === 0) {
      showToast("Cole ao menos um link válido na caixa de texto.", "error");
      return;
    }

    if (isDownloading) {
      showToast("Aguarde o download atual terminar.", "error");
      return;
    }

    var preset = elSelectPreset.value;
    var outputDir = localStorage.getItem("mediadownloader_download_dir") || window.Downloader.getDefaultDownloadDir();

    isDownloading = true;
    showToast("Processando lote de " + urls.length + " mídias...", "info");

    for (var i = 0; i < urls.length; i++) {
      var u = urls[i];
      showProgressCard(true, "Lote (" + (i + 1) + "/" + urls.length + ")");

      try {
        var res = await window.Downloader.startDownload({
          url: u,
          preset: preset,
          outputDir: outputDir
        }, function (prog) {
          updateProgress(prog);
        });

        addToHistory({
          title: res.title,
          filePath: res.filePath,
          preset: res.preset,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          thumbnail: ""
        });
      } catch (err) {
        showToast("Erro no link #" + (i + 1) + ": " + err.message, "error");
      }
    }

    isDownloading = false;
    showProgressCard(false);
    elBatchTextarea.value = "";
    handleBatchInput();
    showToast("Lote finalizado com sucesso!", "success");
  }

  // 7. History Management
  function loadHistory() {
    try {
      var raw = localStorage.getItem("mediadownloader_desktop_history");
      historyItems = raw ? JSON.parse(raw) : [];
    } catch (e) {
      historyItems = [];
    }
    renderHistory();
  }

  function saveHistory() {
    localStorage.setItem("mediadownloader_desktop_history", JSON.stringify(historyItems.slice(0, 50)));
  }

  function addToHistory(item) {
    historyItems.unshift(item);
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
    if (!elHistoryList || !elHistoryCount) return;
    elHistoryCount.textContent = historyItems.length;

    if (historyItems.length === 0) {
      elHistoryList.innerHTML = `
        <div class="history-empty">
          <svg viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
          <span>Nenhum download recente ainda</span>
        </div>
      `;
      return;
    }

    elHistoryList.innerHTML = "";
    historyItems.forEach(function (item, idx) {
      var div = document.createElement("div");
      div.className = "history-item";

      var thumb = document.createElement("img");
      thumb.className = "history-item-thumb";
      thumb.src = item.thumbnail || "icons/iconNormal.png";

      var info = document.createElement("div");
      info.className = "history-item-info";

      var title = document.createElement("div");
      title.className = "history-item-title";
      title.textContent = item.title || "Mídia Baixada";

      var meta = document.createElement("div");
      meta.className = "history-item-meta";
      meta.innerHTML = "<span>" + (item.preset ? item.preset.toUpperCase() : "MP4") + "</span> · <span>" + item.time + "</span>";

      info.appendChild(title);
      info.appendChild(meta);

      var actions = document.createElement("div");
      actions.className = "history-item-actions";

      var btnOpen = document.createElement("button");
      btnOpen.className = "btn-history-action";
      btnOpen.title = "Revelar arquivo no Explorer";
      btnOpen.innerHTML = '<svg viewBox="0 0 24 24"><path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></svg>';
      btnOpen.addEventListener("click", function () {
        if (item.filePath) window.Bridge.showItemInFolder(item.filePath);
      });

      var btnCopy = document.createElement("button");
      btnCopy.className = "btn-history-action";
      btnCopy.title = "Copiar Caminho do Arquivo";
      btnCopy.innerHTML = '<svg viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>';
      btnCopy.addEventListener("click", function () {
        if (item.filePath) {
          window.Bridge.copyToClipboard(item.filePath);
          showToast("Caminho copiado!", "info");
        }
      });

      actions.appendChild(btnOpen);
      actions.appendChild(btnCopy);

      div.appendChild(thumb);
      div.appendChild(info);
      div.appendChild(actions);

      elHistoryList.appendChild(div);
    });
  }

  // 8. Event Listeners Setup
  function setupEventListeners() {
    if (elUrlInput) {
      elUrlInput.addEventListener("input", function () {
        handleUrlChange(elUrlInput.value.trim());
      });
      elUrlInput.addEventListener("keydown", function (e) {
        if (e.key === "Enter") startSingleDownload();
      });
    }

    if (elBtnPaste) elBtnPaste.addEventListener("click", handlePaste);
    if (elBtnDownload) elBtnDownload.addEventListener("click", startSingleDownload);

    // Playlist
    if (elBtnIndexPlaylist) elBtnIndexPlaylist.addEventListener("click", handleIndexPlaylist);
    if (elBtnToggleSelectAll) elBtnToggleSelectAll.addEventListener("click", toggleSelectAllPlaylist);
    if (elBtnDownloadPlaylist) elBtnDownloadPlaylist.addEventListener("click", startPlaylistDownload);

    // Batch
    if (elBatchTextarea) elBatchTextarea.addEventListener("input", handleBatchInput);
    if (elBtnStartBatch) elBtnStartBatch.addEventListener("click", startBatchDownload);

    // History
    if (elBtnClearHistory) elBtnClearHistory.addEventListener("click", clearHistory);

    // Directory Bar
    if (elBtnChangeDir) {
      elBtnChangeDir.addEventListener("click", async function () {
        var folder = await window.Bridge.selectFolder();
        if (folder) {
          localStorage.setItem("mediadownloader_download_dir", folder);
          if (elCurrentDownloadDirPath) elCurrentDownloadDirPath.textContent = folder;
          if (elInputSettingDownloadDir) elInputSettingDownloadDir.value = folder;
          showToast("Pasta de download atualizada!", "success");
        }
      });
    }

    if (elBtnOpenCurrentDir) {
      elBtnOpenCurrentDir.addEventListener("click", function () {
        var dir = localStorage.getItem("mediadownloader_download_dir") || window.Downloader.getDefaultDownloadDir();
        window.Bridge.openFolder(dir);
      });
    }

    // Settings Modal
    if (elBtnOpenSettings) elBtnOpenSettings.addEventListener("click", openSettings);
    if (elBtnCloseSettings) elBtnCloseSettings.addEventListener("click", closeSettings);
    if (elBtnSaveSettings) elBtnSaveSettings.addEventListener("click", saveSettings);

    if (elBtnBrowseSettingDir) {
      elBtnBrowseSettingDir.addEventListener("click", async function () {
        var folder = await window.Bridge.selectFolder();
        if (folder && elInputSettingDownloadDir) {
          elInputSettingDownloadDir.value = folder;
        }
      });
    }

    if (elBtnBrowseCookies) {
      elBtnBrowseCookies.addEventListener("click", async function () {
        var file = await window.Bridge.selectFile([{ name: "Cookies TXT", extensions: ["txt"] }]);
        if (file && elInputCookiesPath) {
          elInputCookiesPath.value = file;
        }
      });
    }

    if (elBtnUpdateYtDlp) {
      elBtnUpdateYtDlp.addEventListener("click", async function () {
        elBtnUpdateYtDlp.textContent = "Baixando yt-dlp Oficial...";
        elBtnUpdateYtDlp.disabled = true;
        try {
          var res = await window.BinManager.downloadStandaloneYtDlp(function (pct) {
            elBtnUpdateYtDlp.textContent = "Baixando (" + pct + "%)...";
          });
          showToast("yt-dlp atualizado com sucesso (" + res.version + ")!", "success");
          checkEnvironment();
        } catch (err) {
          showToast("Falha ao atualizar yt-dlp: " + err.message, "error");
        } finally {
          elBtnUpdateYtDlp.textContent = "Atualizar yt-dlp Oficial (GitHub)";
          elBtnUpdateYtDlp.disabled = false;
        }
      });
    }

    if (elBtnCancelDownload) {
      elBtnCancelDownload.addEventListener("click", function () {
        if (currentDownloadId) {
          window.Downloader.cancelDownload(currentDownloadId);
          showToast("Download cancelado.", "info");
          showProgressCard(false);
          isDownloading = false;
        }
      });
    }
  }

  // Run on DOM ready
  document.addEventListener("DOMContentLoaded", init);
})(window, document);

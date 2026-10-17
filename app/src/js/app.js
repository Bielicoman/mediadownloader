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
  var elDefaultPreset = document.getElementById("selectDefaultPreset");
  var elPlaylistPreset = document.getElementById("selectPresetPlaylist");
  var elBatchPreset = document.getElementById("selectPresetBatch");
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
  var queueCancelled = false;
  var isDownloading = false;
  function reportBusy(){if(window.desktopAPI&&window.desktopAPI.setDownloadBusy)window.desktopAPI.setDownloadBusy(isDownloading);}
  if(window.desktopAPI&&window.desktopAPI.onUpdateStatus)window.desktopAPI.onUpdateStatus(function(message){showToast(message,"success");});
  var playlistData = null;
  var playlistView=null,batchView=null,batchItems=[],playlistTimer=null,playlistGeneration=0;
  var historyItems = [];


  [['btnPastePlaylist','playlistUrlInput'],['btnPasteBatch','batchTextarea']].forEach(function(pair){var button=document.getElementById(pair[0]);if(!button)return;button.addEventListener('click',async function(){try{var text=await window.Bridge.readClipboard();var input=document.getElementById(pair[1]);if(!text){showToast('A área de transferência está vazia.','error');return;}if(pair[1]==='batchTextarea'&&window.MediaCollections){await appendBatchText(text);return;}input.value=text.trim();input.dispatchEvent(new Event('input',{bubbles:true}));input.focus();}catch(e){showToast('Não foi possível colar. Use Ctrl+V no campo.','error');}});});
  var batchPasteQueue=Promise.resolve();
  function appendBatchText(text){batchPasteQueue=batchPasteQueue.then(async function(){try{var links=await window.MediaCollections.expandLinks(text,{container:elBatchTextarea,status:function(message){elBatchCountLabel.textContent=message;}});if(!links.length)return;elBatchTextarea.value=window.MediaCollections.urls(elBatchTextarea.value+'\n'+links.join('\n')).join('\n');handleBatchInput();}catch(e){showToast('Não foi possível adicionar a playlist: '+e.message,'error');}});return batchPasteQueue;}
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
    var wrappers = document.querySelectorAll(".custom-select-wrapper");
    function closeMenu(wrapper) {
      wrapper.classList.remove("open");
      wrapper.querySelector(".custom-select-trigger").setAttribute("aria-expanded", "false");
    }
    wrappers.forEach(function (wrapper) {
      var trigger = wrapper.querySelector(".custom-select-trigger");
      var input = wrapper.querySelector('input[type="hidden"]');
      var label = wrapper.querySelector(".opt-label");
      var options = wrapper.querySelectorAll(".select-option");
      trigger.addEventListener("click", function (e) {
        e.stopPropagation();
        var shouldOpen = !wrapper.classList.contains("open");
        wrappers.forEach(closeMenu);
        if (shouldOpen) {
          wrapper.classList.add("open");
          trigger.setAttribute("aria-expanded", "true");
        }
      });
      options.forEach(function (opt) {
        opt.addEventListener("click", function (e) {
          e.stopPropagation();
          options.forEach(function (o) { o.classList.remove("active"); });
          opt.classList.add("active");
          input.value = opt.getAttribute("data-value");
          label.textContent = opt.getAttribute("data-label");
          var currentIcon = trigger.querySelector(".opt-icon");
          var selectedIcon = opt.querySelector(".opt-icon");
          if (currentIcon && selectedIcon) currentIcon.innerHTML = selectedIcon.innerHTML;
          closeMenu(wrapper);
        });
      });
    });
    document.addEventListener("click", function () { wrappers.forEach(closeMenu); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") wrappers.forEach(closeMenu); });
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

  async function loadSettings() {
    loadDefaultPreset();
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
    if (elDefaultPreset) localStorage.setItem("mediadownloader_default_preset", validDefaultPreset(elDefaultPreset.value));
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
        elFfmpegStatus.textContent = "❌ Não encontrado: necessário para juntar vídeo e áudio";
        elFfmpegStatus.style.color = "var(--accent-amber)";
      }
    }

    if (elAria2Status) {
      if (status.aria2 && status.aria2.found) {
        elAria2Status.textContent = "Não usado (o yt-dlp baixa direto)";
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
  var singlePlaylistPending='';
  function handleUrlChange(url) {
    if(window.MediaCollections&&window.MediaCollections.playlistUrl(url)){clearTimeout(debounceTimer);if(singlePlaylistPending===url)return;singlePlaylistPending=url;window.MediaCollections.askPlaylist(elUrlInput.closest('.input-capsule')||elUrlInput,url).then(async function(choice){if(elUrlInput.value.trim()!==url)return;if(choice==='playlist'){document.querySelector('[data-tab="tab-playlist"]').click();elPlaylistUrlInput.value=url;handleIndexPlaylist();}else if(choice==='video'){var links=await window.MediaCollections.expandLinks(url,{choose:async function(){return 'video';}});if(links[0]){elUrlInput.value=links[0];handleUrlChange(links[0]);}}}).catch(function(e){showToast(e.message,'error');}).finally(function(){singlePlaylistPending='';});return;}

    var thumbnailLink = String(url || "").match(/^https?:\/\/(?:i|img)\.ytimg\.com\/(?:vi|vi_webp)\/([A-Za-z0-9_-]{11})(?:\/|$)/i);
    if (thumbnailLink) { url = "https://www.youtube.com/watch?v=" + thumbnailLink[1]; if (elUrlInput) elUrlInput.value = url; }
    if (!url) {
      if (elPreviewBox) elPreviewBox.classList.remove("active");
      currentMetadata = null;
      return;
    }

    currentMetadata = null;
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
        var meta = await window.Downloader.fetchMetadata(url, function (quick) {
          if (elUrlInput.value.trim() === url && (!currentMetadata || currentMetadata.isInstant)) renderPreview(quick);
        });
        if (elUrlInput.value.trim() !== url) return;
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
    if(window.MediaInfo)window.MediaInfo.render(document.getElementById("mediaDetails"),meta.technical||window.MediaInfo.source({title:meta.title,uploader:meta.uploader}),"icons/editors/");
    elPreviewBox.classList.add("active");
    if (elPreviewThumb) if(window.MediaThumbnails)window.MediaThumbnails.set(elPreviewThumb,meta);else elPreviewThumb.src = meta.thumbnail || "";
    if (elPreviewDuration) elPreviewDuration.textContent = meta.durationFormatted || "--:--";
    if (elPreviewTitle) elPreviewTitle.textContent = meta.title || "Vídeo Online";
    if (elPreviewMeta) elPreviewMeta.textContent = meta.uploader || "Mídia Web";
    if (elPreviewPlatform) {
      elPreviewPlatform.textContent = meta.platform.badge || meta.platform.name;
      elPreviewPlatform.style.color = meta.platform.color;
    }
  }

  async function handlePaste() {
    var text;
    try { text = await window.Bridge.readClipboard(); }
    catch (error) { showToast("Não foi possível acessar a área de transferência. Tente novamente.","error"); if(elUrlInput)elUrlInput.focus(); return; }
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
        if(singlePlaylistPending){showToast("Escolha este vídeo ou a playlist antes de baixar.","info");return;}
    var url = elUrlInput.value.trim();
    if (!url) {
      showToast("Insira um link válido para baixar.", "error");
      return;
    }

    if (isDownloading) {
      showToast("Já existe um download em andamento.", "error");
      return;
    }

    var meta = currentMetadata;
    var preset = elSelectPreset.value;
    var outputDir = localStorage.getItem("mediadownloader_download_dir") || window.Downloader.getDefaultDownloadDir();

    isDownloading = true; reportBusy();
    showProgressCard(true, meta ? meta.title : "Baixando mídia...");

    try {
      var job = window.Downloader.startDownload({
        url: url,
        preset: preset,
        outputDir: outputDir,
        title: meta ? meta.title : null,
        id: meta ? meta.id : null
      }, function (prog) {
        updateProgress(prog);
      }, function (status) {
        if (elProgressStatus) elProgressStatus.textContent = status;
      });
      currentDownloadId = job.downloadId;
      var result = await job;

      showToast("Download concluído com sucesso!", "success");
      addToHistory({
        title: result.title,
        filePath: result.filePath,
        preset: result.preset,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        thumbnail: meta ? meta.thumbnail : ""
      });

      try{var finalProbe=await window.Downloader.inspectFile(result.filePath);window.MediaInfo.render(document.getElementById("mediaDetails"),window.MediaInfo.probe(finalProbe,result.filePath.split(/[\\/]/).pop()),"icons/editors/");}catch(probeError){console.warn("Dados finais indisponíveis:",probeError.message);}
      // Clear input
      elUrlInput.value = "";
      if (elPreviewBox) elPreviewBox.classList.remove("active");
      currentMetadata = null;
    } catch (err) {
      showToast("Erro: " + err.message, "error");
    } finally {
      isDownloading = false; reportBusy();
      currentDownloadId = null;
      setTimeout(function () {
        if (!isDownloading) showProgressCard(false);
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

    var requestedUrl=url,requestGeneration=++playlistGeneration;
    elBtnIndexPlaylist.textContent = "Indexando...";
    elBtnIndexPlaylist.disabled = true;

    try {
      var pl = await window.Downloader.fetchPlaylistOrChannel(url, function (status) {
        showToast(status, "info");
      });

      if(requestGeneration!==playlistGeneration||elPlaylistUrlInput.value.trim()!==requestedUrl)return;
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

    if(window.MediaCollections){
      if(!playlistView)playlistView=window.MediaCollections.create({container:elPlaylistItemsList,key:"playlist",paused:function(){return isDownloading;},onSelection:updateSelectedCountBadge});
      playlistView.load(pl.items);updateSelectedCountBadge();return;
    }
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

    var preset = elPlaylistPreset.value;
    var outputDir = localStorage.getItem("mediadownloader_download_dir") || window.Downloader.getDefaultDownloadDir();

    isDownloading = true; reportBusy();
    queueCancelled = false;
    showToast("Iniciando download de " + selected.length + " vídeos...", "info");

    var successes = 0, failures = 0;
    for (var i = 0; i < selected.length; i++) {
      var item = selected[i];
      showProgressCard(true, "(" + (i + 1) + "/" + selected.length + ") " + item.title);

      if (queueCancelled) break;
      try {
        var plJob = window.Downloader.startDownload({
          url: item.url,
          preset: preset,
          outputDir: outputDir,
          title: item.title,
          id: item.id
        }, function (prog) {
          updateProgress(prog);
        });
        currentDownloadId = plJob.downloadId;
        var res = await plJob;
        successes++;

        addToHistory({
          title: res.title,
          filePath: res.filePath,
          preset: res.preset,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          thumbnail: item.thumbnail
        });
      } catch (err) {
        if (!queueCancelled) { failures++; showToast("Falha em (" + item.title + "): " + err.message, "error"); }
      }
    }

    isDownloading = false; reportBusy();
    showProgressCard(false);
    currentDownloadId = null;
    showQueueResult("Playlist", successes, failures, selected.length, queueCancelled);
  }

  // 6. Batch Downloads
  function handleBatchInput() {
    if(!elBatchTextarea)return;
    var urls=window.MediaCollections?window.MediaCollections.urls(elBatchTextarea.value):elBatchTextarea.value.split(/\r?\n/).filter(function(u){return /^https?:\/\//.test(u);});
    var existing={};batchItems.forEach(function(i){existing[i.url]=i;});
    batchItems=urls.map(function(url){return existing[url]||(window.MediaCollections&&window.MediaCollections.seed(url))||{url:url,title:url,selected:true};});
    if(elBatchCountLabel)elBatchCountLabel.textContent=batchItems.filter(function(i){return i.selected;}).length+" de "+batchItems.length+" links selecionados";
    if(window.MediaCollections){
      if(!batchView)batchView=window.MediaCollections.create({container:document.getElementById("batchItemsList"),key:"batch",paused:function(){return isDownloading;},onSelection:function(){if(elBatchCountLabel)elBatchCountLabel.textContent=batchItems.filter(function(i){return i.selected;}).length+" de "+batchItems.length+" links selecionados";},onRemove:function(item){elBatchTextarea.value=batchItems.filter(function(i){return i.url!==item.url;}).map(function(i){return i.url;}).join("\n");handleBatchInput();}});
      batchView.load(batchItems);
    }
  }

  async function startBatchDownload() {
    handleBatchInput();
    var urls=batchItems.filter(function(i){return i.selected;}).map(function(i){return i.url;});

    if (urls.length === 0) {
      showToast("Cole ao menos um link válido na caixa de texto.", "error");
      return;
    }

    if (isDownloading) {
      showToast("Aguarde o download atual terminar.", "error");
      return;
    }

    var preset = elBatchPreset.value;
    var outputDir = localStorage.getItem("mediadownloader_download_dir") || window.Downloader.getDefaultDownloadDir();

    isDownloading = true; reportBusy();
    queueCancelled = false;
    showToast("Processando lote de " + urls.length + " mídias...", "info");

    var successes = 0, failures = 0, completed = {};
    for (var i = 0; i < urls.length; i++) {
      var u = urls[i];
      showProgressCard(true, "Lote (" + (i + 1) + "/" + urls.length + ")");

      if (queueCancelled) break;
      try {
        var batchJob = window.Downloader.startDownload({
          url: u,
          preset: preset,
          outputDir: outputDir
        }, function (prog) {
          updateProgress(prog);
        });
        currentDownloadId = batchJob.downloadId;
        var res = await batchJob;
        successes++;
        completed[i] = true;

        addToHistory({
          title: res.title,
          filePath: res.filePath,
          preset: res.preset,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          thumbnail: ""
        });
      } catch (err) {
        if (!queueCancelled) { failures++; showToast("Erro no link #" + (i + 1) + ": " + err.message, "error"); }
      }
    }

    isDownloading = false; reportBusy();
    showProgressCard(false);
    var finished={};urls.forEach(function(url,index){if(completed[index])finished[url]=true;});
    elBatchTextarea.value = batchItems.filter(function(item){return !finished[item.url];}).map(function(item){return item.url;}).join("\n");
    handleBatchInput();
    currentDownloadId = null;
    showQueueResult("Lote", successes, failures, urls.length, queueCancelled);
  }

  function showQueueResult(label, successes, failures, total, cancelled) {
    var pending = total - successes - failures;
    var message = label + (cancelled ? " interrompido: " : " finalizado: ") + successes + " concluído(s), " + failures + " falha(s)";
    if (pending > 0) message += ", " + pending + " pendente(s)";
    showToast(message + ".", cancelled || (successes > 0 && failures > 0) ? "info" : (failures > 0 ? "error" : "success"));
  }

  // 7. History Management
  function loadHistory() {
    try {
      var raw = localStorage.getItem("mediadownloader_desktop_history");
      var parsed = raw ? JSON.parse(raw) : [];
      historyItems = Array.isArray(parsed) ? parsed.filter(function (item) { return item && typeof item === "object" && typeof item.filePath === "string"; }).slice(0, 50) : [];
    } catch (e) {
      historyItems = [];
    }
    renderHistory();
  }

  function saveHistory() {
    try { localStorage.setItem("mediadownloader_desktop_history", JSON.stringify(historyItems.slice(0, 50))); } catch (err) { console.warn("Não foi possível salvar o histórico:", err.message); }
  }

  function addToHistory(item) {
    historyItems.unshift(item);
    if (historyItems.length > 50) historyItems.length = 50;
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
      meta.textContent = (item.preset ? String(item.preset).toUpperCase() : "MP4") + " · " + (item.time || "");

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
    if(elPlaylistUrlInput){elPlaylistUrlInput.addEventListener("input",function(){clearTimeout(playlistTimer);++playlistGeneration;playlistTimer=setTimeout(function(){if(elPlaylistUrlInput.value.trim())handleIndexPlaylist();},650);});}
    if(elBatchTextarea){elBatchTextarea.addEventListener("paste",function(event){if(!window.MediaCollections||!event.clipboardData)return;var text=event.clipboardData.getData("text");if(!window.MediaCollections.urls(text).length)return;event.preventDefault();appendBatchText(text);});}
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
          queueCancelled = true;
          window.Downloader.cancelDownload(currentDownloadId);
          showToast("Cancelando download...", "info");
        }
      });
    }
  }

  // Run on DOM ready
  document.addEventListener("DOMContentLoaded", init);
})(window, document);

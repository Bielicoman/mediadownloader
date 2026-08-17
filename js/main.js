/**
 * Media Downloader — Official Premiere Pro Plugin & NLE Simulation Engine
 * Pixel-perfect synchronization with the native CEP extension panel.
 */

document.addEventListener("DOMContentLoaded", function () {
    "use strict";

    // --------------------------------------------------------------------------
    // 1. Data Presets for Interactive Demos
    // --------------------------------------------------------------------------
    const sampleDemos = [
        {
            platform: "YouTube",
            tag: "Vídeo 4K",
            url: "https://www.youtube.com/watch?v=z7AofehqASc",
            title: "Cena de Cinema 4K UHD Master (2160p60)",
            meta: "YouTube • 4K UHD",
            duration: "03:45",
            thumb: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&q=80",
            clipName: "YT_Master_2160p60_PR422.mov",
            clipWidth: "55%",
            clipLeft: "15%"
        },
        {
            platform: "Instagram Reels",
            tag: "Reels 9:16",
            url: "https://www.instagram.com/reel/C8x9Y10Z_abc/",
            title: "Reels Vertical Fashion Film (9:16)",
            meta: "Instagram Reels • 1080x1920",
            duration: "00:58",
            thumb: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&q=80",
            clipName: "IG_Reels_Fashion_1080x1920.mp4",
            clipWidth: "40%",
            clipLeft: "25%"
        },
        {
            platform: "TikTok",
            tag: "TikTok 60fps",
            url: "https://www.tiktok.com/@creator/video/7391823901234",
            title: "TikTok Beat Sync Dynamic Cut",
            meta: "TikTok • Vertical 60fps",
            duration: "00:34",
            thumb: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=400&q=80",
            clipName: "TT_DynamicCut_60fps.mp4",
            clipWidth: "35%",
            clipLeft: "45%"
        },
        {
            platform: "SoundCloud",
            tag: "Áudio 24-bit",
            url: "https://soundcloud.com/soundtracks/epic-cinematic-score",
            title: "Trilha Sonora Original 24-bit 48kHz",
            meta: "SoundCloud • Master Audio",
            duration: "04:12",
            thumb: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&q=80",
            clipName: "Epic_Cinematic_Score_24bit.wav",
            clipWidth: "70%",
            clipLeft: "10%"
        }
    ];

    let currentDemoIndex = 0;
    let isSimulating = false;
    let isPlayingTimeline = false;
    let playheadAnimFrame = null;
    let playheadPosition = 180;

    // DOM Elements - Panel
    const urlInput = document.getElementById("urlInput");
    const btnPaste = document.getElementById("btnPaste");
    const previewThumb = document.getElementById("previewThumb");
    const previewDuration = document.getElementById("previewDuration");
    const previewTitle = document.getElementById("previewTitle");
    const previewMeta = document.getElementById("previewMeta");
    const previewPlatform = document.getElementById("previewPlatform");
    const customSelectWrapper = document.getElementById("customSelectWrapper");
    const customSelectTrigger = document.getElementById("customSelectTrigger");
    const customSelectDropdown = document.getElementById("customSelectDropdown");
    const currentOptionLabel = document.getElementById("currentOptionLabel");
    const selectOptions = document.querySelectorAll(".select-option");
    const btnDownload = document.getElementById("btnDownload");
    const presetPills = document.querySelectorAll(".preset-pill");

    // DOM Elements - Progress
    const progressTitle = document.getElementById("progressTitle");
    const progressPercent = document.getElementById("progressPercent");
    const progressBarFill = document.getElementById("progressBarFill");
    const progressStatus = document.getElementById("progressStatus");
    const progressSpeed = document.getElementById("progressSpeed");
    const progressEta = document.getElementById("progressEta");

    // DOM Elements - Timeline
    const timelineClipVideo = document.getElementById("timelineClipVideo");
    const timelineClipAudio = document.getElementById("timelineClipAudio");
    const clipVideoTitle = document.getElementById("clipVideoTitle");
    const clipAudioTitle = document.getElementById("clipAudioTitle");
    const timelineDropAlert = document.getElementById("timelineDropAlert");
    const timecodeDisplay = document.getElementById("timecodeDisplay");
    const timelinePlayhead = document.getElementById("timelinePlayhead");
    const timelineTracksArea = document.getElementById("timelineTracksArea");
    const btnPlayPause = document.getElementById("btnPlayPause");

    // --------------------------------------------------------------------------
    // 2. Waveform Canvas
    // --------------------------------------------------------------------------
    function renderWaveform(canvasId, barCount = 120, seed = 42) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        const w = canvas.width = canvas.offsetWidth * 2;
        const h = canvas.height = canvas.offsetHeight * 2;

        ctx.clearRect(0, 0, w, h);
        const barWidth = w / barCount;
        ctx.fillStyle = "#00e599";

        for (let i = 0; i < barCount; i++) {
            const noise = Math.sin(i * 0.15 + seed) * 0.3 + Math.sin(i * 0.05) * 0.4 + (Math.random() * 0.2);
            const amplitude = Math.max(0.1, Math.min(0.9, Math.abs(noise))) * (h * 0.75);
            const x = i * barWidth;
            const y = (h - amplitude) / 2;

            ctx.fillRect(x + 1, y, Math.max(1, barWidth - 2), amplitude);
        }
    }

    renderWaveform("waveformCanvas1", 140, 10);
    renderWaveform("waveformCanvas2", 140, 45);

    // --------------------------------------------------------------------------
    // 3. Preset Switcher
    // --------------------------------------------------------------------------
    window.loadSimDemo = function (index) {
        if (isSimulating) return;
        currentDemoIndex = index;
        const demo = sampleDemos[index];

        presetPills.forEach((p, i) => {
            p.classList.toggle("active", i === index);
        });

        if (urlInput) urlInput.value = demo.url;
        if (previewTitle) previewTitle.textContent = demo.title;
        if (previewMeta) previewMeta.textContent = demo.meta;
        if (previewDuration) previewDuration.textContent = demo.duration;
        if (previewPlatform) previewPlatform.textContent = demo.tag;
        if (previewThumb) previewThumb.src = demo.thumb;
    };

    // --------------------------------------------------------------------------
    // 4. Custom Select Dropdown Toggle
    // --------------------------------------------------------------------------
    if (customSelectTrigger) {
        customSelectTrigger.addEventListener("click", function (e) {
            e.stopPropagation();
            customSelectWrapper.classList.toggle("open");
        });
    }

    document.addEventListener("click", function (e) {
        if (customSelectWrapper && !customSelectWrapper.contains(e.target)) {
            customSelectWrapper.classList.remove("open");
        }
    });

    selectOptions.forEach(opt => {
        opt.addEventListener("click", function () {
            selectOptions.forEach(o => o.classList.remove("active"));
            opt.classList.add("active");
            const label = opt.getAttribute("data-label");
            if (currentOptionLabel) currentOptionLabel.textContent = label;
            if (customSelectWrapper) customSelectWrapper.classList.remove("open");
        });
    });

    // --------------------------------------------------------------------------
    // 5. Download Simulation & Drop into Timeline
    // --------------------------------------------------------------------------
    if (btnDownload) {
        btnDownload.addEventListener("click", function () {
            if (isSimulating) return;
            isSimulating = true;

            const demo = sampleDemos[currentDemoIndex];

            btnDownload.disabled = true;
            btnDownload.innerHTML = `
                <svg style="width:13px;height:13px;animation:spin 1s linear infinite;" viewBox="0 0 24 24"><path fill="currentColor" d="M12 4V2A10 10 0 0 0 2 12h2a8 8 0 0 1 8-8z"/></svg>
                Transcodificando...
            `;

            if (timelineDropAlert) timelineDropAlert.style.display = "none";
            if (progressTitle) progressTitle.textContent = "Baixando: " + demo.clipName;

            let progress = 0;
            const interval = setInterval(() => {
                progress += Math.floor(Math.random() * 18) + 12;
                if (progress > 100) progress = 100;

                const speed = (28.4 + (Math.random() * 6.2)).toFixed(1);
                if (progressBarFill) progressBarFill.style.width = progress + "%";
                if (progressPercent) progressPercent.textContent = progress + "%";
                if (progressSpeed) progressSpeed.textContent = `${speed} MB/s`;
                if (progressStatus) progressStatus.textContent = "16-Sockets Ativos";
                if (progressEta) progressEta.textContent = `ETA 00:0${Math.max(1, Math.floor((100 - progress) / 30))}`;

                if (progress === 100) {
                    clearInterval(interval);
                    setTimeout(onComplete, 300);
                }
            }, 120);

            function onComplete() {
                if (clipVideoTitle) clipVideoTitle.textContent = demo.clipName + " [V]";
                if (clipAudioTitle) clipAudioTitle.textContent = demo.clipName.replace('.mov', '.wav').replace('.mp4', '.wav') + " [A2]";

                if (timelineClipVideo) {
                    timelineClipVideo.style.width = demo.clipWidth;
                    timelineClipVideo.style.left = demo.clipLeft;
                    timelineClipVideo.style.transform = "scale(1.03)";
                    setTimeout(() => { timelineClipVideo.style.transform = "scale(1)"; }, 200);
                }

                if (timelineClipAudio) {
                    timelineClipAudio.style.width = demo.clipWidth;
                    timelineClipAudio.style.left = demo.clipLeft;
                    timelineClipAudio.style.transform = "scale(1.03)";
                    setTimeout(() => { timelineClipAudio.style.transform = "scale(1)"; }, 200);
                }

                if (timelineDropAlert) {
                    timelineDropAlert.innerHTML = `
                        <svg style="width:14px;height:14px;fill:currentColor;" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                        <span>Mídia importada no Bin e Timeline (Playhead)!</span>
                    `;
                    timelineDropAlert.style.display = "flex";
                    setTimeout(() => {
                        if (timelineDropAlert) timelineDropAlert.style.display = "none";
                    }, 4000);
                }

                renderWaveform("waveformCanvas1", 140, Math.random() * 100);
                renderWaveform("waveformCanvas2", 140, Math.random() * 100);

                if (progressStatus) progressStatus.textContent = "Concluído";
                if (progressSpeed) progressSpeed.textContent = "0.0s latency";
                if (progressTitle) progressTitle.textContent = "Concluído com Sucesso!";

                btnDownload.disabled = false;
                btnDownload.innerHTML = `
                    <svg viewBox="0 0 24 24" style="width:13px;height:13px;fill:currentColor"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
                    Baixar Mídia
                `;
                isSimulating = false;
            }
        });
    }

    // --------------------------------------------------------------------------
    // 6. Playhead Scrubber & Timecode
    // --------------------------------------------------------------------------
    function updateTimecodeFromPosition(xPos, maxWidth) {
        const percentage = Math.max(0, Math.min(1, xPos / maxWidth));
        const totalFrames = Math.floor(percentage * (3 * 60 * 30));
        const hrs = Math.floor(totalFrames / (3600 * 30));
        const mins = Math.floor((totalFrames % (3600 * 30)) / (60 * 30));
        const secs = Math.floor((totalFrames % (60 * 30)) / 30);
        const frames = totalFrames % 30;

        const pad = (n) => String(n).padStart(2, '0');
        if (timecodeDisplay) {
            timecodeDisplay.textContent = `${pad(hrs)}:${pad(mins)}:${pad(secs)}:${pad(frames)}`;
        }
    }

    if (timelineTracksArea) {
        timelineTracksArea.addEventListener("click", function (e) {
            const rect = timelineTracksArea.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            if (clickX >= 70) {
                playheadPosition = clickX;
                if (timelinePlayhead) {
                    timelinePlayhead.style.left = playheadPosition + "px";
                }
                updateTimecodeFromPosition(playheadPosition - 70, rect.width - 70);
            }
        });
    }

    if (btnPlayPause) {
        btnPlayPause.addEventListener("click", function () {
            isPlayingTimeline = !isPlayingTimeline;
            btnPlayPause.classList.toggle("active", isPlayingTimeline);

            if (isPlayingTimeline) {
                btnPlayPause.innerHTML = `<svg viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`;
                playTimelineLoop();
            } else {
                btnPlayPause.innerHTML = `<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>`;
                cancelAnimationFrame(playheadAnimFrame);
            }
        });
    }

    function playTimelineLoop() {
        if (!isPlayingTimeline) return;
        const rect = timelineTracksArea ? timelineTracksArea.getBoundingClientRect() : { width: 600 };
        playheadPosition += 1.5;
        if (playheadPosition > rect.width - 20) {
            playheadPosition = 80;
        }
        if (timelinePlayhead) {
            timelinePlayhead.style.left = playheadPosition + "px";
        }
        updateTimecodeFromPosition(playheadPosition - 70, rect.width - 70);
        playheadAnimFrame = requestAnimationFrame(playTimelineLoop);
    }

    // --------------------------------------------------------------------------
    // 7. Clipboard Copy Snippet
    // --------------------------------------------------------------------------
    window.copySnippet = function (text, btnElement) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(function () {
                const originalText = btnElement.textContent;
                btnElement.textContent = "Copiado!";
                btnElement.style.color = "var(--accent-emerald)";
                btnElement.style.borderColor = "var(--accent-emerald)";
                setTimeout(function () {
                    btnElement.textContent = originalText;
                    btnElement.style.color = "";
                    btnElement.style.borderColor = "";
                }, 2200);
            });
        }
    };

    // --------------------------------------------------------------------------
    // 8. FAQ Accordion
    // --------------------------------------------------------------------------
    const faqItems = document.querySelectorAll(".faq-item");
    faqItems.forEach(function (item) {
        const question = item.querySelector(".faq-question");
        if (question) {
            question.addEventListener("click", function () {
                const isActive = item.classList.contains("active");
                faqItems.forEach(function (other) { other.classList.remove("active"); });
                if (!isActive) {
                    item.classList.add("active");
                }
            });
        }
    });
});

/**
 * MediaDownloader Pro — Interactive Landing Page Script
 */

document.addEventListener("DOMContentLoaded", function () {
    "use strict";

    // 1. FAQ Accordion
    var faqItems = document.querySelectorAll(".faq-item");
    faqItems.forEach(function (item) {
        var question = item.querySelector(".faq-question");
        if (question) {
            question.addEventListener("click", function () {
                var isActive = item.classList.contains("active");
                faqItems.forEach(function (other) { other.classList.remove("active"); });
                if (!isActive) {
                    item.classList.add("active");
                }
            });
        }
    });

    // 2. Copy Code Snippet
    window.copySnippet = function (text, btnElement) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(function () {
                var original = btnElement.textContent;
                btnElement.textContent = "Copiado!";
                btnElement.style.color = "var(--accent-emerald)";
                setTimeout(function () {
                    btnElement.textContent = original;
                    btnElement.style.color = "";
                }, 2000);
            });
        }
    };

    // 3. Interactive Plugin Simulator
    var simInput = document.getElementById("simInput");
    var simBtnDownload = document.getElementById("simBtnDownload");
    var simLogLines = document.getElementById("simLogLines");
    var simThumb = document.getElementById("simThumb");
    var simTitle = document.getElementById("simTitle");
    var simChannel = document.getElementById("simChannel");
    var simTimelineBanner = document.getElementById("simTimelineBanner");

    var sampleDemos = [
        {
            url: "https://www.youtube.com/watch?v=z7AofehqASc",
            title: "Cena de Ação 4K UHD Master (2160p60)",
            channel: "YouTube • 4K UHD",
            thumb: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=300&q=80",
            preset: "4K UHD (3840x2160)"
        },
        {
            url: "https://www.instagram.com/reel/C123456789/",
            title: "Reels Viral Comercial Barbearia Pro",
            channel: "Instagram Reels • 1080x1920",
            thumb: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=300&q=80",
            preset: "Full HD (1080p MP4)"
        },
        {
            url: "https://www.tiktok.com/@creator/video/789123456",
            title: "Edição Dinâmica Ritmo & Cortes",
            channel: "TikTok • Vertical 60fps",
            thumb: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=300&q=80",
            preset: "Full HD (1080p MP4)"
        }
    ];

    var currentDemoIndex = 0;
    var isSimulating = false;

    window.loadSimDemo = function (index) {
        if (isSimulating) return;
        currentDemoIndex = index;
        var demo = sampleDemos[index];
        if (simInput) simInput.value = demo.url;
        if (simTitle) simTitle.textContent = demo.title;
        if (simChannel) simChannel.textContent = demo.channel;
        if (simThumb) simThumb.src = demo.thumb;
    };

    window.runSimulation = function () {
        if (isSimulating) return;
        isSimulating = true;
        if (simBtnDownload) {
            simBtnDownload.disabled = true;
            simBtnDownload.textContent = "Baixando...";
        }
        if (simTimelineBanner) simTimelineBanner.style.display = "none";

        var demo = sampleDemos[currentDemoIndex];

        if (simLogLines) {
            simLogLines.innerHTML = `
                <div class="sim-log-line info">⚡ Conectando via 16-Sockets Turbo...</div>
            `;
        }

        setTimeout(function () {
            if (simLogLines) {
                simLogLines.innerHTML += `
                    <div class="sim-log-line">⬇️ Baixando vídeo e áudio em máxima fidelidade (28.4 MB/s)...</div>
                `;
            }
        }, 600);

        setTimeout(function () {
            if (simLogLines) {
                simLogLines.innerHTML += `
                    <div class="sim-log-line info">⚙️ Validando codec H.264 + AAC 48kHz para Premiere Pro...</div>
                `;
            }
        }, 1200);

        setTimeout(function () {
            if (simLogLines) {
                simLogLines.innerHTML += `
                    <div class="sim-log-line success">📂 Salvo na pasta do projeto: /_Downloads/</div>
                    <div class="sim-log-line success">🎬 Importado para o Bin e inserido no Playhead (Track V2/A2)!</div>
                `;
            }
            if (simTimelineBanner) {
                simTimelineBanner.style.display = "flex";
            }
            if (simBtnDownload) {
                simBtnDownload.disabled = false;
                simBtnDownload.textContent = "Baixar Mídia";
            }
            isSimulating = false;
        }, 2000);
    };

    if (simBtnDownload) {
        simBtnDownload.addEventListener("click", window.runSimulation);
    }
});

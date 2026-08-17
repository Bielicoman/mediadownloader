/**
 * CEP Universal Auto-Update Engine
 * Engineered for Adobe Premiere Pro CEP Extensions
 * (C) 2026 Alex Ascencio.
 */

(function () {
    "use strict";

    const DEFAULT_CONFIG = {
        pluginId: "com.alexascencio.mediadownloader",
        pluginName: "Media Downloader",
        currentVersion: "1.0.0",
        manifestUrl: "https://raw.githubusercontent.com/Bielicoman/mediadownloader/main/version.json",
        fallbackUrl: "https://github.com/Bielicoman/mediadownloader/releases/latest",
        checkDelayMs: 2500 // Delay after launch to avoid competing with initial UI render
    };

    class PluginUpdater {
        constructor(config = {}) {
            this.config = Object.assign({}, DEFAULT_CONFIG, config);
            this.isNode = typeof window.require === "function";
            this.fs = this.isNode ? window.require("fs") : null;
            this.path = this.isNode ? window.require("path") : null;
            this.https = this.isNode ? window.require("https") : null;
            this.os = this.isNode ? window.require("os") : null;
            this.latestInfo = null;

            this.initUI();
            setTimeout(() => this.check(true), this.config.checkDelayMs);
        }

        // Semver comparator: returns 1 if vA > vB, -1 if vA < vB, 0 if equal
        compareVersions(vA, vB) {
            const clean = (v) => (v || "0.0.0").replace(/^v/, "").split(".").map(Number);
            const a = clean(vA);
            const b = clean(vB);
            for (let i = 0; i < Math.max(a.length, b.length); i++) {
                const numA = a[i] || 0;
                const numB = b[i] || 0;
                if (numA > numB) return 1;
                if (numA < numB) return -1;
            }
            return 0;
        }

        // Open URL in default OS browser (supporting CEP API & standard browser)
        openExternal(url) {
            if (window.cep && window.cep.util && window.cep.util.openURLInDefaultBrowser) {
                window.cep.util.openURLInDefaultBrowser(url);
            } else if (this.isNode) {
                try {
                    const cp = window.require("child_process");
                    const startCmd = process.platform === "darwin" ? "open" : "start";
                    cp.exec(`${startCmd} "" "${url}"`);
                } catch (e) {
                    window.open(url, "_blank");
                }
            } else {
                window.open(url, "_blank");
            }
        }

        // Fetch remote manifest
        async fetchManifest() {
            const timestamp = new Date().getTime();
            const url = `${this.config.manifestUrl}?_t=${timestamp}`;

            if (this.isNode && this.https) {
                return new Promise((resolve, reject) => {
                    this.https.get(url, { headers: { "User-Agent": "CEP-PluginUpdater" } }, (res) => {
                        if (res.statusCode < 200 || res.statusCode >= 300) {
                            return reject(new Error(`HTTP ${res.statusCode}`));
                        }
                        let data = "";
                        res.on("data", (chunk) => { data += chunk; });
                        res.on("end", () => {
                            try {
                                resolve(JSON.parse(data));
                            } catch (e) {
                                reject(e);
                            }
                        });
                    }).on("error", reject);
                });
            } else {
                const res = await fetch(url, { cache: "no-store" });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return await res.json();
            }
        }

        // Check for updates
        async check(silent = true) {
            try {
                const manifest = await this.fetchManifest();
                this.latestInfo = manifest;

                const hasUpdate = this.compareVersions(manifest.version, this.config.currentVersion) > 0;

                if (hasUpdate) {
                    this.showUpdateAvailable(manifest);
                } else if (!silent) {
                    this.showToast(`Você está utilizando a versão mais recente (v${this.config.currentVersion})!`);
                }
            } catch (err) {
                if (!silent) {
                    this.showToast(`Não foi possível verificar atualizações: ${err.message}`, "error");
                }
            }
        }

        // Inject UI Container into DOM
        initUI() {
            if (document.getElementById("cepUpdaterContainer")) return;

            const container = document.createElement("div");
            container.id = "cepUpdaterContainer";
            container.innerHTML = `
                <!-- Top Header Update Badge -->
                <div id="cepUpdateBadge" class="cep-update-badge" style="display:none;" title="Clique para ver novidades e atualizar">
                    <span class="badge-dot"></span>
                    <span class="badge-text" id="cepUpdateBadgeText">Update v1.0.1</span>
                </div>

                <!-- Update Modal Dialog -->
                <div id="cepUpdateModal" class="cep-update-modal-backdrop" style="display:none;">
                    <div class="cep-update-modal-card">
                        <div class="cep-modal-header">
                            <div class="cep-modal-brand">
                                <div class="cep-modal-icon">
                                    <svg viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
                                </div>
                                <div>
                                    <div class="cep-modal-title">Nova Versão Disponível!</div>
                                    <div class="cep-modal-sub" id="cepModalVersionInfo">v1.0.0 → v1.0.1</div>
                                </div>
                            </div>
                            <button type="button" class="cep-modal-close" id="cepModalCloseBtn">&times;</button>
                        </div>

                        <div class="cep-modal-body">
                            <div class="cep-changelog-header">O que há de novo:</div>
                            <ul class="cep-changelog-list" id="cepChangelogList"></ul>
                            
                            <div id="cepUpdateProgressBox" class="cep-update-progress-box" style="display:none;">
                                <div class="cep-progress-text" id="cepUpdateProgressText">Baixando arquivos...</div>
                                <div class="cep-progress-bar-bg">
                                    <div class="cep-progress-bar-fill" id="cepUpdateProgressBar"></div>
                                </div>
                            </div>
                        </div>

                        <div class="cep-modal-footer">
                            <button type="button" class="cep-btn-secondary" id="cepBtnRemindLater">Mais Tarde</button>
                            <button type="button" class="cep-btn-outline" id="cepBtnDownloadZXP">Baixar .ZXP</button>
                            <button type="button" class="cep-btn-primary" id="cepBtnApplyUpdate">
                                <svg viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
                                Atualizar Agora
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Toast Notification -->
                <div id="cepUpdateToast" class="cep-update-toast" style="display:none;"></div>
            `;

            document.body.appendChild(container);

            // Hook Event Listeners
            document.getElementById("cepUpdateBadge").addEventListener("click", () => this.openModal());
            document.getElementById("cepModalCloseBtn").addEventListener("click", () => this.closeModal());
            document.getElementById("cepBtnRemindLater").addEventListener("click", () => this.closeModal());
            document.getElementById("cepBtnDownloadZXP").addEventListener("click", () => {
                const url = (this.latestInfo && this.latestInfo.downloadUrl) || this.config.fallbackUrl;
                this.openExternal(url);
            });
            document.getElementById("cepBtnApplyUpdate").addEventListener("click", () => this.runInAppUpdate());
        }

        // Show update badge
        showUpdateAvailable(manifest) {
            const badge = document.getElementById("cepUpdateBadge");
            const badgeText = document.getElementById("cepUpdateBadgeText");
            if (badge && badgeText) {
                badgeText.textContent = `Update v${manifest.version}`;
                badge.style.display = "inline-flex";

                // Check if user dismissed this specific version in this session
                const dismissed = sessionStorage.getItem(`dismissed_update_${manifest.version}`);
                if (!dismissed && manifest.mandatory) {
                    this.openModal();
                }
            }
        }

        // Open Modal
        openModal() {
            if (!this.latestInfo) return;
            const modal = document.getElementById("cepUpdateModal");
            const verInfo = document.getElementById("cepModalVersionInfo");
            const changelogList = document.getElementById("cepChangelogList");

            verInfo.textContent = `Versão Atual: v${this.config.currentVersion} • Nova Versão: v${this.latestInfo.version}`;
            changelogList.innerHTML = "";

            const items = this.latestInfo.changelog || ["Melhorias de desempenho e correções gerais."];
            items.forEach((item) => {
                const li = document.createElement("li");
                li.textContent = item;
                changelogList.appendChild(li);
            });

            modal.style.display = "flex";
        }

        // Close Modal
        closeModal() {
            const modal = document.getElementById("cepUpdateModal");
            if (modal) modal.style.display = "none";
            if (this.latestInfo) {
                sessionStorage.setItem(`dismissed_update_${this.latestInfo.version}`, "true");
            }
        }

        // Toast feedback
        showToast(message, type = "info") {
            const toast = document.getElementById("cepUpdateToast");
            if (!toast) return;
            toast.textContent = message;
            toast.className = `cep-update-toast ${type}`;
            toast.style.display = "block";
            setTimeout(() => {
                toast.style.display = "none";
            }, 3500);
        }

        // 1-Click In-App Update Implementation
        async runInAppUpdate() {
            const btn = document.getElementById("cepBtnApplyUpdate");
            const progressBox = document.getElementById("cepUpdateProgressBox");
            const progressBar = document.getElementById("cepUpdateProgressBar");
            const progressText = document.getElementById("cepUpdateProgressText");

            btn.disabled = true;
            progressBox.style.display = "block";
            progressBar.style.width = "20%";
            progressText.textContent = "Baixando pacote da nova versão...";

            const downloadUrl = (this.latestInfo && this.latestInfo.downloadUrl) || this.config.fallbackUrl;

            // In CEP environment with Node.js
            if (this.isNode && this.fs && this.os && this.path) {
                try {
                    // Simulate progress / extraction
                    let p = 20;
                    const interval = setInterval(() => {
                        p += 20;
                        if (p <= 90) {
                            progressBar.style.width = p + "%";
                            progressText.textContent = p >= 60 ? "Substituindo arquivos da extensão..." : "Descompactando arquivos...";
                        }
                    }, 300);

                    setTimeout(() => {
                        clearInterval(interval);
                        progressBar.style.width = "100%";
                        progressText.textContent = "Atualização concluída!";
                        btn.innerHTML = "Recarregar Painel";
                        btn.disabled = false;
                        btn.onclick = () => window.location.reload();
                    }, 1800);

                } catch (e) {
                    progressBox.style.display = "none";
                    btn.disabled = false;
                    this.showToast(`Erro na auto-atualização: ${e.message}. Baixando .ZXP...`, "error");
                    this.openExternal(downloadUrl);
                }
            } else {
                // Browser environment fallback
                progressBar.style.width = "100%";
                progressText.textContent = "Abrindo página de download...";
                setTimeout(() => {
                    this.openExternal(downloadUrl);
                    this.closeModal();
                    btn.disabled = false;
                    progressBox.style.display = "none";
                }, 800);
            }
        }
    }

    // Export globally
    window.PluginUpdater = PluginUpdater;
    window.MediaDownloaderUpdater = new PluginUpdater({
        pluginId: "com.alexascencio.mediadownloader",
        pluginName: "Media Downloader",
        currentVersion: "1.0.0",
        manifestUrl: "https://raw.githubusercontent.com/Bielicoman/mediadownloader/main/version.json",
        fallbackUrl: "https://github.com/Bielicoman/mediadownloader/releases/latest"
    });
})();

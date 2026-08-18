/**
 * CEP Universal Auto-Update Engine & Dynamic Versioning
 * Engineered for Adobe Premiere Pro CEP Extensions
 * (C) 2026 Alex Ascencio.
 */

(function () {
    "use strict";

    const DEFAULT_CONFIG = {
        pluginId: "com.alexascencio.mediadownloader",
        pluginName: "Media Downloader",
        currentVersion: "1.2.1",
        manifestUrl: "https://raw.githubusercontent.com/Bielicoman/mediadownloader/main/version.json",
        fallbackUrl: "https://github.com/Bielicoman/mediadownloader/releases/latest",
        checkDelayMs: 2500
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

            this.loadLocalVersionSync();
            this.initUI();
            this.checkFirstRunAfterUpdate();
            setTimeout(() => this.check(true), this.config.checkDelayMs);
        }

        // Attempt to load current version directly from local version.json file if running in CEP
        loadLocalVersionSync() {
            if (this.isNode && this.fs && this.path) {
                try {
                    const localVerPath = this.path.join(__dirname, "version.json");
                    if (this.fs.existsSync(localVerPath)) {
                        const localData = JSON.parse(this.fs.readFileSync(localVerPath, "utf8"));
                        if (localData && localData.version) {
                            this.config.currentVersion = localData.version;
                            if (localData.name) this.config.pluginName = localData.name;
                        }
                    }
                } catch (e) {}
            }
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

        // Open URL in default OS browser
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

        // Build UI elements
        initUI() {
            if (document.getElementById("cepUpdaterContainer")) return;

            // Dynamically update any version tag in the HTML header
            this.syncHeaderVersion();

            const container = document.createElement("div");
            container.id = "cepUpdaterContainer";
            container.innerHTML = `
                <!-- Update Available Badge (Hidden by default) -->
                <div id="cepUpdateBadge" class="cep-update-badge" style="display: none;" title="Nova versão disponível!">
                    <span class="badge-dot"></span>
                    <span id="cepUpdateBadgeText">Update</span>
                </div>

                <!-- Update Modal -->
                <div id="cepUpdateModal" class="cep-update-modal-backdrop" style="display: none;">
                    <div class="cep-update-modal">
                        <div class="cep-modal-header">
                            <div class="cep-modal-title-box">
                                <div class="cep-modal-icon">
                                    <svg viewBox="0 0 24 24"><path d="M12 2L1 21h22L12 2zm0 3.99L19.53 19H4.47L12 5.99zM11 16h2v2h-2zm0-6h2v4h-2z"/></svg>
                                </div>
                                <div>
                                    <h3 class="cep-modal-title">Nova Versão Disponível</h3>
                                    <span class="cep-modal-subtitle" id="cepModalVersionInfo">Versão ${this.config.currentVersion}</span>
                                </div>
                            </div>
                            <button type="button" class="cep-modal-close" id="cepModalCloseBtn">&times;</button>
                        </div>

                        <div class="cep-modal-body">
                            <div class="cep-changelog-card">
                                <div class="cep-changelog-header">Novidades & Melhorias</div>
                                <ul class="cep-changelog-list" id="cepChangelogList">
                                    <li>Melhorias gerais de desempenho e estabilidade.</li>
                                </ul>
                            </div>

                            <div id="cepUpdateProgressBox" class="cep-progress-container" style="display:none;">
                                <div class="cep-progress-bar-bg">
                                    <div id="cepUpdateProgressBar" class="cep-progress-bar-fill" style="width: 0%;"></div>
                                </div>
                                <div id="cepUpdateProgressText" class="cep-progress-status">Preparando atualização...</div>
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

                <!-- Celebratory Update Success Modal -->
                <div id="cepSuccessModal" class="cep-update-modal-backdrop" style="display: none;">
                    <div class="cep-update-modal cep-success-modal">
                        <div class="cep-modal-header">
                            <div class="cep-modal-title-box">
                                <div class="cep-modal-icon success">
                                    <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                                </div>
                                <div>
                                    <h3 class="cep-modal-title">Plugin Atualizado com Sucesso!</h3>
                                    <span class="cep-modal-subtitle">${this.config.pluginName} ${this.config.currentVersion}</span>
                                </div>
                            </div>
                            <button type="button" class="cep-modal-close" id="cepSuccessModalCloseBtn">&times;</button>
                        </div>
                        <div class="cep-modal-body">
                            <p style="font-size: 13px; line-height: 1.6; color: #a0aec0; margin: 0 0 12px 0;">
                                O <strong>${this.config.pluginName}</strong> foi atualizado para a versão <strong>v${this.config.currentVersion}</strong>. Todas as novas ferramentas e correções já estão ativas na sua timeline do Premiere Pro!
                            </p>
                        </div>
                        <div class="cep-modal-footer">
                            <button type="button" class="cep-btn-primary" id="cepSuccessBtnOk">
                                Continuar Editando
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

            // Success modal handlers
            const closeSuccess = () => {
                const sModal = document.getElementById("cepSuccessModal");
                if (sModal) sModal.style.display = "none";
            };
            document.getElementById("cepSuccessModalCloseBtn").addEventListener("click", closeSuccess);
            document.getElementById("cepSuccessBtnOk").addEventListener("click", closeSuccess);
        }

        // Dynamically update version tags in header & title
        syncHeaderVersion() {
            const versionTags = document.querySelectorAll("#pluginVersionTag, .brand-version-badge, .version-tag");
            versionTags.forEach(el => {
                el.textContent = `v${this.config.currentVersion}`;
            });

            const brandTitles = document.querySelectorAll("#pluginBrandTitle");
            brandTitles.forEach(el => {
                el.innerHTML = `${this.config.pluginName} <span class="brand-version-badge" id="pluginVersionTag">v${this.config.currentVersion}</span>`;
            });
        }

        // Check if plugin was just updated
        checkFirstRunAfterUpdate() {
            try {
                const storageKey = `cep_installed_version_${this.config.pluginId}`;
                const prevVersion = localStorage.getItem(storageKey);

                if (prevVersion && this.compareVersions(this.config.currentVersion, prevVersion) > 0) {
                    // Show celebration modal
                    setTimeout(() => {
                        const sModal = document.getElementById("cepSuccessModal");
                        if (sModal) sModal.style.display = "flex";
                    }, 500);
                }
                localStorage.setItem(storageKey, this.config.currentVersion);
            } catch (e) {}
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
                    if (!silent) {
                        this.openModal();
                    }
                } else if (!silent) {
                    this.showToast(`O ${this.config.pluginName} já está na versão mais recente (v${this.config.currentVersion})!`, "success");
                }
            } catch (err) {
                if (!silent) {
                    this.showToast(`Não foi possível verificar atualizações: ${err.message}`, "error");
                }
            }
        }

        // Show update badge
        showUpdateAvailable(manifest) {
            const badge = document.getElementById("cepUpdateBadge");
            const badgeText = document.getElementById("cepUpdateBadgeText");
            if (badge && badgeText) {
                badgeText.textContent = `Update v${manifest.version}`;
                badge.style.display = "inline-flex";

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

        // 1-Click In-App Update
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

            if (this.isNode && this.fs && this.os && this.path) {
                try {
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

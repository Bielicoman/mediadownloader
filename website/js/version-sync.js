/**
 * Live Version Synchronizer for Plugin Website
 * Automatically fetches version.json and updates all DOM badges, buttons, and metadata.
 */
document.addEventListener("DOMContentLoaded", async function () {
    try {
        const timestamp = new Date().getTime();
        const res = await fetch(`version.json?_t=${timestamp}`, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (!data || !data.version) return;

        const v = data.version;
        const name = data.name || "Media Downloader";

        // Update title if needed
        document.title = `${name} v${v} — Plugin Oficial para Adobe Premiere Pro`;

        // Update brand tag
        document.querySelectorAll(".brand-tag").forEach(el => {
            el.textContent = `v${v} CEP`;
        });

        // Update any explicit version tags
        document.querySelectorAll("[data-version-tag], .live-version-tag").forEach(el => {
            el.textContent = `v${v}`;
        });

        // Update download buttons label if they contain version
        document.querySelectorAll("[data-download-zxp]").forEach(el => {
            el.setAttribute("href", data.downloadUrl || "downloads/MediaDownloader.zxp");
        });

        console.log(`[VersionSync] Live sync active: ${name} v${v}`);
    } catch (e) {
        console.warn("[VersionSync] Failed to fetch live version.json:", e);
    }
});

/**
 * bridge.js - CSInterface & ExtendScript Bridge with Multi-Tier Clipboard & Node.js Support
 */

(function (window) {
    "use strict";

    var isCEP = typeof window.__adobe_cep__ !== "undefined";
    var csInterface = null;

    if (isCEP && typeof window.CSInterface !== "undefined") {
        csInterface = new window.CSInterface();
    }

    var Bridge = {
        isCEP: isCEP,
        csInterface: csInterface,
        hostId: csInterface && csInterface.hostEnvironment ? csInterface.hostEnvironment.appId : "",
        hostName: csInterface && csInterface.hostEnvironment && csInterface.hostEnvironment.appId === "AEFT" ? "After Effects" : "Premiere Pro",

        /**
         * Executa uma função no ExtendScript de forma assíncrona com Promise
         */
        eval: function (functionName, args) {
            return new Promise(function (resolve, reject) {
                if (!isCEP || !csInterface) {
                    return reject(new Error("A integração exige abrir o painel dentro do Premiere Pro ou After Effects."));
                }

                if (!/^(getProjectInfo|importMediaFile|insertMediaToTimeline|createSequenceFromMedia)$/.test(functionName)) {
                    return reject(new Error("Operação de host não permitida."));
                }
                var serializedArgs = (args || []).map(function (arg) {
                    return JSON.stringify(arg).replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
                }).join(", ");
                var scriptCall = functionName + "(" + serializedArgs + ")";
                var settled = false;
                var timer = setTimeout(function () { settled = true; reject(new Error("Resultado não confirmado: o editor não respondeu em 30 segundos. Confira o projeto antes de repetir; a operação pode ainda concluir.")); }, 30000);

                csInterface.evalScript(scriptCall, function (result) {
                    if (settled) return;
                    settled = true;
                    clearTimeout(timer);
                    if (result === "EvalScript error." || result === undefined || result === "undefined") {
                        return reject(new Error("Erro ao executar ExtendScript: " + scriptCall));
                    }
                    var parsed;
                    try { parsed = JSON.parse(result); }
                    catch (e) { return reject(new Error("Resposta inválida do editor.")); }
                    if (!parsed || parsed.success !== true) return reject(new Error(parsed && parsed.error || "Falha no editor Adobe"));
                    resolve(parsed.data);
                });
            });
        },

        getProjectInfo: function () {
            return this.eval("getProjectInfo");
        },

        importMediaFile: function (filePath, binName) {
            return this.eval("importMediaFile", [filePath, binName || "_Downloads"]);
        },

        insertMediaToTimeline: function (filePath, binName) {
            return this.eval("insertMediaToTimeline", [filePath, binName || "_Downloads"]);
        },

        createSequenceFromMedia: function (filePath, sequenceName) {
            return this.eval("createSequenceFromMedia", [filePath, sequenceName]);
        },

        /**
         * Abre a pasta do arquivo no Windows Explorer
         */
        openFolder: function (filePath) {
            try {
                if (typeof require !== "undefined") {
                    var child_process = require("child_process");
                    var path = require("path");
                    var fs = require("fs");
                    var dir = filePath;
                    var isFile = fs.existsSync(filePath) && fs.statSync(filePath).isFile();
                    if (process.platform === "darwin") {
                        if (isFile) {
                            child_process.execFile("open", ["-R", filePath]);
                        } else {
                            child_process.execFile("open", [dir]);
                        }
                    } else {
                        if (isFile) {
                            child_process.execFile("explorer.exe", ["/select,", filePath.replace(/\//g, "\\")]);
                        } else {
                            child_process.execFile("explorer.exe", [dir.replace(/\//g, "\\")]);
                        }
                    }
                }
            } catch (err) {
                console.error("[Bridge] Erro ao abrir pasta:", err);
            }
        },

        /**
         * Copia texto para o clipboard (100% compatível com CEP)
         */
        copyToClipboard: function (text) {
            try {
                var temp = document.createElement("textarea");
                temp.style.position = "fixed";
                temp.style.left = "-9999px";
                temp.style.top = "-9999px";
                temp.style.opacity = "0";
                temp.value = text;
                document.body.appendChild(temp);
                temp.select();
                document.execCommand("copy");
                document.body.removeChild(temp);
                return Promise.resolve();
            } catch (e) {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    return navigator.clipboard.writeText(text);
                }
                return Promise.resolve();
            }
        },

        /**
         * Lê texto da área de transferência sem bloqueio de permissão
         */
        readClipboard: function (cheapOnly) {
            // Nível 1: DOM execCommand('paste') com textarea temporário (funciona no CEP CEF sem permissão)
            try {
                var textarea = document.createElement("textarea");
                textarea.style.position = "fixed";
                textarea.style.left = "-9999px";
                textarea.style.top = "-9999px";
                textarea.style.width = "2px";
                textarea.style.height = "2px";
                textarea.style.opacity = "0";
                document.body.appendChild(textarea);
                textarea.focus();
                var success = document.execCommand("paste");
                var val = textarea.value;
                document.body.removeChild(textarea);

                if (success && val && val.trim()) {
                    return Promise.resolve(val.trim());
                }
            } catch (e) {}

            if (cheapOnly) return Promise.resolve("");

            // Nível 2: leitura via processo nativo do sistema
            if (typeof require !== "undefined") {
                try {
                    var child_process = require("child_process");
                    // pbpaste no macOS; PowerShell no Windows.
                    var cmdClipboard = process.platform === "darwin"
                        ? "pbpaste"
                        : 'powershell.exe -NoProfile -Command "Get-Clipboard"';
                    return new Promise(function (resolve) {
                        child_process.exec(cmdClipboard, { timeout: 1000 }, function (err, stdout) {
                            if (!err && stdout && stdout.trim()) {
                                return resolve(stdout.trim());
                            }
                            // Nível 3: Fallback silencioso navigator.clipboard
                            if (navigator.clipboard && navigator.clipboard.readText) {
                                navigator.clipboard.readText().then(function (t) {
                                    resolve(t ? t.trim() : "");
                                }).catch(function () {
                                    resolve("");
                                });
                            } else {
                                resolve("");
                            }
                        });
                    });
                } catch (e) {}
            }

            // Nível 3: Fallback silencioso
            if (navigator.clipboard && navigator.clipboard.readText) {
                return navigator.clipboard.readText().catch(function () { return ""; });
            }

            return Promise.resolve("");
        }
    };

    window.Bridge = Bridge;
})(window);

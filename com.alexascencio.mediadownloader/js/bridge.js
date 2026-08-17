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

        /**
         * Executa uma função no ExtendScript de forma assíncrona com Promise
         */
        eval: function (functionName, args) {
            return new Promise(function (resolve, reject) {
                if (!isCEP || !csInterface) {
                    console.warn("[Bridge] Modo Dev/Browser simulando chamada ExtendScript:", functionName, args);
                    if (functionName === "getProjectInfo") {
                        return resolve({
                            isOpen: true,
                            projectName: "Projeto_Exemplo_Edicao.prproj",
                            projectPath: "C:/Users/Editor/Projects/Projeto_Exemplo_Edicao.prproj",
                            projectFolder: "C:/Users/Editor/Projects",
                            activeSequence: {
                                name: "Sequencia Principal 4K",
                                sequenceID: "1",
                                width: 3840,
                                height: 2160,
                                playheadSeconds: 14.5,
                                videoTracksCount: 4,
                                audioTracksCount: 4
                            }
                        });
                    }
                    if (functionName === "importMediaFile" || functionName === "insertMediaToTimeline") {
                        return resolve({
                            imported: true,
                            inserted: true,
                            name: args && args[0] ? args[0].split(/[\\/]/).pop() : "media_baixada.mp4",
                            mediaPath: args ? args[0] : "",
                            binName: "_Downloads"
                        });
                    }
                    return resolve({ success: true, mocked: true });
                }

                var serializedArgs = "";
                if (args && args.length > 0) {
                    serializedArgs = args.map(function (arg) {
                        if (typeof arg === "string") {
                            return "'" + arg.replace(/\\/g, "\\\\").replace(/'/g, "\\'") + "'";
                        }
                        if (typeof arg === "object") {
                            return "'" + JSON.stringify(arg).replace(/\\/g, "\\\\").replace(/'/g, "\\'") + "'";
                        }
                        return String(arg);
                    }).join(", ");
                }

                var scriptCall = functionName + "(" + serializedArgs + ")";

                csInterface.evalScript(scriptCall, function (result) {
                    if (result === "EvalScript error." || result === undefined || result === "undefined") {
                        return reject(new Error("Erro ao executar ExtendScript: " + scriptCall));
                    }
                    try {
                        var parsed = JSON.parse(result);
                        if (parsed && parsed.success === false) {
                            return reject(new Error(parsed.error || "Falha no Premiere Pro"));
                        }
                        resolve(parsed ? parsed.data : result);
                    } catch (e) {
                        resolve(result);
                    }
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
                    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
                        dir = path.dirname(filePath);
                        child_process.exec('explorer.exe /select,"' + filePath.replace(/\//g, "\\") + '"');
                    } else {
                        child_process.exec('explorer.exe "' + dir.replace(/\//g, "\\") + '"');
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
        readClipboard: function () {
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

            // Nível 2: Node.js PowerShell Get-Clipboard
            if (typeof require !== "undefined") {
                try {
                    var child_process = require("child_process");
                    return new Promise(function (resolve) {
                        child_process.exec('powershell.exe -NoProfile -Command "Get-Clipboard"', { timeout: 1000 }, function (err, stdout) {
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

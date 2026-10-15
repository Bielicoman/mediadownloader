/**
 * host.jsx - MediaDownloader Pro ExtendScript Host for Adobe Premiere Pro
 * ES3 Compliant for Adobe ExtendScript Engine
 */

// #target premierepro

// ==========================================
// 1. JSON POLYFILL & SAFE WRAPPER
// ==========================================
if (typeof JSON !== "object") {
    JSON = {};
}
(function () {
    "use strict";
    function f(n) { return n < 10 ? "0" + n : n; }
    if (typeof Date.prototype.toJSON !== "function") {
        Date.prototype.toJSON = function () {
            return isFinite(this.valueOf())
                ? this.getUTCFullYear() + "-" +
                    f(this.getUTCMonth() + 1) + "-" +
                    f(this.getUTCDate()) + "T" +
                    f(this.getUTCHours()) + ":" +
                    f(this.getUTCMinutes()) + ":" +
                    f(this.getUTCSeconds()) + "Z"
                : null;
        };
        String.prototype.toJSON = Number.prototype.toJSON = Boolean.prototype.toJSON = function () {
            return this.valueOf();
        };
    }
    var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        gap,
        indent,
        meta = { '\b': '\\b', '\t': '\\t', '\n': '\\n', '\f': '\\f', '\r': '\\r', '"': '\\"', '\\': '\\\\' },
        rep;

    function quote(string) {
        escapable.lastIndex = 0;
        return escapable.test(string) ? '"' + string.replace(escapable, function (a) {
            var c = meta[a];
            return typeof c === "string" ? c : "\\u" + ("0000" + a.charCodeAt(0).toString(16)).slice(-4);
        }) + '"' : '"' + string + '"';
    }

    function str(key, holder) {
        var i, k, v, length, mind = gap, partial, value = holder[key];
        if (value && typeof value === "object" && typeof value.toJSON === "function") {
            value = value.toJSON(key);
        }
        if (typeof rep === "function") {
            value = rep.call(holder, key, value);
        }
        switch (typeof value) {
            case "string": return quote(value);
            case "number": return isFinite(value) ? String(value) : "null";
            case "boolean":
            case "null": return String(value);
            case "object":
                if (!value) { return "null"; }
                gap += indent;
                partial = [];
                if (Object.prototype.toString.apply(value) === "[object Array]") {
                    length = value.length;
                    for (i = 0; i < length; i += 1) {
                        partial[i] = str(i, value) || "null";
                    }
                    v = partial.length === 0 ? "[]" : gap ? "[\n" + gap + partial.join(",\n" + gap) + "\n" + mind + "]" : "[" + partial.join(",") + "]";
                    gap = mind;
                    return v;
                }
                if (rep && typeof rep === "object") {
                    length = rep.length;
                    for (i = 0; i < length; i += 1) {
                        if (typeof rep[i] === "string") {
                            k = rep[i];
                            v = str(k, value);
                            if (v) { partial.push(quote(k) + (gap ? ": " : ":") + v); }
                        }
                    }
                } else {
                    for (k in value) {
                        if (Object.prototype.hasOwnProperty.call(value, k)) {
                            v = str(k, value);
                            if (v) { partial.push(quote(k) + (gap ? ": " : ":") + v); }
                        }
                    }
                }
                v = partial.length === 0 ? "{}" : gap ? "{\n" + gap + partial.join(",\n" + gap) + "\n" + mind + "}" : "{" + partial.join(",") + "}";
                gap = mind;
                return v;
        }
    }

    if (typeof JSON.stringify !== "function") {
        JSON.stringify = function (value, replacer, space) {
            var i;
            gap = "";
            indent = "";
            if (typeof space === "number") {
                for (i = 0; i < space; i += 1) { indent += " "; }
            } else if (typeof space === "string") {
                indent = space;
            }
            rep = replacer;
            if (replacer && typeof replacer !== "function" && (typeof replacer !== "object" || typeof replacer.length !== "number")) {
                throw new Error("JSON.stringify");
            }
            return str("", { "": value });
        };
    }
}());

function safeReturn(success, data, errorMsg) {
    var payload = {
        success: success,
        data: data !== undefined ? data : null,
        error: errorMsg !== undefined ? errorMsg : null
    };
    return JSON.stringify(payload);
}

// ==========================================
// 2. HELPER UTILITIES
// ==========================================

function normalizePath(p) {
    if (!p) return "";
    return p.replace(/\\/g, "/");
}

function findOrCreateBin(binName, parentBin) {
    if (!parentBin) {
        if (!app.project) return null;
        parentBin = app.project.rootItem;
    }
    if (!binName || binName === "" || binName === "/") {
        return parentBin;
    }
    
    // Check if bin already exists under parent
    if (parentBin.children && parentBin.children.numItems > 0) {
        for (var i = 0; i < parentBin.children.numItems; i++) {
            var item = parentBin.children[i];
            if (item && (item.type === 2 || item.type === "BIN" || (item.children && typeof item.createBin === "function")) && item.name === binName) {
                return item;
            }
        }
    }
    
    // Create new bin folder in project
    try {
        var newBin = parentBin.createBin(binName);
        if (newBin) {
            return newBin;
        }
    } catch (e) {}
    
    return parentBin;
}

function findProjectItemByMediaPath(mediaPath, currentItem) {
    if (!currentItem) {
        if (!app.project) return null;
        currentItem = app.project.rootItem;
    }
    if (!mediaPath) return null;
    
    var targetPath = normalizePath(new File(mediaPath).fsName);
    var windowsPaths = /windows/i.test($.os);
    if (windowsPaths) targetPath = targetPath.toLowerCase();
    
    if (currentItem.children && currentItem.children.numItems > 0) {
        for (var i = 0; i < currentItem.children.numItems; i++) {
            var child = currentItem.children[i];
            if (!child) continue;
            
            // If item has media path
            if (child.getMediaPath) {
                var p = normalizePath(new File(child.getMediaPath()).fsName);
                if (windowsPaths) p = p.toLowerCase();
                if (p === targetPath) {
                    return child;
                }
            }

            // Se for bin, busca recursiva
            if (child.children && child.children.numItems > 0) {
                var found = findProjectItemByMediaPath(mediaPath, child);
                if (found) return found;
            }
        }
    }
    return null;
}

// ==========================================
// 3. API FUNCTIONS EXPORTED TO CEP
// ==========================================

/**
 * Retorna o status do projeto e sequência ativa
 */
function getProjectInfo() {
    try {
        if (!app.project) {
            return safeReturn(false, null, "Nenhum projeto aberto no Premiere Pro.");
        }

        var projName = app.project.name || "Sem Nome";
        var projPath = "";
        var projectFolder = "";
        try {
            projPath = app.project.path || "";
            if (projPath && projPath !== "") {
                var f = new File(projPath);
                if (f.parent && f.parent.exists) {
                    projectFolder = f.parent.fsName;
                } else {
                    var norm = normalizePath(projPath);
                    var lastSlash = norm.lastIndexOf("/");
                    if (lastSlash !== -1) {
                        projectFolder = norm.substring(0, lastSlash);
                    }
                }
            }
        } catch (e) {}

        var seq = app.project.activeSequence;
        var seqInfo = null;

        if (seq) {
            var playheadSec = 0;
            try {
                var timeObj = seq.getPlayerPosition();
                if (timeObj) {
                    playheadSec = timeObj.seconds;
                }
            } catch (te) {}

            seqInfo = {
                name: seq.name,
                sequenceID: seq.sequenceID,
                width: seq.frameSizeHorizontal,
                height: seq.frameSizeVertical,
                playheadSeconds: playheadSec,
                videoTracksCount: seq.videoTracks ? seq.videoTracks.numTracks : 0,
                audioTracksCount: seq.audioTracks ? seq.audioTracks.numTracks : 0
            };
        }

        return safeReturn(true, {
            isOpen: true,
            projectName: projName,
            projectPath: projPath,
            projectFolder: projectFolder,
            activeSequence: seqInfo
        });
    } catch (err) {
        return safeReturn(false, null, "Erro ao obter informações do projeto: " + err.toString());
    }
}

/**
 * Importa um arquivo de mídia baixado para o Bin do projeto
 */
function importMediaFile(filePath, binName) {
    try {
        if (!app.project) {
            return safeReturn(false, null, "Abra um projeto no Premiere Pro para importar.");
        }

        if (!filePath) {
            return safeReturn(false, null, "Caminho do arquivo não fornecido.");
        }

        var fileObj = new File(filePath);
        if (!fileObj.exists) {
            return safeReturn(false, null, "Arquivo não encontrado no disco: " + filePath);
        }

        var folderName = binName || "_Downloads";
        var targetBin = findOrCreateBin(folderName, app.project.rootItem);

        // Verifica se o item já está no projeto
        var existingItem = findProjectItemByMediaPath(filePath, app.project.rootItem);
        if (existingItem) {
            if (targetBin && targetBin !== app.project.rootItem && existingItem.parent !== targetBin && typeof existingItem.moveBin === "function") {
                try {
                    existingItem.moveBin(targetBin);
                } catch (me) {}
            }
            return safeReturn(true, {
                alreadyExists: true,
                name: existingItem.name,
                mediaPath: filePath,
                binName: folderName,
                nodeId: existingItem.nodeId || ""
            });
        }

        // Executa a importação
        var fileArray = [fileObj.fsName];
        var suppressUI = true;
        var importAsNumbered = false;

        var importResult = app.project.importFiles(fileArray, suppressUI, targetBin, importAsNumbered);
        if (importResult === false) return safeReturn(false, null, "O Premiere recusou a importação.");

        // Localiza o item recém importado
        var importedItem = findProjectItemByMediaPath(filePath, targetBin) || findProjectItemByMediaPath(filePath, app.project.rootItem);

        if (!importedItem) return safeReturn(false, null, "A importação não foi confirmada no projeto.");

        if (importedItem && targetBin && targetBin !== app.project.rootItem && importedItem.parent !== targetBin && typeof importedItem.moveBin === "function") {
            try {
                importedItem.moveBin(targetBin);
            } catch (me2) {}
        }

        return safeReturn(true, {
            imported: true,
            name: importedItem ? importedItem.name : fileObj.name,
            mediaPath: filePath,
            binName: folderName,
            nodeId: importedItem ? (importedItem.nodeId || "") : ""
        });
    } catch (err) {
        return safeReturn(false, null, "Erro ao importar arquivo: " + err.toString());
    }
}

/**
 * Verifica se uma trilha possui algum clipe na posição do playhead
 */
function isTrackOccupiedAtTime(track, timeSec) {
    if (!track || !track.clips) return false;
    try {
        var num = track.clips.numItems;
        for (var i = 0; i < num; i++) {
            var clip = track.clips[i];
            if (clip && clip.start && clip.end) {
                var s = clip.start.seconds;
                var e = clip.end.seconds;
                if (timeSec >= (s - 0.001) && timeSec < (e - 0.001)) {
                    return true;
                }
            }
        }
    } catch (err) {}
    return false;
}

/**
 * Encontra a primeira trilha de vídeo vazia no playhead (ou a camada mais alta livre)
 */
function findEntirelyEmptyTrack(tracks) {
    if (!tracks) return -1;
    for (var i = 0; i < tracks.numTracks; i++) {
        var track = tracks[i];
        if (track && !track.isLocked() && track.clips && track.clips.numItems === 0) return i;
    }
    return -1;
}
function findEmptyVideoTrackIndex(seq) { return findEntirelyEmptyTrack(seq && seq.videoTracks); }
function findEmptyAudioTrackIndex(seq) { return findEntirelyEmptyTrack(seq && seq.audioTracks); }

/**
 * Importa o arquivo para o Bin e insere diretamente na Sequence ativa em uma CAMADA VAZIA no Playhead
 */
function insertMediaToTimeline(filePath, binName) {
    try {
        if (!app.project) {
            return safeReturn(false, null, "Nenhum projeto aberto.");
        }

        var folderName = binName || "_Downloads";
        var targetBin = findOrCreateBin(folderName, app.project.rootItem);
        var projectItem = findProjectItemByMediaPath(filePath, app.project.rootItem);

        if (!projectItem) {
            var fileObj = new File(filePath);
            if (!fileObj.exists) {
                return safeReturn(false, null, "Arquivo não encontrado: " + filePath);
            }
            app.project.importFiles([fileObj.fsName], true, targetBin, false);
            projectItem = findProjectItemByMediaPath(filePath, targetBin) || findProjectItemByMediaPath(filePath, app.project.rootItem);
        }

        if (projectItem && targetBin && targetBin !== app.project.rootItem && projectItem.parent !== targetBin && typeof projectItem.moveBin === "function") {
            try {
                projectItem.moveBin(targetBin);
            } catch (me3) {}
        }

        if (!projectItem) return safeReturn(false, null, "A importação não foi confirmada no projeto.");

        var seq = app.project.activeSequence;
        if (!seq) {
            return safeReturn(true, {
                imported: true,
                inserted: false,
                name: projectItem ? projectItem.name : filePath.split("/").pop(),
                binName: folderName,
                note: "Importado para a pasta " + folderName + " no Projeto (nenhuma Timeline aberta)"
            });
        }

        if (!projectItem) {
            return safeReturn(false, null, "Falha ao localizar item de projeto após importação.");
        }

        // 2. Obtém a posição atual do Playhead
        var playheadTime = null;
        try {
            playheadTime = seq.getPlayerPosition();
        } catch (pe) {}
        
        if (!playheadTime) {
            playheadTime = new Time();
            playheadTime.seconds = 0;
        }

        // 3. Determina se é áudio puro
        var isAudioOnly = false;
        var ext = filePath.substring(filePath.lastIndexOf(".")).toLowerCase();
        if (ext === ".wav" || ext === ".mp3" || ext === ".aac" || ext === ".m4a" || ext === ".ogg" || ext === ".flac" || ext === ".opus") {
            isAudioOnly = true;
        }

        // Empty for the entire timeline, not merely at the playhead: no downstream
        // clip can be overwritten. Use explicit V/A targeting for linked media.
        var targetVideoIdx = isAudioOnly ? -1 : findEmptyVideoTrackIndex(seq);
        var targetAudioIdx = findEmptyAudioTrackIndex(seq);
        var inserted = false;
        if (isAudioOnly && targetAudioIdx >= 0) {
            try {
                var track = seq.audioTracks[targetAudioIdx];
                var before = track.clips.numItems;
                track.overwriteClip(projectItem, playheadTime.ticks);
                inserted = track.clips.numItems > before;
            } catch (insertError) {}
        } else if (!isAudioOnly && targetVideoIdx >= 0 && targetAudioIdx >= 0 && typeof seq.overwriteClip === "function") {
            try {
                var videoBefore = seq.videoTracks[targetVideoIdx].clips.numItems;
                seq.overwriteClip(projectItem, String(playheadTime.seconds), targetVideoIdx, targetAudioIdx);
                inserted = seq.videoTracks[targetVideoIdx].clips.numItems > videoBefore;
            } catch (videoInsertError) {}
        }

        if (!inserted) {
            return safeReturn(true, {
                imported: true,
                inserted: false,
                mediaName: projectItem.name,
                warning: "Mídia importada no Bin. Arraste para a timeline para escolher as faixas e preservar a edição existente."
            });
        }

        return safeReturn(true, {
            imported: true,
            inserted: true,
            mediaName: projectItem.name,
            videoTrack: targetVideoIdx + 1,
            audioTrack: targetAudioIdx + 1,
            playhead: playheadTime.seconds
        });
    } catch (err) {
        return safeReturn(false, null, "Erro na inserção: " + err.toString());
    }
}

// Host-specific adapter; Premiere functions above remain unchanged.
if (typeof CompItem !== "undefined" && typeof ImportOptions !== "undefined") {
    $.evalFile(new File(new File($.fileName).parent.fsName + "/host-aftereffects.jsx"));
}

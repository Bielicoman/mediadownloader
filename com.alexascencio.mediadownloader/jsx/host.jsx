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
    
    var targetPath = normalizePath(mediaPath).toLowerCase();
    var fileName = targetPath.split("/").pop();
    
    if (currentItem.children && currentItem.children.numItems > 0) {
        for (var i = 0; i < currentItem.children.numItems; i++) {
            var child = currentItem.children[i];
            if (!child) continue;
            
            // If item has media path
            if (child.getMediaPath) {
                var p = normalizePath(child.getMediaPath()).toLowerCase();
                if (p === targetPath) {
                    return child;
                }
            }

            // Fallback match por nome de arquivo se caminho for relativo
            if (child.name && child.name.toLowerCase() === fileName) {
                return child;
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

        app.project.importFiles(fileArray, suppressUI, targetBin, importAsNumbered);

        // Localiza o item recém importado
        var importedItem = findProjectItemByMediaPath(filePath, targetBin) || findProjectItemByMediaPath(filePath, app.project.rootItem);

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
function findEmptyVideoTrackIndex(seq, playheadSec) {
    if (!seq || !seq.videoTracks || seq.videoTracks.numTracks === 0) return 0;
    
    // 1. Procura uma trilha existente que esteja 100% vazia no playhead
    for (var v = 0; v < seq.videoTracks.numTracks; v++) {
        var track = seq.videoTracks[v];
        if (!track.isLocked() && !isTrackOccupiedAtTime(track, playheadSec)) {
            return v; // Trilha vazia encontrada!
        }
    }
    
    // 2. Se todas as trilhas estiverem ocupadas no playhead, usa a camada do topo (mais alta desbloqueada)
    for (var v2 = seq.videoTracks.numTracks - 1; v2 >= 0; v2--) {
        if (!seq.videoTracks[v2].isLocked()) {
            return v2;
        }
    }
    return 0;
}

/**
 * Encontra a primeira trilha de áudio vazia no playhead
 */
function findEmptyAudioTrackIndex(seq, playheadSec) {
    if (!seq || !seq.audioTracks || seq.audioTracks.numTracks === 0) return 0;
    
    // 1. Procura uma trilha de áudio 100% vazia no playhead
    for (var a = 0; a < seq.audioTracks.numTracks; a++) {
        var aTrack = seq.audioTracks[a];
        if (!aTrack.isLocked() && !isTrackOccupiedAtTime(aTrack, playheadSec)) {
            return a;
        }
    }
    
    // 2. Se todas estiverem ocupadas, usa a última desbloqueada
    for (var a2 = seq.audioTracks.numTracks - 1; a2 >= 0; a2--) {
        if (!seq.audioTracks[a2].isLocked()) {
            return a2;
        }
    }
    return 0;
}

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
        if (ext === ".wav" || ext === ".mp3" || ext === ".aac" || ext === ".m4a" || ext === ".ogg" || ext === ".flac") {
            isAudioOnly = true;
        }

        // 4. DETECTA CAMADAS VAZIAS PARA NUNCA SUBSCREVER/CORTAR CLIPES EXISTENTES
        var targetVideoIdx = isAudioOnly ? -1 : findEmptyVideoTrackIndex(seq, playheadTime.seconds);
        var targetAudioIdx = findEmptyAudioTrackIndex(seq, playheadTime.seconds);

        var inserted = false;
        var insertError = "";

        // TIER 1: Inserção na trilha vazia alvo via track.overwriteClip (Overlay limpo na camada livre)
        if (!isAudioOnly && targetVideoIdx >= 0 && seq.videoTracks && targetVideoIdx < seq.videoTracks.numTracks) {
            try {
                var targetVTrack = seq.videoTracks[targetVideoIdx];
                if (targetVTrack && typeof targetVTrack.overwriteClip === "function") {
                    targetVTrack.overwriteClip(projectItem, playheadTime);
                    inserted = true;
                }
            } catch (eTrack) {
                insertError += " [TrackOverwrite: " + eTrack.toString() + "]";
            }
        }

        if (isAudioOnly && targetAudioIdx >= 0 && seq.audioTracks && targetAudioIdx < seq.audioTracks.numTracks) {
            try {
                var targetATrack = seq.audioTracks[targetAudioIdx];
                if (targetATrack && typeof targetATrack.overwriteClip === "function") {
                    targetATrack.overwriteClip(projectItem, playheadTime);
                    inserted = true;
                }
            } catch (eATrack) {
                insertError += " [AudioTrackOverwrite: " + eATrack.toString() + "]";
            }
        }

        // TIER 2: Inserção via Premiere Pro Sequence API moderna direcionando as trilhas livres
        if (!inserted && typeof seq.insertClip === "function") {
            try {
                seq.insertClip(projectItem, playheadTime, targetVideoIdx, targetAudioIdx);
                inserted = true;
            } catch (e1) {
                insertError += " [T2: " + e1.toString() + "]";
            }
        }

        // TIER 3: Tenta QE DOM (Quality Engineering API)
        if (!inserted) {
            try {
                if (typeof app.enableQE === "function") {
                    app.enableQE();
                    if (typeof qe !== "undefined" && qe.project) {
                        var qeSeq = qe.project.getActiveSequence();
                        if (qeSeq && typeof qeSeq.insert === "function") {
                            var ticksStr = playheadTime.ticks || String(Math.round(playheadTime.seconds * 254016000000));
                            qeSeq.insert(projectItem, ticksStr);
                            inserted = true;
                        }
                    }
                }
            } catch (e2) {
                insertError += " [T3: " + e2.toString() + "]";
            }
        }

        if (!inserted) {
            return safeReturn(true, {
                imported: true,
                inserted: false,
                mediaName: projectItem.name,
                warning: "Mídia importada no Bin. Arraste para a timeline (todas as faixas bloqueadas)."
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

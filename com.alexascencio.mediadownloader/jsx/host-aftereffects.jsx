/* After Effects adapter. ExtendScript ES3; loaded only by host.jsx in AE. */
function mdAEPath(file) {
    var p = file.fsName.replace(/\\/g, "/");
    return /windows/i.test($.os) ? p.toLowerCase() : p;
}
function mdAEImport(filePath, folderName) {
    if (!app.project) throw new Error("Abra um projeto no After Effects.");
    var file = new File(filePath);
    if (!file.exists) throw new Error("Arquivo não encontrado: " + filePath);
    var item = null, folder = null, i, candidate;
    for (i = 1; i <= app.project.numItems; i++) {
        candidate = app.project.item(i);
        if (candidate instanceof FootageItem && candidate.file && mdAEPath(candidate.file) === mdAEPath(file)) item = candidate;
        if (candidate instanceof FolderItem && candidate.parentFolder === app.project.rootFolder && candidate.name === folderName) folder = candidate;
    }
    // Reuse footage without moving an existing item out of its user's folder.
    if (item) return item;
    var options = new ImportOptions(file);
    options.sequence = false;
    if (!options.canImportAs(ImportAsType.FOOTAGE)) throw new Error("Formato não aceito pelo After Effects. Use WAV, MP4 ou ProRes.");
    options.importAs = ImportAsType.FOOTAGE;
    item = app.project.importFile(options);
    if (!item) throw new Error("O After Effects não confirmou a importação.");
    if (folderName) {
        if (!folder) folder = app.project.items.addFolder(folderName);
        item.parentFolder = folder;
    }
    return item;
}
getProjectInfo = function () {
    try {
        if (!app.project) return safeReturn(false, null, "Nenhum projeto aberto no After Effects.");
        var file = app.project.file, comp = app.project.activeItem;
        return safeReturn(true, {
            isOpen: true, host: "AEFT", projectName: file ? decodeURI(file.name) : "Projeto sem salvar",
            projectPath: file ? file.fsName : "", projectFolder: file ? file.parent.fsName : "",
            activeSequence: comp instanceof CompItem ? {name: comp.name, width: comp.width, height: comp.height, playheadSeconds: comp.time} : null
        });
    } catch (e) { return safeReturn(false, null, e.message); }
};
importMediaFile = function (filePath, folderName) {
    app.beginUndoGroup("Media Downloader: importar");
    try {
        var item = mdAEImport(filePath, folderName || "_Downloads");
        return safeReturn(true, {imported: true, name: item.name, mediaPath: item.file.fsName, binName: item.parentFolder.name});
    } catch (e) { return safeReturn(false, null, e.message); }
    finally { app.endUndoGroup(); }
};
insertMediaToTimeline = function (filePath, folderName) {
    app.beginUndoGroup("Media Downloader: inserir na composição");
    var layer = null;
    try {
        // Capture the target before importing, which can change the project selection.
        var comp = app.project ? app.project.activeItem : null;
        if (!(comp instanceof CompItem)) throw new Error("Abra uma composição antes de inserir. O arquivo baixado foi preservado.");
        var time = comp.time;
        if (time < 0 || time >= comp.duration) throw new Error("Posicione o indicador dentro da duração da composição.");
        var item = mdAEImport(filePath, folderName || "_Downloads");
        layer = comp.layers.add(item);
        layer.startTime = time;
        layer.inPoint = time;
        layer.outPoint = Math.min(comp.duration, item.mainSource.isStill ? comp.duration : time + item.duration);
        if (layer.source !== item || comp.layer(layer.index) !== layer) throw new Error("Não foi possível verificar a camada inserida.");
        return safeReturn(true, {imported: true, inserted: true, name: item.name, composition: comp.name, layerIndex: layer.index, startTime: layer.startTime, binName: item.parentFolder.name});
    } catch (e) {
        if (layer) { try { layer.remove(); } catch (ignored) {} }
        return safeReturn(false, null, e.message);
    } finally { app.endUndoGroup(); }
};
createSequenceFromMedia = function () {
    return safeReturn(false, null, "Abra uma composição existente e use Inserir na composição.");
};

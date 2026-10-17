-- Importa somente no Pool de Midia. Nao cria nem modifica timelines.
local base = assert(os.getenv('APPDATA'), 'APPDATA indisponivel.') .. '\\MediaDownloaderEditors\\'
local f = assert(io.open(base .. 'last-file.txt', 'rb'), 'Baixe ou selecione um arquivo no Media Downloader primeiro.')
local file = f:read('*a'); f:close()
assert(file ~= '' and not file:find('[\r\n%z]'), 'Caminho de midia invalido.')
local media = assert(io.open(file, 'rb'), 'O arquivo de midia nao foi encontrado.'); media:close()
local host = resolve or (bmd and bmd.scriptapp('Resolve'))
assert(host, 'Execute este script pelo menu do DaVinci Resolve.')
local project = assert(host:GetProjectManager():GetCurrentProject(), 'Abra um projeto primeiro.')
local pool = project:GetMediaPool()
local function key(value) return (value or ''):gsub('/', '\\'):lower() end
local function find(folder)
    for _, clip in pairs(folder:GetClipList() or {}) do
        if key(clip:GetClipProperty('File Path')) == key(file) then return clip end
    end
    for _, sub in pairs(folder:GetSubFolderList() or {}) do
        local found = find(sub); if found then return found end
    end
end
local clip = find(pool:GetRootFolder())
local reused = clip ~= nil
if not clip then
    local imported = pool:ImportMedia({file})
    assert(imported and next(imported), 'O Resolve recusou a importacao. Confira o codec do arquivo.')
    clip = assert(find(pool:GetRootFolder()), 'A importacao nao foi confirmada pelo caminho do arquivo.')
end
local receipt = assert(io.open(base .. 'resolve-import-confirmed.txt', 'wb'))
receipt:write(os.date('!%Y-%m-%dT%H:%M:%SZ'), '\n', file, '\n', reused and 'reused' or 'imported'); receipt:close()
print((reused and 'Ja estava no Pool de Midia: ' or 'Importado e confirmado: ') .. clip:GetName())

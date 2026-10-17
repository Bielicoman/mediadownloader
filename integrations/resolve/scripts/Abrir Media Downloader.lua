-- Executado dentro do Resolve; usa apenas o aplicativo instalado no usuario.
local base = os.getenv('LOCALAPPDATA')
assert(base, 'LOCALAPPDATA indisponivel.')
local exe = base .. '\\Programs\\Media Downloader Editores\\Media Downloader Editores.exe'
local f = io.open(exe, 'rb')
assert(f, 'Instale o Media Downloader Editores antes de abrir este atalho.')
f:close()
assert(not exe:find('["%%\r\n]'), 'Caminho de instalacao invalido.')
os.execute('start "" "' .. exe .. '"')
print('Media Downloader aberto. Apos baixar, use Scripts > Media Downloader > Importar ultimo download.')

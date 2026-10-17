"""Package the built portable runtime and record public artifact checksums."""
from pathlib import Path
import hashlib,zipfile
root=Path(__file__).resolve().parents[1]
folder=root/'dist/editors-windows-1.1.4'
if not (folder/'Media Downloader Editores.exe').is_file():raise SystemExit('Build do companion não encontrado.')
output=root/'dist/MediaDownloader-Editores-Windows-1.1.4.zip'
with zipfile.ZipFile(output,'w',zipfile.ZIP_DEFLATED,compresslevel=6,strict_timestamps=False) as z:
 for file in folder.rglob('*'):
  if file.is_file():z.write(file,Path('MediaDownloader-Editores')/file.relative_to(folder))
with zipfile.ZipFile(output) as z:
 if z.testzip() is not None:raise SystemExit('Falha na verificação do ZIP.')
artifacts=[root/'dist/MediaDownloader-Resolve-1.1.4.zip',root/'dist/MediaDownloader-Editores-macOS-1.1.4.zip',output]
(root/'dist/INTEGRATIONS-SHA256SUMS.txt').write_text(''.join(hashlib.sha256(f.read_bytes()).hexdigest()+'  '+f.name+'\n' for f in artifacts),encoding='utf-8')
print(output)

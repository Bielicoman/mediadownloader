from pathlib import Path
import zipfile
root=Path(__file__).resolve().parents[1];out=root/'dist';out.mkdir(exist_ok=True)
with zipfile.ZipFile(out/'MediaDownloader.zip','w',zipfile.ZIP_DEFLATED) as z:
 for f in (root/'com.alexascencio.mediadownloader').rglob('*'):
  if f.is_file() and f.suffix.lower()!='.exe':z.write(f,f.relative_to(root))
 for f in (root/'installers/cep').iterdir():
  if f.is_file():
   i=zipfile.ZipInfo(f.name);i.create_system=3;i.external_attr=(0o100755 if f.suffix=='.command' else 0o100644)<<16;i.compress_type=zipfile.ZIP_DEFLATED;z.writestr(i,f.read_bytes())
print(out/'MediaDownloader.zip')


from pathlib import Path
import argparse,shutil,zipfile,json
root=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser();parser.add_argument('--runtime');args=parser.parse_args()
source=root/'dist/integrations/com.alexascencio.mediadownloader.resolve'
if not source.is_dir():raise SystemExit('Rode package-integrations.py primeiro.')
out=root/'dist'
def add(z,file,name):
 info=zipfile.ZipInfo(str(name).replace('\\','/'));info.create_system=3;info.external_attr=(0o100755 if file.suffix=='.command' else 0o100644)<<16;info.compress_type=zipfile.ZIP_DEFLATED;z.writestr(info,file.read_bytes())
with zipfile.ZipFile(out/'MediaDownloader-Editores-macOS-1.1.7.zip','w') as z:
 for f in source.rglob('*'):
  if f.is_file() and f.name!='manifest.xml':add(z,f,Path('MediaDownloader-Editores')/f.relative_to(source))
 add(z,root/'docs/INTEGRACOES.md','MediaDownloader-Editores/LEIA-PRIMEIRO.md')
if args.runtime:
 runtime=Path(args.runtime).resolve()
 if not (runtime/'version').is_file() or (runtime/'version').read_text().strip()!='44.7.2':raise SystemExit('Runtime Electron 44.7.2 verificado é obrigatório.')
 target=out/'editors-windows-1.1.7'
 target.mkdir(exist_ok=True)
 for f in runtime.iterdir():
  if f.name=='resources':continue
  if f.is_dir():shutil.copytree(f,target/f.name,dirs_exist_ok=True)
  else:shutil.copy2(f,target/f.name)
 exe=next((target/name for name in ['Media Downloader Editores.exe','Media Downloader.exe','electron.exe'] if (target/name).is_file()),None)
 if exe is None:raise SystemExit('Executável do runtime não encontrado.')
 if exe.name!='Media Downloader Editores.exe':exe.replace(target/'Media Downloader Editores.exe')
 app=target/'resources/app';shutil.copytree(source,app,dirs_exist_ok=True)
 (app/'package.json').write_text(json.dumps({'name':'media-downloader-editors','productName':'Media Downloader Editores','version':'1.1.7','main':'companion/main.cjs','license':'MIT','dependencies':{'electron-updater':'6.8.9'}}),encoding='utf-8')
 shutil.copy2(root/'docs/INTEGRACOES.md',target/'LEIA-PRIMEIRO.md')
 print(target)
print(out/'MediaDownloader-Editores-macOS-1.1.7.zip')

"""Build source integration packages; licensed native SDK is copied locally by installer."""
from pathlib import Path
import shutil,zipfile,json
root=Path(__file__).resolve().parents[1]
stage=root/'dist/integrations';stage.mkdir(parents=True,exist_ok=True)
bundle=stage/'com.alexascencio.mediadownloader.resolve'
for name in ['shared','companion']:
 shutil.copytree(root/'integrations'/name,bundle/name,dirs_exist_ok=True)
companion=bundle/'companion'
shutil.copytree(root/'assets/brands',companion/'brands',dirs_exist_ok=True)
shutil.copy2(root/'assets/Manrope.ttf',companion/'Manrope.ttf')
shutil.copy2(root/'logo.png',companion/'logo.png')
(companion/'engine').mkdir(exist_ok=True)
for name in ['downloader.js','binManager.js']:shutil.copy2(root/'app/src/js'/name,companion/'engine'/name)
shutil.copy2(root/'integrations/resolve/manifest.xml',bundle/'manifest.xml')
(bundle/'package.json').write_text(json.dumps({'name':'media-downloader-resolve','version':'1.1.0','main':'companion/main.cjs','license':'MIT'}),encoding='utf-8')
shutil.copy2(root/'LICENSE',bundle/'LICENSE')
shutil.copy2(root/'THIRD-PARTY-NOTICES.md',bundle/'THIRD-PARTY-NOTICES.md')
shutil.copytree(root/'licenses',bundle/'licenses',dirs_exist_ok=True)
def add(z,file,name):
 info=zipfile.ZipInfo(str(name).replace('\\','/'));info.create_system=3;info.external_attr=(0o100755 if file.suffix=='.command' else 0o100644)<<16;info.compress_type=zipfile.ZIP_DEFLATED;z.writestr(info,file.read_bytes())
with zipfile.ZipFile(root/'dist/MediaDownloader-Resolve-1.1.0.zip','w') as z:
 for f in bundle.rglob('*'):
  if f.is_file() and f.suffix not in ['.node','.exe']:add(z,f,f.relative_to(stage))
 for f in (root/'integrations/resolve').glob('Instalar-*'):add(z,f,f.name)
 add(z,root/'docs/INTEGRACOES.md','LEIA-PRIMEIRO.md')
print(root/'dist/MediaDownloader-Resolve-1.1.0.zip')

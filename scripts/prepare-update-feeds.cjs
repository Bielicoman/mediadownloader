'use strict';
// Execute depois de construir os instaladores, antes de publicar a release e o site.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const version=JSON.parse(fs.readFileSync(path.join(root,'app/package.json'))).version;
const editor=JSON.parse(fs.readFileSync(path.join(root,'integrations/companion/package.json'))).version;
const base=`https://github.com/Bielicoman/mediadownloader/releases/download/v${version}/`;
const assets=[['desktop',`dist/desktop-${version}/latest.yml`],['editors',`dist/editors-setup-${editor}/latest.yml`]];
for(const [name,file] of assets){
 const source=fs.readFileSync(path.join(root,file),'utf8');
 const match=source.match(/^path: (.+)$/m);if(!match)throw new Error('Instalador ausente: '+file);
 const exe=path.join(root,path.dirname(file),match[1].trim());
 const hash=crypto.createHash('sha512').update(fs.readFileSync(exe)).digest('base64');
 if(!source.includes('sha512: '+hash))throw new Error('SHA-512 inconsistente: '+exe);
 const dir=path.join(root,'updates',name);fs.mkdirSync(dir,{recursive:true});
 fs.writeFileSync(path.join(dir,'latest.yml'),source.replace(/(url: |^path: )(.+\.exe)/gm,(_,prefix,name)=>prefix+base+name));
}
const zip=path.join(root,`dist/MediaDownloader-Adobe-${version}.zip`);
const manifest={pluginId:'com.alexascencio.mediadownloader',name:'Media Downloader',version,downloadUrl:base+path.basename(zip),sha256:crypto.createHash('sha256').update(fs.readFileSync(zip)).digest('hex'),mandatory:false};
fs.mkdirSync(path.join(root,'updates/adobe'),{recursive:true});
fs.writeFileSync(path.join(root,'updates/adobe/version.json'),JSON.stringify(manifest,null,2)+'\n');
console.log('Manifestos conferidos: Desktop '+version+', Editores '+editor+', Adobe '+version);

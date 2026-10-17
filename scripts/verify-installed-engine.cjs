'use strict';
const fs=require('fs'),path=require('path'),asar=require('@electron/asar'),{execFileSync}=require('child_process');
const {createEngine}=require('../integrations/shared/engine.cjs');
async function main(){
 const resources=path.join(process.env.LOCALAPPDATA,'Programs','Media Downloader','resources'),archive=path.join(resources,'app.asar');
 const out=path.resolve(__dirname,'../work/installed-engine-validation'),engineDir=path.join(out,'engine');fs.mkdirSync(engineDir,{recursive:true});
 for(const name of ['media-info.js','downloader.js','binManager.js'])fs.writeFileSync(path.join(engineDir,name),asar.extractFile(archive,path.join('src','js',name)));
 const version=JSON.parse(asar.extractFile(archive,'package.json')).version;
 const engine=createEngine({engineDir,stateDir:path.join(out,'state'),outputDir:out,binDirs:[path.join(resources,'bin')]});
 const sourceUrl=process.argv[2]||'https://www.youtube.com/watch?v=jNQXAC9IVRw';
 const metadata=await engine.downloader.fetchMetadata(sourceUrl);
 const job=engine.downloader.startDownload({url:sourceUrl,preset:'best',outputDir:out},()=>{},()=>{}),result=await job;
 const ffmpeg=await engine.binaries.findFfmpeg(),ffprobe=engine.binaries.findFfprobe(ffmpeg.path);
 const probe=JSON.parse(execFileSync(ffprobe,['-v','error','-show_streams','-show_format','-of','json',result.filePath],{encoding:'utf8',windowsHide:true}));
 execFileSync(ffmpeg.path,['-v','error','-i',result.filePath,'-f','null','-'],{windowsHide:true,timeout:60000});
 const evidence={version,metadataTitle:metadata.title,technical:!!metadata.technical,file:result.filePath,streams:probe.streams.map(s=>({codec:s.codec_name,pix_fmt:s.pix_fmt,sample_rate:s.sample_rate})),decoded:true};
 if(!evidence.technical||!evidence.streams.some(s=>s.codec==='h264'))throw Error('Resultado incompatível com o esperado');
 fs.writeFileSync(path.join(out,'evidence.json'),JSON.stringify(evidence,null,2));console.log(JSON.stringify(evidence));
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});

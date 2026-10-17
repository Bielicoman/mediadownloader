const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {createRequire}=require('node:module');
function createEngine({engineDir,binDirs,stateDir,outputDir}) {
 fs.mkdirSync(stateDir,{recursive:true});
 const configFile=path.join(stateDir,'preferences.json');
 let prefs={};try{prefs=JSON.parse(fs.readFileSync(configFile,'utf8'));}catch{}
 const storage={getItem:k=>Object.prototype.hasOwnProperty.call(prefs,k)?String(prefs[k]):null,setItem(k,v){prefs[k]=String(v);fs.writeFileSync(configFile,JSON.stringify(prefs));}};
 const window={Bridge:{getSystemPaths:async()=>({appPath:path.dirname(engineDir),localBin:path.join(stateDir,'bin'),bundledBins:binDirs,defaultDownloadDir:outputDir})}};
 const context={window,localStorage:storage,require:createRequire(path.join(engineDir,'binManager.js')),process,console,setTimeout,clearTimeout,Buffer,URL};
 vm.createContext(context);
 for(const name of ['binManager.js','downloader.js'])vm.runInContext(fs.readFileSync(path.join(engineDir,name),'utf8'),context,{filename:name});
 return {downloader:window.Downloader,binaries:window.BinManager,storage};
}
module.exports={createEngine};

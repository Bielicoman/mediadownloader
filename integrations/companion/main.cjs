const {app,BrowserWindow,ipcMain,dialog,shell,nativeImage,session,clipboard}=require('electron');
const fs=require('node:fs'),path=require('node:path'),{execFile}=require('node:child_process'),{pathToFileURL}=require('node:url');
const {createEngine}=require('../shared/engine.cjs'),resolveAdapter=require('../shared/resolve.cjs'),{documentForMedia}=require('../shared/fcpxml.cjs');
const PLUGIN_ID='com.alexascencio.mediadownloader.resolve';
let win,engine,job=null,lastFile=null,resolve=null,integration=null;
let outputDir;
function trusted(event){if(!win||event.sender!==win.webContents||event.senderFrame!==win.webContents.mainFrame)throw Error('Origem de chamada não permitida.');}
require('./clipboard.cjs').registerClipboard({ipcMain,clipboard,trust:trusted,prefix:'editors:clipboard'});
function handle(name,fn){ipcMain.handle('editors:'+name,async(event,...args)=>{trusted(event);return fn(...args);});}
function knownFile(){if(!lastFile||!fs.existsSync(lastFile)||!fs.statSync(lastFile).isFile())throw Error('Baixe ou selecione uma mídia primeiro.');return lastFile;}
function rememberFile(file){fs.writeFileSync(path.join(statePath,'last-file.txt'),file,'utf8');}
function probe(file){return engine.binaries.findFfmpeg().then(ff=>new Promise((ok,no)=>{if(!ff.found)return no(Error('FFmpeg não encontrado. Instale o Desktop.'));const binary=engine.binaries.findFfprobe(ff.path);if(!binary)return no(Error('FFprobe não encontrado.'));execFile(binary,['-v','error','-show_streams','-show_format','-of','json',file],{windowsHide:true,timeout:30000,maxBuffer:4*1024*1024},(err,out)=>{if(err)return no(err);try{ok(JSON.parse(out));}catch(e){no(e);}});}));}
const statePath=path.join(app.getPath('appData'),'MediaDownloaderEditors');
fs.mkdirSync(statePath,{recursive:true});app.setPath('userData',statePath);
function log(message){fs.appendFileSync(path.join(statePath,'runtime.log'),new Date().toISOString()+' '+message+'\n');}
log('starting '+app.getVersion());
app.whenReady().then(async()=>{
 log('electron ready');
 if(app.isPackaged&&process.platform==='win32')try{require('./auto-update.cjs').start({app,updater:require('electron-updater').autoUpdater,isBusy:()=>!!job,log,notify:message=>{if(win&&!win.isDestroyed())win.webContents.send('editors:progress',{status:message});}});}catch(e){log('Atualizações: '+e.message);}
 outputDir=path.join(app.getPath('videos'),'MediaDownloader');
 const desktop=process.platform==='win32'?path.join(process.env.LOCALAPPDATA||'','Programs','Media Downloader','resources','app'):path.join('/Applications','Media Downloader.app','Contents','Resources','app');
 const engineDir=fs.existsSync(path.join(__dirname,'engine','downloader.js'))?path.join(__dirname,'engine'):path.resolve(__dirname,'../../app/src/js');
 engine=createEngine({engineDir,stateDir:app.getPath('userData'),outputDir,binDirs:[path.join(desktop,'bin'),path.join(desktop,'..','bin'),path.join(__dirname,'bin'),path.join(app.getPath('appData'),'MediaDownloaderPro','bin')]});
 const sdk=path.join(__dirname,'WorkflowIntegration.node');
 if(fs.existsSync(sdk)){try{integration=require(sdk);resolve=await resolveAdapter.connectIntegration(integration,PLUGIN_ID);}catch(e){console.warn('Resolve:',e.message);}}
 win=new BrowserWindow({width:900,height:830,minWidth:600,minHeight:650,backgroundColor:'#080a0e',title:'Media Downloader · Editores',icon:path.join(__dirname,'logo.png'),webPreferences:{preload:path.join(__dirname,'preload.cjs'),nodeIntegration:false,contextIsolation:true,sandbox:true}});
 win.setMenuBarVisibility(false);
 win.once('ready-to-show',()=>{win.show();log('window ready');});
 win.webContents.on('render-process-gone',(_,details)=>log('renderer gone: '+details.reason));
 const localPage=pathToFileURL(path.join(__dirname,'index.html')).href;
 win.webContents.on('will-navigate',(event,url)=>{if(url!==localPage)event.preventDefault();});
 win.webContents.on('will-redirect',event=>event.preventDefault());win.webContents.on('will-attach-webview',event=>event.preventDefault());win.webContents.setWindowOpenHandler(()=>({action:'deny'}));
 session.defaultSession.setPermissionRequestHandler((_,__,callback)=>callback(false));session.defaultSession.setPermissionCheckHandler(()=>false);
 handle('info',()=>({resolve:!!resolve,platform:process.platform,outputDir,version:'1.1.2'}));
 const mediaInfo=require('./media-info.js');
 let metadataBusy=false;
 handle('metadata',async(text)=>{if(job||metadataBusy)throw Error('Aguarde a leitura atual.');if(typeof text!=='string'||text.length>2048)throw Error('Link inválido.');const url=new URL(text);if(url.protocol!=='https:'||url.username||url.password)throw Error('Use um link HTTPS sem credenciais.');metadataBusy=true;try{const result=await engine.downloader.fetchMetadata(url.href);return result.technical;}finally{metadataBusy=false;}});
 handle('probe',async()=>mediaInfo.probe(await probe(knownFile()),path.basename(knownFile())));
 handle('folder',async()=>{if(job)throw Error('Aguarde o download antes de trocar a pasta.');const result=await dialog.showOpenDialog(win,{properties:['openDirectory','createDirectory']});if(!result.canceled)outputDir=result.filePaths[0];return outputDir;});
 handle('select',async()=>{if(job)throw Error('Aguarde o download.');const result=await dialog.showOpenDialog(win,{properties:['openFile'],filters:[{name:'Mídia',extensions:['mp4','mov','mkv','webm','wav','mp3','m4a','flac','opus','png','jpg']}]});if(!result.canceled){lastFile=result.filePaths[0];rememberFile(lastFile);}return lastFile;});
 handle('download',async(options)=>{
  if(job)throw Error('Já existe um download em andamento.');
  if(!options||typeof options.url!=='string')throw Error('Informe um link HTTPS.');
  const url=new URL(options.url);if(url.protocol!=='https:'||url.username||url.password)throw Error('Use um link HTTPS sem credenciais.');
  if(!['best','4320p','2160p','1440p','1080p','720p','480p','360p','prores','audio_wav','audio_flac','audio_mp3','audio_m4a','audio_original','thumbnail'].includes(options.preset))throw Error('Formato inválido.');
  const emit=p=>{if(win&&!win.isDestroyed())win.webContents.send('editors:progress',p);};
  try{job=engine.downloader.startDownload({url:url.href,preset:options.preset,outputDir},emit,status=>emit({status}));const result=await job;lastFile=result.filePath;knownFile();rememberFile(lastFile);return {filePath:lastFile,title:result.title};}finally{job=null;}
 });
 handle('cancel',()=>job?engine.downloader.cancelDownload(job.downloadId):false);
 handle('resolve',()=>resolveAdapter.importFile(resolve,knownFile()));
 handle('fcpxml',async()=>{const file=knownFile();const result=await dialog.showSaveDialog(win,{defaultPath:path.join(path.dirname(file),path.parse(file).name+'.fcpxml'),filters:[{name:'Final Cut XML',extensions:['fcpxml']}]});if(result.canceled)return null;const xml=documentForMedia(file,await probe(file));fs.writeFileSync(result.filePath,xml,'utf8');return result.filePath;});
 handle('reveal',()=>{shell.showItemInFolder(knownFile());return true;});
 ipcMain.on('editors:drag',event=>{trusted(event);try{event.sender.startDrag({file:knownFile(),icon:nativeImage.createFromPath(path.join(__dirname,'logo.png'))});}catch(e){console.warn(e.message);}});
 win.on('close',event=>{if(job){event.preventDefault();dialog.showMessageBox(win,{message:'Cancele ou aguarde o download antes de fechar.',buttons:['Voltar']});}});
 await win.loadFile(path.join(__dirname,'index.html'));
}).catch(error=>{log('startup error: '+error.message);dialog.showErrorBox('Media Downloader',error.message);app.quit();});
app.on('window-all-closed',()=>app.quit());
app.on('will-quit',()=>{if(integration)try{integration.CleanUp();}catch{}});

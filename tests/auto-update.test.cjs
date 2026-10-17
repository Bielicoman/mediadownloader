const {test}=require('node:test'),assert=require('node:assert/strict'),{EventEmitter}=require('node:events');
const {start}=require('../app/src/auto-update.cjs');
test('automatic update waits for downloads, defers installation until quit and tolerates network failure',async()=>{
 const app=new EventEmitter();app.isPackaged=true;const updater=new EventEmitter();let busy=true,checks=0,downloads=0,tick;
 updater.checkForUpdates=async()=>{checks++;};updater.downloadUpdate=async()=>{downloads++;};
 const client=start({app,updater,isBusy:()=>busy,schedule:fn=>{tick=fn;return{unref(){}};}});
 assert.equal(checks,0);assert.equal(updater.autoInstallOnAppQuit,true);assert.equal(updater.autoDownload,false);assert.equal(updater.allowDowngrade,false);
 updater.emit('update-available');await tick();assert.equal(downloads,0);busy=false;await tick();assert.equal(downloads,1);
 await client.check();assert.equal(checks,1);let blocked=false;busy=true;app.emit('before-quit',{preventDefault(){blocked=true;}});assert(blocked);
 busy=false;updater.checkForUpdates=async()=>{throw Error('offline');};await assert.doesNotReject(client.check());
});
test('metadata is exposed in Electron with Node integration and in the companion engine sandbox',()=>{
 const fs=require('fs'),vm=require('vm'),source=fs.readFileSync(require.resolve('../app/src/js/media-info.js'),'utf8');
 const window={},context={window,module:{exports:{}}};vm.runInNewContext(source,context);
 assert.equal(typeof window.MediaInfo.source,'function');assert.equal(window.MediaInfo,context.module.exports);
 assert.equal(window.MediaInfo.compression('pcm_s24le'),'Sem compressão');
 const sourceData=window.MediaInfo.source({title:'Real title',formats:[],http_headers:{Authorization:'secret'},url:'https://private/?token=secret'});
 assert(!JSON.stringify(sourceData).includes('secret'));
});

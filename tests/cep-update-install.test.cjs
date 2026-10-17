const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),os=require('os'),crypto=require('crypto'),{execFileSync}=require('child_process'),{Readable}=require('stream'),{EventEmitter}=require('events'),{JSDOM}=require('jsdom');
test('CEP update checks ZIP hash, swaps verified files and preserves previous installation',async(t)=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'md-update-test-')),installed=path.join(root,'installed'),source=path.join(root,'source');
 for(const folder of [installed,source]){fs.mkdirSync(path.join(folder,'CSXS'),{recursive:true});fs.writeFileSync(path.join(folder,'CSXS/manifest.xml'),'<ExtensionBundle ExtensionBundleId="com.alexascencio.mediadownloader"/>');}
 fs.writeFileSync(path.join(installed,'version.json'),JSON.stringify({version:'1.0.0'}));fs.writeFileSync(path.join(source,'version.json'),JSON.stringify({version:'1.0.1'}));
 fs.writeFileSync(path.join(source,'fixture.bin'),crypto.randomBytes(12000));const zip=path.join(root,'fixture.zip');execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',`Compress-Archive -LiteralPath '${source}' -DestinationPath '${zip}'`],{windowsHide:true});const bytes=fs.readFileSync(zip);
 const https={get(url,options,callback){const req=new EventEmitter();req.setTimeout=()=>{};req.destroy=e=>req.emit('error',e);process.nextTick(()=>{const response=Readable.from([bytes]);response.statusCode=200;response.headers={'content-length':bytes.length};callback(response);});return req;}};
 const dom=new JSDOM('<body></body>',{url:'https://example.com',runScripts:'outside-only'}),w=dom.window;
 t.after(()=>dom.window.close());await new Promise(r=>setTimeout(r,10));
 w.require=name=>name==='https'?https:require(name);w.CSInterface=function(){this.getSystemPath=()=>installed;};
 w.eval(fs.readFileSync(path.join(__dirname,'../com.alexascencio.mediadownloader/js/ascencio-updater.js'),'utf8'));
 w.AscencioUpdater.init({pluginId:'com.alexascencio.mediadownloader',pluginName:'Test',currentVersion:'1.0.0',manifestUrl:'https://example.com/version.json',checkDelayMs:60000});
 const updater=w.__ascUpd;updater.remote={pluginId:'com.alexascencio.mediadownloader',version:'1.0.1',downloadUrl:'https://github.com/Bielicoman/mediadownloader/releases/download/test/fixture.zip',sha256:'0'.repeat(64)};updater.run(true);
 const wait=ms=>new Promise(r=>setTimeout(r,ms));for(let i=0;i<100&&updater.busy;i++)await wait(50);
 assert.equal(JSON.parse(fs.readFileSync(path.join(installed,'version.json'))).version,'1.0.0');
 updater.remote.sha256=crypto.createHash('sha256').update(bytes).digest('hex');updater.run(true);for(let i=0;i<300&&updater.busy;i++)await wait(50);
 assert.equal(JSON.parse(fs.readFileSync(path.join(installed,'version.json'))).version,'1.0.1',w.document.querySelector('#ascSt')?.textContent);assert(fs.readdirSync(root).some(n=>n.startsWith('installed.previous-')));dom.window.close();
});

const {test}=require('node:test');
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('com.alexascencio.mediadownloader/js/bridge.js','utf8');
function bridge(reply) {
 let script;
 const context={window:{__adobe_cep__:{},CSInterface:function(){this.hostEnvironment={appId:'AEFT',appName:'Adobe After Effects'};this.evalScript=(s,cb)=>{script=s;cb(reply)}}},console,setTimeout,clearTimeout};
 vm.runInNewContext(source,context);
 return {api:context.window.Bridge,script:()=>script};
}
test('outside Adobe rejects instead of simulating an imported file',async()=>{
 const c={window:{},console};vm.runInNewContext(source,c);
 await assert.rejects(c.window.Bridge.importMediaFile('a.mp4'),/dentro do/);
});
test('host failures, invalid replies and missing confirmation reject',async()=>{
 for(const reply of ['EvalScript error.','undefined','garbage','{}','{"success":false,"error":"Sem composição"}']) {
  await assert.rejects(bridge(reply).api.importMediaFile('a.mp4'));
 }
});
test('AE is detected and arguments survive quotes, newlines and Unicode separators',async()=>{
 const b=bridge('{"success":true,"data":{"imported":true}}');
 const file='C:/ação/quote\'"\n\u2028\u2029.mp4';
 assert.equal(b.api.hostId,'AEFT');
 assert.equal((await b.api.importMediaFile(file)).imported,true);
 let received;vm.runInNewContext(b.script(),{importMediaFile(p){received=p}});
 assert.equal(received,file);
 await assert.rejects(b.api.eval('app.quit',[]),/não permitida/);
});
test('AE interface exposes project/composition controls with truthful tooltips',()=>{
 const {JSDOM}=require('jsdom');
 const dom=new JSDOM(fs.readFileSync('com.alexascencio.mediadownloader/index.html','utf8'),{url:'https://ui.test',runScripts:'outside-only'});
 const w=dom.window;w.Bridge={hostId:'AEFT'};
 const app=fs.readFileSync('com.alexascencio.mediadownloader/js/app.js','utf8').replace('document.addEventListener("DOMContentLoaded", init);','window.configureHostUI=configureHostUI;');
 w.eval(app);w.configureHostUI();
 assert.equal(w.document.getElementById('hostInsertLabel').textContent,'Inserir na composição');
 assert.equal(w.document.getElementById('hostImportLabel').textContent,'Importar no projeto');
 assert.match(w.document.getElementById('toggleInsertTimeline').closest('label').title,/sem alterar/);
 dom.window.close();
});

const {test}=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const {documentForMedia}=require('../integrations/shared/fcpxml.cjs');
const resolve=require('../integrations/shared/resolve.cjs');
const {JSDOM}=require('jsdom');
test('Resolve awaits initialization and rejects a Promise instead of an actual host',async()=>{
 let initialized=false;
 const binding={Initialize:async id=>{assert.equal(id,'plugin');await new Promise(r=>setTimeout(r,10));initialized=true;return true;},GetResolve:async()=>{assert(initialized);return{GetProjectManager:()=>({})};}};
 const host=await resolve.connectIntegration(binding,'plugin');assert.equal(typeof host.GetProjectManager,'function');
 await assert.rejects(resolve.connectIntegration({Initialize:async()=>false},'plugin'),/recusou/);
 await assert.rejects(resolve.connectIntegration({Initialize:async()=>true,GetResolve:async()=>null},'plugin'),/conexão válida/);
});
test('FCPXML escapes names and URLs, keeps rational frame duration and media flags',()=>{
 const file=path.resolve('a & "quoted".mov');
 const xml=documentForMedia(file,{format:{duration:'10.1'},streams:[{codec_type:'video',avg_frame_rate:'30000/1001',width:1920,height:1080},{codec_type:'audio',channels:2,sample_rate:'48000'}]});
 const dom=new JSDOM(xml,{contentType:'text/xml'}),d=dom.window.document;
 assert.equal(d.querySelector('parsererror'),null);assert.equal(d.querySelector('asset').getAttribute('name'),path.basename(file));
 assert.equal(d.querySelector('format').getAttribute('frameDuration'),'1001/30000s');
 assert.match(d.querySelector('media-rep').getAttribute('src'),/^file:/);
 assert.equal(d.querySelector('asset').getAttribute('hasAudio'),'1');dom.window.close();
});
test('FCPXML rejects unknown duration and generates audio-only media',()=>{
 assert.throws(()=>documentForMedia(path.resolve('a.png'),{streams:[]}),/Nenhuma faixa/);
 assert.throws(()=>documentForMedia(path.resolve('a.wav'),{streams:[{codec_type:'audio'}]}),/Duração/);
 const xml=documentForMedia(path.resolve('a.wav'),{format:{duration:'2'},streams:[{codec_type:'audio',channels:1,sample_rate:'48000'}]});assert.match(xml,/hasAudio="1"/);assert.doesNotMatch(xml,/hasVideo/);
});
function mockHost({existing=false,fail=false}={}){
 const file=path.resolve('clip.mp4'),clips=[],clip={GetClipProperty:async()=>file,GetName:async()=>'clip'};if(existing)clips.push(clip);
 let calls=0;const folder={GetClipList:async()=>clips,GetSubFolderList:async()=>[]};
 const pool={GetRootFolder:async()=>folder,ImportMedia:async files=>{calls++;assert.equal(files[0],file);if(fail)return[];clips.push(clip);return[clip]}};
 return{file,calls:()=>calls,host:{GetProjectManager:async()=>({GetCurrentProject:async()=>({GetMediaPool:async()=>pool})})}};
}
test('Resolve confirms imported media and reuses existing exact path',async()=>{for(const existing of [false,true]){const h=mockHost({existing});const result=await resolve.importFile(h.host,h.file);assert.equal(result.imported,true);assert.equal(result.reused,existing);assert.equal(h.calls(),existing?0:1);}});
test('Resolve rejects missing host, closed project and unconfirmed import',async()=>{
 await assert.rejects(resolve.importFile(null,path.resolve('a')),/Resolve Studio/);
 await assert.rejects(resolve.importFile({GetProjectManager:async()=>({GetCurrentProject:async()=>null})},path.resolve('a')),/Abra um projeto/);
 const h=mockHost({fail:true});await assert.rejects(resolve.importFile(h.host,h.file),/não confirmou/);
});

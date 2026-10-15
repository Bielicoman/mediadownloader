const {JSDOM}=require('jsdom');
const fs=require('fs'),assert=require('assert');
const root=require('path').resolve(__dirname,'..')+'/';
const expected=['best','4320p','2160p','1440p','1080p','720p','480p','360p','prores','audio_wav','audio_flac','audio_mp3','audio_m4a','audio_original','thumbnail'];
function boot(kind,saved){
 const rel=kind==='desktop'?'app/src/':'com.alexascencio.mediadownloader/';
 const dom=new JSDOM(fs.readFileSync(root+rel+'index.html','utf8'),{url:'https://ui.test',runScripts:'outside-only'});
 const w=dom.window;w.setTimeout=()=>0;Object.entries(saved||{}).forEach(([k,v])=>w.localStorage.setItem(k,v));
 const calls=[];w.Downloader={getDefaultDownloadDir:()=>'/downloads',startDownload:opts=>{calls.push(opts);return Promise.resolve({title:'Test',filePath:'/downloads/a',preset:opts.preset})}};
 w.Platforms={};w.Bridge={};
 let s=fs.readFileSync(root+rel+'js/app.js','utf8');
 const expose=kind==='desktop'?'window.test={loadSettings,saveSettings,setupDropdown,startPlaylistDownload,startBatchDownload,setPlaylist:p=>{playlistData=p}};':'window.test={loadSettings,saveSettings};';
 s=s.replace('document.addEventListener("DOMContentLoaded", init);',expose);w.eval(s);
 return {w,dom,calls,api:w.test};
}
(async()=>{
 const b=boot('desktop',{}),w=b.w;
 const wrappers=[...w.document.querySelectorAll('.custom-select-wrapper')];assert.equal(wrappers.length,3);
 wrappers.forEach(wrapper=>assert.deepEqual([...wrapper.querySelectorAll('.select-option')].map(o=>o.dataset.value),expected));
 assert.equal(new Set([...w.document.querySelectorAll('[id]')].map(e=>e.id)).size,w.document.querySelectorAll('[id]').length);
 b.api.setupDropdown();await b.api.loadSettings();
 function choose(suffix,value){const wrap=w.document.getElementById('customSelectWrapper'+suffix);wrap.querySelector('.custom-select-trigger').click();wrap.querySelector('[data-value="'+value+'"]').click();assert.equal(wrap.querySelector('input').value,value);assert.equal(wrap.classList.contains('open'),false)}
 choose('','2160p');choose('Playlist','audio_flac');choose('Batch','audio_original');
 assert.equal(w.document.getElementById('selectPreset').value,'2160p');assert.equal(w.localStorage.getItem('mediadownloader_default_preset'),null);
 b.api.setPlaylist({items:[{selected:true,url:'https://a',title:'A'},{selected:true,url:'https://b',title:'B'}]});await b.api.startPlaylistDownload();assert.equal(b.calls.length,2);assert(b.calls.every(c=>c.preset==='audio_flac'));
 b.calls.length=0;w.document.getElementById('batchTextarea').value='https://a\nhttps://b';await b.api.startBatchDownload();assert.equal(b.calls.length,2);assert(b.calls.every(c=>c.preset==='audio_original'));
 assert.equal(w.document.getElementById('selectPresetPlaylist').value,'audio_flac');
 for(const kind of ['desktop','plugin']){
  const c=boot(kind,{});await c.api.loadSettings();c.w.document.getElementById('selectDefaultPreset').value='audio_wav';c.api.saveSettings();assert.equal(c.w.localStorage.getItem('mediadownloader_default_preset'),'audio_wav');
  const reloaded=boot(kind,{mediadownloader_default_preset:c.w.localStorage.getItem('mediadownloader_default_preset')});await reloaded.api.loadSettings();[...reloaded.w.document.querySelectorAll('.custom-select-wrapper')].forEach(wrapper=>{assert.equal(wrapper.querySelector('input').value,'audio_wav');assert.equal(wrapper.querySelector('.select-option.active').dataset.value,'audio_wav')});
  assert.deepEqual([...reloaded.w.document.querySelectorAll('#customSelectDropdown .select-option')].map(o=>o.dataset.value),expected);
  const invalid=boot(kind,{mediadownloader_default_preset:'invalid'});await invalid.api.loadSettings();assert.equal(invalid.w.document.getElementById('selectPreset').value,'best');assert.equal(invalid.w.document.getElementById('selectDefaultPreset').value,'best');
  c.dom.window.close();reloaded.dom.window.close();invalid.dom.window.close();console.log('PASS '+kind+' 15 presets, save, reload, invalid fallback');
 }
 console.log('PASS desktop 3 independent selectors, 2 playlist jobs and 2 batch jobs receive correct formats');
 b.dom.window.close();
})().catch(e=>{console.error(e);process.exitCode=1});

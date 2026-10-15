const fs=require('fs'),assert=require('assert'),{JSDOM}=require('jsdom');const root=require('path').resolve(__dirname,'..')+'/';
function boot(rel,expose){const dom=new JSDOM(fs.readFileSync(root+rel+'index.html','utf8'),{url:'https://ui.test',runScripts:'outside-only'}),w=dom.window;w.setTimeout=()=>0;w.Bridge={};w.Downloader={getDefaultDownloadDir:()=>'/download',detectPlatform:()=>({id:'web',name:'Web',badge:'WEB'})};w.eval(fs.readFileSync(root+rel+'js/app.js','utf8').replace('document.addEventListener("DOMContentLoaded", init);','window.test={'+expose+'};'));return {dom,w,api:w.test}}
const good=opts=>({title:'Test',filePath:'/tmp/a',preset:opts.preset});
(async()=>{
 for(const mode of ['allfail','partial','cancel']){
  let b=boot('app/src/','startBatchDownload,setCancel:()=>{queueCancelled=true},loadHistory'),w=b.w,n=0;
  w.document.getElementById('batchTextarea').value='https://a\nhttps://b\nhttps://c';
  w.Downloader.startDownload=opts=>{n++;if(mode==='cancel'&&n===1){b.api.setCancel();return Promise.reject(Error('Cancelado'))}if(mode==='allfail'||mode==='partial'&&n===2)return Promise.reject(Error('Failed'));return Promise.resolve(good(opts))};
  await b.api.startBatchDownload();let remain=w.document.getElementById('batchTextarea').value;let toast=w.document.getElementById('toastContainer').lastElementChild;
  if(mode==='allfail'){assert.equal(remain,'https://a\nhttps://b\nhttps://c');assert(toast.classList.contains('error'));assert(toast.textContent.includes('0 concluído(s), 3 falha(s)'))}
  if(mode==='partial'){assert.equal(remain,'https://b');assert(toast.classList.contains('info'));assert(toast.textContent.includes('2 concluído(s), 1 falha(s)'))}
  if(mode==='cancel'){assert.equal(n,1);assert.equal(remain,'https://a\nhttps://b\nhttps://c');assert(toast.textContent.includes('3 pendente(s)'));assert(toast.classList.contains('info'))}
  w.localStorage.setItem('mediadownloader_desktop_history','{}');b.api.loadHistory();console.log('PASS batch '+mode+' retains retry links and reports counts; invalid history safe');b.dom.window.close();
 }
 let b=boot('app/src/','startPlaylistDownload,setPlaylist:p=>{playlistData=p}');b.w.Downloader.startDownload=()=>Promise.reject(Error('Failed'));b.api.setPlaylist({items:[{url:'https://a',title:'A',selected:true}]});await b.api.startPlaylistDownload();assert(b.w.document.getElementById('toastContainer').lastElementChild.classList.contains('error'));b.dom.window.close();console.log('PASS playlist all failures has error summary');
 b=boot('com.alexascencio.mediadownloader/','loadHistory,startDownload,cancelDownload');let w=b.w;
 for(const thumbnail of ['https://image.test/x" onerror="window.injected=1','javascript:window.injected=1','data:image/svg+xml,<svg onload="x">']){
  w.localStorage.setItem('mediadownloader_history',JSON.stringify([{title:'<img onerror="x">',filePath:'/tmp/a',thumbnail,timestamp:Date.now(),preset:'audio_flac',platform:{id:'web" onclick="x',name:'<img onerror="x">'}}]));b.api.loadHistory();assert.equal(w.document.querySelectorAll('[onerror],[onload],[onclick]').length,0);assert.equal(w.document.querySelector('.history-format-badge').textContent,'FLAC');
 }
 w.localStorage.setItem('mediadownloader_history','{}');b.api.loadHistory();let resolveInfo,jobs=0;w.Bridge.getProjectInfo=()=>new Promise(resolve=>resolveInfo=resolve);w.Downloader.startDownload=()=>{jobs++;return new Promise(()=>{})};w.Downloader.cancelDownload=()=>{};w.document.getElementById('urlInput').value='https://example.com/media';b.api.startDownload();b.api.cancelDownload();resolveInfo({projectFolder:'/p'});await new Promise(resolve=>setImmediate(resolve));assert.equal(jobs,0);console.log('PASS CEP injection blocked, FLAC badge, invalid history safe, cancellation before host lookup prevents download');b.dom.window.close();
})().catch(e=>{console.error(e);process.exitCode=1});

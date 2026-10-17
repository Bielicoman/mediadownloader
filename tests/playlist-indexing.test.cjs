const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),{EventEmitter}=require('node:events');
const children=[];const w={BinManager:{findYtDlp:async()=>({found:true,path:'yt-dlp'})}};
const ctx={window:w,URL,Buffer,console,setTimeout(){},localStorage:{getItem:()=>null},require(n){if(n==='child_process')return{spawn(file,args){const c=new EventEmitter();c.stdout=new EventEmitter();c.stderr=new EventEmitter();children.push({c,args});return c;}};return require(n);}};
vm.runInNewContext(fs.readFileSync('app/src/js/downloader.js','utf8'),ctx);
async function run(url,info){const p=w.Downloader.fetchPlaylistOrChannel(url);await new Promise(r=>setImmediate(r));const x=children.at(-1);x.c.stdout.emit('data',Buffer.from(JSON.stringify(info)));x.c.emit('close',0);return{result:await p,args:x.args};}
(async()=>{
let x=await run('https://www.youtube.com/watch?v=abc123',{id:'abc123',title:'Um vídeo',extractor:'youtube',webpage_url:'https://www.youtube.com/watch?v=abc123'});assert.equal(x.result.itemsCount,1);assert.equal(x.result.singleVideo,true);assert.equal(x.result.items[0].selected,true);
x=await run('https://www.youtube.com/watch?v=abc123&list=PLtest&index=3',{_type:'playlist',title:'Coleção',entries:[{id:'abc123',url:'abc123',ie_key:'Youtube'},{id:'def456',url:'https://www.youtube.com/watch?v=def456'}]});assert.equal(x.result.itemsCount,2);assert.equal(x.args.at(-1),'https://www.youtube.com/playlist?list=PLtest');assert(x.args.includes('--yes-playlist'));assert.equal(x.result.items[0].url,'https://www.youtube.com/watch?v=abc123');
await assert.rejects(run('https://www.youtube.com/playlist?list=PLempty',{_type:'playlist',entries:[]}),/Nenhum vídeo disponível/);
console.log('PASS video unico, playlist watch normalizada, dois itens, URL valida e colecao vazia rejeitada');
})().catch(e=>{console.error(e);process.exitCode=1;});

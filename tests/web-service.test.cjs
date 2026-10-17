const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {Jobs,validateInput}=require('../web/jobs.cjs'),{createServer}=require('../web/server.cjs');
const input={url:'https://www.youtube.com/watch?v=test',format:'original',quality:'best'};
const wait=ms=>new Promise(r=>setTimeout(r,ms));
test('URL e opções: recusa rede local, credenciais, portas, protocolos e plataformas falsas',()=>{
  for(const url of ['http://youtube.com/watch?v=x','https://127.0.0.1/','https://localhost/','file:///etc/passwd','https://youtube.com.evil.example/','https://user:pass@youtube.com/','https://youtube.com:8443/','https://www.youtube.com/playlist?list=x'])assert.throws(()=>validateInput({...input,url}));
  assert.equal(validateInput(input).quality,'best');assert.throws(()=>validateInput({...input,format:'../../secret'}));assert.throws(()=>validateInput({...input,quality:'-x'}));
});
test('progresso em chunks, entrega original e limite de capacidade',async()=>{
  class FixtureJobs extends Jobs {async command(j,exe,args,onLine){assert(args.includes('--ignore-config'));assert(args.includes('--no-playlist'));assert(!args.includes('--no-check-certificates'));assert.equal(args.at(-1),input.url);onLine('TITLE:Vídeo de teste');onLine('PROGRESS: 50.0%');await wait(40);const file=path.join(j.dir,'source.mkv');fs.writeFileSync(file,'real-fixture-bytes');onLine('FILE:'+file);}}
  const jobs=new FixtureJobs({maxJobs:1});try{const j=jobs.create(input);assert.throws(()=>jobs.create(input),/ocupado/);assert.equal(jobs.jobs.get(j.id).percent,50);await wait(80);const v=jobs.view(jobs.jobs.get(j.id));assert.equal(v.state,'ready');assert.equal(v.bytes,18);assert.equal(v.filename,'Vídeo de teste.mkv');assert(!JSON.stringify(v).includes(jobs.root));}finally{await jobs.close();}
});
test('cancelamento encerra processo real e não gera resultado pronto',async()=>{
  const jobs=new Jobs();const j={id:'cancel',state:'processing',dir:fs.mkdtempSync(path.join(jobs.root,'cancel-')),expiresAt:Date.now()+1000};jobs.jobs.set(j.id,j);
  const p=jobs.command(j,process.execPath,['-e','setInterval(()=>{},1000)']).then(()=>assert.fail('Deveria cancelar'),()=>{});await wait(80);assert(j.child.pid);jobs.cancel(j.id);await p;assert.equal(j.state,'cancelled');await jobs.close();
});
test('timeout encerra processo real',async()=>{const jobs=new Jobs({timeoutMs:80});try{const j={state:'processing',dir:jobs.root};await assert.rejects(jobs.command(j,process.execPath,['-e','setInterval(()=>{},1000)']),/tempo/);}finally{await jobs.close();}});
test('API: proteção de origem, erros, Range, HEAD, expiração e arquivos privados',async()=>{
  class FixtureJobs extends Jobs {async ready(){} async process(j){j.file=path.join(j.dir,'fixture.mp4');fs.writeFileSync(j.file,'0123456789');j.filename='Teste.mp4';j.state='ready';j.stage='Arquivo pronto';j.bytes=10;j.percent=100;}}
  const jobs=new FixtureJobs(),{server}=createServer({jobs});await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
  const post=(origin=base,body=JSON.stringify(input),type='application/json')=>fetch(base+'/api/jobs',{method:'POST',headers:{Origin:origin,'Content-Type':type},body});
  try{
    assert.equal((await fetch(base+'/api/health')).status,200);
    assert.equal((await post('https://evil.example')).status,403);assert.equal((await post(base,'{}','text/plain')).status,415);assert.equal((await post(base,'null')).status,400);
    const created=await post();assert.equal(created.status,202);const j=await created.json();assert.match(j.id,/^[a-f0-9]{48}$/);
    const file=base+'/api/jobs/'+j.id+'/file';const response=await fetch(file);assert.equal(await response.text(),'0123456789');assert.match(response.headers.get('content-disposition'),/attachment/);
    const range=await fetch(file,{headers:{Range:'bytes=3-6'}});assert.equal(range.status,206);assert.equal(await range.text(),'3456');assert.equal(range.headers.get('content-range'),'bytes 3-6/10');
    assert.equal((await fetch(file,{headers:{Range:'bytes=99-'}})).status,416);const head=await fetch(file,{method:'HEAD'});assert.equal(head.headers.get('content-length'),'10');assert.equal(await head.text(),'');
    assert.equal((await fetch(base+'/web/jobs.cjs')).status,404);assert.equal((await fetch(base+'/api/jobs/'+'0'.repeat(48))).status,404);
    jobs.jobs.get(j.id).expiresAt=0;assert.equal((await fetch(file)).status,404);jobs.cleanup();assert(!jobs.jobs.has(j.id));
  }finally{server.closeAllConnections();await new Promise(r=>server.close(r));await jobs.close();}
});
test('erros não vazam caminhos/saída de processos e serviço ausente não aceita job',async()=>{
  const jobs=new Jobs({ytdlp:'missing-media-web-binary'});const {server}=createServer({jobs});await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
  try{assert.equal((await fetch(base+'/api/health')).status,503);assert.equal((await fetch(base+'/api/jobs',{method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:JSON.stringify(input)})).status,503);assert(!jobs.friendlyError('secret path C:\\private\\password').includes('secret'));assert.match(jobs.friendlyError('HTTP Error 403'),/bloqueou/);}finally{server.closeAllConnections();await new Promise(r=>server.close(r));await jobs.close();}
});

'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const {Jobs}=require('./jobs.cjs');
function createServer(options={}) {
  const jobs=options.jobs || new Jobs(),root=options.root || path.resolve(__dirname,'../dist/site');
  const publicOrigin=process.env.PUBLIC_ORIGIN;
  const attempts=new Map();
  let ready=false; jobs.ready().then(()=>{ready=true;}).catch(()=>{});
  const json=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
  const server=http.createServer(async(req,res)=>{
    res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');
    res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: https://i.ytimg.com; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
    try {
      const pathname=new URL(req.url,'http://localhost').pathname;
      if(pathname.startsWith('/api/')){
        if(req.method==='GET' && pathname==='/api/health')return json(res,ready?200:503,{ready,formats:['original','premiere','prores','mp3','wav','flac','m4a','audio_original','thumbnail'],maxBytes:jobs.maxBytes,retentionMinutes:60});
        const match=pathname.match(/^\/api\/jobs\/([a-f0-9]{48})(\/file)?$/);
        if(req.method==='POST' && ['/api/jobs','/api/metadata'].includes(pathname)){
          const origin=req.headers.origin;
          if(!origin || origin!==(publicOrigin || 'http://'+req.headers.host))return json(res,403,{error:'Origem não autorizada.'});
          if(!/^application\/json(?:;|$)/i.test(req.headers['content-type']||''))return json(res,415,{error:'Envie JSON.'});
          if(!ready)return json(res,503,{error:'O serviço de downloads ainda não está disponível.'});
          const ip=req.socket.remoteAddress,now=Date.now();
          // Do not trust forwarded headers supplied by callers.
          for(const [key,v] of attempts)if(v.until<now)attempts.delete(key);
          const rate=attempts.get(ip)||{count:0,until:now+60000};attempts.set(ip,rate);
          if(++rate.count>5)return json(res,429,{error:'Aguarde um minuto antes de tentar novamente.'});
          let body='';for await(const chunk of req){body+=chunk;if(Buffer.byteLength(body)>4096)return json(res,413,{error:'Link muito longo.'});}
          let input;try{input=JSON.parse(body);}catch{return json(res,400,{error:'Pedido inválido.'});}
          if(!input || typeof input!=='object')return json(res,400,{error:'Pedido inválido.'});
          try {return json(res,202,jobs.create(input,pathname==='/api/metadata'));}catch(e){return json(res,e.status||400,{error:e.message});}
        }
        if(match){
          const j=jobs.jobs.get(match[1]);if(!j || Date.now()>j.expiresAt)return json(res,404,{error:'Download expirado. Prepare o arquivo novamente.'});
          if(req.method==='GET' && !match[2])return json(res,200,jobs.view(j));
          if(req.method==='DELETE' && !match[2]){
            if(req.headers.origin!==(publicOrigin || 'http://'+req.headers.host))return json(res,403,{error:'Origem não autorizada.'});
            return json(res,jobs.cancel(j.id)?200:409,jobs.view(j));
          }
          if(['GET','HEAD'].includes(req.method) && match[2]){
            if(j.state!=='ready'||!j.file)return json(res,409,{error:'O arquivo ainda não está pronto.'});
            const stat=fs.statSync(j.file);let start=0,end=stat.size-1,status=200;
            if(req.headers.range){const range=req.headers.range.match(/^bytes=(\d+)-(\d*)$/);if(!range || Number(range[1])>=stat.size){res.writeHead(416,{'Content-Range':'bytes */'+stat.size});return res.end();}start=Number(range[1]);end=range[2]?Math.min(Number(range[2]),end):end;if(end<start){res.writeHead(416);return res.end();}status=206;res.setHeader('Content-Range',`bytes ${start}-${end}/${stat.size}`);}
            res.writeHead(status,{'Content-Type':'application/octet-stream','Content-Disposition':`attachment; filename="MediaDownloader${path.extname(j.file)}"; filename*=UTF-8''${encodeURIComponent(j.filename).replace(/['()*]/g,c=>'%'+c.charCodeAt(0).toString(16))}`,'Content-Length':end-start+1,'Accept-Ranges':'bytes','Cache-Control':'private, no-store'});
            if(req.method==='HEAD')return res.end();
            j.transfers++;const stream=fs.createReadStream(j.file,{start,end});let released=false;
            const release=()=>{if(!released){released=true;j.transfers--;}};res.on('close',()=>{stream.destroy();release();});stream.on('error',()=>{release();res.destroy();});stream.pipe(res);return;
          }
        }
        return json(res,404,{error:'Rota não encontrada.'});
      }
      if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);return res.end();}
      let rel;try{rel=decodeURIComponent(pathname).replace(/^\/+/, '')||'index.html';}catch{res.writeHead(400);return res.end();}
      if(!path.extname(rel))rel+='.html';
      const file=path.resolve(root,rel);
      if(!file.startsWith(root+path.sep) || rel.split(/[\\/]/).some(p=>p.startsWith('.'))){res.writeHead(404);return res.end();}
      let stat;try{stat=fs.statSync(file);}catch{res.writeHead(404);return res.end('Não encontrado');}if(!stat.isFile()){res.writeHead(404);return res.end();}
      const types={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'application/javascript','.svg':'image/svg+xml','.png':'image/png','.ttf':'font/ttf','.json':'application/json'};
      res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Content-Length':stat.size,'Cache-Control':'no-cache'});
      if(req.method==='HEAD')res.end();else {const s=fs.createReadStream(file);s.on('error',()=>res.destroy());res.on('close',()=>s.destroy());s.pipe(res);}
    }catch{if(!res.headersSent)json(res,500,{error:'O serviço encontrou um erro. Tente novamente.'});else res.destroy();}
  });
  server.requestTimeout=15000;server.headersTimeout=10000;
  return {server,jobs};
}
if(require.main===module){const {server,jobs}=createServer();server.listen(Number(process.env.PORT||3080),process.env.HOST||'127.0.0.1',()=>console.log('Media Downloader Web: porta '+server.address().port));for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>{server.close();jobs.close().then(()=>process.exit());});}
module.exports={createServer};

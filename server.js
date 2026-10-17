const http = require('http');
const fs = require('fs');
const path = require('path');
const root = fs.existsSync(path.join(__dirname, 'dist/site/index.html')) ? path.join(__dirname, 'dist/site') : __dirname;
const port = Number(process.env.PORT || 3000);
const allowed = new Set(['index.html','site.css','site.js','online.html','online.css','online.js','version.json','logo.png','favicon.ico','favicon.svg','favicon.png','apple-touch-icon.png','LICENSE','LICENSE.txt','THIRD-PARTY-NOTICES.md','privacidade.html','termos.html','cookies.html','licencas.html','suporte.html','acessibilidade.html']);
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.txt':'text/plain; charset=utf-8','.md':'text/plain; charset=utf-8','.ttf':'font/ttf'};
http.createServer((req,res)=>{
  if (!['GET','HEAD'].includes(req.method)) {res.writeHead(405);res.end();return;}
  let rel;
  try { rel=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\/+/, '') || 'index.html'; } catch {res.writeHead(400);res.end();return;}
  const file=path.resolve(root,rel);
  const inRoot=file.startsWith(path.resolve(root)+path.sep);
  const publicFile=allowed.has(rel)||(/^(assets|licenses)\//.test(rel)&&!rel.split('/').some(p=>p.startsWith('.')));
  if(!inRoot||!publicFile){res.writeHead(404);res.end('Não encontrado');return;}
  fs.stat(file,(err,st)=>{if(err||!st.isFile()){res.writeHead(404);res.end('Não encontrado');return;}
    res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Content-Length':st.size,'X-Content-Type-Options':'nosniff','Cache-Control':'no-cache'});
    if(req.method==='HEAD')res.end();else fs.createReadStream(file).pipe(res);
  });
}).listen(port,'127.0.0.1',()=>console.log('Media Downloader: http://127.0.0.1:'+port));

'use strict';
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const {randomBytes} = require('node:crypto');
const {spawn, execFile} = require('node:child_process');
const {promisify} = require('node:util');
const {StringDecoder} = require('node:string_decoder');
const run = promisify(execFile);
const platforms = ['youtube.com','youtu.be','vimeo.com','instagram.com','tiktok.com','facebook.com','fb.watch','twitter.com','x.com'];
function validateInput(input) {
  let url; try { url = new URL(input.url); } catch { throw new Error('Cole um link completo de vídeo.'); }
  if (url.protocol !== 'https:' || url.username || url.password || url.port || !platforms.some(h=>url.hostname===h || url.hostname.endsWith('.'+h))) throw new Error('Use um link HTTPS do YouTube, Vimeo, Instagram, TikTok, Facebook ou X.');
  if (!['original','premiere','mp3','wav'].includes(input.format)) throw new Error('Formato inválido.');
  if (!['best','4320','2160','1440','1080','720','480','360','240','144'].includes(input.quality)) throw new Error('Qualidade inválida.');
  if (url.pathname === '/playlist' || /\/(channel|user|c)\//.test(url.pathname) || /^\/@/.test(url.pathname)) throw new Error('Use o link de um vídeo. Coleções ainda não estão disponíveis na versão web.');
  return {url:url.href,format:input.format,quality:input.quality};
}
function stopTree(child) {
  if (!child || !child.pid) return;
  if (process.platform === 'win32') { const p=spawn('taskkill',['/PID',String(child.pid),'/T','/F'],{windowsHide:true,stdio:'ignore'}); p.on('error',()=>child.kill()); }
  else { try {process.kill(-child.pid,'SIGKILL');} catch {child.kill('SIGKILL');} }
}
class Jobs {
  constructor(options={}) {
    this.ytdlp=options.ytdlp || process.env.YTDLP_PATH || 'yt-dlp';
    this.ffmpeg=options.ffmpeg || process.env.FFMPEG_PATH || 'ffmpeg';
    this.ffprobe=options.ffprobe || process.env.FFPROBE_PATH || 'ffprobe';
    this.root=fs.mkdtempSync(path.join(os.tmpdir(),'media-web-'));
    this.jobs=new Map(); this.maxJobs=options.maxJobs || 2;
    this.maxBytes=options.maxBytes || 2*1024**3;
    this.timeoutMs=options.timeoutMs || 30*60*1000;
    this.ttlMs=options.ttlMs || 60*60*1000;
    this.timer=setInterval(()=>this.cleanup(),60000); this.timer.unref();
  }
  async ready() { await Promise.all([run(this.ytdlp,['--version'],{timeout:15000,windowsHide:true}),run(this.ffmpeg,['-version'],{timeout:15000,windowsHide:true}),run(this.ffprobe,['-version'],{timeout:15000,windowsHide:true})]); }
  view(j) { return {id:j.id,state:j.state,stage:j.stage,percent:j.percent,error:j.error,filename:j.filename,bytes:j.bytes,expiresAt:j.expiresAt,downloadUrl:j.state==='ready'?'/api/jobs/'+j.id+'/file':null}; }
  create(input) {
    input=validateInput(input);
    if ([...this.jobs.values()].filter(j=>!['ready','error','cancelled'].includes(j.state)).length>=this.maxJobs || this.jobs.size>=40) { const e=new Error('O serviço está ocupado. Tente novamente em alguns minutos.'); e.status=429; throw e; }
    const id=randomBytes(24).toString('hex'),dir=path.join(this.root,id);
    fs.mkdirSync(dir); const j={id,dir,input,state:'processing',stage:'Buscando o vídeo',percent:null,created:Date.now(),expiresAt:Date.now()+this.timeoutMs+this.ttlMs,child:null,transfers:0};
    this.jobs.set(id,j); this.process(j).catch(e=>{if(j.state!=='cancelled'){j.state='error';j.stage='Não foi possível preparar o arquivo';j.error=this.friendlyError(e.message);} this.removeFiles(j);});
    return this.view(j);
  }
  friendlyError(message) {
    if (/403|429|sign in|bot|login|cookies|private|restricted|unavailable/i.test(message)) return 'A plataforma bloqueou o acesso ou exige autenticação. Tente outro vídeo público; a versão web não recebe cookies da sua conta.';
    if (/limite|tempo|cancelado|tamanho|duração/i.test(message)) return message;
    return 'Não foi possível processar esse vídeo. Confira se o link é público e tente novamente.';
  }
  command(j,exe,args,onLine=()=>{}) {
    return new Promise((resolve,reject)=>{
      if(j.state==='cancelled')return reject(new Error('Cancelado.'));
      const child=spawn(exe,args,{windowsHide:true,detached:process.platform!=='win32',stdio:['ignore','pipe','pipe']}); j.child=child;
      let tail=''; const pending=[];
      for(const stream of [child.stdout,child.stderr]) {
        const state={decoder:new StringDecoder('utf8'),buffer:''};pending.push(state);
        stream.on('data',data=>{const text=state.decoder.write(data);tail=(tail+text).slice(-6000);state.buffer+=text;const lines=state.buffer.split(/[\r\n]+/);state.buffer=lines.pop();for(const line of lines)onLine(line);});
      }
      const timer=setTimeout(()=>{j.failure='O vídeo excedeu o tempo disponível. Tente um vídeo menor.';stopTree(child);},this.timeoutMs);
      const budget=setInterval(()=>{try {const size=fs.readdirSync(j.dir).reduce((n,f)=>n+fs.statSync(path.join(j.dir,f)).size,0);if(size>this.maxBytes){j.failure='O arquivo excedeu o limite de 2 GB da versão web.';stopTree(child);}}catch{}},1000);
      const done=()=>{clearTimeout(timer);clearInterval(budget);if(j.child===child)j.child=null;};
      child.on('error',e=>{done();reject(e);}); child.on('close',code=>{done();for(const state of pending){state.buffer+=state.decoder.end();if(state.buffer)onLine(state.buffer);}if(code===0 && !j.failure && j.state!=='cancelled')resolve(tail);else reject(new Error(j.failure || tail || 'Cancelado.'));});
    });
  }
  async process(j) {
    const {url,format,quality}=j.input;
    const audio=['wav','mp3'].includes(format),filter=quality==='best'?'':`[height<=${quality}]`;
    const args=['--ignore-config','--no-playlist','--no-warnings','--no-colors','--newline','--no-simulate','--no-write-info-json','--no-write-thumbnail','--js-runtimes','node:'+process.execPath,'--socket-timeout','20','--retries','2','--fragment-retries','2','--concurrent-fragments','8','--max-filesize',String(this.maxBytes),'--match-filter','!is_live & duration <= 3600','--ffmpeg-location',path.dirname(path.resolve(this.ffmpeg)),'-f',audio?'bestaudio/best':`bestvideo${filter}+bestaudio/best${filter}`,'--merge-output-format','mkv','--print','before_dl:TITLE:%(title)s','--print','after_move:FILE:%(filepath)s','--progress-template','download:PROGRESS:%(progress._percent_str)s','-o',path.join(j.dir,'source.%(ext)s'),'--',url];
    // Let yt-dlp resolve FFmpeg from PATH when a bare executable name is used.
    if(!path.isAbsolute(this.ffmpeg)){const i=args.indexOf('--ffmpeg-location');args.splice(i,2);}
    let source;
    await this.command(j,this.ytdlp,args,line=>{
      if(line.startsWith('TITLE:'))j.title=line.slice(6);
      if(line.startsWith('FILE:'))source=line.slice(5).trim();
      const m=line.match(/^PROGRESS:\s*([\d.]+)%/);if(m){j.stage='Baixando da plataforma';j.percent=Math.min(100,Number(m[1]));}
      if(line.includes('[Merger]')){j.stage='Unindo vídeo e áudio';j.percent=null;}
    });
    if (!source || path.dirname(path.resolve(source))!==j.dir || !fs.existsSync(source)) throw new Error('Vídeo indisponível ou duração acima do limite de uma hora.');
    if(format==='original'){j.file=source;} else {
      j.stage='Preparando '+(format==='premiere'?'Vídeo MP4':format.toUpperCase());j.percent=null;
      const probe=JSON.parse((await run(this.ffprobe,['-v','error','-show_streams','-show_format','-of','json',source],{windowsHide:true,timeout:30000,maxBuffer:1024*1024})).stdout);
      const video=probe.streams.find(s=>s.codec_type==='video'),sound=probe.streams.find(s=>s.codec_type==='audio'),duration=Number(probe.format.duration);
      const ext=format==='premiere'?'mp4':format;j.file=path.join(j.dir,'final.'+ext);
      let codecs;
      if(format==='premiere') {
        if(!video)throw new Error('Vídeo sem imagem.');
        const copy=video.codec_name==='h264' && video.pix_fmt==='yuv420p';
        codecs=['-map','0:v:0','-map','0:a:0?',...(copy?['-c:v','copy']:['-c:v','libx264','-preset','veryfast','-crf','16','-pix_fmt','yuv420p']),...(sound && sound.codec_name==='aac' && Number(sound.sample_rate)===48000?['-c:a','copy']:['-c:a','aac','-b:a','320k','-ar','48000']),'-movflags','+faststart'];
      } else {if(!sound)throw new Error('Vídeo sem áudio.');codecs=['-vn',...(format==='mp3'?['-c:a','libmp3lame','-b:a','320k']:['-c:a','pcm_s24le','-ar','48000'])];}
      await this.command(j,this.ffmpeg,['-nostdin','-hide_banner','-loglevel','error','-y','-i',source,...codecs,'-progress','pipe:1',j.file],line=>{const m=line.match(/^out_time_us=(\d+)/);if(m && duration>0)j.percent=Math.min(99,Number(m[1])/1e6/duration*100);});
      fs.unlinkSync(source);
    }
    const stat=fs.statSync(j.file);if(stat.size===0 || stat.size>this.maxBytes)throw new Error('Arquivo vazio ou acima do limite de tamanho.');
    const title=(j.title || 'Media Downloader').replace(/[\x00-\x1f<>:"/\\|?*]/g,'_').slice(0,120);
    j.filename=title+path.extname(j.file);j.bytes=stat.size;j.state='ready';j.stage='Arquivo pronto';j.percent=100;j.expiresAt=Date.now()+this.ttlMs;
  }
  cancel(id) { const j=this.jobs.get(id);if(!j)return false;if(j.state==='ready' && j.transfers)return false;j.state='cancelled';j.stage='Cancelado';stopTree(j.child);if(!j.child)this.removeFiles(j);return true; }
  removeFiles(j) {if(!j.transfers)fs.rmSync(j.dir,{recursive:true,force:true});}
  cleanup() {for(const [id,j] of this.jobs)if(Date.now()>j.expiresAt && !j.child && !j.transfers){this.removeFiles(j);this.jobs.delete(id);}}
  async close() {clearInterval(this.timer);for(const j of this.jobs.values())this.cancel(j.id);await new Promise(r=>setTimeout(r,300));if(![...this.jobs.values()].some(j=>j.child))fs.rmSync(this.root,{recursive:true,force:true});}
}
module.exports={Jobs,validateInput};

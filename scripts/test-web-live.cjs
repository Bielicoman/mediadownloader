// Opt-in integration test: downloads a public 19-second reference, no private cookies.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{execFile}=require('node:child_process'),{promisify}=require('node:util');
const {Jobs}=require('../web/jobs.cjs'),run=promisify(execFile);
(async()=>{
 const jobs=new Jobs(),out=path.resolve(__dirname,'../work/web-validation');fs.mkdirSync(out,{recursive:true});const evidence=[];
 try{
  await jobs.ready();
  for(const format of ['original','premiere','mp3','wav']){
   const started=Date.now(),v=jobs.create({url:'https://www.youtube.com/watch?v=jNQXAC9IVRw',format,quality:'best'}),j=jobs.jobs.get(v.id);
   while(j.state==='processing')await new Promise(r=>setTimeout(r,500));
   assert.equal(j.state,'ready',j.error);const dest=path.join(out,format+path.extname(j.file));fs.copyFileSync(j.file,dest);
   const probe=JSON.parse((await run(jobs.ffprobe,['-v','error','-show_streams','-show_format','-of','json',dest],{windowsHide:true})).stdout);
   await run(jobs.ffmpeg,['-v','error','-i',dest,'-f','null','-'],{windowsHide:true});
   const streams=probe.streams.map(s=>({codec:s.codec_name,type:s.codec_type,width:s.width,height:s.height,pix_fmt:s.pix_fmt,sample_rate:s.sample_rate,bit_rate:s.bit_rate}));
   if(format==='premiere'){assert(streams.some(s=>s.codec==='h264'&&s.pix_fmt==='yuv420p'));assert(streams.some(s=>s.codec==='aac'&&s.sample_rate==='48000'));}
   if(format==='mp3')assert(streams.some(s=>s.codec==='mp3'&&s.bit_rate==='320000'));
   if(format==='wav')assert(streams.some(s=>s.codec==='pcm_s24le'&&s.sample_rate==='48000'));
   assert(Number(probe.format.duration)>18&&Number(probe.format.duration)<21);
   const item={format,seconds:(Date.now()-started)/1000,bytes:j.bytes,duration:probe.format.duration,streams,fullDecode:true};evidence.push(item);console.log(JSON.stringify(item));
  }
 }finally{await jobs.close();fs.writeFileSync(path.join(out,'evidence.json'),JSON.stringify({testedAt:new Date().toISOString(),evidence},null,2));}
})().catch(e=>{console.error(e.message);process.exitCode=1;});

const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {JSDOM}=require('jsdom');
test('prévia funciona sem backend, acompanha links e não aceita domínio impostor',async()=>{
  const dom=new JSDOM(fs.readFileSync('index.html','utf8'),{url:'https://example.test/',runScripts:'outside-only'});
  const w=dom.window,d=w.document;
  w.fetch=async()=>{throw Error('offline');};w.AbortSignal.timeout=()=>undefined;
  w.eval(fs.readFileSync('online.js','utf8'));
  const input=d.getElementById('media-url'),preview=d.getElementById('media-preview'),img=d.getElementById('media-thumbnail');
  const enter=url=>{input.value=url;input.dispatchEvent(new w.Event('input'));};
  try{
    enter('https://youtu.be/jNQXAC9IVRw?si=tracking');
    assert(!preview.hidden);assert.equal(img.src,'https://i.ytimg.com/vi/jNQXAC9IVRw/hqdefault.jpg');
    enter('https://www.youtube.com/shorts/Uw-_a0taISM');assert(img.src.includes('/Uw-_a0taISM/'));
    enter('https://youtube.com.evil.example/watch?v=jNQXAC9IVRw');assert(preview.hidden);assert(!img.hasAttribute('src'));
    enter('https://youtu.be/jNQXAC9IVRw');img.dispatchEvent(new w.Event('error'));assert(preview.classList.contains('preview-failed'));
    enter('https://www.youtube.com/watch?v=Uw-_a0taISM');assert(!preview.classList.contains('preview-failed'));
    const format=d.getElementById('media-format'),quality=d.getElementById('media-quality');
    format.value='wav';format.dispatchEvent(new w.Event('change'));assert(quality.disabled);
    format.value='premiere';format.dispatchEvent(new w.Event('change'));assert(!quality.disabled);
    await new Promise(r=>setImmediate(r));assert(d.getElementById('prepare').disabled);
  }finally{w.close();}
});

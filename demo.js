(()=>{'use strict';
const demo=document.querySelector('[data-demo]');if(!demo)return;
const $=s=>demo.querySelector(s),motion=matchMedia('(prefers-reduced-motion: reduce)'),fine=matchMedia('(pointer: fine)');
const field=$('#demoLink'),media=$('#demoMedia'),progress=$('#demoProgress'),bar=$('#demoBar'),status=$('#demoStatus'),run=$('#demoDownload'),play=$('#demoPlay');
let sequence=0,timer=null,phase='empty',playing=false,frame=0;
const sample='https://exemplo.com/horizontes';
function reset(){playing=false;sequence++;clearTimeout(timer);phase='empty';field.value='';media.hidden=true;progress.hidden=true;run.disabled=true;run.textContent='Baixar exemplo';play.textContent='Ver demonstração';status.textContent='Uma prévia interativa. Nenhum arquivo será baixado.';demo.dataset.phase=phase;}
function paste(){sequence++;clearTimeout(timer);field.value=sample;showMedia();}
function showMedia(){phase='ready';demo.dataset.phase=phase;media.hidden=false;progress.hidden=true;run.disabled=false;run.textContent='Baixar exemplo';play.textContent='Repetir demonstração';status.textContent='Exemplo carregado. Explore os dados e escolha o formato.';}
function finish(){playing=false;phase='complete';demo.dataset.phase=phase;bar.style.transform='scaleX(1)';$('#demoPercent').textContent='100%';$('#demoProgressLabel').textContent='Arquivo de exemplo pronto';run.disabled=false;run.textContent='Simular novamente';status.textContent='Demonstração concluída. No aplicativo, o arquivo fica na sua pasta.';play.textContent='Repetir demonstração';}
function download(){if(phase==='empty')paste();const token=++sequence;clearTimeout(timer);phase='downloading';demo.dataset.phase=phase;run.disabled=true;run.textContent='Preparando exemplo…';progress.hidden=false;bar.style.transform='scaleX(0)';let percent=0;
 const tick=()=>{if(token!==sequence)return;percent=Math.min(100,percent+5);bar.style.transform=`scaleX(${percent/100})`;$('#demoPercent').textContent=percent+'%';$('#demoProgressLabel').textContent=percent<20?'Preparando mídia':percent<85?'Baixando vídeo e áudio':'Finalizando o arquivo';if(percent===100)finish();else timer=setTimeout(tick,motion.matches?15:140);};tick();}
function simulate(){reset();playing=true;play.textContent='Pausar demonstração';const token=sequence;let i=0;const type=()=>{if(token!==sequence)return;field.value=sample.slice(0,++i);if(i<sample.length){timer=setTimeout(type,motion.matches?0:32);return;}showMedia();play.textContent='Pausar demonstração';timer=setTimeout(()=>{if(token===sequence)download();},motion.matches?0:1000);};type();}
$('#demoPaste').addEventListener('click',paste);run.addEventListener('click',download);
play.addEventListener('click',()=>{if(playing||phase==='downloading'){playing=false;sequence++;clearTimeout(timer);phase=field.value?'ready':'empty';run.disabled=!field.value;run.textContent='Baixar exemplo';play.textContent='Continuar demonstração';status.textContent='Demonstração pausada.';}else simulate();});
field.addEventListener('input',()=>{sequence++;clearTimeout(timer);if(field.value.trim())showMedia();else reset();});
demo.querySelectorAll('[data-demo-mode]').forEach(btn=>btn.addEventListener('click',()=>{demo.querySelectorAll('[data-demo-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b===btn)));$('#demoCollection').hidden=btn.dataset.demoMode==='single';$('#demoCollection').textContent=btn.dataset.demoMode==='playlist'?'Playlist de exemplo · 3 vídeos selecionados':'Lista de exemplo · 3 links selecionados';if(phase==='empty')paste();}));
$('#demoFormat').addEventListener('change',()=>{$('#demoCodec').textContent=$('#demoFormat').value;});
demo.addEventListener('pointermove',e=>{if(motion.matches||!fine.matches||frame)return;frame=requestAnimationFrame(()=>{frame=0;const r=demo.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;demo.style.setProperty('--demo-rx',(-y*5).toFixed(2)+'deg');demo.style.setProperty('--demo-ry',(x*7).toFixed(2)+'deg');demo.style.setProperty('--demo-light',(50+x*60).toFixed(1)+'%');});});
function neutral(){cancelAnimationFrame(frame);frame=0;demo.style.setProperty('--demo-rx','0deg');demo.style.setProperty('--demo-ry','0deg');}demo.addEventListener('pointerleave',neutral);motion.addEventListener('change',neutral);
document.addEventListener('visibilitychange',()=>{if(document.hidden){sequence++;clearTimeout(timer);run.disabled=phase==='empty';play.textContent='Repetir demonstração';}});
reset();
})();

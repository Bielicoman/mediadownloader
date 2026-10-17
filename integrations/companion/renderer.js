const api=window.mediaEditors,$=id=>document.getElementById(id);
let target='resolve',info={},file=null,busy=false;
let metadataTimer=null,metadataSequence=0;
function showMedia(value){if(value)window.MediaInfo.render($('media-details'),value,'brands/');}
$('url').addEventListener('input',()=>{const sequence=++metadataSequence;clearTimeout(metadataTimer);$('media-details').hidden=true;if(!$('url').value.trim())return;metadataTimer=setTimeout(async()=>{try{const value=await api.metadata($('url').value.trim());if(sequence===metadataSequence)showMedia(value);}catch(e){if(sequence===metadataSequence)feedback('Dados da fonte indisponíveis: '+e.message);}},650);});
function feedback(text,error=false){$('feedback').textContent=text;$('feedback').classList.toggle('error',error);}
function refresh(){
 document.querySelectorAll('[data-target]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.target===target)));
 const isResolve=target==='resolve',isFinal=target==='final-cut',isAvid=target==='avid';
 $('instructions').textContent=isResolve?(info.resolve?'Importe na pasta atual do Media Pool. A timeline permanece intacta.':'Após baixar, no DaVinci abra Área de Trabalho > Scripts > Media Downloader > Importar último download. Você também pode arrastar o arquivo para o Pool de Mídia.'):isFinal?'Exporte um FCPXML e importe pelo menu Arquivo > Importar > XML do Final Cut no Mac. O arquivo de mídia deve permanecer no mesmo caminho.':isAvid?'No Media Composer, abra File > Input > Source Browser e selecione o arquivo na pasta de download. Use Link ou Import conforme o codec e a versão do Avid. Este companion é externo; não é um plugin AVX.':'Arraste a mídia pronta para a área de importação do CapCut, ou abra a pasta e use Importar. Não alteramos arquivos internos do projeto.';
 $('deliver').textContent=isResolve?(info.resolve?'Importar no Media Pool':'Abrir pasta para o Resolve'):isFinal?'Exportar para Final Cut':isAvid?'Abrir pasta para o Avid':'Abrir pasta para o CapCut';
 $('deliver').disabled=busy||!file;
 $('reveal').disabled=$('drag').disabled=busy||!file;
 $('file').textContent=file||'Nenhum arquivo selecionado.';
 $('url').disabled=$('paste').disabled=busy;
 $('download').disabled=busy;$('select').disabled=busy;$('folder').disabled=busy;
 $('cancel').hidden=!busy;$('destination').textContent=info.outputDir||'';
}
async function action(fn){try{await fn();}catch(e){feedback(e.message,true);}finally{refresh();}}
document.querySelectorAll('[data-target]').forEach(b=>b.addEventListener('click',()=>{target=b.dataset.target;feedback('');refresh();}));
$('folder').onclick=()=>action(async()=>{info.outputDir=await api.folder();});
$('select').onclick=()=>action(async()=>{const selected=await api.selectFile();if(!selected)return;++metadataSequence;clearTimeout(metadataTimer);file=selected;showMedia(await api.probe());feedback('Arquivo pronto para entregar ao editor.');});
$('download').onclick=()=>action(async()=>{busy=true;++metadataSequence;clearTimeout(metadataTimer);refresh();$('progress').hidden=false;$('bar').removeAttribute('value');$('status').textContent='Preparando download…';feedback('');try{const result=await api.download({url:$('url').value.trim(),preset:$('preset').value});file=result.filePath;try{showMedia(await api.probe());}catch{}$('status').textContent='Download concluído.';$('bar').value=100;feedback('Mídia pronta. Escolha como levar ao editor.');}catch(e){$('status').textContent=e.message;throw e;}finally{busy=false;}});
$('cancel').onclick=()=>action(async()=>{await api.cancel();});
$('deliver').onclick=()=>action(async()=>{if(target==='resolve'&&!info.resolve){await api.reveal();feedback('No Resolve: Área de Trabalho > Scripts > Media Downloader > Importar ultimo download. Ou arraste o arquivo para o Pool de Mídia.');}else if(target==='resolve'){const result=await api.importResolve();if(!result||!result.imported)throw Error('Importação não confirmada.');feedback(result.reused?'Arquivo já estava no Media Pool.':'Arquivo confirmado no Media Pool.');}else if(target==='final-cut'){const result=await api.exportFinalCut();if(result)feedback('FCPXML salvo. Importe-o no Final Cut Pro no Mac.');}else{await api.reveal();feedback(target==='avid'?'Pasta aberta. No Avid, selecione a mídia pelo Source Browser.':'Pasta aberta. Importe ou arraste a mídia para o CapCut.');}});
$('reveal').onclick=()=>action(()=>api.reveal());$('drag').addEventListener('dragstart',event=>{event.preventDefault();if(file&&!busy)api.drag();});
api.progress(p=>{if(p.percent!==undefined)$('bar').value=Math.min(100,Math.max(0,p.percent));if(p.status)$('status').textContent=p.status;});
api.info().then(value=>{info=value;if($('editorVersion'))$('editorVersion').textContent='EDITORES'+(info.version?' · '+info.version:'');refresh();}).catch(e=>feedback(e.message,true));

$('paste').addEventListener('click',()=>action(async()=>{const text=await api.readClipboard();if(!text.trim())throw Error('A área de transferência está vazia.');$('url').value=text.trim();$('url').dispatchEvent(new Event('input',{bubbles:true}));$('url').focus();}));

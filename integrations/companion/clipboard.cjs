'use strict';
function registerClipboard({ipcMain,clipboard,trust,prefix='clipboard'}) {
  ipcMain.handle(prefix+':read',async event=>{trust(event);let last;
    for(let attempt=0;attempt<3;attempt++){try{return clipboard.readText();}catch(e){last=e;if(attempt<2)await new Promise(r=>setTimeout(r,60));}}
    throw Error('Não foi possível acessar a área de transferência do sistema: '+(last&&last.message||'indisponível'));
  });
  ipcMain.handle(prefix+':write',(event,text)=>{trust(event);if(typeof text!=='string'||text.length>2*1024*1024)throw Error('Texto inválido.');clipboard.writeText(text);return true;});
}
module.exports={registerClipboard};

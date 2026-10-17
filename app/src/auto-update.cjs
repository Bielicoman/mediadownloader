'use strict';
// NSIS: baixa e verifica SHA-512; instala somente quando o usuario fecha o app.
function start({app,updater,log=()=>{},isBusy=()=>false,notify=()=>{},schedule=setInterval}) {
  updater.autoDownload=false;
  updater.autoInstallOnAppQuit=true;
  updater.allowPrerelease=false;
  updater.allowDowngrade=false;
  let checking=false,pending=false;
  const check=async()=>{if(checking||isBusy())return;checking=true;try{if(pending){pending=false;await updater.downloadUpdate();}else await updater.checkForUpdates();}catch(e){log('Atualização: '+e.message);}finally{checking=false;}};
  updater.on('update-available',()=>{pending=true;notify('Nova versão encontrada. Será baixada quando os downloads terminarem.');});
  updater.on('update-downloaded',()=>notify('Atualização pronta. Será instalada ao fechar o aplicativo.'));
  updater.on('error',e=>log('Atualização: '+e.message));
  const timer=schedule(check,60000);if(timer&&timer.unref)timer.unref();
  app.on('before-quit',event=>{if(isBusy()){event.preventDefault();notify('Aguarde ou cancele o download antes de fechar.');}});
  if(app.isPackaged)check();
  return {check};
}
module.exports={start};

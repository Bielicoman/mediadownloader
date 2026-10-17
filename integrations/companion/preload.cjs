const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('mediaEditors',{
 readClipboard:()=>ipcRenderer.invoke('editors:clipboard:read'),
 info:()=>ipcRenderer.invoke('editors:info'),
 metadata:url=>ipcRenderer.invoke('editors:metadata',url),
 probe:()=>ipcRenderer.invoke('editors:probe'),
 folder:()=>ipcRenderer.invoke('editors:folder'),
 download:options=>ipcRenderer.invoke('editors:download',options),
 cancel:()=>ipcRenderer.invoke('editors:cancel'),
 importResolve:()=>ipcRenderer.invoke('editors:resolve'),
 exportFinalCut:()=>ipcRenderer.invoke('editors:fcpxml'),
 reveal:()=>ipcRenderer.invoke('editors:reveal'),
 selectFile:()=>ipcRenderer.invoke('editors:select'),
 drag:()=>ipcRenderer.send('editors:drag'),
 progress:callback=>{const listener=(_,p)=>callback(p);ipcRenderer.on('editors:progress',listener);return()=>ipcRenderer.removeListener('editors:progress',listener);}
});

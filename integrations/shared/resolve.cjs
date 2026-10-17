const path=require('node:path');
async function connectIntegration(binding,id){
 if(!binding || !(await binding.Initialize(id)))throw Error('O Resolve recusou a inicialização da integração.');
 const resolve=await binding.GetResolve();
 if(!resolve || typeof resolve.GetProjectManager!=='function')throw Error('O SDK não retornou uma conexão válida com o Resolve.');
 return resolve;
}
function key(p){const v=path.resolve(p);return process.platform==='win32'?v.toLowerCase():v;}
async function findClip(folder,file) {
 for(const clip of await folder.GetClipList()||[])if(key(await clip.GetClipProperty('File Path')||'')===key(file))return clip;
 for(const sub of await folder.GetSubFolderList()||[]){const found=await findClip(sub,file);if(found)return found;}
 return null;
}
async function importFile(resolve,file) {
 if(!resolve)throw Error('Abra este painel por Workspace > Workflow Integrations no Resolve Studio.');
 const project=await (await resolve.GetProjectManager()).GetCurrentProject();
 if(!project)throw Error('Abra um projeto no DaVinci Resolve.');
 const pool=await project.GetMediaPool();
 const existing=await findClip(await pool.GetRootFolder(),file);
 if(existing)return {imported:true,reused:true,name:await existing.GetName()};
 const result=await pool.ImportMedia([file]);
 if(!result||!result.length)throw Error('O Resolve não confirmou a importação. Confira o formato e a pasta do Media Pool.');
 const confirmed=await findClip(await pool.GetRootFolder(),file);
 if(!confirmed)throw Error('Importação não confirmada pelo caminho do arquivo. Confira o Media Pool antes de repetir.');
 return {imported:true,reused:false,name:await confirmed.GetName()};
}
module.exports={importFile,findClip,connectIntegration};

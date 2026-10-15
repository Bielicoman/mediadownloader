const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('com.alexascencio.mediadownloader/jsx/host-aftereffects.jsx','utf8');
function host({active=true,unsupported=false,failLayer=false}={}) {
 const items=[],layers=[],root={name:'Root'},state={imports:0,groups:0};
 function FolderItem(name){this.name=name;this.parentFolder=root}
 function FootageItem(file){this.file=file;this.name=file.fsName;this.duration=7;this.mainSource={isStill:false};this.parentFolder=root}
 function CompItem(){this.name='Comp';this.time=8;this.duration=10;this.width=1920;this.height=1080;this.layers={add(item){const layer={source:item,index:1,remove(){layers.splice(layers.indexOf(layer),1)}};layers.push(layer);if(failLayer)Object.defineProperty(layer,'startTime',{set(){throw Error('failed timing')}});return layer}};this.layer=()=>layers[layers.length-1]}
 const comp=new CompItem(),project={rootFolder:root,file:null,activeItem:active?comp:null,item:i=>items[i-1],items:{addFolder(n){const f=new FolderItem(n);items.push(f);return f}},importFile(o){state.imports++;const f=new FootageItem(o.file);items.push(f);return f}};
 Object.defineProperty(project,'numItems',{get:()=>items.length});
 const c={app:{project,beginUndoGroup(){state.groups++},endUndoGroup(){state.groups--}},File:function(p){this.fsName=p;this.exists=!p.includes('missing')},ImportOptions:function(file){this.file=file;this.canImportAs=()=>!unsupported},ImportAsType:{FOOTAGE:1},CompItem,FolderItem,FootageItem,$:{os:'Windows'},safeReturn:(success,data,error)=>JSON.stringify({success,data,error})};
 vm.runInNewContext(source,c);return{c,items,layers,state,comp};
}
test('unsaved project reports empty disk path; duplicate import reuses exact footage',()=>{
 const h=host();assert.equal(JSON.parse(h.c.getProjectInfo()).data.projectFolder,'');
 assert.equal(JSON.parse(h.c.importMediaFile('C:/media/a.mp4','Downloads')).success,true);
 assert.equal(JSON.parse(h.c.importMediaFile('c:/MEDIA/a.mp4','Other')).success,true);
 assert.equal(h.state.imports,1);assert.equal(h.items[0].parentFolder.name,'Downloads');assert.equal(h.state.groups,0);
});
test('insertion creates new layer at playhead, clips to comp end and preserves existing layers',()=>{
 const h=host();const original={locked:true};h.layers.push(original);
 const result=JSON.parse(h.c.insertMediaToTimeline('C:/media/a.mp4','Downloads'));
 assert.equal(result.success,true);assert.equal(result.data.startTime,8);assert.equal(h.layers[1].outPoint,10);assert.equal(h.layers[0],original);assert.equal(h.state.groups,0);
});
test('missing comp refuses import; missing/unsupported file and failed layer return errors',()=>{
 const h=host({active:false});assert.equal(JSON.parse(h.c.insertMediaToTimeline('a.mp4')).success,false);assert.equal(h.state.imports,0);
 for(const opt of [{unsupported:true},{failLayer:true},{}]){
  const h=host(opt),file=Object.keys(opt).length?'a.mp4':'missing.mp4';
  assert.equal(JSON.parse(h.c.insertMediaToTimeline(file)).success,false);assert.equal(h.layers.length,0);assert.equal(h.state.groups,0);
 }
});

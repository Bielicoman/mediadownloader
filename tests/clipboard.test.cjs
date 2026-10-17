const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {registerClipboard}=require('../app/src/clipboard.cjs');
test('preload uses trusted main-process clipboard even when renderer clipboard is unavailable',async()=>{
 const handlers=new Map(),owner={},valid={sender:owner};let content='https://youtu.be/jNQXAC9IVRw\nhttps://youtu.be/Uw-_a0taISM',calls=0;
 registerClipboard({ipcMain:{handle:(name,fn)=>handlers.set(name,fn)},clipboard:{readText:()=>{if(calls++===0)throw Error('busy');return content;},writeText:t=>content=t},trust:event=>{if(event.sender!==owner)throw Error('untrusted');}});
 const window={},electron={ipcRenderer:{invoke:(name,...args)=>handlers.get(name)(valid,...args),on(){}}};
 vm.runInNewContext(fs.readFileSync('app/src/preload.js','utf8'),{window,require:()=>electron,process:{platform:'win32'}});
 assert.match(await window.desktopAPI.readClipboard(),/jNQXAC9IVRw\n/);assert.equal(calls,2);
 await window.desktopAPI.writeClipboard('ação\nvídeo');assert.equal(await window.desktopAPI.readClipboard(),'ação\nvídeo');
 await assert.rejects(handlers.get('clipboard:read')({sender:{}}),/untrusted/);
});

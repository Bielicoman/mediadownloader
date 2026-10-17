const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const updater = require('../com.alexascencio.mediadownloader/js/ascencio-updater.js');
test('updater rejects unsafe URLs, versions and archive traversal', () => {
  for (const url of ['http://example.com/a', 'file:///tmp/x', 'javascript:alert(1)', 'https://user:pass@example.com/a', 'https://example.com/\n']) assert.equal(updater.safeHttpsUrl(url), false, url);
  assert.equal(updater.safeHttpsUrl('https://github.com/Bielicoman/media-downloader/releases/latest'), true);
  assert.ok(updater.validateManifest({version:'1.2.3/../../x',downloadUrl:'https://example.com/a'}));
  assert.ok(updater.validateManifest({version:'1.2.3',downloadUrl:'http://example.com/a'}));
  assert.equal(updater.validateManifest({version:'1.2.3',downloadUrl:'https://example.com/a'}), null);
  for (const name of ['../x', '/tmp/x', 'C:\\temp\\x', 'dir\\..\\x', 'a\n../x']) assert.equal(updater.safeArchiveEntry(name), false, name);
  assert.equal(updater.safeArchiveEntry('panel/CSXS/manifest.xml'), true);
});
test('Electron denies remote navigation, popups, permissions and executable URL schemes', async () => {
  const handlers = {}, events = {}, opened = [];
  const session = {setPermissionRequestHandler(fn){this.request=fn},setPermissionCheckHandler(fn){this.check=fn}};
  let window;
  class BrowserWindow { constructor(){window=this;this.webContents={session,on(n,fn){events[n]=fn},setWindowOpenHandler(fn){events.popup=fn}}} loadFile(){} on(){} }
  const app={getPath:()=>process.cwd(),setPath(){},whenReady:()=>({then:fn=>fn()}),on(){}};
  const electron={app,BrowserWindow,ipcMain:{handle:(name,fn)=>handlers[name]=fn},shell:{openExternal:async url=>opened.push(url)}};
  const source=fs.readFileSync(path.join(__dirname,'../app/src/main.js'),'utf8');
  vm.runInNewContext(source,{require(name){return name==='electron'?electron:name==='./clipboard.cjs'?require('../app/src/clipboard.cjs'):require(name)},__dirname:path.join(__dirname,'../app/src'),process,console,URL});
  let blocked=false;
  events['will-navigate']({preventDefault(){blocked=true}},'https://example.com');
  assert.equal(blocked,true);
  assert.equal(events.popup().action,'deny');
  let granted=true;session.request(null,'camera',value=>granted=value);assert.equal(granted,false);assert.equal(session.check(),false);
  for(const url of ['file:///C:/Windows/notepad.exe','javascript:alert(1)','http://example.com']) assert.equal(await handlers['shell:openExternal']({},url),false);
  assert.equal(await handlers['shell:openExternal']({},'https://example.com'),true);
  assert.deepEqual(opened,['https://example.com']);
});
test('CEP updater never builds commands through a shell',()=>{
  const source=fs.readFileSync(path.join(__dirname,'../com.alexascencio.mediadownloader/js/ascencio-updater.js'),'utf8');
  assert.doesNotMatch(source,/cp\.exec\s*\(/);
  assert.doesNotMatch(source,/rejectUnauthorized\s*:\s*false/);
});

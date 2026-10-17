const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),{JSDOM}=require('jsdom');
test('language selection translates controls, preserves input values and survives reload',async()=>{
 const source=fs.readFileSync('i18n.js','utf8'),d=new JSDOM('<body><header class="site-header"><nav></nav></header><button>Colar</button><p>Seus downloads</p><input value="Título privado"><p class="path">Colar</p>',{url:'https://example.com',runScripts:'outside-only'});
 d.window.eval(source);await new Promise(r=>d.window.addEventListener('load',r));
 for(const [lang,word] of [['en','Paste'],['es','Pegar'],['fr','Coller'],['de','Einfügen'],['it','Incolla'],['pt','Colar']]){d.window.MediaI18n.setLanguage(lang);assert.equal(d.window.document.querySelector('button').textContent,word);}
 d.window.MediaI18n.setLanguage('en');assert.equal(d.window.document.querySelector('input').value,'Título privado');assert.equal(d.window.document.querySelector('.path').textContent,'Colar');assert.equal(d.window.localStorage.getItem('mediadownloader_language'),'en');
 await new Promise(r=>setTimeout(r,0));/* This lightweight DOM owns a live MutationObserver; let the VM collect it. */
});
test('demo explicitly simulates media and can paste, select modes, start and pause without network',async()=>{
 const d=new JSDOM(fs.readFileSync('index.html','utf8'),{url:'https://example.com',runScripts:'outside-only'}),w=d.window;
 await new Promise(r=>w.addEventListener('load',r));w.matchMedia=()=>({matches:false,addEventListener(){}});w.requestAnimationFrame=cb=>setTimeout(cb,0);w.cancelAnimationFrame=clearTimeout;
 w.eval(fs.readFileSync('demo.js','utf8'));const doc=w.document;
 assert.match(doc.querySelector('#demoStatus').textContent,/Nenhum arquivo/);doc.querySelector('#demoPaste').click();assert.equal(doc.querySelector('#demoMedia').hidden,false);doc.querySelector('[data-demo-mode="playlist"]').click();assert.equal(doc.querySelector('#demoCollection').hidden,false);
 doc.querySelector('#demoDownload').click();assert.equal(doc.querySelector('[data-demo]').dataset.phase,'downloading');doc.querySelector('#demoPlay').click();assert.equal(doc.querySelector('#demoDownload').disabled,false);doc.dispatchEvent(new w.Event('visibilitychange'));await new Promise(r=>setTimeout(r,0));w.close();
});

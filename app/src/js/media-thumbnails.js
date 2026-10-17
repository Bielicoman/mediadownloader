(function(root){'use strict';
 var placeholder='data:image/svg+xml;charset=utf-8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180"><rect width="320" height="180" fill="#202c3d"/><text x="160" y="96" text-anchor="middle" font-family="Arial" font-size="16" fill="#adb7c7">Sem prévia</text></svg>');
 function candidates(item){var list=[],quick=root.Downloader&&root.Downloader.getInstantPreview?root.Downloader.getInstantPreview(item.url||''):null;
  if(item.thumbnail&&/^https?:\/\//i.test(item.thumbnail))list.push(item.thumbnail);
  if(quick&&quick.id)['hqdefault.jpg','mqdefault.jpg','sddefault.jpg','default.jpg'].forEach(function(name){list.push('https://i.ytimg.com/vi/'+quick.id+'/'+name);});
  return list.filter(function(url,i){return list.indexOf(url)===i;});
 }
 function set(img,item){var key=(item.url||'')+'|'+(item.thumbnail||'');if(img.dataset.thumbnailKey===key)return;img.dataset.thumbnailKey=key;
  var urls=candidates(item),index=0,current='';img.referrerPolicy='no-referrer';
  function next(){if(index<urls.length){current=urls[index++];img.classList.remove('no-thumbnail');img.src=current;}else{current=placeholder;img.classList.add('no-thumbnail');img.src=placeholder;}}
  img.onerror=function(){if(current!==placeholder)next();};
  img.onload=function(){if(/i\.ytimg\.com/.test(current)&&!/\/default\.jpg$/.test(current)&&img.naturalWidth<=120)next();};next();
 }
 root.MediaThumbnails={set:set,candidates:candidates};
})(typeof window==='object'?window:this);

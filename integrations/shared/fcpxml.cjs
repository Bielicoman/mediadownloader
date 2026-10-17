const path=require('node:path'),{pathToFileURL}=require('node:url');
function xml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));}
function documentForMedia(file,probe) {
 if(!path.isAbsolute(file))throw Error('O caminho da mídia precisa ser absoluto.');
 const video=(probe.streams||[]).find(s=>s.codec_type==='video'&&!s.disposition?.attached_pic);
 const audio=(probe.streams||[]).find(s=>s.codec_type==='audio');
 if(!video&&!audio)throw Error('Nenhuma faixa de áudio ou vídeo encontrada.');
 const seconds=Number(probe.format?.duration||video?.duration||audio?.duration);
 if(!Number.isFinite(seconds)||seconds<=0)throw Error('Duração inválida para exportar FCPXML. Use um vídeo ou áudio, não uma capa.');
 const fps=(video?.avg_frame_rate||'30/1').split('/').map(Number);
 if(!fps[0]||!fps[1])throw Error('Taxa de quadros inválida.');
 // Snap duration down to a complete frame to keep the sequence on its time grid.
 const frames=Math.max(1,Math.floor(seconds*fps[0]/fps[1]));
 const duration=frames*fps[1]+'/'+fps[0]+'s';
 const name=xml(path.basename(file)),url=xml(pathToFileURL(file).href);
 const audioAttributes=audio?` hasAudio="1" audioSources="1" audioChannels="${Number(audio.channels)||2}" audioRate="${Number(audio.sample_rate)||48000}"`:'';
 const videoAttributes=video?' hasVideo="1" videoSources="1"':'';
 return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE fcpxml>
<fcpxml version="1.9"><resources>
<format id="r1" frameDuration="${fps[1]}/${fps[0]}s" width="${Number(video?.width)||1920}" height="${Number(video?.height)||1080}"/>
<asset id="r2" name="${name}" start="0s" duration="${duration}" format="r1"${videoAttributes}${audioAttributes}><media-rep kind="original-media" src="${url}"/></asset>
</resources><library><event name="Media Downloader"><asset-clip name="${name}" ref="r2" format="r1" start="0s" duration="${duration}"/></event></library></fcpxml>`;
}
module.exports={documentForMedia,xml};

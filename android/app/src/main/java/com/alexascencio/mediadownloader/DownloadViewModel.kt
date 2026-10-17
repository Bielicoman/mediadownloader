package com.alexascencio.mediadownloader

import android.app.Application
import android.content.ContentValues
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.yausername.ffmpeg.FFmpeg
import com.yausername.youtubedl_android.YoutubeDL
import com.yausername.youtubedl_android.YoutubeDLRequest
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*
import org.json.JSONObject
import java.io.File
import java.util.UUID

sealed interface Estado {
    data object Preparando:Estado
    data object Pronto:Estado
    data object Sondando:Estado
    data class Baixando(val progresso:Float?,val linha:String):Estado
    data class Concluido(val nomeArquivo:String,val uri:String,val mime:String):Estado
    data class Falhou(val mensagem:String):Estado
}
data class Previa(val url:String="",val titulo:String="",val autor:String="",val thumbnail:String?=null,val duracao:Int=0,val lendo:Boolean=false,val aviso:String?=null)

class DownloadViewModel(app:Application):AndroidViewModel(app) {
    private val _estado=MutableStateFlow<Estado>(Estado.Preparando)
    val estado=_estado.asStateFlow()
    private val _previa=MutableStateFlow(Previa())
    val previa=_previa.asStateFlow()
    private val _motor=MutableStateFlow("Preparando motores…")
    val motor=_motor.asStateFlow()
    private val _registro=MutableStateFlow(emptyList<String>())
    val registro=_registro.asStateFlow()
    private val prefs=app.getSharedPreferences("media-downloader",0)
    @Volatile private var initialized=false
    @Volatile private var activeId:String?=null
    @Volatile private var previewId:String?=null
    @Volatile private var conversion:Process?=null
    @Volatile private var cancelled=false
    private var downloadJob:Job?=null
    private var previewJob:Job?=null
    init {iniciarMotores()}
    private fun iniciarMotores() {
        viewModelScope.launch(Dispatchers.IO) {
            try {
                YoutubeDL.init(getApplication());FFmpeg.init(getApplication());initialized=true
                if(System.currentTimeMillis()-prefs.getLong("engine-update",0)>86400000L)atualizarInterno()
                _motor.value="yt-dlp ${YoutubeDL.versionName(getApplication()) ?: "incluído"} · pronto"
                _estado.value=Estado.Pronto
            }catch(e:Exception){anotar(e.message.orEmpty());_estado.value=Estado.Falhou("Não foi possível preparar os motores. Toque em Atualizar motor para tentar novamente.")}
        }
    }
    private fun atualizarInterno() {
        _motor.value="Atualizando o motor de download…"
        try {YoutubeDL.updateYoutubeDL(getApplication(),YoutubeDL.UpdateChannel.STABLE);prefs.edit().putLong("engine-update",System.currentTimeMillis()).apply()}
        catch(e:Exception){anotar("Atualização indisponível: ${e.message}")}
    }
    fun atualizarMotor() {
        if(downloadJob?.isActive==true || _estado.value is Estado.Preparando)return
        if(!initialized){_estado.value=Estado.Preparando;iniciarMotores();return}
        cancelarPrevia();_estado.value=Estado.Preparando
        viewModelScope.launch(Dispatchers.IO){atualizarInterno();_motor.value="yt-dlp ${YoutubeDL.versionName(getApplication()) ?: "incluído"}";_estado.value=Estado.Pronto}
    }
    fun limpar(){if(!initialized){atualizarMotor();return};if(downloadJob?.isActive!=true)_estado.value=Estado.Pronto}
    @Synchronized private fun anotar(linha:String){if(linha.isNotBlank())_registro.value=(_registro.value+linha.take(4000)).takeLast(60)}
    private fun pedidoBase(url:String)=YoutubeDLRequest(url).apply {
        addOption("--ignore-config");addOption("--no-playlist");addOption("--no-colors")
        addOption("--socket-timeout","20");addOption("--retries","2");addOption("--fragment-retries","2")
        addOption("--concurrent-fragments","8");addOption("--remote-components","ejs:github")
        addOption("--cache-dir",File(getApplication<Application>().cacheDir,"yt-cache").absolutePath)
    }
    private fun cancelarPrevia(){previewId?.let{YoutubeDL.destroyProcessById(it)};previewJob?.cancel();previewJob=null;previewId=null}
    fun carregarPrevia(texto:String) {
        cancelarPrevia()
        val link=runCatching{normalizarLink(texto)}.getOrNull()
        if(link==null){_previa.value=Previa();return}
        _previa.value=Previa(url=link,thumbnail=youtubeId(link)?.let{"https://i.ytimg.com/vi/$it/hqdefault.jpg"},lendo=true)
        previewJob=viewModelScope.launch(Dispatchers.IO) {
            delay(650);while(!initialized && _estado.value is Estado.Preparando)delay(200)
            if(!initialized || downloadJob?.isActive==true)return@launch
            val id="preview-${UUID.randomUUID()}";previewId=id
            try {
                val response=YoutubeDL.execute(pedidoBase(link).apply{addOption("--dump-single-json");addOption("--skip-download")},id)
                ensureActive();val info=JSONObject(response.out)
                if(_previa.value.url==link)_previa.value=Previa(link,info.optString("title"),info.optString("uploader"),info.optString("thumbnail").takeIf{it.startsWith("https://")} ?: _previa.value.thumbnail,info.optInt("duration"),false)
            }catch(e:Exception){if(isActive && _previa.value.url==link)_previa.value=_previa.value.copy(lendo=false,aviso="A prévia não carregou. Você ainda pode tentar baixar.")}
            finally{if(previewId==id)previewId=null}
        }
    }
    fun cancelar(){cancelled=true;activeId?.let{YoutubeDL.destroyProcessById(it)};conversion?.destroy();_motor.value="Cancelando…"}
    fun baixar(texto:String,perfil:Perfil,qualidade:Qualidade) {
        if(!initialized || downloadJob?.isActive==true)return
        val link=try{normalizarLink(texto)}catch(e:Exception){_estado.value=Estado.Falhou(erroAmigavel(e.message.orEmpty()));return}
        cancelarPrevia();cancelled=false;_registro.value=emptyList();_estado.value=Estado.Sondando
        downloadJob=viewModelScope.launch(Dispatchers.IO) {
            val dir=File(getApplication<Application>().cacheDir,"download-${UUID.randomUUID()}")
            try {
                check(dir.mkdirs()){"Não foi possível criar a pasta temporária."}
                val resultFile=File(dir,"result.txt")
                val pedido=pedidoBase(link).apply {
                    addOption("--no-mtime");addOption("--newline");addOption("--no-simulate");addOption("--match-filter","!is_live")
                    addOption("-f",seletorFormato(perfil,qualidade));addOption("--merge-output-format","mkv")
                    addOption("-o",File(dir,"%(title).80s.%(ext)s").absolutePath)
                    addCommands(listOf("--print-to-file","after_move:%(filepath)s",resultFile.absolutePath))
                }
                val id="download-${UUID.randomUUID()}";activeId=id
                YoutubeDL.execute(pedido,id){progresso,_,linha->if(!cancelled){anotar(linha);_estado.value=Estado.Baixando(if(progresso>=0)(progresso/100).coerceIn(0f,1f)else null,if(linha.contains("[Merger]"))"Unindo vídeo e áudio…" else "Baixando da plataforma…")}}
                conferirCancelamento()
                val source=File(resultFile.readLines().lastOrNull{it.isNotBlank()} ?: error("O download não gerou um arquivo final."))
                check(source.canonicalFile.parentFile==dir.canonicalFile && source.isFile && source.length()>0){"Arquivo final inválido."}
                val final=if(perfil==Perfil.VIDEO_ORIGINAL)source else converter(source,perfil,dir)
                conferirCancelamento();_estado.value=Estado.Baixando(null,"Salvando no celular…");_estado.value=publicar(final,perfil)
            }catch(e:Exception){anotar(e.message.orEmpty());_estado.value=if(cancelled)Estado.Pronto else Estado.Falhou(erroAmigavel(e.message.orEmpty()))}
            finally{activeId=null;conversion=null;dir.deleteRecursively();_motor.value="yt-dlp ${YoutubeDL.versionName(getApplication()) ?: "incluído"} · pronto"}
        }
    }
    private fun conferirCancelamento(){if(cancelled)throw CancellationException("Cancelado")}
    internal fun converter(source:File,perfil:Perfil,dir:File):File {
        val app=getApplication<Application>();val ext=when(perfil){Perfil.AUDIO_MP3->"mp3";Perfil.AUDIO_WAV->"wav";else->"mp4"}
        val output=File(dir,"${source.nameWithoutExtension}.edit.$ext")
        val base=File(app.noBackupFilesDir,"youtubedl-android/packages")
        val libraryPath=listOf("python","ffmpeg","aria2c").joinToString(":"){File(base,"$it/usr/lib").absolutePath}
        val ffmpeg=File(app.applicationInfo.nativeLibraryDir,"libffmpeg.so").absolutePath
        var description=""
        if(!perfil.ehAudio){
            val probe=ProcessBuilder(ffmpeg,"-nostdin","-hide_banner","-i",source.absolutePath).redirectErrorStream(true)
            probe.environment()["LD_LIBRARY_PATH"]=libraryPath
            val process=probe.start();conversion=process
            description=process.inputStream.bufferedReader().readText();process.waitFor();conferirCancelamento()
        }
        val copyVideo=Regex("Video: h264[^\n]*yuv420p(?:\\(|[, ])").containsMatchIn(description)
        val copyAudio=Regex("Audio: aac[^\n]*48000 Hz").containsMatchIn(description)
        val codec=when(perfil){
            Perfil.AUDIO_MP3->listOf("-vn","-c:a","libmp3lame","-b:a","320k")
            Perfil.AUDIO_WAV->listOf("-vn","-c:a","pcm_s24le","-ar","48000")
            else->listOf("-map","0:v:0","-map","0:a:0?")+
                (if(copyVideo)listOf("-c:v","copy")else listOf("-c:v","libx264","-crf","16","-preset","veryfast","-pix_fmt","yuv420p","-threads","2"))+
                (if(copyAudio)listOf("-c:a","copy")else listOf("-c:a","aac","-b:a","320k","-ar","48000"))+
                listOf("-movflags","+faststart")
        }
        val builder=ProcessBuilder(listOf(File(app.applicationInfo.nativeLibraryDir,"libffmpeg.so").absolutePath,"-nostdin","-hide_banner","-loglevel","error","-y","-i",source.absolutePath)+codec+listOf("-progress","pipe:1",output.absolutePath)).redirectErrorStream(true)
        builder.environment()["LD_LIBRARY_PATH"]=libraryPath
        fun status(p:Float?)=Estado.Baixando(p,if(perfil.ehAudio)"Convertendo o áudio…" else "Preparando MP4…")
        _estado.value=status(null);val proc=builder.start();conversion=proc;val errors=StringBuilder()
        try {
            proc.inputStream.bufferedReader().useLines{lines->lines.forEach{linha->
                conferirCancelamento()
                if(linha.startsWith("out_time_us=")){
                    val seconds=linha.substringAfter('=').toDoubleOrNull()?.div(1e6);val duration=_previa.value.duracao
                    _estado.value=status(if(duration>0 && seconds!=null)(seconds/duration).toFloat().coerceIn(0f,.99f)else null)
                }else if(!linha.contains('=')){errors.appendLine(linha);if(errors.length>5000)errors.delete(0,errors.length-5000)}
            }}
            check(proc.waitFor()==0 && output.isFile && output.length()>0){"Falha na conversão: $errors"}
        }finally{proc.destroy();conversion=null}
        conferirCancelamento();source.delete();return output
    }
    private fun publicar(arquivo:File,perfil:Perfil):Estado.Concluido {
        val app=getApplication<Application>();val resolver=app.contentResolver
        val mime=when(arquivo.extension.lowercase()){"mp4"->"video/mp4";"mkv"->"video/x-matroska";"webm"->"video/webm";"mp3"->"audio/mpeg";"wav"->"audio/wav";else->"application/octet-stream"}
        if(Build.VERSION.SDK_INT<29){
            val dir=File(Environment.getExternalStoragePublicDirectory(if(perfil.ehAudio)Environment.DIRECTORY_MUSIC else Environment.DIRECTORY_MOVIES),"MediaDownloader");check(dir.isDirectory || dir.mkdirs())
            var out=File(dir,arquivo.name);if(out.exists())out=File(dir,"${arquivo.nameWithoutExtension}-${System.currentTimeMillis()}.${arquivo.extension}")
            arquivo.copyTo(out);android.media.MediaScannerConnection.scanFile(app,arrayOf(out.absolutePath),arrayOf(mime),null)
            return Estado.Concluido(out.name,"",mime)
        }
        val collection=if(perfil.ehAudio)MediaStore.Audio.Media.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY)else MediaStore.Video.Media.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY)
        val values=ContentValues().apply{put(MediaStore.MediaColumns.DISPLAY_NAME,arquivo.name);put(MediaStore.MediaColumns.MIME_TYPE,mime);put(MediaStore.MediaColumns.RELATIVE_PATH,(if(perfil.ehAudio)Environment.DIRECTORY_MUSIC else Environment.DIRECTORY_MOVIES)+"/MediaDownloader");put(MediaStore.MediaColumns.IS_PENDING,1)}
        val uri=resolver.insert(collection,values) ?: error("Não foi possível criar o arquivo na galeria.")
        try {
            resolver.openOutputStream(uri)?.use{out->arquivo.inputStream().use{it.copyTo(out)}} ?: error("Não foi possível gravar o arquivo.")
            values.clear();values.put(MediaStore.MediaColumns.IS_PENDING,0);check(resolver.update(uri,values,null,null)>0)
        }catch(e:Exception){resolver.delete(uri,null,null);throw e}
        return Estado.Concluido(arquivo.name,uri.toString(),mime)
    }
    override fun onCleared(){cancelarPrevia();cancelar();super.onCleared()}
}

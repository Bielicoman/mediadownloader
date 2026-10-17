package com.alexascencio.mediadownloader
import org.json.JSONObject

private fun valor(value:Any?):String=if(value==null||value==JSONObject.NULL||value.toString().isBlank()||value=="none")"Não informado" else value.toString()
fun compressao(codec:String):String=when {
    codec.contains("pcm",true)||codec=="rawvideo"->"Sem compressão"
    listOf("flac","alac","ffv1","huffyuv").any{codec.contains(it,true)}->"Compressão sem perda"
    codec.isBlank()||codec=="none"||codec=="Não informado"->"Não informado"
    codec.contains("prores",true)||codec.contains("dnx",true)->"Intraframe, com perda"
    else->"Comprimido; original preserva o codec"
}
fun detalhesFonte(info:JSONObject):List<Pair<String,String>> {
    val requested=info.optJSONArray("requested_formats")
    val selected=(0 until (requested?.length()?:0)).mapNotNull{requested?.optJSONObject(it)}
    val video=selected.firstOrNull{it.optString("vcodec").let{v->v.isNotBlank()&&v!="none"}}?:info
    val audio=selected.firstOrNull{it.optString("acodec").let{v->v.isNotBlank()&&v!="none"}}?:info
    val pairs=listOf("Título" to info.opt("title"),"Autor / canal" to info.opt("uploader"),"ID" to info.opt("id"),"Duração (segundos)" to info.opt("duration"),"Contêiner" to info.opt("ext"),"Largura" to video.opt("width"),"Altura" to video.opt("height"),"FPS" to video.opt("fps"),"Codec de vídeo" to video.opt("vcodec"),"Codec de áudio" to audio.opt("acodec"),"Bitrate vídeo (kbps)" to video.opt("vbr"),"Bitrate áudio (kbps)" to audio.opt("abr"),"Amostragem (Hz)" to audio.opt("asr"),"Canais de áudio" to audio.opt("audio_channels"),"Cor / HDR" to video.opt("dynamic_range"),"Profundidade de bits" to video.opt("bits_per_raw_sample"),"Tamanho estimado (bytes)" to (info.opt("filesize")?:info.opt("filesize_approx")),"Data" to info.opt("upload_date"),"Idioma" to info.opt("language"),"Licença" to info.opt("license"))
    val formats=info.optJSONArray("formats")
    return pairs.map{it.first to valor(it.second)}+listOf("Compressão de vídeo" to compressao(video.optString("vcodec")),"Compressão de áudio" to compressao(audio.optString("acodec")),"Formatos da fonte" to (0 until (formats?.length()?:0)).mapNotNull{formats?.optJSONObject(it)}.joinToString("\n"){f->listOf(f.optString("format_id"),f.optString("ext"),f.optString("resolution"),f.optString("vcodec"),f.optString("acodec"),f.optString("fps")).filter{it.isNotBlank()}.joinToString(" · ")}.ifBlank{"Não informado"},"Descrição" to valor(info.opt("description")))
}
fun detalhesArquivo(name:String,bytes:Long,diagnostic:String):List<Pair<String,String>> {
    fun campo(regex:String)=Regex(regex).find(diagnostic)?.groupValues?.get(1)?:"Não informado"
    val video=campo("Video: ([^,\\s]+)")
    val audio=campo("Audio: ([^,\\s]+)")
    return listOf("Arquivo final" to name,"Tamanho (bytes)" to bytes.toString(),"Codec de vídeo" to video,"Codec de áudio" to audio,"Compressão de vídeo" to compressao(video),"Compressão de áudio" to compressao(audio),"Resolução" to campo("(\\d{2,5}x\\d{2,5})(?:[ ,])"),"FPS" to campo("([0-9.]+) fps"),"Amostragem" to campo("(\\d+ Hz)"),"Duração" to campo("Duration: ([0-9:.]+)"),"Bitrate" to campo("bitrate: ([^\\r\\n]+)"),"Leitura nos editores" to "Verifique o contêiner, os codecs e a versão do editor. MP4 H.264/AAC costuma ser aceito; Resolve depende também do sistema/edição, Avid de Link/Import e Final Cut exige Mac.")
}

fun resumoMidia(previa:Previa):List<Pair<String,String>> {
    val fields=previa.detalhes.toMap()
    val missing="Não informado"
    val duration=if(previa.duracao>0)"${previa.duracao/60}:${(previa.duracao%60).toString().padStart(2,'0')}"else fields["Duração"]?:missing
    val resolution=fields["Resolução"]?:if(fields["Largura"]?.toDoubleOrNull()!=null&&fields["Altura"]?.toDoubleOrNull()!=null)"${fields["Largura"]} × ${fields["Altura"]}"else missing
    val codecs=listOfNotNull(fields["Codec de vídeo"],fields["Codec de áudio"]).filter{it!=missing&&it!="none"}.joinToString(" / ").ifBlank{missing}
    val sample=fields["Amostragem (Hz)"]?.toDoubleOrNull()?.let{"${it/1000} kHz"}?:fields["Amostragem"]?:missing
    val bytes=(fields["Tamanho (bytes)"]?:fields["Tamanho estimado (bytes)"])?.toDoubleOrNull()
    return listOf("Duração" to duration,"Resolução" to resolution,"Quadros" to (fields["FPS"]?.takeIf{it!=missing}?.plus(" fps")?:missing),"Codec" to codecs,"Áudio" to sample,(if(previa.arquivoFinal)"Tamanho"else"Tamanho estimado") to (bytes?.takeIf{it>0}?.let{String.format(java.util.Locale.ROOT,"%.1f MB",it/1048576)}?:missing))
}

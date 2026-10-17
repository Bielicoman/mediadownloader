package com.alexascencio.mediadownloader
import java.net.URI
import java.net.URLDecoder

enum class Perfil(val rotulo:String,val detalhe:String,val ehAudio:Boolean) {
    VIDEO_MAX("Vídeo MP4","H.264 + AAC 48 kHz. Conversão apenas quando necessária.",false),
    VIDEO_ORIGINAL("Vídeo original","Preserva os codecs da fonte, sem reconversão.",false),
    AUDIO_MP3("Áudio MP3","320 kbps. Fácil de ouvir e compartilhar.",true),
    AUDIO_WAV("Áudio WAV","PCM 24-bit / 48 kHz.",true),
    VIDEO_PRORES("Apple ProRes 422 HQ","MOV intraframe. Arquivos grandes; processamento pode demorar.",false),
    AUDIO_FLAC("Áudio FLAC","Compressão sem perda adicional.",true),
    AUDIO_M4A("Áudio M4A","AAC até 320 kbps.",true),
    AUDIO_ORIGINAL("Áudio original","Preserva o codec da fonte, sem recodificar.",true),
    CAPA("Capa PNG","Imagem disponibilizada pela plataforma.",false)
}
enum class Qualidade(val rotulo:String,val limite:Int?) {
    MAXIMA("Máxima disponível",null),OITO_K("Até 8K · 4320p",4320),UHD("Até 4K · 2160p",2160),QHD("Até 2K · 1440p",1440),FULLHD("Até Full HD · 1080p",1080),HD("Até HD · 720p",720),SD("Até 480p",480),BAIXA("Até 360p",360),MINIMA("Até 240p",240),ECONOMICA("Até 144p",144)
}
fun youtubeId(link:String):String?=runCatching {
    val uri=URI(link);val host=uri.host?.lowercase()?.removePrefix("www.")?.removePrefix("m.")
    val id=when(host){
        "youtu.be"->uri.path.trim('/').substringBefore('/')
        "youtube.com","music.youtube.com"->if(Regex("^/(shorts|live|embed)/").containsMatchIn(uri.path))uri.path.trim('/').split('/').getOrNull(1) else uri.rawQuery?.split('&')?.firstOrNull{it.startsWith("v=")}?.substringAfter("v=")?.let{URLDecoder.decode(it,"UTF-8")}
        else->null
    };id?.takeIf{it.matches(Regex("[A-Za-z0-9_-]{11}"))}
}.getOrNull()
fun normalizarLink(texto:String):String {
    val link=Regex("https://[^\\s<>]+").find(texto.trim())?.value?.trimEnd(')', '.', ',', '"', '\'') ?: throw IllegalArgumentException("Cole um link completo que comece com https://.")
    val uri=runCatching{URI(link)}.getOrNull() ?: throw IllegalArgumentException("O link está incompleto. Copie novamente pelo botão Compartilhar do vídeo.")
    require(uri.host!=null && uri.userInfo==null && uri.scheme=="https"){"Use um link HTTPS sem senha ou credenciais."}
    return youtubeId(link)?.let{"https://www.youtube.com/watch?v=$it"} ?: link
}
fun seletorFormato(perfil:Perfil,qualidade:Qualidade):String {
    if(perfil.ehAudio)return "ba/b"
    val filtro=qualidade.limite?.let{"[height<=$it]"}.orEmpty()
    return "bv${filtro}+ba/b${filtro}"
}
fun erroAmigavel(mensagem:String):String=when {
    Regex("sign in|confirm.*bot|login|cookies|private|members.only|age.restricted",RegexOption.IGNORE_CASE).containsMatchIn(mensagem)->"A plataforma pediu autenticação. Atualize o motor e tente novamente. Vídeos privados, com restrição de idade ou bloqueio de rede podem continuar indisponíveis."
    Regex("HTTP Error (400|403)|Precondition check failed|nsig|challenge|signature",RegexOption.IGNORE_CASE).containsMatchIn(mensagem)->"A plataforma recusou a extração. Toque em Atualizar motor e tente novamente. Se persistir, abra os detalhes técnicos."
    Regex("network|timed out|resolve host|connection|Unable to download",RegexOption.IGNORE_CASE).containsMatchIn(mensagem)->"Não foi possível acessar a plataforma. Confira a conexão e tente novamente."
    mensagem.contains("No space left",true)->"O celular está sem espaço. Libere espaço e tente novamente."
    mensagem.startsWith("Cole ") || mensagem.startsWith("Use ") || mensagem.startsWith("O link")->mensagem
    else->"Não foi possível concluir o download. Tente novamente ou abra os detalhes técnicos."
}

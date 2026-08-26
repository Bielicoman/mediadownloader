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
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.File

/** Perfis de saida oferecidos na interface. */
enum class Perfil(
    val rotulo: String,
    val detalhe: String,
    val ehAudio: Boolean
) {
    VIDEO_MAX("Qualidade maxima", "Melhor video + melhor audio, em MP4", false),
    VIDEO_1080("Full HD 1080p", "Menor, bom para o celular", false),
    AUDIO_MP3("Audio MP3", "320 kbps", true),
    AUDIO_WAV("Audio WAV", "Sem perda, 24-bit", true)
}

sealed interface Estado {
    data object Preparando : Estado
    data object Pronto : Estado
    data object Sondando : Estado
    data class Baixando(val progresso: Float, val linha: String) : Estado
    data class Concluido(val nomeArquivo: String) : Estado
    data class Falhou(val mensagem: String) : Estado
}

class DownloadViewModel(app: Application) : AndroidViewModel(app) {

    private val _estado = MutableStateFlow<Estado>(Estado.Preparando)
    val estado: StateFlow<Estado> = _estado.asStateFlow()

    private val _titulo = MutableStateFlow("")
    val titulo: StateFlow<String> = _titulo.asStateFlow()

    private val _registro = MutableStateFlow(listOf<String>())
    val registro: StateFlow<List<String>> = _registro.asStateFlow()

    init {
        iniciarMotores()
    }

    /**
     * Descompacta Python, yt-dlp e FFmpeg na primeira execucao. Leva alguns
     * segundos e precisa terminar antes de qualquer download.
     */
    private fun iniciarMotores() {
        viewModelScope.launch(Dispatchers.IO) {
            try {
                YoutubeDL.getInstance().init(getApplication())
                FFmpeg.getInstance().init(getApplication())
                _estado.value = Estado.Pronto
            } catch (e: Exception) {
                _estado.value = Estado.Falhou(
                    "Falha ao preparar os motores: ${e.message ?: "erro desconhecido"}"
                )
            }
        }
    }

    fun limpar() {
        _estado.value = Estado.Pronto
        _titulo.value = ""
        _registro.value = emptyList()
    }

    private fun anotar(linha: String) {
        if (linha.isBlank()) return
        _registro.value = (_registro.value + linha.trim()).takeLast(60)
    }

    fun baixar(url: String, perfil: Perfil) {
        val alvo = url.trim()
        if (alvo.isEmpty()) {
            _estado.value = Estado.Falhou("Cole um link primeiro.")
            return
        }

        viewModelScope.launch(Dispatchers.IO) {
            try {
                _registro.value = emptyList()
                _estado.value = Estado.Sondando

                // Sondagem: da o titulo antes de comecar, e falha cedo se a URL
                // nao for suportada.
                val info = runCatching { YoutubeDL.getInstance().getInfo(alvo) }.getOrNull()
                _titulo.value = info?.title ?: "Midia"

                val destino = pastaDeTrabalho()
                val pedido = montarPedido(alvo, perfil, destino)

                _estado.value = Estado.Baixando(0f, "iniciando")

                YoutubeDL.getInstance().execute(pedido, null) { progresso, _, linha ->
                    anotar(linha)
                    val p = if (progresso < 0f) 0f else progresso / 100f
                    _estado.value = Estado.Baixando(p.coerceIn(0f, 1f), linha.trim())
                }

                val arquivo = destino.listFiles()
                    ?.filter { it.isFile && !it.name.endsWith(".part") }
                    ?.maxByOrNull { it.lastModified() }
                    ?: throw IllegalStateException("O download terminou mas nenhum arquivo foi encontrado.")

                val nomeFinal = publicarNaGaleria(arquivo, perfil)
                arquivo.delete()

                _estado.value = Estado.Concluido(nomeFinal)
            } catch (e: Exception) {
                _estado.value = Estado.Falhou(e.message ?: "Falha no download.")
            }
        }
    }

    private fun montarPedido(url: String, perfil: Perfil, destino: File): YoutubeDLRequest {
        val pedido = YoutubeDLRequest(url)
        pedido.addOption("--no-mtime")
        pedido.addOption("--no-playlist")
        pedido.addOption("-o", "${destino.absolutePath}/%(title).80s.%(ext)s")

        when (perfil) {
            Perfil.VIDEO_MAX -> {
                pedido.addOption("-f", "bv*+ba/b")
                pedido.addOption("--merge-output-format", "mp4")
            }
            Perfil.VIDEO_1080 -> {
                pedido.addOption("-f", "bv*[height<=1080]+ba/b[height<=1080]/b")
                pedido.addOption("--merge-output-format", "mp4")
            }
            Perfil.AUDIO_MP3 -> {
                pedido.addOption("-f", "ba/b")
                pedido.addOption("-x")
                pedido.addOption("--audio-format", "mp3")
                pedido.addOption("--audio-quality", "0")
            }
            Perfil.AUDIO_WAV -> {
                pedido.addOption("-f", "ba/b")
                pedido.addOption("-x")
                pedido.addOption("--audio-format", "wav")
            }
        }
        return pedido
    }

    /** Pasta privada do app: nao exige permissao em nenhuma versao do Android. */
    private fun pastaDeTrabalho(): File {
        val dir = File(getApplication<Application>().getExternalFilesDir(null), "downloads")
        if (dir.exists()) dir.listFiles()?.forEach { it.delete() } else dir.mkdirs()
        return dir
    }

    /**
     * Move o arquivo para a pasta publica, para aparecer na galeria e no
     * gerenciador de arquivos. Do Android 10 em diante isso passa pelo
     * MediaStore, que nao exige permissao de armazenamento.
     */
    private suspend fun publicarNaGaleria(arquivo: File, perfil: Perfil): String =
        withContext(Dispatchers.IO) {
            val resolver = getApplication<Application>().contentResolver
            val nome = arquivo.name
            val mime = when (arquivo.extension.lowercase()) {
                "mp4", "mkv", "webm", "mov" -> "video/${arquivo.extension.lowercase()}"
                "mp3" -> "audio/mpeg"
                "wav" -> "audio/x-wav"
                "m4a" -> "audio/mp4"
                else -> if (perfil.ehAudio) "audio/*" else "video/*"
            }

            val pastaRelativa =
                if (perfil.ehAudio) "${Environment.DIRECTORY_MUSIC}/MediaDownloader"
                else "${Environment.DIRECTORY_MOVIES}/MediaDownloader"

            val colecao = if (perfil.ehAudio) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q)
                    MediaStore.Audio.Media.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY)
                else MediaStore.Audio.Media.EXTERNAL_CONTENT_URI
            } else {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q)
                    MediaStore.Video.Media.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY)
                else MediaStore.Video.Media.EXTERNAL_CONTENT_URI
            }

            val valores = ContentValues().apply {
                put(MediaStore.MediaColumns.DISPLAY_NAME, nome)
                put(MediaStore.MediaColumns.MIME_TYPE, mime)
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    put(MediaStore.MediaColumns.RELATIVE_PATH, pastaRelativa)
                    put(MediaStore.MediaColumns.IS_PENDING, 1)
                }
            }

            val uri = resolver.insert(colecao, valores)
                ?: throw IllegalStateException("Nao foi possivel criar o arquivo na galeria.")

            resolver.openOutputStream(uri)?.use { saida ->
                arquivo.inputStream().use { entrada -> entrada.copyTo(saida, 1 shl 16) }
            } ?: throw IllegalStateException("Nao foi possivel gravar o arquivo.")

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                valores.clear()
                valores.put(MediaStore.MediaColumns.IS_PENDING, 0)
                resolver.update(uri, valores, null, null)
            }

            nome
        }
}

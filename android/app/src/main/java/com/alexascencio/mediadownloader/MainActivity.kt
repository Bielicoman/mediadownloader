package com.alexascencio.mediadownloader

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.selection.SelectionContainer
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle

private val Fundo = Color(0xFF080A0E)
private val Superficie = Color(0xFF11141A)
private val Borda = Color(0xFF232833)
private val Ambar = Color(0xFFFFB020)
private val Texto = Color(0xFFE8EAED)
private val Apagado = Color(0xFF8A919E)
private val Verde = Color(0xFF3DDC84)
private val Vermelho = Color(0xFFE5534B)

class MainActivity : ComponentActivity() {

    private val vm: DownloadViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        val compartilhado = linkCompartilhado(intent)

        setContent {
            MaterialTheme(
                colorScheme = darkColorScheme(
                    primary = Ambar,
                    background = Fundo,
                    surface = Superficie,
                    onPrimary = Color(0xFF0A0700),
                    onBackground = Texto,
                    onSurface = Texto
                )
            ) {
                Tela(vm, compartilhado)
            }
        }
    }

    private fun linkCompartilhado(intent: Intent?): String? =
        if (intent?.action == Intent.ACTION_SEND && intent.type == "text/plain") {
            intent.getStringExtra(Intent.EXTRA_TEXT)?.trim()
        } else null
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun Tela(vm: DownloadViewModel, linkInicial: String?) {
    val estado by vm.estado.collectAsStateWithLifecycle()
    val titulo by vm.titulo.collectAsStateWithLifecycle()
    val registro by vm.registro.collectAsStateWithLifecycle()

    var url by rememberSaveable { mutableStateOf(linkInicial.orEmpty()) }
    var perfil by rememberSaveable { mutableStateOf(Perfil.VIDEO_MAX) }

    val ocupado = estado is Estado.Sondando || estado is Estado.Baixando ||
        estado is Estado.Preparando

    Scaffold(containerColor = Fundo) { pad ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(pad)
                .verticalScroll(rememberScrollState())
                .padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Cabecalho()

            OutlinedTextField(
                value = url,
                onValueChange = { url = it },
                enabled = !ocupado,
                singleLine = true,
                label = { Text("Cole o link do video") },
                placeholder = { Text("https://") },
                modifier = Modifier.fillMaxWidth(),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = Ambar,
                    unfocusedBorderColor = Borda,
                    focusedLabelColor = Ambar,
                    unfocusedLabelColor = Apagado,
                    cursorColor = Ambar
                )
            )

            Text(
                "FORMATO",
                color = Apagado,
                fontSize = 11.sp,
                fontWeight = FontWeight.SemiBold,
                letterSpacing = 1.4.sp
            )

            Perfil.entries.forEach { p ->
                CartaoPerfil(
                    perfil = p,
                    selecionado = perfil == p,
                    habilitado = !ocupado,
                    aoClicar = { perfil = p }
                )
            }

            Button(
                onClick = { vm.baixar(url, perfil) },
                enabled = !ocupado && url.isNotBlank() && estado !is Estado.Preparando,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp),
                shape = RoundedCornerShape(6.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = Ambar,
                    contentColor = Color(0xFF0A0700),
                    disabledContainerColor = Borda,
                    disabledContentColor = Apagado
                )
            ) {
                Text(
                    if (ocupado) "Trabalhando..." else "Baixar",
                    fontWeight = FontWeight.Bold,
                    fontSize = 15.sp
                )
            }

            Situacao(estado, titulo, aoLimpar = vm::limpar)

            if (registro.isNotEmpty()) {
                Registro(registro)
            }
        }
    }
}

@Composable
private fun Cabecalho() {
    Column(modifier = Modifier.padding(bottom = 4.dp)) {
        Text(
            "MEDIA DOWNLOADER",
            color = Texto,
            fontSize = 26.sp,
            fontWeight = FontWeight.Black,
            letterSpacing = (-0.5).sp
        )
        Text(
            "Baixe em qualidade maxima direto no celular",
            color = Apagado,
            fontSize = 13.sp
        )
    }
}

@Composable
private fun CartaoPerfil(
    perfil: Perfil,
    selecionado: Boolean,
    habilitado: Boolean,
    aoClicar: () -> Unit
) {
    Surface(
        onClick = aoClicar,
        enabled = habilitado,
        shape = RoundedCornerShape(6.dp),
        color = if (selecionado) Color(0xFF1C1A12) else Superficie,
        border = androidx.compose.foundation.BorderStroke(
            1.dp,
            if (selecionado) Ambar else Borda
        ),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier.padding(14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            RadioButton(
                selected = selecionado,
                onClick = aoClicar,
                enabled = habilitado,
                colors = RadioButtonDefaults.colors(
                    selectedColor = Ambar,
                    unselectedColor = Apagado
                )
            )
            Spacer(Modifier.width(6.dp))
            Column {
                Text(
                    perfil.rotulo,
                    color = if (selecionado) Ambar else Texto,
                    fontWeight = FontWeight.SemiBold,
                    fontSize = 14.sp
                )
                Text(perfil.detalhe, color = Apagado, fontSize = 12.sp)
            }
        }
    }
}

@Composable
private fun Situacao(estado: Estado, titulo: String, aoLimpar: () -> Unit) {
    when (estado) {
        is Estado.Preparando -> Aviso(
            "Preparando os motores na primeira execucao...",
            Apagado,
            mostrarBarra = true
        )

        is Estado.Pronto -> Unit

        is Estado.Sondando -> Aviso("Lendo as informacoes do video...", Ambar, mostrarBarra = true)

        is Estado.Baixando -> Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            if (titulo.isNotBlank()) {
                Text(
                    titulo,
                    color = Texto,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.SemiBold,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )
            }
            LinearProgressIndicator(
                progress = { estado.progresso },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(6.dp),
                color = Ambar,
                trackColor = Borda
            )
            Text(
                "${(estado.progresso * 100).toInt()}%",
                color = Ambar,
                fontSize = 13.sp,
                fontWeight = FontWeight.Bold
            )
        }

        is Estado.Concluido -> Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Aviso("Pronto! Salvo na galeria:", Verde)
            Text(
                estado.nomeArquivo,
                color = Texto,
                fontSize = 13.sp,
                fontFamily = FontFamily.Monospace
            )
            TextButton(onClick = aoLimpar) {
                Text("Baixar outro", color = Ambar)
            }
        }

        is Estado.Falhou -> Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Aviso("Nao deu certo", Vermelho)
            SelectionContainer {
                Text(estado.mensagem, color = Apagado, fontSize = 12.sp)
            }
            TextButton(onClick = aoLimpar) {
                Text("Tentar de novo", color = Ambar)
            }
        }
    }
}

@Composable
private fun Aviso(texto: String, cor: Color, mostrarBarra: Boolean = false) {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text(texto, color = cor, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
        if (mostrarBarra) {
            LinearProgressIndicator(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(3.dp),
                color = cor,
                trackColor = Borda
            )
        }
    }
}

@Composable
private fun Registro(linhas: List<String>) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(Color(0xFF06080B), RoundedCornerShape(6.dp))
            .padding(12.dp),
        verticalArrangement = Arrangement.spacedBy(2.dp)
    ) {
        linhas.takeLast(6).forEach {
            Text(
                it,
                color = Apagado,
                fontSize = 10.sp,
                fontFamily = FontFamily.Monospace,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
        }
    }
}

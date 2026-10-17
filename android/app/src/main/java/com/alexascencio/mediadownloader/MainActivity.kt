package com.alexascencio.mediadownloader

import android.Manifest
import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.view.WindowManager
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import coil.ImageLoader
import coil.decode.SvgDecoder
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.selection.SelectionContainer
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Download
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import coil.compose.AsyncImage

private val Fundo=Color(0xFF080A0E)
private val Superficie=Color(0xFF12161E)
private val Borda=Color(0xFF303949)
private val Ambar=Color(0xFFFFB020)
private val Texto=Color(0xFFE8EAEE)
private val Apagado=Color(0xFFADB7C7)
private val Verde=Color(0xFF3DDC84)
private val Fonte=FontFamily(Font(R.font.manrope))

class MainActivity:ComponentActivity() {
    private val vm:DownloadViewModel by viewModels()
    private var compartilhado by mutableStateOf("")
    override fun onCreate(savedInstanceState:Bundle?) {
        super.onCreate(savedInstanceState);enableEdgeToEdge();receber(intent)
        setContent {
            val type=Typography()
            MaterialTheme(colorScheme=darkColorScheme(primary=Ambar,background=Fundo,surface=Superficie,onPrimary=Fundo,onBackground=Texto,onSurface=Texto),typography=Typography(bodyLarge=type.bodyLarge.copy(fontFamily=Fonte),bodyMedium=type.bodyMedium.copy(fontFamily=Fonte),bodySmall=type.bodySmall.copy(fontFamily=Fonte),labelLarge=type.labelLarge.copy(fontFamily=Fonte),titleLarge=type.titleLarge.copy(fontFamily=Fonte),titleMedium=type.titleMedium.copy(fontFamily=Fonte))) {Tela(vm,compartilhado)}
        }
    }
    override fun onNewIntent(intent:Intent){super.onNewIntent(intent);setIntent(intent);receber(intent)}
    private fun receber(intent:Intent?){if(intent?.action==Intent.ACTION_SEND && intent.type=="text/plain")compartilhado=intent.getStringExtra(Intent.EXTRA_TEXT).orEmpty()}
}

@Composable private fun Tela(vm:DownloadViewModel,linkInicial:String) {
    val estado by vm.estado.collectAsStateWithLifecycle()
    val previa by vm.previa.collectAsStateWithLifecycle()
    val motor by vm.motor.collectAsStateWithLifecycle()
    val appUpdate by vm.appUpdate.collectAsStateWithLifecycle()
    val registro by vm.registro.collectAsStateWithLifecycle()
    val context=LocalContext.current;val clipboard=LocalClipboardManager.current
    var url by rememberSaveable{mutableStateOf("")}
    var perfil by rememberSaveable{mutableStateOf(Perfil.VIDEO_MAX)}
    var qualidade by rememberSaveable{mutableStateOf(Qualidade.MAXIMA)}
    var detalhes by rememberSaveable{mutableStateOf(false)}
    var aviso by remember{mutableStateOf("")}
    val ocupado=estado is Estado.Preparando || estado is Estado.Sondando || estado is Estado.Baixando
    LaunchedEffect(linkInicial){if(linkInicial.isNotBlank()){url=linkInicial;vm.carregarPrevia(url)}}
    DisposableEffect(ocupado){val window=(context as? Activity)?.window;if(ocupado)window?.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)else window?.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);onDispose{window?.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)}}
    val permissao=rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()){ok->if(ok)vm.baixar(url,perfil,qualidade)else aviso="Autorize o armazenamento para salvar a mídia neste Android."}
    Scaffold(containerColor=Fundo){pad->
        Column(Modifier.fillMaxSize().padding(pad).verticalScroll(rememberScrollState()).padding(horizontal=20.dp,vertical=24.dp),verticalArrangement=Arrangement.spacedBy(18.dp)) {
            Row(verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(12.dp)){
                Surface(shape=RoundedCornerShape(8.dp),color=Superficie,border=androidx.compose.foundation.BorderStroke(1.dp,Borda)){Icon(Icons.Outlined.Download,null,tint=Ambar,modifier=Modifier.padding(9.dp).size(25.dp))}
                Column{Text("Media Downloader",fontSize=21.sp,fontWeight=FontWeight.ExtraBold,fontFamily=Fonte);Text("Sua mídia, pronta para editar.",fontSize=12.sp,color=Apagado)}
            }
            Surface(shape=RoundedCornerShape(14.dp),color=Superficie){Column(Modifier.padding(18.dp),verticalArrangement=Arrangement.spacedBy(14.dp)){
                Text("Seu próximo download",fontWeight=FontWeight.Bold,fontSize=19.sp)
                Row(verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(8.dp)){
                    OutlinedTextField(value=url,onValueChange={url=it;vm.carregarPrevia(it)},enabled=!ocupado,singleLine=true,label={Text("Link do vídeo")},placeholder={Text("https://…")},modifier=Modifier.weight(1f),shape=RoundedCornerShape(8.dp),colors=OutlinedTextFieldDefaults.colors(unfocusedBorderColor=Borda,focusedBorderColor=Ambar))
                    TextButton(onClick={clipboard.getText()?.text?.let{url=it;vm.carregarPrevia(it)}},enabled=!ocupado){Text("Colar")}
                }
                if(previa.url.isNotBlank())CartaoPrevia(previa)
                Seletor("Como quer salvar?",perfil.rotulo,!ocupado,Perfil.entries.map{it.rotulo}){i->perfil=Perfil.entries[i]}
                Seletor("Qualidade do vídeo",qualidade.rotulo,!ocupado && !perfil.ehAudio && perfil!=Perfil.CAPA,Qualidade.entries.map{it.rotulo}){i->qualidade=Qualidade.entries[i]}
                Text(perfil.detalhe,color=Apagado,fontSize=12.sp)
                Button(onClick={aviso="";if(Build.VERSION.SDK_INT<29 && ContextCompat.checkSelfPermission(context,Manifest.permission.WRITE_EXTERNAL_STORAGE)!=PackageManager.PERMISSION_GRANTED)permissao.launch(Manifest.permission.WRITE_EXTERNAL_STORAGE)else vm.baixar(url,perfil,qualidade)},enabled=!ocupado && url.isNotBlank(),shape=RoundedCornerShape(8.dp),modifier=Modifier.fillMaxWidth().heightIn(min=48.dp)) {Text(if(ocupado)"Preparando…" else "Baixar mídia",fontWeight=FontWeight.Bold)}
                if(estado is Estado.Sondando || estado is Estado.Baixando)OutlinedButton(onClick=vm::cancelar,modifier=Modifier.fillMaxWidth()){Text("Cancelar")}
                Text("Mantenha o aplicativo aberto durante o download. Máxima qualidade usa os formatos disponíveis na fonte.",fontSize=11.sp,color=Apagado)
            }}
            when(val e=estado){
                Estado.Preparando->{Text(motor,color=Apagado,fontSize=13.sp);LinearProgressIndicator(modifier=Modifier.fillMaxWidth())}
                Estado.Sondando->{Text("Acessando o vídeo…",color=Ambar);LinearProgressIndicator(modifier=Modifier.fillMaxWidth())}
                is Estado.Baixando->{Text(e.linha,color=Ambar);if(e.progresso!=null){LinearProgressIndicator(progress={e.progresso},modifier=Modifier.fillMaxWidth());Text("${(e.progresso*100).toInt()}% desta etapa",color=Apagado,fontSize=12.sp)}else LinearProgressIndicator(modifier=Modifier.fillMaxWidth())}
                is Estado.Concluido->{Text("Arquivo salvo",color=Verde,fontWeight=FontWeight.Bold);Text(e.nomeArquivo,maxLines=3,overflow=TextOverflow.Ellipsis);Text("${if(perfil==Perfil.CAPA)"Imagens" else if(perfil.ehAudio)"Música" else "Filmes"}/MediaDownloader",color=Apagado,fontSize=12.sp)
                    if(e.uri.isNotBlank())OutlinedButton(onClick={try{context.startActivity(Intent.createChooser(Intent(Intent.ACTION_VIEW).setDataAndType(Uri.parse(e.uri),e.mime).addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION),"Abrir mídia"))}catch(_:Exception){aviso="Abra a mídia pelo gerenciador de arquivos do celular."}}){Text("Abrir arquivo")}
                    TextButton(onClick=vm::limpar){Text("Baixar outro")}}
                is Estado.Falhou->{Text("Não foi possível baixar",color=Ambar,fontWeight=FontWeight.Bold);Text(e.mensagem,fontSize=13.sp,color=Apagado);TextButton(onClick=vm::limpar){Text("Tentar novamente")}}
                Estado.Pronto->Unit
            }
            if(aviso.isNotBlank())Text(aviso,color=Ambar,fontSize=13.sp)
            Row(Modifier.fillMaxWidth(),verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.SpaceBetween){Text(motor,modifier=Modifier.weight(1f),color=Apagado,fontSize=11.sp);TextButton(onClick=vm::atualizarMotor,enabled=!ocupado){Text("Atualizar motor",fontSize=12.sp)}}
            appUpdate?.let { update->OutlinedButton(enabled=!ocupado,onClick={try{if(Build.VERSION.SDK_INT>=26&&!context.packageManager.canRequestPackageInstalls()){context.startActivity(Intent(android.provider.Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,Uri.parse("package:"+context.packageName)))}else{val uri=androidx.core.content.FileProvider.getUriForFile(context,context.packageName+".updates",update.file);context.startActivity(Intent(Intent.ACTION_VIEW).setDataAndType(uri,"application/vnd.android.package-archive").addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION))}}catch(_:Exception){aviso="Não foi possível abrir o instalador do Android."}}){Text("Instalar atualização "+update.version)}}
            if(registro.isNotEmpty()){
                TextButton(onClick={detalhes=!detalhes}){Text(if(detalhes)"Ocultar detalhes técnicos" else "Ver detalhes técnicos",fontSize=12.sp)}
                if(detalhes)SelectionContainer{Text(registro.takeLast(18).joinToString("\n"),fontFamily=FontFamily.Monospace,fontSize=10.sp,color=Apagado,modifier=Modifier.fillMaxWidth().background(Superficie,RoundedCornerShape(8.dp)).padding(12.dp))}
            }
        }
    }
}
@OptIn(ExperimentalMaterial3Api::class)
@Composable private fun Seletor(rotulo:String,selecionado:String,enabled:Boolean,itens:List<String>,escolher:(Int)->Unit){
    var expanded by remember{mutableStateOf(false)}
    Column(verticalArrangement=Arrangement.spacedBy(6.dp)){
        Text(rotulo,fontSize=12.sp,color=Apagado)
        OutlinedButton(onClick={expanded=true},enabled=enabled,shape=RoundedCornerShape(9.dp),modifier=Modifier.fillMaxWidth(),contentPadding=PaddingValues(horizontal=14.dp,vertical=12.dp)){Text(selecionado,modifier=Modifier.weight(1f),color=if(enabled)Texto else Apagado);Text("⌄",color=Ambar)}
    }
    if(expanded)ModalBottomSheet(onDismissRequest={expanded=false},containerColor=Fundo){
        Column(Modifier.fillMaxWidth().heightIn(max=650.dp).verticalScroll(rememberScrollState()).padding(horizontal=20.dp,vertical=12.dp),verticalArrangement=Arrangement.spacedBy(10.dp)){
            Text(rotulo,fontSize=23.sp,fontWeight=FontWeight.Bold)
            Text("Escolha a opção que combina com seu uso. A qualidade depende da fonte.",fontSize=12.sp,color=Apagado)
            itens.forEachIndexed{i,item->Surface(onClick={escolher(i);expanded=false},color=if(item==selecionado)Color(0xFF282214)else Superficie,shape=RoundedCornerShape(12.dp),border=androidx.compose.foundation.BorderStroke(1.dp,if(item==selecionado)Ambar else Borda)){
                Row(Modifier.fillMaxWidth().padding(12.dp),verticalAlignment=Alignment.CenterVertically){RadioButton(selected=item==selecionado,onClick={escolher(i);expanded=false});Text(item,modifier=Modifier.padding(start=8.dp),fontWeight=FontWeight.SemiBold,fontSize=14.sp)}
            }}
            Spacer(Modifier.height(18.dp))
        }
    }
}
@OptIn(ExperimentalMaterial3Api::class)
@Composable private fun CartaoPrevia(previa:Previa){
    var detailsOpen by remember{mutableStateOf(false)}
    val context=LocalContext.current
    val imageLoader=remember(context){ImageLoader.Builder(context).components{add(SvgDecoder.Factory())}.build()}
    Row(horizontalArrangement=Arrangement.spacedBy(12.dp),verticalAlignment=Alignment.CenterVertically){
        if(previa.thumbnail!=null)AsyncImage(model=previa.thumbnail,contentDescription="Miniatura do vídeo",contentScale=ContentScale.Crop,modifier=Modifier.width(112.dp).aspectRatio(16f/9).clip(RoundedCornerShape(8.dp)))
        Column(Modifier.weight(1f),verticalArrangement=Arrangement.spacedBy(4.dp)){
            Text(previa.titulo.ifBlank{if(previa.lendo)"Lendo informações…" else "Prévia do vídeo"},fontWeight=FontWeight.SemiBold,fontSize=13.sp,maxLines=3,overflow=TextOverflow.Ellipsis)
            if(previa.autor.isNotBlank())Text(previa.autor,fontSize=11.sp,color=Apagado,maxLines=1,overflow=TextOverflow.Ellipsis)
            if(previa.duracao>0)Text("${previa.duracao/60}:${(previa.duracao%60).toString().padStart(2,'0')}",fontSize=11.sp,color=Apagado)
        }
    }
    if(previa.detalhes.isNotEmpty())OutlinedButton(onClick={detailsOpen=true},modifier=Modifier.fillMaxWidth()){Text(if(previa.arquivoFinal)"Ver dados do arquivo final" else "Ver todos os dados da mídia")}
    if(detailsOpen)ModalBottomSheet(onDismissRequest={detailsOpen=false},containerColor=Fundo){
        Column(Modifier.fillMaxWidth().heightIn(max=700.dp).verticalScroll(rememberScrollState()).padding(20.dp),verticalArrangement=Arrangement.spacedBy(12.dp)){
            Text(if(previa.arquivoFinal)"Arquivo final" else "Dados da fonte",fontSize=23.sp,fontWeight=FontWeight.Bold)
            Text("Original preserva a codificação da fonte e pode ter compressão. A ficha final pode ter outros codecs.",fontSize=12.sp,color=Apagado)
            Text("Leitura nos editores",fontWeight=FontWeight.SemiBold)
            val editors=listOf("Premiere" to "premiere.png","After Effects" to "after-effects.png","Resolve" to "resolve.png","Avid" to "avid.svg","Final Cut" to "final-cut.png","CapCut" to "capcut.png")
            editors.chunked(3).forEach{row->Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.spacedBy(8.dp)){row.forEach{editor->Surface(modifier=Modifier.weight(1f),shape=RoundedCornerShape(10.dp),color=Superficie){Column(Modifier.padding(10.dp),verticalArrangement=Arrangement.spacedBy(6.dp)){
                AsyncImage(model="file:///android_asset/brands/${editor.second}",imageLoader=imageLoader,contentDescription=editor.first,modifier=Modifier.size(24.dp),contentScale=ContentScale.Fit)
                Text(editor.first,fontSize=10.sp,fontWeight=FontWeight.Bold)
                Text(if(!previa.arquivoFinal)"Conferir após salvar" else if(editor.first=="Avid")"Conferir Link/Import" else if(editor.first=="Resolve")"Depende do sistema" else if(editor.first=="Final Cut")"Requer Mac" else "Verificar codecs",fontSize=9.sp,color=Apagado)
            }}}}}
            Text("Indicação pelo formato, sem teste de importação neste arquivo. Versão, sistema e licença do editor podem alterar o suporte.",fontSize=11.sp,color=Apagado)
            SelectionContainer{Column(verticalArrangement=Arrangement.spacedBy(12.dp)){previa.detalhes.forEach{(label,value)->Column{Text(label,fontSize=11.sp,color=Apagado);Text(value,fontSize=13.sp)}}}}
            Spacer(Modifier.height(20.dp))
        }
    }
    previa.aviso?.let{Text(it,fontSize=11.sp,color=Apagado)}
}

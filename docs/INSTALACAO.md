# Instalação

Baixe pelo [site oficial](https://mediadownloader-blush.vercel.app) ou pelas [releases do projeto](https://github.com/Bielicoman/mediadownloader/releases). O aplicativo é gratuito.

## Windows 10/11, 64 bits

1. Baixe [MediaDownloader-Windows-x64-Setup.exe v1.3.0](https://github.com/Bielicoman/mediadownloader/releases/download/v1.3.0/MediaDownloader-Windows-x64-Setup.exe).
2. Abra o EXE. Mantenha **Somente para mim** para instalar no seu usuário; **Todos os usuários** solicita administrador. Escolha a pasta e conclua.
3. Abra **Media Downloader** pelo Menu Iniciar.
4. Confira a pasta de destino, cole um link autorizado, escolha qualidade/formato e clique em **Baixar Mídia**.

Os motores já acompanham o Desktop. Você não precisa instalar Python, Node.js, FFmpeg ou configurar PATH. O Windows pode mostrar um aviso por ausência de certificado de editor: confirme a origem do arquivo. Políticas corporativas podem impedir a execução.

Para remover o aplicativo, use **Configurações do Windows → Aplicativos**. A desinstalação preserva dados do usuário; seus downloads ficam na pasta de destino escolhida.

## Qualidade padrão

Abra as Configurações, escolha **Qualidade padrão ao abrir** e clique em **Salvar Configurações**. Ao abrir novamente, o Desktop aplica o padrão às três abas. Durante a sessão, cada aba pode usar outro formato sem alterar a preferência salva.

Em Playlist ou canal, indexe o link, selecione os itens e escolha o formato da própria aba. Em Vários links, cole uma URL por linha e escolha o formato desse lote.

## Plugin do Premiere Pro

1. Instale o Desktop para disponibilizar os motores. No Mac, instale a arquitetura correta e abra o Desktop uma vez.
2. Baixe o [ZIP do plugin v1.3.0](https://github.com/Bielicoman/mediadownloader/releases/download/v1.3.0/MediaDownloader.zip) e **extraia tudo**.
3. Preserve a pasta `com.alexascencio.mediadownloader` ao lado dos scripts. No Windows, abra `Instalar-no-Windows.cmd`; no Mac, abra `Instalar-no-Mac.command`.
4. Reinicie o Premiere quando puder. Abra **Janela → Extensões (Legado) → Media Downloader**; algumas versões mostram apenas **Extensões**.

O instalador copia o painel para o CEP do seu usuário e habilita o modo de depuração necessário à extensão não assinada. Reinstalações preservam a versão anterior em backup fora da pasta `CEP/extensions`, evitando duas extensões com o mesmo identificador.

Se o Desktop foi instalado em uma pasta personalizada e o painel não encontrar os motores, abra as Configurações do painel e use a instalação/seleção dos motores. O plugin possui seleção de formato para vídeo único; as três abas de coleção pertencem ao aplicativo Desktop.

### Instalação manual do painel

Copie a pasta `com.alexascencio.mediadownloader` para:

| Sistema | Pasta |
|---|---|
| Windows | `%APPDATA%/Adobe/CEP/extensions/` |
| macOS | `~/Library/Application Support/Adobe/CEP/extensions/` |

No macOS, habilite o CEP não assinado pelo Terminal:

```sh
for v in 9 10 11 12; do defaults write com.adobe.CSXS.$v PlayerDebugMode -string 1; done
```

No Windows, prefira o script do pacote, que configura `PlayerDebugMode` como String nos registros CSXS.9 a CSXS.12. Reinicie o Premiere após concluir.

## macOS

Os [DMGs publicados v1.0.0](https://github.com/Bielicoman/mediadownloader/releases/tag/v1.0.0) são anteriores à nova interface e aos novos formatos. Escolha **Apple Silicon** ou **Intel** conforme **Apple → Sobre Este Mac**.

Abra o DMG, arraste o aplicativo para **Aplicativos** e tente abri-lo. Se houver bloqueio, consulte **Ajustes do Sistema → Privacidade e Segurança → Abrir Assim Mesmo**, quando disponível, e a [orientação oficial da Apple](https://support.apple.com/pt-br/102445).

O aplicativo não é notarizado pela Apple. A nova versão e os scripts CEP foram revisados em código; execução e instalação no Mac real ainda não foram validadas.

## Linux

O [AppImage x86_64 publicado](https://github.com/Bielicoman/mediadownloader/releases/download/v1.0.0/MediaDownloader-Linux-x86_64.AppImage) permanece v1.0.0.

```sh
chmod +x MediaDownloader-Linux-x86_64.AppImage
./MediaDownloader-Linux-x86_64.AppImage
```

Se FUSE não estiver disponível:

```sh
./MediaDownloader-Linux-x86_64.AppImage --appimage-extract-and-run
```

A nova versão não foi executada em Linux nesta validação.

## Android

Baixe o [APK ARM64 v1.0.0](https://github.com/Bielicoman/mediadownloader/releases/download/v1.0.0/MediaDownloader-Android-arm64.apk), abra pela pasta Downloads e autorize a fonte de instalação se o sistema solicitar. ARM32 e universal estão na [release anterior](https://github.com/Bielicoman/mediadownloader/releases/tag/v1.0.0). A nova versão não foi validada em Android.

## Se algo falhar

Abra as Configurações e confira o diagnóstico dos motores, a pasta de destino e o espaço disponível. Algumas fontes exigem autenticação; o arquivo `cookies.txt` é selecionado localmente e usado nas requisições ao serviço da mídia. Ele pode conter sessões de conta: não compartilhe esse arquivo, seu conteúdo ou credenciais em issues.

Reporte a mensagem de erro, a plataforma e o formato escolhido nas [issues](https://github.com/Bielicoman/mediadownloader/issues). Envie somente links públicos de conteúdo que você tenha autorização para baixar.

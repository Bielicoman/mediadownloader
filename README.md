<p align="center"><img src="logo.png" width="76" alt="Media Downloader"></p>
<h1 align="center">Media Downloader</h1>
<p align="center">Vídeo, áudio e capas. Um link, sua qualidade, sua pasta.</p>
<p align="center"><a href="https://mediadownloader-blush.vercel.app">Site e downloads</a> · <a href="docs/INSTALACAO.md">Instalação</a> · <a href="docs/AVISOS-DE-INSTALACAO.md">Avisos de instalação</a> · <a href="docs/README.en.md">English</a></p>

Aplicativo gratuito de Alex Ascencio para mídia autorizada, playlists e arquivos para editores. Código próprio sob MIT; projeto independente dos fabricantes.

## Downloads

| Produto | Versão | Canal | Pacote |
|---|---|---|---|
| Desktop Windows 10/11 x64 | 1.4.6 | Estável | [EXE](https://github.com/Bielicoman/mediadownloader/releases/download/v1.4.6/MediaDownloader-Windows-x64-Setup.exe) |
| Painel Premiere e After Effects | 1.4.6 | Beta | [ZIP Adobe](https://github.com/Bielicoman/mediadownloader/releases/download/v1.4.6/MediaDownloader-Adobe-1.4.6.zip) |
| Editores Windows: Resolve, CapCut e Avid | 1.1.7 | Beta | [Instalador](https://github.com/Bielicoman/mediadownloader/releases/download/v1.4.6/MediaDownloader-Editores-Windows-Setup.exe) |
| Editores macOS: Final Cut, Resolve e Avid | 1.1.7 | Beta | [ZIP Mac](https://github.com/Bielicoman/mediadownloader/releases/download/v1.4.6/MediaDownloader-Editores-macOS-1.1.7.zip) |
| Android | 1.3.7 | Beta | [ARM64](https://github.com/Bielicoman/mediadownloader/releases/download/android-v1.3.7/MediaDownloader-Android-arm64.apk) · [Universal](https://github.com/Bielicoman/mediadownloader/releases/download/android-v1.3.7/MediaDownloader-Android-universal.apk) |
| Desktop macOS / Linux | 1.0.0 | Beta, pacote anterior | [Escolher arquitetura](https://mediadownloader-blush.vercel.app/#baixar) |

Beta identifica uma entrega em avaliação, com compatibilidade variável conforme sistema e editor. Componentes têm versões independentes. O site distribui aplicativos e apresenta uma demonstração interativa; o processamento público de mídia no navegador está desativado.

## Recursos

- Vídeo/áudio, playlists e vários links no Desktop e no painel Adobe.
- Escolha entre vídeo e playlist ao colar links combinados; passagem automática ao modo Playlist.
- Coleções em Lista ou Grade, seleção individual, miniaturas alternativas e controle de tamanho.
- Limite de resolução, ProRes, WAV, FLAC, MP3, M4A, áudio original e capa PNG.
- Dados da fonte e do arquivo, codec e orientação de compatibilidade.
- Seletor de idioma com preferência local. Traduções complementares são Beta; informações técnicas externas mantêm a língua de origem.
- Atualizações verificadas por hash no Windows/Adobe e APK com confirmação do Android.

Escolher 8K não amplia um vídeo menor. Converter para WAV/FLAC não recupera qualidade perdida. O formato original pode exigir conversão no editor.

## Começar

Instale o Desktop, cole um link autorizado, confira o destino e baixe. Para editores, instale o painel Adobe ou o aplicativo Editores. No Resolve em português: **Área de Trabalho → Scripts → Media Downloader**. O companion usa mecanismos distintos por editor; não é um plugin interno CapCut, Avid ou Final Cut.

## Documentação

[Instalação](docs/INSTALACAO.md) · [Integrações](docs/INTEGRACOES.md) · [Atualizações](docs/ATUALIZACOES.md) · [Idiomas](docs/IDIOMAS.md) · [Desenvolvimento](docs/DESENVOLVIMENTO.md) · [Validação técnica](docs/VALIDACAO.md) · [Changelog](CHANGELOG.md) · [Segurança](SECURITY.md)

## Desenvolvimento

```sh
npm ci
npm ci --prefix app --omit=dev --ignore-scripts
npm test
npm run check
npm run build:site
```

Node.js 24 e Python 3 para empacotar. A interface no navegador não executa recursos nativos. Preserve os motores fora do ASAR e use binários da plataforma correta.

## Licenças e contato

[MIT](LICENSE) para o código próprio; [licenças de terceiros](THIRD-PARTY-NOTICES.md) para os componentes. A fonte correspondente completa do build FFmpeg distribuído continua sendo uma pendência de conformidade; Beta não substitui obrigações de licença.

[Relatar problema](https://github.com/Bielicoman/mediadownloader/issues/new/choose) · [Contribuir](CONTRIBUTING.md). Contato: **ascencioalexgabriel@gmail.com**. Não publique cookies, credenciais ou links privados.

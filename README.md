# Media Downloader

Aplicativo gratuito para baixar vídeos, áudios e capas, com seleção de qualidade, playlists e fila de links. Também oferece um painel CEP para o Adobe Premiere Pro.

Criado por **Alex Ascencio**. [Site e instalação](https://mediadownloader-blush.vercel.app) · [Releases](https://github.com/Bielicoman/mediadownloader/releases) · [Documentação de instalação](docs/INSTALACAO.md)

## Baixar e instalar

| Plataforma | Pacote | Situação desta entrega |
|---|---|---|
| Windows 10/11 x64 | [Instalador EXE v1.3.0](https://github.com/Bielicoman/mediadownloader/releases/download/v1.3.0/MediaDownloader-Windows-x64-Setup.exe) | Aplicativo atualizado; instalador por usuário ou para todos os usuários |
| Premiere Pro | [Plugin ZIP v1.3.0](https://github.com/Bielicoman/mediadownloader/releases/download/v1.3.0/MediaDownloader.zip) | Painel CEP, com scripts de instalação por usuário para Windows e Mac |
| macOS Apple Silicon | [DMG v1.0.0](https://github.com/Bielicoman/mediadownloader/releases/download/v1.0.0/MediaDownloader-macOS-AppleSilicon.dmg) | Pacote publicado anterior; execução da nova versão em Mac real não validada |
| macOS Intel | [DMG v1.0.0](https://github.com/Bielicoman/mediadownloader/releases/download/v1.0.0/MediaDownloader-macOS-Intel.dmg) | Pacote publicado anterior |
| Linux x86_64 | [AppImage v1.0.0](https://github.com/Bielicoman/mediadownloader/releases/download/v1.0.0/MediaDownloader-Linux-x86_64.AppImage) | Pacote publicado anterior |
| Android ARM64 | [APK v1.0.0](https://github.com/Bielicoman/mediadownloader/releases/download/v1.0.0/MediaDownloader-Android-arm64.apk) | Pacote publicado anterior |

Os links v1.3.0 identificam os artefatos desta entrega. Até a publicação da release, esses links podem ainda não estar disponíveis. Consulte a [página da versão](https://github.com/Bielicoman/mediadownloader/releases/tag/v1.3.0) antes de compartilhar.

No Windows, abra o EXE e mantenha **Somente para mim** para instalar no seu usuário. O Desktop inclui yt-dlp, FFmpeg e FFprobe; o usuário final não precisa instalar Python ou Node.js. Para o Premiere, extraia o ZIP inteiro e use o instalador do seu sistema. [Passo a passo](docs/INSTALACAO.md).

## O que mudou na v1.3.0

- Download direto pelo yt-dlp, sem depender do aria2c que causava a falha de áudio.
- Interface Desktop com superfícies de vidro, cores e identidade visual do projeto.
- Seletores independentes de qualidade em **Vídeo ou áudio**, **Playlist ou canal** e **Vários links**.
- Quinze opções: máxima; até 8K, 4K, 1440p, 1080p, 720p, 480p e 360p; ProRes; WAV, FLAC, MP3, M4A e áudio original; thumbnail PNG.
- Qualidade padrão persistente nas Configurações, aplicada ao abrir. Escolher outro formato em uma aba não muda o padrão salvo.
- Atualizações de motores na pasta do usuário, sem modificar o bundle assinado do Mac.

A resolução depende da fonte: escolher 8K não amplia um vídeo menor. Converter áudio para WAV ou FLAC não recupera informação perdida na origem. **Áudio original** mantém a codificação da fonte sem conversão.

## O que foi verificado

Em Windows, foram realizados downloads reais de WAV, FLAC, MP3, M4A, áudio original e vídeo 360p, com inspeção dos arquivos e decodificação. Os testes DOM verificaram os quinze presets, independência das três abas, formato recebido pelos trabalhos da fila e persistência do padrão após recarga.

No macOS, cinco cenários de descoberta de motores foram verificados em VM JavaScript com plataforma e filesystem simulados. Isso **não equivale a executar no Mac**. Instalação, abertura e download da nova versão no macOS permanecem sem validação em equipamento real. Os pacotes publicados Mac, Linux e Android continuam na v1.0.0, sem os novos recursos. [Evidências e limites](docs/VALIDACAO.md).

## Desenvolvimento

Requisitos: Node.js com npm; Python 3 para gerar o pacote do plugin. A execução Desktop em desenvolvimento exige Electron e os motores locais, conforme [guia de desenvolvimento](docs/DESENVOLVIMENTO.md).

```sh
npm test
npm run serve
npm run build:site
npm run package:plugin
npm run sync:engine
```

[Contribuir](CONTRIBUTING.md) · [Relatar vulnerabilidade](SECURITY.md) · [Histórico de mudanças](CHANGELOG.md)

## Próximas integrações

A expansão será feita uma etapa por vez, começando pela conclusão Windows/site/GitHub/Premiere. After Effects, DaVinci Resolve, Final Cut Pro, CapCut e iOS são planos sujeitos a validação; não são plugins compatíveis já entregues. Android tem uma base publicada v1.0.0, ainda sem teste da nova entrega. Veja o [roadmap e os critérios de validação](docs/ROADMAP.md).

## Licença e terceiros

O **código próprio** do Media Downloader está sob a [licença MIT](LICENSE). O aplicativo é gratuito; a MIT permite usar, modificar e redistribuir o código com os respectivos avisos.

Os programas embarcados têm licenças próprias. FFmpeg/FFprobe e o executável Windows do yt-dlp incluem componentes GPL; a MIT do projeto não substitui essas condições. Consulte [avisos de terceiros](THIRD-PARTY-NOTICES.md).

A verificação do **código-fonte correspondente completo do build FFmpeg Gyan 6.1.1**, incluindo bibliotecas e scripts da compilação, permanece pendente. Não declaramos conformidade integral resolvida apenas com um link para o repositório genérico do FFmpeg.

## Contato

Dúvidas: **ascencioalexgabriel@gmail.com**. Para bugs, use as [issues](https://github.com/Bielicoman/mediadownloader/issues). Nunca publique cookies, credenciais ou links privados.

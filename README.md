<div align="center">

<img src="icons/logo.png" width="96" alt="Media Downloader">

# Media Downloader

**Baixe vídeos, áudios, playlists e canais em qualidade máxima — prontos para a timeline.**

Aplicativo Desktop para Windows, macOS e Linux · Extensão nativa para o Adobe Premiere Pro

[![Site oficial](https://img.shields.io/badge/site-mediadownloader-FFB020?style=for-the-badge)](https://mediadownloader-blush.vercel.app)
[![Downloads](https://img.shields.io/badge/downloads-v1.0.0-10b981?style=for-the-badge)](https://github.com/Bielicoman/mediadownloader/releases/tag/v1.0.0)
[![Licença](https://img.shields.io/badge/licença-MIT-00d2ff?style=for-the-badge)](#licença)

[![Build](https://github.com/Bielicoman/mediadownloader/actions/workflows/build-desktop.yml/badge.svg)](https://github.com/Bielicoman/mediadownloader/actions/workflows/build-desktop.yml)

</div>

---

## Baixar

Todos os pacotes são autocontidos: os motores de download e conversão vêm dentro do arquivo. Não é preciso instalar Python, FFmpeg nem nada por fora.

| Sistema | Arquivo | Tamanho |
|---|---|---|
| **Windows 10/11** (64-bit) | [MediaDownloader-Windows-x64.zip](https://github.com/Bielicoman/mediadownloader/releases/download/v1.0.0/MediaDownloader-Windows-x64.zip) | 169 MB |
| **macOS** Apple Silicon (M1–M4) | [MediaDownloader-macOS-AppleSilicon.dmg](https://github.com/Bielicoman/mediadownloader/releases/download/v1.0.0/MediaDownloader-macOS-AppleSilicon.dmg) | 165 MB |
| **macOS** Intel | [MediaDownloader-macOS-Intel.dmg](https://github.com/Bielicoman/mediadownloader/releases/download/v1.0.0/MediaDownloader-macOS-Intel.dmg) | 185 MB |
| **Linux** x86_64 | [MediaDownloader-Linux-x86_64.AppImage](https://github.com/Bielicoman/mediadownloader/releases/download/v1.0.0/MediaDownloader-Linux-x86_64.AppImage) | 186 MB |
| **Adobe Premiere Pro** | [MediaDownloader.zxp](https://mediadownloader-blush.vercel.app/MediaDownloader.zxp) | 3 MB |

Versões `.zip` do macOS também estão na [página da release](https://github.com/Bielicoman/mediadownloader/releases/tag/v1.0.0), para quem prefere não usar DMG.

---

## Recursos

- **Qualidade máxima real** — 4K/8K, 2160p60, 1440p, 1080p60, sem travar em 1080p
- **Perfis prontos para edição** — Apple ProRes 422 HQ (`.mov`), H.264 + AAC 48 kHz, WAV 24-bit/48 kHz PCM, MP3 320 kbps
- **Playlists e canais** — indexa a coleção inteira com seleção por checkbox ou download em lote
- **Múltiplas URLs** — cole dezenas de links de uma vez para processar em fila
- **Conversão automática** — VP9 do YouTube, Reels e TikTok viram H.264 ou ProRes, eliminando o problema de importar só o áudio
- **Vídeos com restrição** — suporte a `cookies.txt`
- **Inserção na timeline** (extensão) — coloca o clipe na primeira faixa livre sob o playhead e organiza num bin `_Downloads`

---

## Instalação por sistema

<details>
<summary><b>Windows</b></summary>

<br>

1. Baixe o `.zip` e extraia em qualquer pasta.
2. Execute **`Media Downloader.exe`**.

Não requer instalador, Node.js nem terminal. Para acesso rápido, crie um atalho ou fixe na barra de tarefas.

</details>

<details>
<summary><b>macOS</b> — inclui o passo do Gatekeeper</summary>

<br>

1. Confira seu chip no menu Apple, em **Sobre Este Mac**, e baixe o pacote correspondente.
2. Abra o `.dmg` e arraste o **Media Downloader** para **Aplicativos**.
3. **Na primeira abertura o macOS vai bloquear o app.** Aparece *"O item Media Downloader não foi aberto"*, dizendo que a Apple não pôde verificá-lo.

Isso é esperado e **não significa que o app esteja danificado**. O aplicativo tem assinatura ad-hoc, não um certificado pago da Apple, então não passou pela notarização. Para liberar:

- Clique em **OK**
- Abra **Ajustes do Sistema › Privacidade e Segurança**
- Role até o fim e clique em **Abrir Assim Mesmo**
- Confirme com Touch ID ou senha

Só é necessário uma vez. Alternativa pelo Terminal, que resolve de uma vez:

```bash
xattr -dr com.apple.quarantine "/Applications/Media Downloader.app"
```

</details>

<details>
<summary><b>Linux</b> — inclui a questão do libfuse2</summary>

<br>

```bash
chmod +x MediaDownloader-Linux-x86_64.AppImage
./MediaDownloader-Linux-x86_64.AppImage
```

Se aparecer erro mencionando **FUSE** ou **dlopen**, é porque distribuições recentes deixaram de trazer a biblioteca que o formato AppImage usa para se montar:

```bash
sudo apt install libfuse2      # Ubuntu 22.04+ / Debian 12+
```

Ou rode sem instalar nada:

```bash
./MediaDownloader-Linux-x86_64.AppImage --appimage-extract-and-run
```

</details>

<details>
<summary><b>Extensão do Adobe Premiere Pro</b> — Windows e macOS</summary>

<br>

Compatível com o **Premiere Pro 2020 (v14.0) até 2026+**.

**Caminho normal:** abra o [ZXP Installer](https://zxpinstaller.com/) ou o [Anastasiy's Extension Manager](https://install.anastasiy.com/) e arraste o `.zxp`. Depois, no Premiere: **Janela › Extensões › Media Downloader**.

**Se o instalador recusar o arquivo** — a extensão não é assinada com certificado pago da Adobe — use o [ZIP manual](https://mediadownloader-blush.vercel.app/MediaDownloader.zip):

1. Abra a pasta de extensões do CEP:

| Sistema | Caminho |
|---|---|
| Windows | `%APPDATA%\Adobe\CEP\extensions\` |
| macOS | `~/Library/Application Support/Adobe/CEP/extensions/` |

2. Extraia o ZIP lá, numa pasta `com.alexascencio.mediadownloader`.
3. Autorize extensões não assinadas:

```bash
# macOS
for v in 9 10 11 12; do defaults write com.adobe.CSXS.$v PlayerDebugMode 1; done
```

```powershell
# Windows (PowerShell)
9..12 | ForEach-Object { New-ItemProperty -Path "HKCU:\Software\Adobe\CSXS.$_" -Name PlayerDebugMode -Value 1 -PropertyType String -Force }
```

4. Reinicie o Premiere Pro.

**Sobre os motores:** a extensão não empacota o FFmpeg. Sem ele o download trava em resoluções baixas e não há conversão para ProRes. Há duas saídas, ambas válidas:

- **Instalar o app Desktop** — a extensão detecta e usa os motores que já vêm dentro dele, sem configurar nada. É a via mais simples no macOS.
- **Usar o botão "Instalar FFmpeg na extensão"**, no painel de ajustes, que baixa os binários direto para a pasta da extensão. Funciona nas duas plataformas.

No macOS o Premiere não enxerga programas instalados por Homebrew, porque aplicativos de interface não herdam o `PATH` do Terminal — por isso a extensão procura em caminhos explícitos, incluindo `/opt/homebrew/bin` e `/usr/local/bin`.

</details>

---

## Motores por plataforma

O que vai dentro de cada pacote. A tabela é literal — nada é prometido onde não existe.

| Motor | Windows | macOS | Linux | Extensão Premiere |
|---|:---:|:---:|:---:|:---:|
| **yt-dlp** | incluso | incluso | incluso | incluso |
| **FFmpeg + ffprobe** | incluso | incluso | incluso | sob demanda |
| **aria2c** (16 conexões) | incluso | — | — | Windows |

O `aria2c` não entra no macOS nem no Linux porque o projeto aria2 **não publica binários para essas plataformas** — só Windows e Android. Onde ele falta, o yt-dlp usa o próprio motor de download: o resultado é o mesmo arquivo, com throughput menor.

---

## Como os pacotes são gerados

Tudo sai do [GitHub Actions](.github/workflows/build-desktop.yml), em runners nativos de cada sistema — nada é compilado em máquina local:

| Job | Runner | Produz |
|---|---|---|
| `windows` | `windows-latest` | `.zip` portátil |
| `macos` | `macos-latest` | `.dmg` e `.zip`, arm64 e x64 |
| `linux` | `ubuntu-latest` | `.AppImage` x86_64 |

O macOS **exige** runner Apple: em Apple Silicon o sistema recusa binários sem assinatura de código válida, e o `codesign` só existe no macOS.

Cada job verifica antes de publicar, e falha em vez de subir algo quebrado:

- tamanho de cada binário baixado, para pegar download corrompido
- presença dos codecs que o app usa — `libx264`, `prores_ks`, `aac`, `pcm_s24le`, `libmp3lame` — executando o próprio FFmpeg
- estrutura do pacote: os binários precisam existir e ser executáveis, e não pode haver `app.asar`, porque binário dentro de asar não roda
- no macOS, `codesign --verify` na assinatura ad-hoc
- no Linux, o AppImage é extraído e o FFmpeg executado de dentro dele

---

## Estrutura do repositório

```
├── app/                              fonte do aplicativo Desktop (Electron)
│   ├── src/main.js                   processo principal, IPC, janela
│   ├── src/js/downloader.js          orquestra yt-dlp e FFmpeg
│   ├── src/js/binManager.js          localiza os motores no sistema
│   └── icons/
├── com.alexascencio.mediadownloader/ fonte da extensão CEP do Premiere
│   ├── CSXS/manifest.xml             declaração da extensão
│   ├── jsx/host.jsx                  ExtendScript: import e timeline
│   └── js/
├── .github/workflows/                build das três plataformas
├── index.html                        site oficial
└── package-zxp.js                    empacotador de ZXP, em Node puro
```

---

## Desenvolvimento

```bash
git clone https://github.com/Bielicoman/mediadownloader.git
cd mediadownloader

# App Desktop
npm install electron --no-save
npx electron app

# Empacotar a extensão do Premiere
node package-zxp.js
```

Os binários (`app/bin/`) **não ficam versionados** — são baixados durante o build. Para rodar localmente, coloque `yt-dlp`, `ffmpeg` e `ffprobe` em `app/bin/`, ou deixe o app encontrá-los no sistema.

---

## Aviso de uso

Baixar conteúdo de plataformas como o YouTube pode violar os termos de serviço delas e, dependendo do material, a legislação de direitos autorais. Use com material próprio, licenciado ou de domínio público. A responsabilidade pelo uso é de quem usa.

---

## Licença

MIT.

Criado por **[Alex Ascencio](https://github.com/Bielicoman)**.

Outros plugins: [My Packs Pro](https://mypackspro.vercel.app) · [Master Color](https://mastercolor-plugin.vercel.app) · [Safe Zones](https://safezones-psi.vercel.app)

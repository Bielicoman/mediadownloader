# Avisos de terceiros

O código-fonte do Media Downloader é licenciado sob [MIT](LICENSE).

Os pacotes distribuídos (`.zip`, `.dmg`, `.AppImage`) **empacotam programas de
terceiros**, cada um sob a sua própria licença. Alguns são copyleft (GPL) e essas
licenças **não são substituídas** pela licença MIT deste projeto.

Os programas abaixo são executados como **processos separados**, invocados pela
linha de comando. Não há vinculação de código: o Media Downloader não é uma obra
derivada deles.

---

## Componentes empacotados

| Componente | Licença | Origem |
|---|---|---|
| **yt-dlp** | Unlicense (domínio público) | [yt-dlp/yt-dlp](https://github.com/yt-dlp/yt-dlp) |
| **FFmpeg** e **ffprobe** | **GPL v3** | [ffmpeg.org](https://ffmpeg.org) |
| **aria2c** (só no Windows) | **GPL v2 ou posterior** | [aria2/aria2](https://github.com/aria2/aria2) |
| **Electron** | MIT | [electron/electron](https://github.com/electron/electron) |
| **Chromium** (dentro do Electron) | BSD-3-Clause e outras | [chromium.org](https://www.chromium.org) |
| **Node.js** (dentro do Electron) | MIT | [nodejs.org](https://nodejs.org) |
| **CSInterface.js** (extensão CEP) | BSD-3-Clause, Adobe | [Adobe-CEP/CEP-Resources](https://github.com/Adobe-CEP/CEP-Resources) |

O FFmpeg é distribuído sob **GPL v3**, e não sob a LGPL, porque as builds usadas
incluem o **libx264**, que é GPL. Essa é a licença que vale para os binários que
acompanham os pacotes.

---

## Como obter o código-fonte (obrigação da GPL)

A GPL exige que quem distribui os binários ofereça o código-fonte correspondente.
Os binários empacotados **não são compilados por este projeto**: são baixados,
sem modificação, durante o build. As fontes exatas estão publicadas:

| Binário | Build usada | Código-fonte |
|---|---|---|
| `ffmpeg`, `ffprobe` (Windows, macOS) | [eugeneware/ffmpeg-static](https://github.com/eugeneware/ffmpeg-static/releases) | [git.ffmpeg.org/ffmpeg.git](https://git.ffmpeg.org/ffmpeg.git) |
| `ffmpeg`, `ffprobe` (Linux) | [johnvansickle.com/ffmpeg](https://johnvansickle.com/ffmpeg/) | [git.ffmpeg.org/ffmpeg.git](https://git.ffmpeg.org/ffmpeg.git) |
| `aria2c` | [aria2 release 1.37.0](https://github.com/aria2/aria2/releases/tag/release-1.37.0) | mesmo repositório, aba de tags |
| `yt-dlp` | [release mais recente](https://github.com/yt-dlp/yt-dlp/releases/latest) | mesmo repositório |
| `electron` | versão fixada no workflow | [electron/electron](https://github.com/electron/electron) |

As versões exatas de cada build estão declaradas em
[`.github/workflows/build-desktop.yml`](.github/workflows/build-desktop.yml),
nas variáveis `ELECTRON_VERSION` e `FFMPEG_TAG` e nas URLs de download.

Se precisar do código-fonte de alguma versão específica e os links acima não
resolverem, abra uma
[issue](https://github.com/Bielicoman/mediadownloader/issues).

---

## Texto completo das licenças

- MIT deste projeto: [LICENSE](LICENSE)
- GPL v3 (FFmpeg): https://www.gnu.org/licenses/gpl-3.0.html
- GPL v2 (aria2): https://www.gnu.org/licenses/old-licenses/gpl-2.0.html
- Unlicense (yt-dlp): https://unlicense.org
- Licenças do Chromium: acompanham cada pacote, no arquivo de licenças do Electron

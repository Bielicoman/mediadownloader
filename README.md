# Media Downloader 🎬⚡

> **Plugin CEP nativo para Adobe Premiere Pro** que permite baixar vídeos em 4K UHD, 1440p, Reels do Instagram e TikTok direto para sua Timeline com 1 clique.

![Adobe Premiere Pro](https://img.shields.io/badge/Adobe%20Premiere%20Pro-2020%20--%202026%2B-00005b?style=for-the-badge&logo=adobe-premiere-pro&logoColor=white)
![Status](https://img.shields.io/badge/Status-100%25%20Funcional-10b981?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-00d2ff?style=for-the-badge)

---

## 🌟 Principais Recursos

- 🎬 **Resolução 4K & 1440p Real**: Pega a máxima resolução absoluta do YouTube (2160p60, 1440p, 1080p60) sem travar em 1080p.
- ⚡ **Aceleração 16-Sockets Turbo**: Conexões concorrentes paralelas e integração com Aria2c para downloads ultra-rápidos sem estrangulamento de banda (*anti-throttling*).
- 📱 **Compatibilidade Total de Codecs (Instagram Reels & TikTok)**: Auto-conversão de VP9 para H.264 + AAC 48kHz para eliminar o erro de importar apenas o áudio no Premiere.
- 🛡️ **Proteção Anti-Colisão [WinError 32]**: Previne travamentos de arquivos abertos gerando automaticamente novas versões.
- 📁 **Download Automático na Pasta do Projeto**: Detecta o arquivo `.prproj` que você está editando e salva tudo organizadamente em `[Projeto]/_Downloads/`.
- 🎯 **Inserção Inteligente na Timeline**: Localiza a primeira trilha vazia no Playhead sem sobrescrever seus cortes anteriores.
- 🍪 **Suporte a Vídeos 18+ (Cookies)**: Desbloqueie vídeos com restrição de idade no YouTube apontando seu arquivo `cookies.txt` nas configurações.

---

## 🚀 Como Instalar

### Método 1: Instalador Rápido (Windows)
1. Baixe o repositório ou o arquivo [`Instalar-Windows.bat`](downloads/Instalar-Windows.bat).
2. Dê dois cliques em **`Instalar-Windows.bat`**.
3. Abra o Premiere Pro e acesse: **Janela > Extensões > Media Downloader**.

### Método 2: Pacote ZXP (macOS / Windows)
1. Baixe [`MediaDownloader.zxp`](downloads/MediaDownloader.zxp).
2. Instale usando o [ZXP Installer](https://zxpinstaller.com/) ou [Anastasiy's Extension Manager](https://install.anastasiy.com/).
3. Abra o Premiere Pro em **Janela > Extensões > Media Downloader**.

---

## 🌐 Website Oficial
Acesse o site oficial e simulador interativo em:
👉 **[https://mediadownloader-blush.vercel.app](https://mediadownloader-blush.vercel.app)**

---

## 🛠️ Tecnologias Utilizadas
- **Adobe CEP (Common Extensibility Platform)** & ExtendScript API
- **Node.js runtime** embutido
- **yt-dlp** & **FFmpeg 9.0** & **aria2c**
- **Obsidian Cinema Design System** (Zero Purple)

---

## 📄 Licença
Distribuído sob a licença MIT. Desenvolvido por Alex Ascencio.

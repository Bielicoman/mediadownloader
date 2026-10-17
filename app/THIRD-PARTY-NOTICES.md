# Avisos de terceiros e proveniência

O código próprio e a documentação do Media Downloader são MIT, copyright 2026 Alex Ascencio. Isso não relicencia programas, fontes ou bibliotecas de terceiros. Downloads oficiais do projeto são gratuitos.

## Pacotes Windows 1.4.2 e Editores 1.1.3

| Componente | Versão medida | Licença efetiva / origem |
|---|---|---|
| Electron | 44.7.2 | MIT; contém Chromium e Node.js com avisos próprios |
| yt-dlp.exe | 2026.08.19 | núcleo Unlicense; executável PyInstaller combinado GPLv3 ou posterior e licenças de dependências |
| FFmpeg / FFprobe | 6.1.1 essentials, Gyan | GPLv3 ou posterior; build estática com --enable-gpl --enable-version3 |
| Manrope | fonte variável do projeto Manrope | SIL OFL 1.1; copyright 2018 The Manrope Project Authors |
| CSInterface.js (CEP) | arquivo distribuído no painel | BSD-3-Clause, Adobe; aviso mantido no próprio arquivo |

aria2c 1.37.0 está incluído no conjunto de motores Windows legado, sob GPLv2 ou posterior; o fluxo atual utiliza download direto do yt-dlp. Origem: https://github.com/aria2/aria2/releases/tag/release-1.37.0. Electron-updater 6.8.9 e dependências preservam seus arquivos LICENSE nos módulos distribuídos.

## Textos de licença

- MIT do projeto: [LICENSE](LICENSE)
- Electron: [licenses/Electron-MIT.txt](licenses/Electron-MIT.txt)
- Chromium e dependências: `LICENSES.chromium.html` acompanha o runtime Electron
- aria2 GPLv2: [licenses/aria2-GPL-2.0.txt](licenses/aria2-GPL-2.0.txt)
- GPLv3: [licenses/GPL-3.0.txt](licenses/GPL-3.0.txt)
- yt-dlp: [Unlicense](licenses/yt-dlp-Unlicense.txt) e [avisos completos](licenses/yt-dlp-THIRD-PARTY-LICENSES.txt)
- Manrope: [OFL](licenses/Manrope-OFL.txt) e [FONTLOG](licenses/Manrope-FONTLOG.txt)

## Fontes identificadas

- Media Downloader: https://github.com/Bielicoman/mediadownloader — a release inclui snapshot do código desta entrega.
- yt-dlp 2026.08.19: https://github.com/yt-dlp/yt-dlp/tree/2026.08.19 — inclui receitas e referências de dependências. Os avisos completos identificam os componentes combinados.
- Electron 44.7.2: https://github.com/electron/electron/tree/v44.7.2
- Build Gyan 6.1.1: https://github.com/GyanD/codexffmpeg/releases/tag/6.1.1
- Núcleo FFmpeg identificado pelo fornecedor: commit e38092ef93, https://github.com/FFmpeg/FFmpeg/commit/e38092ef93
- Manrope: https://github.com/google/fonts/tree/main/ofl/manrope

## Limite de verificação da fonte correspondente GPL

O núcleo FFmpeg foi identificado, mas o conjunto completo de fontes das bibliotecas vinculadas estaticamente e dos scripts correspondentes ao build Gyan ainda não foi verificado. Um link genérico para FFmpeg não equivale a esse conjunto. A inclusão dos avisos não encerra essa obrigação de distribuição. Esta entrega não é uma certificação de conformidade GPL; a coleta e oferta da fonte correspondente completa permanecem registradas como pendência de distribuição.

Para solicitar fontes, comunicar lacunas ou exercer direitos relativos às licenças: ascencioalexgabriel@gmail.com. Não envie cookies ou credenciais. As licenças originais prevalecem.

## Outras plataformas

O workflow baixa motores nativos conforme arquitetura. A proveniência de um futuro pacote deverá registrar os binários realmente incorporados; não reutilizar a identificação Gyan Windows como se descrevesse todos os pacotes Mac/Linux. As versões atualmente publicadas em cada plataforma são indicadas no site.

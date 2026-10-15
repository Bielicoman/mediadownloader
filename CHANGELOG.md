# Histórico de mudanças

## Adobe 1.4.0 — prévia em desenvolvimento

- Adaptador separado para After Effects 2026: importação no projeto e nova camada na composição ativa.
- Importação WAV e inserção testadas no After Effects 26.3x87/Windows. Fluxo completo no painel e macOS pendentes.
- Bridge identifica appId, valida respostas e rejeita chamadas fora do host em vez de simular sucesso.
- Pacote e instaladores compartilhados Premiere/After Effects; Desktop estável permanece 1.3.0.
- Sete testes novos de contratos do host e interface.


## 1.3.0 — 2026-10-15

Entrega Windows/CEP em preparação para publicação. A disponibilidade dos artefatos depende da release no GitHub.

### Corrigido

- Falha de download associada a `aria2c exited with code 1`: fluxo atualizado usa o downloader nativo do yt-dlp.
- Playlist e lote agora usam o seletor de formato da própria aba, sem herdar a escolha do vídeo único.
- Atualização de motores fora do bundle macOS; descoberta de motores do usuário, embarcados e Homebrew.
- Descoberta CEP de instalação Windows no caminho padrão para todos os usuários.

### Adicionado

- Quinze opções de qualidade/formato no Desktop e no seletor existente do CEP.
- WAV, FLAC, MP3, M4A e áudio original; limites de vídeo até 8K, 4K, 1440p, 1080p, 720p, 480p e 360p, além de máxima qualidade, ProRes e thumbnail.
- Qualidade padrão persistente nas Configurações, aplicada na abertura; mudanças de sessão permanecem independentes.
- Instalador Windows EXE com escolha de usuário e pasta.
- ZIP CEP com instaladores por usuário para Windows/Mac e preservação de backup fora de `CEP/extensions`.
- Nova interface Desktop de vidro e novo site com instalação por plataforma e documentação.

### Verificado

- Downloads reais de WAV, FLAC, MP3, M4A, áudio original e vídeo 360p, com inspeção e decodificação.
- Testes DOM dos seletores, passagem dos presets às filas e preferência salva.
- Cinco cenários de descoberta de motores com mocks de plataforma e filesystem.

### Limitações conhecidas

- Nova versão não executada em macOS real. Linux e Android novos também sem teste nativo nesta entrega.
- Pacotes Mac/Linux/Android publicados permanecem v1.0.0 e não incluem automaticamente os novos recursos.
- Código-fonte correspondente completo do build FFmpeg Gyan, incluindo scripts e dependências, ainda não verificado; a MIT cobre somente o código próprio.

## 1.0.0

Release anterior com instaladores distribuídos para Windows, macOS, Linux e Android. Consulte os [artefatos e notas originais](https://github.com/Bielicoman/mediadownloader/releases/tag/v1.0.0) para o conteúdo dessa versão.

# Serviço web retirado

O processamento público no navegador foi desativado em 17/10/2026. O site oficial é estático e oferece instaladores e uma demonstração identificada. O Render permanece suspenso. O material abaixo é histórico de desenvolvimento local e não anuncia disponibilidade pública.

# Media Downloader no navegador

Interface em `online.html`, API Node em `web/server.cjs`, processamento em `web/jobs.cjs`. Funciona sem instalar componentes no celular/computador visitante. O servidor precisa de Node 24, yt-dlp, FFmpeg e FFprobe. Não inclui envio de cookies pessoais, playlists ou acesso a arquivos locais.

## Executar

1. `npm run build:site`
2. Defina `YTDLP_PATH`, `FFMPEG_PATH` e `FFPROBE_PATH` com caminhos absolutos, se não estiverem no PATH.
3. `node web/server.cjs`
4. Abra `http://127.0.0.1:3080/online.html`.

Para teste em celular na mesma rede, use `HOST=0.0.0.0` e o IP do computador, liberando a porta apenas na rede privada. Colar via botão exige HTTPS ou localhost; colar manualmente funciona por HTTP. Nenhum túnel público é aberto automaticamente.

## Hospedagem pública

Use o Dockerfile com o repositório como contexto: `docker build -f web/Dockerfile -t media-web .`. O container serve a mesma interface e API na porta 3080. Use disco temporário de pelo menos 8 GB e memória apropriada para conversão. Defina `PUBLIC_ORIGIN` com a origem HTTPS externa (sem barra final) atrás do proxy. A API não aceita origens externas. Configure o proxy para preservar streaming, requisições Range e prazos de processamento; nenhuma sessão depende de WebSocket.

O site estático da Vercel não executa este worker. Para manter o domínio atual, hospede este serviço e encaminhe `/api/:path*` para ele, definindo PUBLIC_ORIGIN como a origem do site. Não adicionar um rewrite com endereço fictício. Alternativamente, hospede frontend e API juntos neste container. A versão estática informa indisponibilidade e desabilita Preparar, sem simular progresso.

Antes de exposição pública, configure no provedor limite de tráfego/CPU, autenticação ou proteção contra abuso conforme o público e bloqueio de saída para redes privadas, loopback, link-local e endpoints de metadados. A API aceita somente plataformas conhecidas e não permite URLs arbitrárias; a restrição de rede do container também precisa cobrir redirecionamentos/CDNs obtidos pelos extratores. O rate limit por socket é adequado para instância simples; atrás de proxy ele pode agrupar visitantes. Não confiar em X-Forwarded-For sem proxy configurado. Jobs em memória exigem uma instância; para escalar, mover fila/arquivos para armazenamento compartilhado.

## Comportamento e limites

- Vídeo original: melhores streams disponíveis (ou limite escolhido), preservando codecs. Pode entregar MKV/WebM.
- MP4 para edição: H.264 yuv420p + AAC 48 kHz. Copia streams já compatíveis; converte os demais com CRF 16. Preserva resolução/fps, sem prometer conversão sem perdas. ProRes/HDR especializado não faz parte desta primeira versão web.
- MP3 320 kbps e WAV PCM 24-bit/48 kHz. Conversão não melhora a qualidade da origem.
- Dois processamentos simultâneos, cinco tentativas/minuto por conexão de origem, até uma hora de mídia, 2 GB de arquivos temporários por job, até 30 minutos por processo e expiração uma hora após conclusão. O limite de disco inclui fonte e saída durante conversão.
- IDs aleatórios de 192 bits funcionam como links privados temporários. Não publicar esses links em logs/analytics. Arquivos expirados ou cancelados são removidos; reinício perde a fila. Falha/encerramento abrupto do host requer limpeza do volume temporário pela hospedagem.
- Sem coleta de cookies nem armazenamento de histórico em localStorage. Servidor processa o link enviado e armazena mídia temporariamente. Revisar a política de privacidade publicada antes de habilitar o serviço público.
- Plataformas podem recusar acesso por região, autenticação ou bloqueio de IP de datacenter. O serviço informa o erro e não contorna restrições.

## Validação

`node --test tests/web-service.test.cjs` cobre contratos, arquivos, cancelamento, limites e tratamento de erro com processos de teste. Validação real de mídia é separada: exige download externo, FFprobe e decodificação do arquivo entregue. Navegador emulado não comprova instalação, comportamento nativo do Android/iOS ou importação real no Premiere.

### Resultado verificado em 16/10/2026

- Download real da referência pública `jNQXAC9IVRw` (cerca de 19 segundos): original AV1/Opus, MP4 H.264 yuv420p/AAC 48 kHz, MP3 320 kbps e WAV pcm_s24le/48 kHz. FFprobe e decodificação completa passaram nos quatro arquivos.
- Teste pelo navegador: preparar e salvar MP4 em viewport de computador (1440 px), preparar e salvar MP3 em viewport de celular (390 px), cancelar uma solicitação e voltar a habilitar o formulário. Sem transbordamento horizontal nessas larguras.
- Seis testes automatizados da API/processamento passaram. A suíte anterior do repositório e a checagem sintática também passaram.
- Evidências locais: `work/web-validation/evidence.json`, `work/web-desktop-ready.png`, `work/web-mobile-ready.png`. Arquivos gerados ficam fora do Git.
- Não foi testado em um aparelho físico, em importação real no Premiere nem em todas as plataformas anunciadas. Uma referência anterior do YouTube foi recusada pela origem e exibiu erro; a referência acima completou o fluxo real.
- A API foi executada apenas em localhost. Não há worker publicado nem rewrite de produção apontando para uma hospedagem. Acesso da CLI da Vercel foi confirmado usando `NODE_USE_SYSTEM_CA=1`, sem desativar TLS. A conexão MCP da Vercel pediu reautenticação; a CLI autenticada funcionou.

Para repetir a verificação real, configure os três caminhos dos motores e execute `node scripts/test-web-live.cjs`. O script faz quatro downloads da referência pública, valida codecs/duração, decodifica e salva evidências em `work/web-validation`.

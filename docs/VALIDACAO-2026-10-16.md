# Validação de celular, web e integrações — 16/10/2026

## Vídeo da captura

O link `https://www.youtube.com/watch?v=Uw-_a0taISM` fornecido na captura retornou título, miniatura e duração com o motor atualizado no Windows. O arquivo completo foi baixado: 1920×1080, VP9 + Opus, 1263,368 segundos, 327742778 bytes. A decodificação completa terminou com código zero; o muxer de teste null relatou avisos de timestamps repetidos da fonte HLS. Isso comprova o acesso nesta conexão e neste motor, não no aparelho Android do usuário.

## Android

O APK publicado anteriormente usava youtubedl-android 0.17.3. A fonte 1.3.1 foi atualizada para 0.18.1 com QuickJS, atualização diária/manual do yt-dlp e componentes EJS oficiais. A interface ganhou Manrope, miniatura real, título/autor/duração quando obtidos, seletores compactos independentes, cancelamento e detalhes técnicos recolhidos. O compartilhamento é tratado também quando a Activity já está aberta.

Cada solicitação usa uma pasta temporária isolada e lê o caminho final informado pelo yt-dlp. A publicação no MediaStore limpa entradas incompletas se falhar. Android antigo solicita permissão de gravação na interface. MP4 é convertido para H.264/AAC; MP3 e WAV usam codecs explícitos. Vídeo original preserva os codecs da fonte.

Há uma assinatura de release permanente configurada no armazenamento de segredos do CI. APKs antigos assinados com uma chave de debug diferente podem exigir a remoção da instalação antiga antes de instalar a nova; não prometer atualização por cima. As mídias já salvas nas pastas públicas são independentes do aplicativo.

O fluxo CI compila, executa testes JVM e testa conversão nativa de vídeo/MP3/WAV em emulador Android antes de publicar. Consultar o resultado do workflow Android para o status do APK. Nenhuma etapa foi executada no aparelho físico do usuário.

## Site e web

O SVG Android não tinha viewBox; ao reduzir para o cartão do site, era recortado. O arquivo corrigido usa `viewBox="0 0 430 252"`. A seção web está na página inicial, com estado de disponibilidade real. Sem um worker conectado, o botão de preparar permanece desabilitado.

A API web foi testada localmente com download real e decodificação de vídeo original, MP4, MP3 e WAV. Não há serviço público de processamento conectado. A hospedagem gratuita depende do acesso a uma conta do provedor e dos seus limites; nenhum plano pago foi contratado. Não anunciar o uso online público como concluído.

## Integrações

O SDK Resolve atual retorna Promises na inicialização e na obtenção do host. O companion agora aguarda ambas e valida o objeto recebido. Os testes cobrem essa sequência e os contratos de importação, mas a conexão MCP local ao Resolve não se estabeleceu; importação nativa ainda pendente.

Um teste em uma janela Electron real do companion 1.1.0 baixou o vídeo público `jNQXAC9IVRw`, confirmou o MP4 no disco, alternou para o destino Avid e exportou FCPXML. Evidências locais ficam em `work/companion-e2e`. O diálogo de escolha do destino XML foi substituído apenas no executor de teste para salvar na pasta de teste; o código IPC e a geração do arquivo são os de produção.

Avid é entrega externa de arquivos para o Source Browser, não plugin AVX. Final Cut é exportação FCPXML por companion externo, não extensão interna. Não foram executados Media Composer ou Final Cut Pro neste computador. O pacote Mac inclui um launcher que obtém o runtime Electron oficial e verifica o SHA-256; a execução no macOS permanece pendente.

Os ZIPs publicados como prévia têm SHA-256 e passaram pela checagem CRC do empacotador. Os testes automatizados do repositório e da API web passaram. Isso não substitui testes dentro de cada editor.

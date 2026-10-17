# Registro técnico de validação

## Auditoria de 17/10/2026

- Windows 1.4.1 instalado via NSIS: versão extraída do ASAR; executáveis físicos em resources/bin. Download real jNQXAC9IVRw resultou em MP4 H.264/yuv420p e AAC; FFprobe e decodificação FFmpeg passaram.
- Suíte de regressão e sintaxe passou antes da atualização de segurança. SHA-256 do ZIP Adobe público corresponde ao manifesto; feeds Desktop, Editores e Adobe retornaram HTTP 200 com no-store.
- Android 1.3.4: GitHub Actions 39037396892 concluiu com sucesso build e validação no emulador. O aparelho físico é um estágio separado.
- Usuário confirmou abertura do aplicativo pelo menu Scripts do Resolve. Importação no Pool de Mídia, reprodução CapCut e integrações Mac/Avid/Final Cut continuam como validação nativa pendente; na apresentação pública são Beta.
- Auditoria de dependências identificou GHSA-p2f4-r6v6-j797 em electron-updater 6.6.2 / builder-util-runtime. Atualização para 6.8.9 eliminou os avisos da auditoria de produção.
- Desktop 1.4.2 e Editores 1.1.3 instalados via NSIS com saída 0; versões, i18n e electron-updater 6.8.9 conferidos nos ASAR instalados. Novo download real MP4 passou em FFprobe e decodificação FFmpeg. Adobe 1.4.2 copiado com backup; reabertura do painel é necessária.
- Sete testes dedicados de atualização, coleções, idioma e demonstração passaram. Sintaxe: 54 arquivos válidos. Demonstração no navegador completou com metadados e 100%; não usa download de mídia real. Android 1.3.5: GitHub Actions 39040134673 concluído com sucesso; build, testes e emulador. Release android-v1.3.5 publicada com os quatro APKs e SHA256SUMS. Validação do código/site em main: 39040134620, sucesso.
- Traduções são um catálogo incremental: interface principal em seis idiomas; textos fora do catálogo permanecem na origem. Francês, alemão e italiano são apresentados como Beta.

Não substituir validação de host por mocks, build ou abertura da interface no navegador. O selo Beta comunica maturidade ao usuário e não substitui os registros técnicos.

## Registros anteriores

# Validação da entrega v1.3.0

Registro da revisão de 15 de outubro de 2026. Separe sempre teste de código, teste de pacote e execução em equipamento real. Este documento não certifica plataformas que não foram executadas.

## Windows e formatos

O aplicativo Windows foi usado na validação local. O instalador foi gerado a partir da entrega atual; mantenha os relatórios do build e da verificação do pacote junto aos artefatos da release.

Foram feitos downloads reais de uma fonte pública, com inspeção por FFprobe e decodificação dos resultados:

| Perfil | Verificação registrada |
|---|---|
| WAV | Arquivo produzido, propriedades de áudio verificadas e decodificação completa |
| FLAC | Download/conversão, inspeção e decodificação |
| MP3 | Download/conversão, inspeção e decodificação |
| M4A | Download/conversão, inspeção e decodificação |
| Áudio original | Fluxo preservado sem conversão; a fonte testada forneceu Opus |
| Vídeo 360p | Download/conversão, inspeção e decodificação |

Esses resultados não significam teste de todas as fontes, de todas as resoluções, de vídeos 8K reais ou de todos os codecs possíveis. A seleção de uma resolução superior não amplia a fonte.

O erro original `aria2c exited with code 1` motivou a remoção da dependência de aria2 no fluxo atualizado. A transferência é realizada pelo motor nativo do yt-dlp.

## Interface e preferências

O harness com DOM verificou:

- Quinze opções idênticas no conjunto de menus Desktop; quinze no seletor do CEP.
- IDs únicos e seletores independentes nas três abas Desktop.
- Cliques alterando rótulo, valor e opção ativa.
- Dois trabalhos de playlist recebendo o perfil FLAC escolhido nessa aba.
- Dois trabalhos de lote recebendo o perfil áudio original escolhido nessa aba.
- Salvamento de `mediadownloader_default_preset`, aplicação após recarga e fallback para `best` em valor inválido, tanto Desktop quanto CEP.
- Alterar um seletor durante a sessão não grava outra qualidade padrão.

As capturas do novo Desktop e do site foram inspecionadas visualmente. Testes DOM não substituem avaliação visual de todos os tamanhos de janela ou teste de tecnologias assistivas.

## macOS

Cinco cenários de descoberta de motores foram executados em VM JavaScript com mocks de `process.platform`, filesystem e subprocessos:

1. Desktop encontra motor na pasta do usuário.
2. Desktop recorre ao motor do bundle.
3. Desktop encontra o Homebrew fora do PATH de GUI.
4. CEP usa a pasta gravável do usuário e o fallback do Desktop no Mac.
5. CEP inclui o caminho de instalação Windows para todos os usuários.

O último cenário verifica um caminho Windows dentro do mesmo harness; não é um teste macOS nativo. Sintaxe dos arquivos alterados também foi verificada.

**Não houve execução da nova versão em um Mac real.** Instalação do `.app`, Gatekeeper, assinatura, abertura do Premiere e download/importação no host permanecem sem validação nativa. Os instaladores Mac publicados continuam v1.0.0.

## Premiere CEP

O ZIP atual deve conter a pasta `com.alexascencio.mediadownloader` e os scripts Windows/Mac de instalação por usuário. Os scripts devem preservar backups fora de `CEP/extensions`.

A UI e seus estados foram exercitados em DOM. Isso não comprova download e importação no Premiere em todas as versões suportadas pelo manifesto. Registre separadamente qualquer ensaio com o host real, sua versão e o resultado observado.

## Linux e Android

Os pacotes publicados vinculados pelo site permanecem v1.0.0. A nova interface e os formatos v1.3.0 não devem ser atribuídos a esses instaladores. Não foi registrado teste da nova versão em Linux ou Android nesta entrega.

## Licenças e publicação

Foi identificado FFmpeg/FFprobe Gyan 6.1.1 essentials, com GPLv3+ no binário. O executável yt-dlp Windows inclui licenças de terceiros além da Unlicense do projeto principal. A preservação de avisos deve ser verificada no pacote final.

O conjunto completo de fontes correspondentes e scripts do build FFmpeg Gyan ainda não foi verificado. Não declarar essa obrigação concluída apenas por incluir a licença ou o link de um repositório genérico.

A disponibilidade dos arquivos deve ser conferida após cada publicação, independentemente dos testes locais.

## Revisão final de código e regressões

Correções verificadas por testes: contagem real de sucesso/falha das filas; preservação dos links pendentes; cancelamento durante consulta ao host; histórico inválido; bloqueio de injeção no HTML de miniaturas; comandos de abertura sem shell; recusa de trilhas ocupadas; busca de mídia por caminho; rollback de conversão; leitura de progresso em stdout e stderr; UTF-8 e linhas parciais. O WAV do link original também foi baixado novamente com arquivo já existente.

A importação/inserção do painel só utiliza caminhos e faixas confirmados; se não houver uma faixa vazia adequada, a mídia permanece no bin com aviso. Os testes de host foram simulados; teste nativo no Premiere permanece separado.

## Empacotamento e segurança finais

O runtime Windows foi atualizado para Electron 44.7.2 e seu ZIP conferido pelo SHASUMS256 oficial. A janela nativa abriu com título Media Downloader 1.3.0. Atualizadores Desktop e CEP foram executados em pastas isoladas e baixaram/executaram o yt-dlp 2026.08.19 com TLS validado, inclusive usando certificados confiáveis do Windows.

Os testes de diagnóstico, downloads truncados, escrita, rollback, erros de certificado e cache de confiança passaram. A auditoria npm de produção registrou zero vulnerabilidades no seu escopo. Isso não certifica os binários de terceiros ou ausência total de falhas.

O layout foi exercitado em 1040×820 com a prévia e o progresso ativos: as caixas não se sobrepõem. O histórico fica ao lado, e o conteúdo usa rolagem em alturas menores. Endereços de miniaturas do YouTube são normalizados para o vídeo correspondente.

## Conferência após publicação

Site oficial e as seis páginas institucionais responderam HTTP200. CSP da produção conferida. Instalador público baixado integralmente: SHA2569C9EA9D026192FDBA3DA5A77FB99B4CC859E2BEFCC50D5FD10A37AE65C12901C, igual ao artefato local. Instalação real na pasta padrão do usuário retornou0, com executável1.3.0 e runtime44.7.2; fontes instaladas comparadas por hash. A consulta ao Premiere não recebeu resposta do MCPBridge, portanto não registramos importação nativa como validada.

## Prévia Adobe 1.4.0 — After Effects

Em 15/10/2026, sete novos testes de bridge/adaptador passaram junto à suíte anterior e à revisão independente de código. Identificação usa appId AEFT, sem sucesso simulado fora da Adobe. A instalação Windows por usuário preservou backup; o SHA256 do adaptador instalado coincidiu com o fonte.

Execução nativa no After Effects 26.3x87: importação WAV sem duplicação (duas chamadas, um footage), camada em t=2 com outPoint=10, preservação de camada anterior bloqueada e erro real para arquivo inexistente. Removidos somente os itens de teste; contagem do projeto: 92 antes e 92 depois. Não foi salvo o projeto. Relatório local smoke.json; não publicado por conter caminhos locais.

Pendente: abertura e download/importação através do painel CEP instalado, além de macOS. O teste do adaptador via linha de comando não equivale a validar o painel completo.

## Cartão de mídia e nova instalação

Desktop 1.4.3 e Editores 1.1.4 instalados por NSIS, ambos com saída 0; painel Adobe 1.4.3 copiado com backup. Motor do ASAR instalado baixou novamente jNQXAC9IVRw em H.264/AAC, conferido e decodificado. Teste do renderizador verificou seis campos com valores reais e seis ícones, preservando a ficha completa. Site publicado conferido em 390 px, sem transbordamento horizontal. Android 1.3.6 está em validação no emulador na execução 39056700647.

## Entrega 1.4.4 / Editores 1.1.5

Instalação Windows concluída com saída 0 nos dois instaladores. Motor instalado 1.4.4 baixou jNQXAC9IVRw em H.264/AAC; FFprobe e decodificação completa passaram. Clipboard via IPC possui testes de confiança, Unicode e repetição de bloqueio temporário; leitura nativa do Windows passou. Clique real no botão dentro do editor permanece no canal Beta. Android 1.3.6: execução 39056700647 concluída com sucesso, incluindo emulador.

Auditoria: dependências de produção do app sem vulnerabilidades conhecidas; ferramenta de empacotamento atualizada para 26.15.3. Restam oito avisos moderados na cadeia de desenvolvimento. A disponibilização integral do código correspondente de todos os componentes FFmpeg continua pendente conforme THIRD-PARTY-NOTICES.md.

# Integrações para editores

O motor de downloads é compartilhado. Cada editor usa um mecanismo diferente; painel interno, importação por XML e arrastar arquivos não são a mesma coisa. Os nomes e ícones identificam os programas de destino, sem associação comercial com seus fabricantes.

| Editor | Entrega | Validação |
|---|---|---|
| Premiere Pro | Painel CEP Adobe 1.4.0 | Regressões de código aprovadas; teste nativo de importação pendente |
| After Effects 2026 | Mesmo painel CEP, adaptador AE separado | Importação e camada testadas no AE 26.3x87; usuário confirmou funcionamento do painel |
| DaVinci Resolve Studio | Workflow Integration 1.1.0 | APIs conferidas no SDK instalado; contratos testados; execução nativa pendente |
| Avid Media Composer | Companion externo: baixar mídia e abrir pasta para Source Browser | Fluxo de arquivo disponível; importação no Avid não testada; não é plugin AVX |
| Final Cut Pro | Companion externo com exportação FCPXML 1.9 | Geração de XML testada; importação no Final Cut/Mac pendente; não é extensão interna |
| CapCut | Companion externo com download, pasta e arrastar mídia | Operação do companion verificável no Windows; importação dentro do CapCut pendente; não é painel interno |

## Painel Adobe: Premiere e After Effects

Extraia o ZIP Adobe e execute o instalador correspondente ao sistema. A instalação padrão é no usuário atual e mantém backup da extensão anterior. Depois reinicie o editor quando puder e abra **Janela > Extensões > Media Downloader**. O submenu também pode se chamar Extensões (Legado).

O painel oferece os quinze formatos e a qualidade padrão salva. No After Effects, **Importar no projeto** organiza o footage e **Inserir na composição** cria uma nova camada no tempo atual. No Premiere, os controles se referem ao bin e à sequência. Consulte [AFTER-EFFECTS.md](AFTER-EFFECTS.md).

## DaVinci Resolve Studio

1. Instale o Desktop Media Downloader para disponibilizar yt-dlp, FFmpeg e FFprobe.
2. Extraia `MediaDownloader-Resolve-1.1.0.zip` inteiro.
3. Execute `Instalar-Resolve.ps1` no Windows ou `Instalar-Resolve.command` no Mac.
4. Reinicie o Resolve e abra **Workspace > Workflow Integrations > Media Downloader**.
5. Baixe um link e clique em **Importar no Media Pool**. Um footage existente é reutilizado pelo caminho completo. A timeline permanece intacta.

O instalador copia o módulo `WorkflowIntegration.node` da instalação local do Resolve, evitando distribuir um binário de outra versão/sistema. O diretório de plugins é o diretório compartilhado oficial do fabricante; permissão de gravação depende da máquina. Não prometemos instalação sem administrador para esse diretório. Mac e carregamento nativo do plugin ainda precisam de validação.

O painel interno tem como alvo **Resolve Studio**, conforme o README do SDK. Para outras edições, use o companion externo e importe os arquivos pelo Media Pool; isso não comprova um painel interno nessas edições.

## Companion para Avid, CapCut e Final Cut

No Windows, extraia o ZIP portátil Editores e abra **Media Downloader Editores.exe**. O runtime está incluído; os motores são localizados na instalação do Desktop ou em sua pasta de atualizações. Não é necessário instalar Node.js ou Python. O companion não usa serviços web locais ou portas de rede de controle.

No Avid, selecione a aba correspondente e baixe em MP4 H.264, ProRes ou WAV conforme o projeto. Abra **File > Input > Source Browser** e escolha a mídia na pasta indicada. Use **Link** e, quando necessário, **Consolidate/Transcode**. Não há plugin AVX ou automação de timeline Avid nesta entrega; a aplicação é externa e não foi validada dentro do Media Composer.

No CapCut, selecione a aba correspondente, baixe a mídia e use **Arrastar mídia** para a área de importação. **Abrir pasta** permite usar o seletor de importação do próprio editor. O companion não escreve em drafts internos nem altera timelines do CapCut.

No Final Cut, o companion exporta um FCPXML com referência ao arquivo real. No Mac, importe por **Arquivo > Importar > XML**. Preserve o caminho do arquivo; se transferir um XML do Windows para o Mac, será necessário relincar a mídia. Prefira gerar o XML no Mac. Não há extensão interna Final Cut compilada ou assinada nesta entrega; isso exige o SDK Workflow Extension e o pipeline Apple.

## Testes e limites

Os testes de código cobrem contratos da API Resolve, reutilização por caminho, importação recusada, XML escapado e duração racional. Isso não substitui a execução no editor. O status de cada produto deve permanecer explícito no site, nos pacotes e nas releases. Android e iOS são aplicativos separados, não plugins de edição.

## Fontes

- Resolve: README local em `Support/Developer/Workflow Integrations` e `Support/Developer/Scripting` da instalação.
- Apple FCPXML: https://developer.apple.com/documentation/professional-video-applications/fcpxml-reference
- Extensões Final Cut: https://developer.apple.com/documentation/professional-video-applications/building-a-workflow-extension
- CapCut × Codex: https://www.capcut.com/tools/capcut-x-codex — integração oficial distinta do Media Downloader; não é SDK público confirmado para o nosso painel.

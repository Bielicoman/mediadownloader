# After Effects 2026 — prévia Adobe 1.4.0

Esta versão está em desenvolvimento. O Desktop Windows estável continua em 1.3.0; a prévia altera somente o painel Adobe. Não está publicada como atualização estável no site.

## Instalar

1. Instale o Media Downloader Desktop para disponibilizar os motores de download.
2. Extraia completamente `MediaDownloader-Adobe-1.4.0-preview.zip`.
3. No Windows, execute `Instalar-no-Windows.cmd`. No macOS, execute `Instalar-no-Mac.command`. Os arquivos vão para o usuário atual, sem administrador. A versão anterior é preservada em backup fora das pastas de extensões Adobe.
4. Reinicie o editor quando puder e procure **Janela > Extensões (Legado) > Media Downloader**. O nome do submenu pode variar com o idioma/versão.

## Usar

Cole o link e escolha o formato. **Importar no projeto** coloca o resultado na pasta configurada do painel Projeto. **Inserir na composição** cria uma nova camada na composição ativa, no tempo atual, e limita a saída ao fim da composição. As camadas anteriores permanecem intactas. Deixe essa opção desmarcada para baixar sem inserir.

Salve o projeto para baixar ao lado dele; um projeto sem salvar usa a pasta padrão de downloads. Um arquivo já importado é reutilizado pelo caminho completo. Para áudio no After Effects, prefira WAV; os formatos originais de uma fonte podem não ser aceitos pelo editor.

Sem composição ativa, a inserção retorna erro e mantém o arquivo baixado. Erro ou timeout não deve ser interpretado como importação concluída. Após timeout, confira o editor antes de repetir: a operação pode terminar depois.

## Estado verificado

- Código e testes automatizados de contrato do host: aprovados.
- Pacote e instalação por usuário no Windows: aprovados, com backup da versão anterior e hash do adaptador instalado igual ao fonte.
- Importação e camada no After Effects 26.3x87 (Windows): **aprovadas** em execução nativa do adaptador. WAV importado duas vezes gerou um único footage; camada criada no segundo 2 e limitada ao segundo 10; camada anterior bloqueada preservada. Arquivo inexistente retornou erro. Os itens criados no teste foram removidos; contagem do projeto antes/depois: 92. Projeto não foi salvo.
- Abertura e operação ponta a ponta pelo painel CEP: **pendentes**, dependem de o editor carregar a extensão instalada. A prova nativa do adaptador não substitui essa verificação.
- macOS: **não testado**.

Base das APIs e limites: [api-truth/after-effects.md](../api-truth/after-effects.md). A presença de AEFT no manifesto não é evidência de teste nativo.

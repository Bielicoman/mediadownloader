# After Effects — base da integração Adobe 1.4.0 (prévia)

Consulta: 15/10/2026. Alvo: After Effects 2026 (26.x), CEP/ExtendScript ES3.

- Adobe CEP: https://github.com/Adobe-CEP/CEP-Resources — manifesto AEFT, ScriptPath e CSInterface.
- `com.alexascencio.mediadownloader/lib/CSInterface.js`: HostEnvironment diferencia `appName` (nome humano) de `appId` (AEFT/PPRO); o bridge usa appId.
- Adobe scripts: https://helpx.adobe.com/after-effects/desktop/automate-in-after-effects/automate-animation/scripts.html — execução de ExtendScript e painéis.
- Sample oficial instalado: `C:/Program Files/Adobe/Adobe After Effects 2026/Support Files/Scripts/Smart Import.jsx`: `new ImportOptions(file)` e `app.project.importFile(options)`.

## Decisões e prova disponível

Adaptador AE separado do Premiere. Importação usa ImportOptions/FOOTAGE, FootageItem e FolderItem; camada usa CompItem.layers.add, startTime, inPoint e outPoint. Reutiliza footage pelo caminho completo; não move footage existente nem altera camadas anteriores. Uma composição deve estar ativa para inserir. Sem composição, a inserção falha e o download permanece no disco.

Tipos específicos CompItem/ImportOptions selecionam o script AE; não depender de `app.name`, que não foi validado como API do AE.

**Testado em Node com host simulado:** identificação appId, respostas de erro, caminhos com caracteres especiais, importação sem duplicação, composição ausente, camada nova no tempo atual, limite da duração e limpeza de camada após erro.

**Medido no host real:** After Effects 26.3x87 no Windows executou o adaptador via `AfterFX.exe -r` com script temporário em caminho sem espaços. Importação de WAV confirmada, duas chamadas reutilizam um footage; inserção cria nova camada em t=2, outPoint=10 (fim da composição), preserva camada anterior bloqueada. Falha de arquivo inexistente tratada. Limpeza dos itens de teste confirmada (92 itens antes e depois), sem salvar projeto. Instalação do painel por usuário e hash do adaptador conferidos.

**Não testado:** abertura e operação ponta a ponta no painel CEP; macOS. O bridge MCP não respondeu; a execução nativa foi feita por linha de comando com relatório em disco.

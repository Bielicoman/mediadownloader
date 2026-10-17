# Integrações para editores

| Editor | Entrega | Canal |
|---|---|---|
| Premiere Pro | Painel CEP Adobe 1.4.2 | Beta |
| After Effects | Mesmo painel, adaptador de projeto/composição | Beta |
| DaVinci Resolve | Atalhos Scripts + Editores 1.1.3; Workflow Integration Studio opcional | Beta |
| CapCut | Aplicativo externo, arquivo/pasta/arrastar | Beta |
| Avid Media Composer | Aplicativo externo, arquivo para Source Browser | Beta |
| Final Cut Pro | Aplicativo externo, FCPXML | Beta |

Beta identifica a fase de avaliação de cada integração. Nomes e logotipos identificam os destinos sem parceria ou certificação. [Registro técnico](VALIDACAO.md).

## Adobe

Instale o Desktop e extraia o ZIP Adobe inteiro. Execute o instalador por usuário, reabra o editor e use **Janela → Extensões → Media Downloader**. Premiere importa no bin ou insere em faixas vazias; After Effects importa no projeto ou cria camada na composição ativa. Os controles não sobrescrevem faixas ocupadas.

## DaVinci Resolve

O instalador Windows Editores instala os atalhos Lua em Scripts do usuário. Em português: **Área de Trabalho → Scripts → Media Downloader → Abrir Media Downloader**. Baixe ou escolha um arquivo, volte ao Resolve com projeto aberto e execute **Importar ultimo download**. A importação usa o caminho real e não altera a timeline. Alternativa: arraste a mídia para o Pool de Mídia.

A Workflow Integration interna é Beta e requer Resolve Studio e SDK local compatível. O instalador usa o módulo do próprio Resolve. Um SDK ausente não impede usar os atalhos e o companion. Pastas compartilhadas podem exigir permissão; não há promessa de acesso sem administrador a diretórios protegidos.

## CapCut, Avid e Final Cut

No CapCut, use o seletor Importar, a pasta ou Arrastar mídia. A ferramenta não modifica drafts internos. No Avid, use File → Input → Source Browser e Link/Import conforme o formato; não é plugin AVX. No Final Cut do Mac, gere FCPXML e use Arquivo → Importar → XML. Preserve os arquivos nos caminhos referenciados e relinque se transferir de máquina.

Configurações/Idioma controla a interface. Tradução de nomes de menus do editor depende do próprio editor.

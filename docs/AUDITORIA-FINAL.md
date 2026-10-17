# Auditoria final — 17/10/2026

Desktop/Adobe 1.4.6, Editores 1.1.7 Beta e Android 1.3.7 Beta.

| Antes | Depois | Motivo |
| --- | --- | --- |
| Respostas antigas podiam restaurar prévia após trocar ou apagar o link | Geração da consulta e limpeza do cartão completo | Evitar título/capa da mídia anterior |
| Selecionar todos incluía itens indisponíveis | Somente itens disponíveis entram na seleção e fila | Evitar tentativas inválidas |
| Cancelar seletor no companion anunciava arquivo pronto | Cancelamento preserva o estado | Não indicar sucesso inexistente |
| Consulta de metadados podia competir com download/seleção | Consultas invalidadas e campo/Colar bloqueados durante download | Manter dados associados ao arquivo correto |
| Versão Editores fixa em dois pontos | Versão do pacote em execução | Evitar informação desatualizada |
| Controles pequenos e menu Plugins oculto no celular | Controles principais de 44 px, menu móvel acessível | Melhor toque e navegação |

## Verificação

- Suíte completa e quatro novas regressões passaram; 59 arquivos de código sintaticamente válidos.
- Produção Electron: zero vulnerabilidades conhecidas no npm audit. Ferramentas de desenvolvimento: oito avisos moderados, zero alto/crítico; não equivale a garantia de ausência de falhas.
- Site observado a 1280×800, 768×1024 e 375×812. Em 375 px, largura do documento 372 px, sem transbordamento horizontal; controles principais de toque medidos com pelo menos 44 px. Demonstração é explicitamente simulada.
- Android 1.3.7: compilação, unidade e conversões reais no emulador aprovadas na execução 39060293943. Ícone sem borda e pacotes com hashes conferidos.
- Download real do motor instalado e conferência dos pacotes são registrados em VALIDACAO.md.

## Limites e pendências

- Os testes de renderizador usam DOM de teste; não comprovam clique nativo, importação e playback em cada versão de Premiere, Resolve, CapCut, Avid e Final Cut.
- Resolve abriu o companion na máquina do usuário. Importações nos editores restantes e instalação física em Mac/Linux/iPad/iPhone não foram confirmadas nesta auditoria; integrações correspondentes permanecem Beta.
- Traduções incrementais: seis idiomas disponíveis, com retorno ao português em textos ainda não traduzidos. Não é localização integral.
- Cadeia de ferramentas com oito avisos moderados requer acompanhamento. Os motores e plataformas podem mudar após esta verificação.
- Continua pendente a verificação/disponibilização integral do código correspondente dos componentes FFmpeg conforme THIRD-PARTY-NOTICES.md. Beta não elimina obrigações de licença.

## Parecer

Correções encontradas aplicadas e regressões automatizadas aprovadas. O escopo verificado está documentado; não há base para certificar 100% de todas as plataformas, integrações e situações reais.

## Conferência da entrega

Desktop 1.4.6 e Editores 1.1.7 instalados no Windows com saída 0; painel Adobe atualizado com backup. Download real de jNQXAC9IVRw em H.264/AAC confirmado e completamente decodificado no motor extraído do ASAR instalado. Houve bloqueio de robô e falha de rede antes da repetição bem-sucedida; isso demonstra uma dependência externa, não funcionamento garantido de toda plataforma a qualquer momento.

Foi corrigida uma divergência no lock de desenvolvimento: end-of-stream permanece em 1.4.5 com URL e integridade originais, separado da versão 1.4.6 do aplicativo. O npm ci da validação no GitHub voltou a passar.

Site: botão de estrela aponta para o repositório oficial; Pix apenas copia a chave pública autorizada e não inicia pagamento. Sucesso da cópia confirmado no navegador publicado; alternativa de seleção manual coberta por teste quando o acesso ao clipboard falha. Não há contagem fictícia de estrelas, doações ou valores.

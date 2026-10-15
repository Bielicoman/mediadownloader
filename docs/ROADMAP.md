# Roadmap de integrações

Este documento registra a direção do projeto, não compatibilidade já entregue. O desenvolvimento seguirá **uma etapa por vez**, validando instalação, abertura, operação e resultado no aplicativo de destino antes de anunciar suporte.

## 1. Fechar Windows, site, GitHub e Premiere

Prioridade atual: consolidar a entrega Windows/CEP v1.3.0, a instalação, os quinze formatos, a qualidade padrão e a documentação. Publicar os artefatos corretos no GitHub e conferir os links do site depois do upload.

A validação Windows inclui downloads reais e decodificação dos perfis registrados em [VALIDACAO.md](VALIDACAO.md). Testes de interface não substituem testes no Premiere: a integração de download/importação deve ser registrada com a versão real do host. O plugin atual é CEP para Premiere Pro; as três abas de download pertencem ao Desktop.

A fonte correspondente completa do FFmpeg Gyan, incluindo scripts e dependências exigidos pela licença, continua pendente de verificação. Avisos e licença MIT do código próprio não encerram essa obrigação.

## 2. After Effects

Planejar um adaptador de host separado para o After Effects, aproveitando o motor de download e a interface onde for apropriado. A primeira investigação será a integração CEP e as APIs efetivamente disponíveis na versão-alvo do host.

Antes de anunciar suporte: validar manifesto/instalação, abertura do painel, destino dos arquivos, importação no projeto e tratamento de erros no After Effects real. O manifesto e os scripts atuais do Premiere não constituem suporte automático ao After Effects.

**Situação:** adaptador implementado na prévia Adobe 1.4.0. Importação e inserção testadas nativamente no After Effects 26.3x87/Windows; painel instalado por usuário. Abertura e fluxo completo do painel ainda pendentes; macOS não testado. Detalhes em [AFTER-EFFECTS.md](AFTER-EFFECTS.md).

## 3. DaVinci Resolve

Investigar integração pela API e pelos scripts suportados pelo Resolve, conferindo a disponibilidade por versão, edição e sistema operacional. Definir o fluxo adequado de download, organização e importação de mídia sem presumir que um painel CEP funcione nesse host.

**Situação:** investigação planejada; não há integração validada nesta entrega.

## 4. Final Cut Pro

Avaliar os mecanismos de integração permitidos pela plataforma Apple e pelas versões-alvo do Final Cut Pro. Definir uma prova de conceito antes de escolher formato de extensão, comunicação entre aplicativos ou importação de arquivos.

**Situação:** viabilidade e distribuição a validar em Mac real. Não há plugin Final Cut Pro disponível nesta entrega.

## 5. CapCut

Verificar primeiro se existe uma API, SDK ou mecanismo oficial de extensão que atenda ao fluxo desejado, e suas condições de uso/distribuição. A instalação do aplicativo Desktop de download não comprova integração com o CapCut.

**Situação:** avaliação de viabilidade pendente. Não prometer painel ou plugin antes dessa verificação.

## 6. Android

Já existe uma base Android e pacotes publicados v1.0.0. Eles não receberam automaticamente a nova interface e os formatos do Desktop v1.3.0.

Uma próxima etapa poderá atualizar o aplicativo, gerar APKs assinados e validar instalação, primeiro preparo dos motores, download, compartilhamento de links, armazenamento e atualização sobre a versão anterior em aparelhos reais.

**Situação:** base existente e APK v1.0.0 publicado; nova entrega Android não testada.

## 7. iOS

Investigar uma implementação compatível com as restrições do iOS. Isso inclui a execução permitida dos motores, sandbox, armazenamento, compartilhamento de links, tarefas em segundo plano e as regras da distribuição pretendida.

Será necessário validar um pipeline Apple, assinatura, identificadores/perfis e forma de distribuição. Custos e permissões de conta não estão confirmados por este roadmap. Não há promessa de aprovação em loja nem data de lançamento.

**Situação:** planejamento; aplicativo iOS e pipeline de assinatura/distribuição ainda não entregues.

## Critério para mudar o status

Uma integração só passa a ser indicada como funcionando depois de instalar e abrir no sistema de destino, executar a operação proposta, conferir o arquivo/importação resultante, tratar uma falha relevante e passar pelo reteste. Registre separadamente revisão de código, testes simulados, build de pacote e teste nativo.

O Desktop pode produzir arquivos utilizáveis em vários editores, mas isso não equivale a ter plugin ou integração com cada editor. Esta distinção deve permanecer no site, nas releases e no suporte.

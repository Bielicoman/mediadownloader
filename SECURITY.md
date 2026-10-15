# Segurança

## Reportar em privado

Envie vulnerabilidades para **ascencioalexgabriel@gmail.com**, com assunto `Media Downloader — segurança`.

Inclua versão, sistema operacional, componente afetado, passos de reprodução e impacto observado. Compartilhe uma prova mínima que não exponha dados reais. Não envie senhas, tokens, cookies, sessões de conta ou arquivos pessoais.

Evite publicar detalhes exploráveis em issues antes de uma análise e correção. Não há prazo de resposta garantido nem programa remunerado de recompensas.

## Escopo e versões

A linha em desenvolvimento é a v1.3.0 de Windows/CEP. Os instaladores Mac, Linux e Android atualmente vinculados são da v1.0.0 e não receberam validação nativa da nova entrega. Não há garantia de correções retroativas para todos os pacotes anteriores.

O programa usa yt-dlp, FFmpeg/FFprobe, Electron e integração CEP. Problemas de uma dependência podem exigir atualização upstream; informe o componente e a versão detectados no diagnóstico.

## Dados sensíveis

`cookies.txt` pode conceder acesso à sua conta. O aplicativo permite selecionar um arquivo local para autenticar requisições à fonte da mídia. Não coloque cookies no repositório nem em relatórios públicos. Revogue sessões comprometidas no serviço correspondente.

Use downloads de origem conhecida e mantenha suas mídias e projetos protegidos. A política de privacidade publicada no site descreve o tratamento de dados e os serviços externos envolvidos; este arquivo trata do canal para vulnerabilidades.

## Proteções e limites da versão 1.3.0

- Electron 44.7.2, verificado contra a release oficial; checksum do runtime validado no build local desta entrega.
- Navegação remota, popups, webviews e permissões de captura/geolocalização bloqueadas.
- Atualizadores exigem HTTPS e validação do certificado; certificados confiáveis do Windows são usados em memória quando necessário.
- Downloads temporários de motores são executados para validar versão antes da substituição, com rollback.
- ZIPs de atualização recusam caminhos de travessia e links simbólicos antes da extração.
- Abertura de arquivos usa argumentos de processo, sem montar comandos de shell com títulos ou caminhos de mídia.
- Miniaturas e histórico não incorporam HTML de fontes externas.
- Site estático com CSP, fontes locais e sem rastreador incluído no código.

O renderer Desktop ainda depende de `nodeIntegration` habilitado e `contextIsolation` desabilitado. A migração completa para uma ponte preload isolada é uma melhoria de arquitetura pendente; os bloqueios de navegação não equivalem a essa migração. Os pacotes Windows não possuem assinatura Authenticode e as atualizações não usam uma assinatura criptográfica própria do projeto. As licenças e a verificação pendente da fonte correspondente FFmpeg são descritas nos avisos de terceiros.

A auditoria npm de dependências de produção retornou zero vulnerabilidades na execução registrada. Esse comando não cobre os executáveis embutidos, dependências de desenvolvimento ou todos os tipos de falha. Nenhuma garantia de ausência absoluta de vulnerabilidades é dada.

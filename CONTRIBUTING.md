# Contribuindo

O Media Downloader é gratuito e recebe contribuições. O código próprio é MIT; componentes embarcados mantêm suas licenças.

Antes de alterar o projeto, leia [Desenvolvimento](docs/DESENVOLVIMENTO.md) e [Validação](docs/VALIDACAO.md). Procure uma issue existente para evitar trabalho duplicado.

## Bugs

Informe versão, sistema, modo usado, formato escolhido, passos para reproduzir e erro observado. Use um link público autorizado quando necessário. Remova nomes pessoais, caminhos privados e dados de sessão dos logs. Nunca anexe `cookies.txt`, tokens, senhas ou arquivos de clientes.

Falhas de segurança devem ser enviadas pelo canal privado indicado em [SECURITY.md](SECURITY.md).

## Mudanças de código

1. Crie uma branch e faça uma alteração de escopo claro.
2. Preserve originais, preferências salvas e integrações existentes.
3. Execute `npm test` e os testes adicionais apropriados ao comportamento alterado.
4. Para UI, confira a janela mínima e os estados vazio, carregando, erro e concluído. Para download, confirme o arquivo final com inspeção e decodificação quando aplicável.
5. Abra um pull request com problema, mudança, testes executados e limitações reais. Identifique plataformas não executadas.

Mantenha o motor Desktop e CEP compatível. Não introduza credenciais, binários sem procedência, dependências sem licença ou sucesso/progresso fictício. Novos downloads de dependências precisam de origem, versão, integridade e avisos de licença apropriados.

Documentação deve ser direta, em português brasileiro, sem promessas de funcionamento não verificadas. Capturas e exemplos devem usar conteúdo público ou autorizado.

# Atualizações e publicação

## Para quem usa

| Componente | Comportamento |
|---|---|
| Desktop Windows 1.4.3+ | Consulta o site oficial; baixa atualização com SHA-512 quando não há download de mídia ativo; instala ao fechar o app. |
| Editores Windows 1.1.4+ — Beta | Mesmo mecanismo; o instalador também atualiza os atalhos Lua do Resolve. |
| Painel Adobe 1.4.3+ — Beta | Consulta o manifesto oficial, verifica SHA-256 do ZIP, guarda backup e troca os arquivos; reabra o painel para carregar a versão nova. |
| Android 1.3.5+ — Beta | Consulta releases Android, verifica hash e assinatura do APK; a instalação precisa de confirmação do sistema. |
| macOS, Linux e ZIP portátil — Beta | Atualização manual pelo site nesta entrega. |

Pacotes antigos sem atualizador exigem uma instalação inicial da versão nova. Uma mudança de código só chega aos usuários depois de construir, conferir e publicar seus pacotes e manifestos. As preferências e os downloads são preservados pelas rotas normais de atualização.

## Para publicar

1. Atualize a versão do componente e mantenha `app/package.json`, manifesto CEP e versão principal em `version.json` coerentes para a release Desktop.
2. Execute `npm ci`, `npm ci --prefix app --omit=dev --ignore-scripts`, `npm test` e `npm run check`. Execute também `node --test tests/cep-update-install.test.cjs` no Windows.
3. Construa os instaladores e ZIPs, confirme os motores executáveis fora do ASAR e valide um download real. Não sobrescreva binários de uma release pública.
4. Execute `node scripts/prepare-update-feeds.cjs`. O script verifica SHA-512 dos instaladores e gera o manifesto Adobe com SHA-256.
5. Publique os arquivos correspondentes no GitHub. Gere `SHA256SUMS.txt` e preserve as licenças e a proveniência dos componentes.
6. Atualize os links de `version.json` e do site apenas com artefatos existentes. Execute `npm run build:site` e publique `dist/site` na Vercel, incluindo `updates/`.
7. Confirme HTTP 200 dos três manifestos, hashes e URLs públicas. Registre evidências em `docs/VALIDACAO.md` e marque como Beta os destinos em avaliação.

Os manifests são servidos com `Cache-Control: no-store`. Segredos, keystores, cookies e arquivos de sessão ficam fora do Git e dos pacotes.

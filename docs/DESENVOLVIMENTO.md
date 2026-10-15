# Desenvolvimento

## Estrutura

| Caminho | Responsabilidade |
|---|---|
| `app/src/` | Interface e processo principal do Desktop Electron |
| `app/src/js/downloader.js` | Motor de download/conversão do Desktop |
| `com.alexascencio.mediadownloader/` | Painel CEP e integração com o Premiere |
| `index.html`, `site.css`, `site.js` | Site público |
| `installers/` | Configurações e scripts de instalação |
| `docs/` | Instalação, desenvolvimento e validação |
| `.github/workflows/build-desktop.yml` | Build de distribuições por plataforma |

Desktop e CEP têm cópias do motor; mantenha comportamento compatível entre elas. O Desktop possui três abas; o painel CEP atual é de vídeo único.

## Preparar

Use Node.js com npm. Python 3 é necessário para empacotar o plugin. Confira os scripts no `package.json` da raiz antes de executá-los.

```sh
npm test
npm run serve
npm run build:site
npm run package:plugin
npm run sync:engine
```

- `npm test`: verificações automatizadas mantidas pelo projeto.
- `npm run serve`: servidor local para revisar o site; use a URL indicada no terminal.
- `npm run build:site`: prepara os arquivos públicos para publicação.
- `npm run package:plugin`: gera o ZIP de instalação CEP usando Python 3.
- `npm run sync:engine`: sincroniza o código compartilhado do motor entre Desktop e plugin; revise o diff antes de empacotar.

Não conclua que a integração com o Premiere funciona por abrir o HTML no navegador. Recursos CEP dependem de Node e do host Adobe. Da mesma forma, build bem-sucedido não substitui instalação e download reais.

## Executar o Desktop

O ponto de entrada Electron é `app/src/main.js`, definido em `app/package.json`. O workflow fixa a versão do runtime; use a mesma versão para reproduzir o pacote. Instale Electron no ambiente de desenvolvimento e execute-o apontando para a pasta `app`.

Os motores embarcados ficam em `app/bin`; dependências executáveis não devem ser substituídas por arquivos de outra plataforma. Atualizações em uso vão para a pasta `MediaDownloaderPro/bin` nos dados do usuário. No macOS, nunca atualize motores gravando dentro do `.app` assinado.

No plugin, a descoberta considera a pasta do usuário, os motores embarcados na extensão, instalações Desktop conhecidas e caminhos Homebrew no macOS. Instalações Desktop em diretórios personalizados podem precisar de seleção manual ou instalação dos motores pelo painel.

## Alterações de interface e formatos

Os quinze valores atuais são:

```text
best 4320p 2160p 1440p 1080p 720p 480p 360p prores
audio_wav audio_flac audio_mp3 audio_m4a audio_original thumbnail
```

Preserve a independência dos três seletores Desktop. A chave `mediadownloader_default_preset` é salva explicitamente nas Configurações; na inicialização, valores inválidos retornam para `best`. Mudanças em uma aba durante a sessão não alteram essa preferência.

Respeite o limite da resolução original. Não adicione upscale implícito, melhora de áudio prometida ou progresso fictício. Preserve IDs e handlers necessários aos controles após alterações visuais.

## Build e publicação

O workflow usa runners por plataforma. Assinatura ad-hoc macOS não equivale a notarização nem validação em equipamento real. O instalador Windows usa a configuração em `installers/windows/`.

Antes de publicar, confira:

1. Versões em manifests, package, `version.json`, documentação e nome da release.
2. Presença dos motores e licenças no instalador.
3. ZIP CEP com pasta da extensão e scripts lado a lado; `.command` com LF e permissão executável no ZIP.
4. Scripts de backup fora de `CEP/extensions`.
5. Links do site correspondentes a arquivos realmente publicados.
6. Instalação, abertura, download e decodificação no sistema de destino, registrando o que ficou sem teste.

A v1.3.0 atualiza Windows e CEP. O site mantém links explícitos para instaladores Mac/Linux/Android v1.0.0 enquanto novos artefatos não forem produzidos e verificados.

## Distribuição de terceiros

Preserve a MIT do código próprio e os avisos específicos de cada componente. O FFmpeg Gyan 6.1.1 é GPLv3+; o executável Windows do yt-dlp também inclui componentes GPLv3+. Incluir somente uma URL genérica de upstream não comprova disponibilidade de todo código-fonte correspondente. Consulte `THIRD-PARTY-NOTICES.md` e não anuncie conformidade integral enquanto a pendência de fontes/scripts do FFmpeg não estiver resolvida.

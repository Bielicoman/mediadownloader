# Instalação

Baixe pelo [site oficial](https://mediadownloader-blush.vercel.app/#baixar). As versões por componente estão no [README](../README.md). Consulte os [avisos de instalação](AVISOS-DE-INSTALACAO.md).

## Windows

Abra o EXE 1.4.3, mantenha **Somente para mim** e conclua. Abra pelo Menu Iniciar. Motores acompanham o Desktop; não precisa de Python ou Node.js. Escolha pasta, link e formato. Os três modos têm Colar; coleções permitem Lista, Grade e Tamanho. O botão Baixar fica antes dos itens.

## Painel Adobe — Beta

Instale primeiro o Desktop. Extraia o ZIP Adobe 1.4.3 completo e execute `Instalar-no-Windows.cmd` ou `Instalar-no-Mac.command`, mantendo a pasta da extensão ao lado dos scripts. O instalador configura o CEP independente no usuário e guarda backup fora da pasta ativa. Salve seu trabalho e reabra o editor quando puder.

Abra **Janela → Extensões → Media Downloader** ou **Extensões (Legado)**. Os três modos estão no painel. Para alterar o idioma, abra Configurações.

## Editores — Beta

No Windows, instale o Desktop e depois o instalador Editores 1.1.4. No Resolve, reabra o editor e use **Área de Trabalho → Scripts → Media Downloader → Abrir Media Downloader**. Após baixar, com um projeto aberto, execute **Importar ultimo download** no mesmo submenu. CapCut usa arquivo/arrastar; Avid usa Source Browser. [Detalhes](INTEGRACOES.md).

No Mac, o ZIP Editores 1.1.4 usa `companion/Abrir-no-Mac.command`; a primeira abertura baixa e verifica o runtime. Final Cut recebe FCPXML com referência à mídia local.

## macOS e Linux — Beta

Os pacotes Desktop disponíveis são 1.0.0. No Mac, escolha Intel ou Apple Silicon conforme Sobre Este Mac; abra o DMG e arraste para Aplicativos. No Linux, marque o AppImage como executável e abra; sem FUSE, use `--appimage-extract-and-run`.

## Android — Beta

Use APK ARM64 ou universal da versão publicada no site. Abra em Downloads e autorize somente a fonte necessária para instalar; mantenha o Play Protect ativo. Atualizações do APK exigem confirmação do sistema. O Android não precisa do Desktop.

## Preferências e suporte

Configurações guarda idioma, qualidade padrão e destino. Limpar o histórico não apaga as mídias. A desinstalação pode preservar preferências. Confira espaço, permissões e diagnóstico dos motores; envie versão e mensagem nas issues. Nunca compartilhe cookies.txt.

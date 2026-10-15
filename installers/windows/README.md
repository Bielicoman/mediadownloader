# Instalador Windows

Execute `Build-Installer.ps1` com um runtime Electron completo em `-SourceApp`.
O script cria um staging novo, copia a fonte atual de `app/src`, inclui yt-dlp,
FFmpeg e FFprobe e remove aria2c e os BATs legados apenas da cópia.

O EXE assistido oferece instalação para o usuário atual ou todos os usuários
(com elevação do Windows), seleção da pasta e atalhos no Menu Iniciar/Desktop.
Os motores ficam em `resources/app/bin` dentro da pasta escolhida; não há
instalação global de Python, Node ou alteração de PATH. Atualizações dos motores
usam a pasta de dados do usuário conforme a implementação do aplicativo.

Artefato: `MediaDownloader-Windows-x64-Setup.exe` (Windows x64).
O binário atualmente não possui assinatura Authenticode.

Para teste silencioso, use caminhos Windows com barras invertidas e coloque
`/D=C:\pasta\de\teste` como último argumento. Nunca aponte testes para uma
instalação existente. Os registros e atalhos do instalador são persistentes.

Verificação desta alteração: build NSIS concluído; variante sem atalhos instalada
em pasta isolada com retorno 0; EXE e três motores presentes, aria2c ausente;
motores executados; processo do app com fonte final permaneceu vivo por 4s usando
user-data-dir de teste. A interface assistida, elevação/todos os usuários e os
atalhos da variante final precisam de validação manual em Windows limpo.

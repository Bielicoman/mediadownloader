# Avisos de instalação

Baixe pelo [site oficial](https://mediadownloader-blush.vercel.app) ou pelas [releases do projeto](https://github.com/Bielicoman/mediadownloader/releases). O projeto é independente. Os pacotes Windows não possuem certificado comercial de editor; os pacotes Mac não são notarizados pela Apple. O APK Android usa a chave de assinatura do projeto e é distribuído fora da Google Play.

## Windows

Se a mensagem for **O Windows protegeu o computador** ou **editor desconhecido**, confira a origem e a versão do arquivo. No aviso do SmartScreen, **Mais informações → Executar assim mesmo** pode estar disponível. Essa escolha é individual para o arquivo e deve ser feita apenas se você confiar na origem. Se a opção não aparecer, políticas do dispositivo podem impedir a instalação; consulte o administrador.

Um aviso de reputação não é um laudo de malware nem uma garantia de segurança. Se o Defender identificar uma ameaça pelo nome ou colocar o arquivo em quarentena, interrompa a instalação e envie a versão e o nome da detecção ao suporte. Não desative o antivírus nem crie exclusões gerais.

## macOS — Beta

Depois de conferir a origem, mova o app para Aplicativos e tente abrir uma vez. Para um bloqueio de desenvolvedor não identificado ou ausência de notarização, consulte **Ajustes do Sistema → Privacidade e Segurança → Abrir Assim Mesmo**, quando o sistema oferecer essa opção. Confirme apenas o aplicativo que você escolheu instalar. Não desative o Gatekeeper nem remova a quarentena em massa pelo Terminal.

Se o macOS informar que o arquivo contém malware, foi adulterado ou danificará o computador, não prossiga: baixe novamente pela origem oficial e reporte o aviso.

## Android — Beta

Baixe o APK ARM64 na maioria dos celulares atuais; use universal em caso de dúvida. Abra o APK em Downloads. Se necessário, permita **Instalar apps desconhecidos → Permitir desta fonte** apenas para o navegador ou gerenciador de arquivos usado nessa instalação. Os nomes variam por fabricante. Depois de instalar, você pode revogar essa permissão.

Mantenha o Google Play Protect ativado e aceite a análise quando solicitada. Uma detecção de app nocivo exige investigação; não desative a proteção para forçar a instalação. Atualizações do APK também pedem confirmação do Android. Se a assinatura não corresponder à versão antiga, não remova o aplicativo antes de conferir seus dados e o pacote com o suporte.

## Conferir o arquivo

O arquivo `SHA256SUMS.txt` da release registra os hashes dos pacotes. No Windows:

```powershell
Get-FileHash -Algorithm SHA256 -LiteralPath "$env:USERPROFILE\Downloads\MediaDownloader-Windows-x64-Setup.exe"
```

No Mac: `shasum -a 256 caminho-do-arquivo`. Compare com a linha do mesmo arquivo e versão. Um hash confirma integridade em relação ao manifesto; não substitui análise de segurança ou assinatura de editor.

## Fontes oficiais

- [Microsoft: proteção e reputação de aplicativos](https://support.microsoft.com/en-gb/windows/security/windows-security/app-browser-control-in-the-windows-security-app)
- [Apple: abrir apps com segurança](https://support.apple.com/pt-br/102445)
- [Google: instalar aplicativos no Android](https://support.google.com/pixelphone/answer/7391672?hl=pt-BR)
- [Google: tipos de aviso do Play Protect](https://developers.google.com/android/play-protect/warning-dev-guidance)

Suporte: ascencioalexgabriel@gmail.com. Envie a mensagem, versão e sistema; nunca envie cookies ou credenciais.

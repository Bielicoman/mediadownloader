# APIs e fontes dos demais editores

Consulta: 15/10/2026.

## DaVinci Resolve

Fonte primária instalada: `C:/ProgramData/Blackmagic Design/DaVinci Resolve/Support/Developer/Workflow Integrations/README.txt` (atualizado 03/10/2024) e `Scripting/README.txt`.

O SDK descreve Workflow Integrations no Resolve Studio para Windows/macOS, manifesto BlackmagicDesign/Plugin e FilePath para main. JavaScript usa Initialize(pluginId), GetResolve(), GetProjectManager(), GetCurrentProject(), GetMediaPool(), GetRootFolder(), Folder.GetClipList/GetSubFolderList, MediaPoolItem.GetClipProperty('File Path'), ImportMedia([paths]). Sucesso exige retorno e confirmação do footage por caminho. Não inserir na timeline implicitamente.

O módulo nativo é obtido da instalação do próprio host, não do repositório. Não se presume ABI igual entre versões. UI usa preload isolado, IPC restrito e Node desabilitado no renderer, conforme sample oficial SamplePlugin.

## Final Cut Pro

https://developer.apple.com/documentation/professional-video-applications/fcpxml-reference

https://developer.apple.com/documentation/professional-video-applications/creating-fcpxml-documents

Escolha implementada: intercâmbio FCPXML 1.9, com resources/format/asset/media-rep e asset-clip em event/library. Duração alinhada a quadros, URLs file escapadas. Sem afirmar importação nativa validada no Windows. Extensão interna não implementada: SDK Workflow Extension, Xcode, assinatura e teste Mac continuam necessários.

## CapCut

https://www.capcut.com/tools/capcut-x-codex

A página oficial confirma o plugin CapCut × Codex. Não confirma um SDK de painéis arbitrários dentro do CapCut Desktop. O fluxo Media Downloader implementado entrega mídia via arrastar/arquivo local, sem manipular formatos internos não documentados. Não chamar o companion de plugin interno do CapCut.

## Marcas

Android: SVG original https://developer.android.com/static/images/brand/android-head_3D.svg, conforme https://developer.android.com/distribute/marketing-tools/brand-guidelines, CC BY 3.0 com atribuição.

Premiere/After Effects/Resolve: ícones dos respectivos executáveis locais, usados para identificação nominativa. Final Cut/CapCut: artworkUrl512 da API pública Apple lookup, IDs 424389933/1500855883. Marcas continuam pertencendo aos fabricantes, sem endosso ou parceria declarada.

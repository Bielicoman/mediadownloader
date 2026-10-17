!macro customInstall
  SetShellVarContext current
  CreateDirectory "$APPDATA\Blackmagic Design\DaVinci Resolve\Support\Fusion\Scripts\Utility\Media Downloader"
  CopyFiles /SILENT "$INSTDIR\resources\resolve-scripts\*.lua" "$APPDATA\Blackmagic Design\DaVinci Resolve\Support\Fusion\Scripts\Utility\Media Downloader"
!macroend

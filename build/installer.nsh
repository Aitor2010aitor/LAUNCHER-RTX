!include "LogicLib.nsh"
!include "nsDialogs.nsh"

Page custom finishPage finishPageLeave

Function finishPage
  nsDialogs::Create 1018
  Pop $0

  ${If} $0 == error
    Abort
  ${EndIf}

  ${NSD_CreateLabel} 0 0 100% 20u "Instalacion completada!"
  Pop $0
  CreateFont $1 "Segoe UI" 12 700
  SendMessage $0 ${WM_SETFONT} $1 0

  ${NSD_CreateLabel} 0 25u 100% 20u "Ruta de instalacion:"
  Pop $0

  ${NSD_CreateText} 0 45u 80% 25u "$INSTDIR"
  Pop $2

  ${NSD_CreateButton} 82% 45u 18% 25u "Copiar"
  Pop $3
  GetFunctionAddress $0 onClickCopy
  nsDialogs::OnClick $3 $0

  ${NSD_CreateLabel} 0 80u 100% 40u "IMPORTANTE: Agrega esta carpeta a las exclusiones de Windows Defender para evitar que el antivirus bloquee los DLLs."
  Pop $0
  CreateFont $1 "Segoe UI" 9 400
  SendMessage $0 ${WM_SETFONT} $1 0

  nsDialogs::Show
FunctionEnd

Function onClickCopy
  ${NSD_GetText} $2 $4
  nsExec::ExecToStack 'powershell -command "Set-Clipboard -Value '''$4'''"'
  Pop $0
  MessageBox MB_OK "Ruta copiada al portapapeles!"
FunctionEnd

Function finishPageLeave
FunctionEnd

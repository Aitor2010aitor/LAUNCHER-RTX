@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
title RTX LAUNCHER - COMPILAR Y PUBLICAR

echo ================================================
echo   RTX GTA V LAUNCHER - COMPILAR Y PUBLICAR
echo ================================================
echo.

REM ============================================================
REM 1) VERSION INSTALADA EN ESTE PC
REM ============================================================
set "INSTALADA=no instalada"
powershell -NoProfile -Command "try{(Get-Content (Join-Path $env:LOCALAPPDATA 'Programs\RTX GTA LAUNCHER\resources\app\package.json') -Raw | ConvertFrom-Json).version}catch{'no instalada'}" > ".tmp_installed" 2>nul
if exist ".tmp_installed" set /p INSTALADA=<".tmp_installed"
if "%INSTALADA%"=="" set "INSTALADA=no instalada"
echo [1] Version instalada en el PC: %INSTALADA%

REM ============================================================
REM 2) TOKEN GITHUB (archivo .gh_token)
REM ============================================================
set "GH_TOKEN="
if exist ".gh_token" set /p GH_TOKEN=<".gh_token"
if not defined GH_TOKEN (
  echo [2] ERROR: falta el archivo .gh_token con el token de GitHub
  goto :fin
)
echo [2] Token GitHub: OK

REM ============================================================
REM 3) VERSIONES: mira el repositorio y calcula la siguiente
REM ============================================================
if "%~1"=="/probar" set "DRY=1"
node -e "const h=require('https'),f=require('fs');const tok=f.existsSync('.gh_token')?f.readFileSync('.gh_token','utf8').trim():'';const opt={host:'api.github.com',path:'/repos/Aitor2010aitor/LAUNCHER-RTX/releases?per_page=5',headers:{'User-Agent':'bat','Authorization':'token '+tok}};h.get(opt,r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>finish(d))}).on('error',()=>finish(''));function finish(d){let tags=[];try{tags=JSON.parse(d).map(x=>x.tag_name)}catch(e){}const rem=tags.length?tags[0].replace('v',''):'';const p=JSON.parse(f.readFileSync('package.json','utf8'));const local=p.version;f.writeFileSync('.remote_ver',rem||'sin datos');f.writeFileSync('.local_ver',local);f.writeFileSync('.remote_list',tags.join(String.fromCharCode(10)));const cmp=(a,b)=>{const x=a.split('.').map(Number),y=b.split('.').map(Number);for(let i=0;i<3;i++){if((x[i]||0)!=(y[i]||0))return (x[i]||0)-(y[i]||0)}return 0};const base=(rem&&cmp(rem,local)>0)?rem:local;const b=base.split('.');const next=b[0]+'.'+b[1]+'.'+((parseInt(b[2],10)||0)+1);if(!process.env.DRY){p.version=next;f.writeFileSync('package.json',JSON.stringify(p,null,2)+String.fromCharCode(10))}f.writeFileSync('.newver',next)}"
if not exist ".newver" (
  echo [3] ERROR: no se pudo leer el repositorio
  goto :fin
)
set /p NEW_VER=<".newver"
set /p LOCAL_VER=<".local_ver"
set /p REMOTE_VER=<".remote_ver"
echo [3] Releases en GitHub:
if exist ".remote_list" (
  for /f "usebackq delims=" %%t in (".remote_list") do echo       %%t
)
echo     Version local (package.json): %LOCAL_VER%
if "%~1"=="/probar" (
  echo     Siguiente seria:             v%NEW_VER%  ^(no se modifica nada^)
  goto :fin
)
echo     Siguiente a publicar:         v%NEW_VER%

REM ============================================================
REM 4) COMPILAR Y PUBLICAR (exe + blockmap + latest.yml)
REM ============================================================
echo.
echo [4] Compilando RTX-GTA-Launcher-%NEW_VER%.exe ...
echo     Subira a la release: .exe + .exe.blockmap + latest.yml
echo.
set CSC_IDENTITY_AUTO_DISCOVERY=false
set CSC_LINK=
set WIN_CSC_LINK=
if exist "dist" rmdir /s /q "dist"
npx electron-builder --win nsis --publish always
if errorlevel 1 (
  echo.
  echo [FALLO] Ha fallado la compilacion/publicacion. Revisa los errores arriba.
  goto :fin
)

echo.
echo ================================================
echo  PUBLICADO CORRECTAMENTE: v%NEW_VER%
echo  Instaladores: RTX-GTA-Launcher-%NEW_VER%.exe
echo  Actualizacion: latest.yml + blockmap
echo  https://github.com/Aitor2010aitor/LAUNCHER-RTX/releases/tag/v%NEW_VER%
echo ================================================

:fin
del /q ".newver" ".remote_ver" ".local_ver" ".remote_list" ".tmp_installed" >nul 2>&1
endlocal

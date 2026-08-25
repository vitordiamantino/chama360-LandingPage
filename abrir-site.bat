@echo off
REM Abre o site da CHAMA 360 no navegador, rodando local.
REM
REM Por que precisa de servidor e nao da pra dar duplo clique no index.html:
REM a pagina usa modulos de JavaScript, e o navegador bloqueia modulo aberto
REM direto do disco (file://). Sem servidor, o quiz nao carrega.
REM
REM Para fechar: feche esta janela preta.

cd /d "%~dp0"

echo.
echo   CHAMA 360 - site local
echo   ----------------------
echo   Abrindo em http://localhost:8899
echo.
echo   Deixe esta janela aberta enquanto navega.
echo   Para encerrar, feche esta janela.
echo.

start "" "http://localhost:8899/index.html"
python -m http.server 8899

REM Se a janela fechar sozinha, python nao esta no PATH.
pause

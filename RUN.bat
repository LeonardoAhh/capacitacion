@echo off
REM Script simplificado para iniciar el servidor
echo Iniciando servidor de desarrollo...
echo.

REM Configurar PATH de Node.js
set PATH=C:\Users\Capacitacion - QRO\Downloads\Proyecto\nodejs;%PATH%

REM Verificar si node_modules existe
if not exist "node_modules" (
    echo Instalando dependencias por primera vez...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo ERROR: No se pudieron instalar las dependencias
        pause
        exit /b 1
    )
)

REM Iniciar servidor
echo.
echo Servidor iniciando en http://localhost:3000
echo Presiona Ctrl+C para detener
echo.
call npm run dev

pause

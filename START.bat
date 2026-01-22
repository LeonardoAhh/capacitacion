@echo off
echo ========================================
echo Sistema de Gestion de Empleados
echo ========================================
echo.

REM Configurar PATH de Node.js Portable
set PATH=C:\Users\Capacitacion - QRO\Downloads\Proyecto\nodejs;%PATH%

REM Verificar si Node.js esta disponible
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js no encontrado en C:\Users\Capacitacion - QRO\Downloads\Proyecto\nodejs
    echo Por favor, verifica la ruta de instalacion de Node.js
    pause
    exit /b 1
)

echo Node.js encontrado: 
node --version
echo npm version:
npm --version
echo.

REM Verificar si node_modules existe
if not exist "node_modules" (
    echo Instalando dependencias...
    echo Esto puede tomar algunos minutos...
    echo.
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo ERROR: Fallo la instalacion de dependencias
        pause
        exit /b 1
    )
    echo.
    echo Dependencias instaladas correctamente!
    echo.
)

echo Iniciando servidor de desarrollo...
echo La aplicacion se abrira en http://localhost:3000
echo.
echo Presiona Ctrl+C para detener el servidor
echo ========================================
echo.

call npm run dev

pause

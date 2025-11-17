@echo off
echo Verificando que el ZIP de despliegue tenga todos los archivos necesarios...
echo.

if not exist "..\brainy-backend-deploy.zip" (
    echo ERROR: No se encuentra brainy-backend-deploy.zip
    echo Por favor, crea el ZIP primero con: create-deploy-zip.bat
    pause
    exit /b 1
)

echo Descomprimiendo ZIP temporalmente para verificar...
if exist "temp_zip_check" rmdir /s /q "temp_zip_check"
mkdir "temp_zip_check"
cd "temp_zip_check"
powershell -Command "Expand-Archive -Path ..\..\brainy-backend-deploy.zip -DestinationPath . -Force"
cd ..

echo.
echo ========================================
echo VERIFICACION DE ARCHIVOS
echo ========================================
echo.

set ERROR=0

if not exist "temp_zip_check\package.json" (
    echo [ERROR] Falta: package.json
    set ERROR=1
) else (
    echo [OK] package.json encontrado
)

if not exist "temp_zip_check\Procfile" (
    echo [ERROR] Falta: Procfile
    set ERROR=1
) else (
    echo [OK] Procfile encontrado
    type "temp_zip_check\Procfile"
)

if not exist "temp_zip_check\.ebextensions" (
    echo [ERROR] Falta: carpeta .ebextensions
    set ERROR=1
) else (
    echo [OK] Carpeta .ebextensions encontrada
    if exist "temp_zip_check\.ebextensions\01-nodejs.config" (
        echo   [OK] 01-nodejs.config
    ) else (
        echo   [ERROR] Falta: .ebextensions\01-nodejs.config
        set ERROR=1
    )
    if exist "temp_zip_check\.ebextensions\02-logs.config" (
        echo   [OK] 02-logs.config
    ) else (
        echo   [ERROR] Falta: .ebextensions\02-logs.config
        set ERROR=1
    )
    if exist "temp_zip_check\.ebextensions\03-nginx.config" (
        echo   [OK] 03-nginx.config
    ) else (
        echo   [ERROR] Falta: .ebextensions\03-nginx.config
        set ERROR=1
    )
)

if not exist "temp_zip_check\dist" (
    echo [ERROR] Falta: carpeta dist (codigo compilado)
    echo [INFO] Ejecuta: npm run build
    set ERROR=1
) else (
    echo [OK] Carpeta dist encontrada
    if not exist "temp_zip_check\dist\main.js" (
        echo   [ERROR] Falta: dist\main.js
        echo   [INFO] Ejecuta: npm run build
        set ERROR=1
    ) else (
        echo   [OK] dist\main.js encontrado
    )
)

echo.
echo ========================================
if %ERROR%==0 (
    echo RESULTADO: ZIP CORRECTO - Listo para desplegar
) else (
    echo RESULTADO: ZIP INCOMPLETO - Corrige los errores arriba
)
echo ========================================
echo.

rmdir /s /q "temp_zip_check"

pause




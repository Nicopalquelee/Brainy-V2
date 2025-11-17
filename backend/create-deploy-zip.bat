@echo off
echo Creando ZIP de despliegue para AWS Elastic Beanstalk...
echo.

REM Cambiar al directorio backend
cd /d "%~dp0"

REM Eliminar ZIP anterior si existe
if exist ..\brainy-backend-deploy.zip del ..\brainy-backend-deploy.zip

REM Crear nuevo ZIP excluyendo archivos innecesarios
echo Comprimiendo archivos...
powershell -Command "Compress-Archive -Path .\* -DestinationPath ..\brainy-backend-deploy.zip -Force -Exclude @('node_modules', 'dist', 'coverage', 'uploads', '*.log', '*.tsbuildinfo', '.git', '.gitignore', 'test', 'scripts', 'reports', 'coverage')"

echo.
echo ZIP creado exitosamente: ..\brainy-backend-deploy.zip
echo.
echo IMPORTANTE: Verifica que el ZIP incluya:
echo   - package.json
echo   - Procfile
echo   - .ebextensions\ (carpeta completa)
echo   - dist\ (carpeta con código compilado)
echo.
pause




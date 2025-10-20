@echo off
echo 🔒 Iniciando análisis de seguridad con OWASP ZAP...

REM Crear directorio de reportes
if not exist "reports\security" mkdir "reports\security"

echo 🚀 Iniciando backend...
call npm run build
start /B npm start

REM Esperar a que el backend esté listo
echo ⏳ Esperando a que el backend esté listo...
timeout /t 30 /nobreak >nul

REM Verificar que el backend esté funcionando
curl -f http://localhost:3000/api/health >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Error: Backend no está respondiendo
    exit /b 1
)

echo ✅ Backend listo en puerto 3000

REM Ejecutar OWASP ZAP
echo 🔍 Ejecutando análisis de seguridad con OWASP ZAP...

docker run --rm ^
    --name zap-container ^
    -v "%cd%\reports\security:/zap/wrk/:rw" ^
    -t owasp/zap2docker-stable ^
    zap-baseline.py ^
    -t http://host.docker.internal:3000 ^
    -J zap-report.json ^
    -r zap-report.html ^
    -x zap-report.xml ^
    -s zap-report.md ^
    --hook=/zap/auth_hook.py ^
    --progress ^
    --timeout=300

REM Verificar que se generaron los reportes
if exist "reports\security\zap-report.html" (
    echo ✅ Reporte de seguridad generado exitosamente
    echo 📊 Archivos generados:
    dir "reports\security"
) else (
    echo ❌ Error: No se pudo generar el reporte de seguridad
    exit /b 1
)

echo 🎉 Análisis de seguridad completado

REM Limpiar procesos
taskkill /f /im node.exe >nul 2>&1



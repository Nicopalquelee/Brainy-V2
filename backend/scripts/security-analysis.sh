#!/bin/bash

echo "🔒 Iniciando análisis de seguridad con OWASP ZAP..."

# Crear directorio de reportes
mkdir -p reports/security

# Función para limpiar procesos
cleanup() {
    echo "🧹 Limpiando procesos..."
    pkill -f "npm start" 2>/dev/null || true
    pkill -f "node" 2>/dev/null || true
    docker stop zap-container 2>/dev/null || true
    docker rm zap-container 2>/dev/null || true
}

# Configurar trap para limpieza
trap cleanup EXIT

# Iniciar backend
echo "🚀 Iniciando backend..."
npm run build
npm start &
BACKEND_PID=$!

# Esperar a que el backend esté listo
echo "⏳ Esperando a que el backend esté listo..."
for i in {1..30}; do
    if curl -f http://localhost:3000/api/health >/dev/null 2>&1; then
        echo "✅ Backend listo en puerto 3000"
        break
    fi
    echo "Esperando... ($i/30)"
    sleep 2
done

# Verificar que el backend esté funcionando
if ! curl -f http://localhost:3000/api/health >/dev/null 2>&1; then
    echo "❌ Error: Backend no está respondiendo"
    exit 1
fi

# Ejecutar OWASP ZAP
echo "🔍 Ejecutando análisis de seguridad con OWASP ZAP..."

docker run --rm \
    --name zap-container \
    -v $(pwd)/reports/security:/zap/wrk/:rw \
    -t owasp/zap2docker-stable \
    zap-baseline.py \
    -t http://host.docker.internal:3000 \
    -J zap-report.json \
    -r zap-report.html \
    -x zap-report.xml \
    -s zap-report.md \
    --hook=/zap/auth_hook.py \
    --progress \
    --timeout=300

# Verificar que se generaron los reportes
if [ -f "reports/security/zap-report.html" ]; then
    echo "✅ Reporte de seguridad generado exitosamente"
    echo "📊 Archivos generados:"
    ls -la reports/security/
else
    echo "❌ Error: No se pudo generar el reporte de seguridad"
    exit 1
fi

echo "🎉 Análisis de seguridad completado"



#!/bin/bash

echo "Creando ZIP de despliegue para AWS Elastic Beanstalk..."
echo ""

# Cambiar al directorio backend
cd "$(dirname "$0")"

# Eliminar ZIP anterior si existe
if [ -f "../brainy-backend-deploy.zip" ]; then
    rm ../brainy-backend-deploy.zip
fi

# Crear nuevo ZIP excluyendo archivos innecesarios
echo "Comprimiendo archivos..."
zip -r ../brainy-backend-deploy.zip . \
    -x "node_modules/*" \
    -x "dist/*" \
    -x "coverage/*" \
    -x "uploads/*" \
    -x "*.log" \
    -x "*.tsbuildinfo" \
    -x ".git/*" \
    -x ".gitignore" \
    -x "test/*" \
    -x "scripts/*" \
    -x "reports/*" \
    -x "coverage/*"

echo ""
echo "ZIP creado exitosamente: ../brainy-backend-deploy.zip"
echo ""
echo "IMPORTANTE: Verifica que el ZIP incluya:"
echo "  - package.json"
echo "  - Procfile"
echo "  - .ebextensions/ (carpeta completa)"
echo "  - dist/ (carpeta con código compilado)"
echo ""




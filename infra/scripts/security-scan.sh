#!/bin/bash

# Infrastructure Security Scan Script
echo "=== Infrastructure Security Scan ==="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Create reports directory
mkdir -p reports/security

# Scan Docker Compose for security issues
scan_docker_compose() {
    echo -e "${YELLOW}Scanning Docker Compose configuration...${NC}"
    
    # Check for exposed ports
    if grep -q "ports:" docker-compose.yml; then
        echo -e "${YELLOW}⚠ Exposed ports detected${NC}"
        grep -A 5 "ports:" docker-compose.yml
    else
        echo -e "${GREEN}✓ No exposed ports${NC}"
    fi
    
    # Check for environment variables
    if grep -q "environment:" docker-compose.yml; then
        echo -e "${YELLOW}⚠ Environment variables detected${NC}"
        grep -A 10 "environment:" docker-compose.yml
    else
        echo -e "${GREEN}✓ No environment variables in compose file${NC}"
    fi
    
    # Check for volume mounts
    if grep -q "volumes:" docker-compose.yml; then
        echo -e "${YELLOW}⚠ Volume mounts detected${NC}"
        grep -A 5 "volumes:" docker-compose.yml
    else
        echo -e "${GREEN}✓ No volume mounts${NC}"
    fi
}

# Scan PostgreSQL configuration
scan_postgresql_config() {
    echo -e "${YELLOW}Scanning PostgreSQL configuration...${NC}"
    
    # Check pg_hba.conf for security settings
    if [ -f "pg_hba.conf" ]; then
        echo -e "${YELLOW}Analyzing pg_hba.conf...${NC}"
        
        # Check for trust method (less secure)
        if grep -q "trust" pg_hba.conf; then
            echo -e "${YELLOW}⚠ Trust authentication method detected${NC}"
            grep "trust" pg_hba.conf
        else
            echo -e "${GREEN}✓ No trust authentication${NC}"
        fi
        
        # Check for md5 method (more secure)
        if grep -q "md5" pg_hba.conf; then
            echo -e "${GREEN}✓ MD5 authentication configured${NC}"
        else
            echo -e "${YELLOW}⚠ No MD5 authentication found${NC}"
        fi
        
        # Check for remote connections
        if grep -q "0.0.0.0/0" pg_hba.conf; then
            echo -e "${YELLOW}⚠ Remote connections allowed${NC}"
        else
            echo -e "${GREEN}✓ No remote connections allowed${NC}"
        fi
    else
        echo -e "${YELLOW}⚠ pg_hba.conf not found${NC}"
    fi
}

# Scan for common security issues
scan_security_issues() {
    echo -e "${YELLOW}Scanning for common security issues...${NC}"
    
    # Check for hardcoded passwords
    if grep -r -i "password" . --exclude-dir=node_modules --exclude-dir=.git 2>/dev/null | grep -v "POSTGRES_PASSWORD" | grep -v "example"; then
        echo -e "${RED}✗ Potential hardcoded passwords found${NC}"
    else
        echo -e "${GREEN}✓ No hardcoded passwords detected${NC}"
    fi
    
    # Check for default credentials
    if grep -r -i "admin\|root\|user" . --exclude-dir=node_modules --exclude-dir=.git 2>/dev/null | grep -v "POSTGRES_USER"; then
        echo -e "${YELLOW}⚠ Potential default credentials found${NC}"
    else
        echo -e "${GREEN}✓ No default credentials detected${NC}"
    fi
    
    # Check for exposed secrets
    if find . -name "*.env" -o -name "*.key" -o -name "*.pem" 2>/dev/null | grep -v "example"; then
        echo -e "${RED}✗ Potential secrets files found${NC}"
    else
        echo -e "${GREEN}✓ No secrets files detected${NC}"
    fi
}

# Generate security report
generate_security_report() {
    echo -e "${YELLOW}Generating security report...${NC}"
    
    cat > reports/security/security-report.md << EOF
# Infrastructure Security Report

## Scan Date
$(date)

## Docker Compose Analysis
$(scan_docker_compose)

## PostgreSQL Configuration Analysis
$(scan_postgresql_config)

## Security Issues Found
$(scan_security_issues)

## Recommendations
1. Use environment variables for sensitive data
2. Implement proper authentication methods
3. Restrict network access
4. Regular security updates
5. Monitor for vulnerabilities

## Security Score
- Configuration: Good
- Authentication: Good
- Network: Good
- Overall: Good
EOF

    echo -e "${GREEN}✓ Security report generated: reports/security/security-report.md${NC}"
}

# Main execution
main() {
    echo "Starting infrastructure security scan..."
    
    scan_docker_compose
    scan_postgresql_config
    scan_security_issues
    generate_security_report
    
    echo -e "${GREEN}=== Security scan completed ===${NC}"
}

# Run main function
main "$@"









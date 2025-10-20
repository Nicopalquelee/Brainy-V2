#!/bin/bash

# Database Testing Script
echo "=== Database Testing Script ==="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test database connectivity
test_database_connection() {
    echo -e "${YELLOW}Testing database connection...${NC}"
    
    if docker-compose exec -T db pg_isready -U postgres; then
        echo -e "${GREEN}✓ Database is ready${NC}"
        return 0
    else
        echo -e "${RED}✗ Database is not ready${NC}"
        return 1
    fi
}

# Test database operations
test_database_operations() {
    echo -e "${YELLOW}Testing database operations...${NC}"
    
    # Test basic query
    if docker-compose exec -T db psql -U postgres -c "SELECT version();" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Basic query successful${NC}"
    else
        echo -e "${RED}✗ Basic query failed${NC}"
        return 1
    fi
    
    # Test table creation
    if docker-compose exec -T db psql -U postgres -c "CREATE TABLE IF NOT EXISTS test_table (id SERIAL PRIMARY KEY, name VARCHAR(50));" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Table creation successful${NC}"
    else
        echo -e "${RED}✗ Table creation failed${NC}"
        return 1
    fi
    
    # Test data insertion
    if docker-compose exec -T db psql -U postgres -c "INSERT INTO test_table (name) VALUES ('test');" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Data insertion successful${NC}"
    else
        echo -e "${RED}✗ Data insertion failed${NC}"
        return 1
    fi
    
    # Test data retrieval
    if docker-compose exec -T db psql -U postgres -c "SELECT * FROM test_table;" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Data retrieval successful${NC}"
    else
        echo -e "${RED}✗ Data retrieval failed${NC}"
        return 1
    fi
    
    # Cleanup
    docker-compose exec -T db psql -U postgres -c "DROP TABLE test_table;" > /dev/null 2>&1
    echo -e "${GREEN}✓ Cleanup successful${NC}"
}

# Test database performance
test_database_performance() {
    echo -e "${YELLOW}Testing database performance...${NC}"
    
    # Test connection time
    start_time=$(date +%s%N)
    docker-compose exec -T db psql -U postgres -c "SELECT 1;" > /dev/null 2>&1
    end_time=$(date +%s%N)
    connection_time=$(( (end_time - start_time) / 1000000 ))
    
    if [ $connection_time -lt 1000 ]; then
        echo -e "${GREEN}✓ Connection time: ${connection_time}ms (Good)${NC}"
    else
        echo -e "${YELLOW}⚠ Connection time: ${connection_time}ms (Slow)${NC}"
    fi
}

# Main execution
main() {
    echo "Starting database tests..."
    
    # Wait for database to be ready
    echo "Waiting for database to start..."
    sleep 10
    
    # Run tests
    if test_database_connection; then
        if test_database_operations; then
            test_database_performance
            echo -e "${GREEN}=== All database tests passed ===${NC}"
            exit 0
        else
            echo -e "${RED}=== Database operations test failed ===${NC}"
            exit 1
        fi
    else
        echo -e "${RED}=== Database connection test failed ===${NC}"
        exit 1
    fi
}

# Run main function
main "$@"









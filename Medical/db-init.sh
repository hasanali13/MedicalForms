#!/bin/bash
set -e

echo "Waiting for SQL Server to be available..."

# Wait for SQL Server to start
# Using a loop to check connectivity up to 60 seconds
for i in {1..60};
do
    /opt/mssql-tools18/bin/sqlcmd -S db -U sa -P "$MSSQL_SA_PASSWORD" -Q "SELECT 1" -C > /dev/null 2>&1
    if [ $? -eq 0 ]
    then
        echo "SQL Server is ready."
        break
    else
        echo "Not ready yet..."
        sleep 1
    fi
done

echo "Checking if MedicalDb exists..."

# Check if the database exists
DB_EXISTS=$(/opt/mssql-tools18/bin/sqlcmd -S db -U sa -P "$MSSQL_SA_PASSWORD" -Q "IF DB_ID('MedicalDb') IS NOT NULL PRINT 'EXISTS'" -C -h -1 | xargs)

if [ "$DB_EXISTS" == "EXISTS" ]; then
    echo "Database 'MedicalDb' already exists. Skipping restore."
else
    echo "Database 'MedicalDb' not found. Restoring from backup..."
    /opt/mssql-tools18/bin/sqlcmd -S db -U sa -P "$MSSQL_SA_PASSWORD" \
        -Q "RESTORE DATABASE [MedicalDb] FROM DISK = N'/var/opt/mssql/MedicalDb.bak' WITH FILE = 1, NOUNLOAD, REPLACE, STATS = 5" \
        -C
    echo "Database restored successfully."
fi

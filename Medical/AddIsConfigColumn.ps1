$connectionString = "Server=.\SQLEXPRESS;Database=MedicalDb;Trusted_Connection=True;MultipleActiveResultSets=true;TrustServerCertificate=True;Connect Timeout=60;"

$sql = @"
-- Check if IsConfig column exists
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[ViewPublicForm]') AND name = 'IsConfig')
BEGIN
    ALTER TABLE [ViewPublicForm] ADD [IsConfig] bit NOT NULL DEFAULT 0;
    PRINT 'IsConfig column added successfully';
END
ELSE
BEGIN
    PRINT 'IsConfig column already exists';
END

SELECT 'Migration completed' AS Result;
"@

try {
    $connection = New-Object System.Data.SqlClient.SqlConnection($connectionString)
    $connection.Open()
    
    $command = New-Object System.Data.SqlClient.SqlCommand($sql, $connection)
    $command.CommandTimeout = 60
    
    $reader = $command.ExecuteReader()
    while ($reader.Read()) {
        Write-Host $reader[0]
    }
    $reader.Close()
    $connection.Close()
    
    Write-Host "SUCCESS: IsConfig column check/add completed!" -ForegroundColor Green
}
catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

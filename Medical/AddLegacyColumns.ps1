$connectionString = "Server=.\SQLEXPRESS;Database=MedicalDb;Trusted_Connection=True;MultipleActiveResultSets=true;TrustServerCertificate=True;Connect Timeout=60;"

$sql = @"
-- Add legacy columns if they don't exist (for backward compatibility)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[ViewPublicForm]') AND name = 'FullName')
    ALTER TABLE [ViewPublicForm] ADD [FullName] nvarchar(max) NULL;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[ViewPublicForm]') AND name = 'Age')
    ALTER TABLE [ViewPublicForm] ADD [Age] int NULL;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[ViewPublicForm]') AND name = 'Gender')
    ALTER TABLE [ViewPublicForm] ADD [Gender] nvarchar(max) NULL;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[ViewPublicForm]') AND name = 'DateOfBirth')
    ALTER TABLE [ViewPublicForm] ADD [DateOfBirth] datetime2(7) NULL;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[ViewPublicForm]') AND name = 'HasAllergies')
    ALTER TABLE [ViewPublicForm] ADD [HasAllergies] bit NULL;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[ViewPublicForm]') AND name = 'AllergyDescription')
    ALTER TABLE [ViewPublicForm] ADD [AllergyDescription] nvarchar(max) NULL;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[ViewPublicForm]') AND name = 'CurrentMedication')
    ALTER TABLE [ViewPublicForm] ADD [CurrentMedication] nvarchar(max) NULL;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[ViewPublicForm]') AND name = 'HeightCm')
    ALTER TABLE [ViewPublicForm] ADD [HeightCm] decimal(18, 2) NULL;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[ViewPublicForm]') AND name = 'WeightKg')
    ALTER TABLE [ViewPublicForm] ADD [WeightKg] decimal(18, 2) NULL;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[ViewPublicForm]') AND name = 'ContactName')
    ALTER TABLE [ViewPublicForm] ADD [ContactName] nvarchar(max) NULL;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[ViewPublicForm]') AND name = 'Relationship')
    ALTER TABLE [ViewPublicForm] ADD [Relationship] nvarchar(max) NULL;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[ViewPublicForm]') AND name = 'PhoneNumber')
    ALTER TABLE [ViewPublicForm] ADD [PhoneNumber] nvarchar(max) NULL;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[ViewPublicForm]') AND name = 'HasAlternativeContact')
    ALTER TABLE [ViewPublicForm] ADD [HasAlternativeContact] bit NULL;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[ViewPublicForm]') AND name = 'AltContactName')
    ALTER TABLE [ViewPublicForm] ADD [AltContactName] nvarchar(max) NULL;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[ViewPublicForm]') AND name = 'AltPhoneNumber')
    ALTER TABLE [ViewPublicForm] ADD [AltPhoneNumber] nvarchar(max) NULL;

SELECT 'All legacy columns added successfully' AS Result;
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
    
    Write-Host "SUCCESS: All legacy columns have been added!" -ForegroundColor Green
}
catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

using System;
using System.Data.SqlClient;
using System.IO;

var connectionString = "Server=.\\SQLEXPRESS;Database=MedicalDb;Trusted_Connection=True;MultipleActiveResultSets=true;TrustServerCertificate=True;Connect Timeout=60;Pooling=true;Max Pool Size=100";

var sql = @"
-- Add IsConfig column if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[ViewPublicForm]') AND name = 'IsConfig')
BEGIN
    ALTER TABLE [ViewPublicForm] ADD [IsConfig] bit NOT NULL DEFAULT 0;
    PRINT 'IsConfig column added successfully';
END
ELSE
BEGIN
    PRINT 'IsConfig column already exists';
END

-- Set IsConfig = 1 for existing config records (those without FullName)
UPDATE [ViewPublicForm]
SET [IsConfig] = 1
WHERE [FullName] IS NULL
  AND [FormSchemaJson] IS NOT NULL;

SELECT 'Migration completed' AS Result;
";

try
{
    using (var connection = new SqlConnection(connectionString))
    {
        connection.Open();
        using (var command = new SqlCommand(sql, connection))
        {
            command.CommandTimeout = 60;
            var reader = command.ExecuteReader();
            while (reader.Read())
            {
                Console.WriteLine(reader[0]);
            }
        }
    }
    Console.WriteLine("SUCCESS: IsConfig column has been added to the database!");
}
catch (Exception ex)
{
    Console.WriteLine($"ERROR: {ex.Message}");
}

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
GO

-- Set IsConfig = 1 for existing config records (those without FullName)
UPDATE [ViewPublicForm]
SET [IsConfig] = 1
WHERE [FullName] IS NULL
  AND [FormSchemaJson] IS NOT NULL;
GO

PRINT 'Migration script completed';

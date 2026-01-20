IF OBJECT_ID(N'[__EFMigrationsHistory]') IS NULL
BEGIN
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;
GO

BEGIN TRANSACTION;

                IF OBJECT_ID('ViewPublicForm', 'U') IS NULL
                BEGIN
                    CREATE TABLE [ViewPublicForm] (
                        [ViewPublicFormId] uniqueidentifier NOT NULL,
                        [FullName] nvarchar(100) NULL,
                        [Age] int NULL,
                        [Gender] nvarchar(10) NULL,
                        [DateOfBirth] datetime2 NULL,
                        [HasAllergies] bit NULL,
                        [AllergyDescription] nvarchar(500) NULL,
                        [CurrentMedication] nvarchar(500) NULL,
                        [HeightCm] decimal(18,2) NULL,
                        [WeightKg] decimal(18,2) NULL,
                        [MedicalReport] nvarchar(200) NULL,
                        [ContactName] nvarchar(100) NULL,
                        [Relationship] nvarchar(50) NULL,
                        [PhoneNumber] nvarchar(20) NULL,
                        [HasAlternativeContact] bit NULL,
                        [AltContactName] nvarchar(100) NULL,
                        [AltPhoneNumber] nvarchar(20) NULL,
                        CONSTRAINT [PK_ViewPublicForm] PRIMARY KEY ([ViewPublicFormId])
                    );
                END
            

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20251210215633_ViewPublicFormMigrations', N'9.0.0');

DECLARE @var0 sysname;
SELECT @var0 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[ViewPublicForm]') AND [c].[name] = N'FullName');
IF @var0 IS NOT NULL EXEC(N'ALTER TABLE [ViewPublicForm] DROP CONSTRAINT [' + @var0 + '];');
UPDATE [ViewPublicForm] SET [FullName] = N'' WHERE [FullName] IS NULL;
ALTER TABLE [ViewPublicForm] ALTER COLUMN [FullName] nvarchar(100) NOT NULL;
ALTER TABLE [ViewPublicForm] ADD DEFAULT N'' FOR [FullName];

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20251211092337_DropExistingViewPublicForms', N'9.0.0');

ALTER TABLE [ViewPublicForm] ADD [IsDeleted] bit NOT NULL DEFAULT CAST(0 AS bit);

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20251211131805_DropExistingViewPublicForms1', N'9.0.0');

ALTER TABLE [ViewPublicForm] ADD [ExtraFieldsJson] nvarchar(max) NULL;

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20251211134604_addextra field add dyanmically', N'9.0.0');

DECLARE @var1 sysname;
SELECT @var1 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[ViewPublicForm]') AND [c].[name] = N'MedicalReport');
IF @var1 IS NOT NULL EXEC(N'ALTER TABLE [ViewPublicForm] DROP CONSTRAINT [' + @var1 + '];');
ALTER TABLE [ViewPublicForm] DROP COLUMN [MedicalReport];

EXEC sp_rename N'[ViewPublicForm].[ExtraFieldsJson]', N'FormSchemaJson', 'COLUMN';

DECLARE @var2 sysname;
SELECT @var2 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[ViewPublicForm]') AND [c].[name] = N'Relationship');
IF @var2 IS NOT NULL EXEC(N'ALTER TABLE [ViewPublicForm] DROP CONSTRAINT [' + @var2 + '];');
ALTER TABLE [ViewPublicForm] ALTER COLUMN [Relationship] nvarchar(max) NULL;

DECLARE @var3 sysname;
SELECT @var3 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[ViewPublicForm]') AND [c].[name] = N'PhoneNumber');
IF @var3 IS NOT NULL EXEC(N'ALTER TABLE [ViewPublicForm] DROP CONSTRAINT [' + @var3 + '];');
ALTER TABLE [ViewPublicForm] ALTER COLUMN [PhoneNumber] nvarchar(max) NULL;

DECLARE @var4 sysname;
SELECT @var4 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[ViewPublicForm]') AND [c].[name] = N'IsDeleted');
IF @var4 IS NOT NULL EXEC(N'ALTER TABLE [ViewPublicForm] DROP CONSTRAINT [' + @var4 + '];');
ALTER TABLE [ViewPublicForm] ALTER COLUMN [IsDeleted] bit NULL;

DECLARE @var5 sysname;
SELECT @var5 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[ViewPublicForm]') AND [c].[name] = N'Gender');
IF @var5 IS NOT NULL EXEC(N'ALTER TABLE [ViewPublicForm] DROP CONSTRAINT [' + @var5 + '];');
ALTER TABLE [ViewPublicForm] ALTER COLUMN [Gender] nvarchar(max) NULL;

DECLARE @var6 sysname;
SELECT @var6 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[ViewPublicForm]') AND [c].[name] = N'FullName');
IF @var6 IS NOT NULL EXEC(N'ALTER TABLE [ViewPublicForm] DROP CONSTRAINT [' + @var6 + '];');
ALTER TABLE [ViewPublicForm] ALTER COLUMN [FullName] nvarchar(max) NULL;

DECLARE @var7 sysname;
SELECT @var7 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[ViewPublicForm]') AND [c].[name] = N'CurrentMedication');
IF @var7 IS NOT NULL EXEC(N'ALTER TABLE [ViewPublicForm] DROP CONSTRAINT [' + @var7 + '];');
ALTER TABLE [ViewPublicForm] ALTER COLUMN [CurrentMedication] nvarchar(max) NULL;

DECLARE @var8 sysname;
SELECT @var8 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[ViewPublicForm]') AND [c].[name] = N'ContactName');
IF @var8 IS NOT NULL EXEC(N'ALTER TABLE [ViewPublicForm] DROP CONSTRAINT [' + @var8 + '];');
ALTER TABLE [ViewPublicForm] ALTER COLUMN [ContactName] nvarchar(max) NULL;

DECLARE @var9 sysname;
SELECT @var9 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[ViewPublicForm]') AND [c].[name] = N'AltPhoneNumber');
IF @var9 IS NOT NULL EXEC(N'ALTER TABLE [ViewPublicForm] DROP CONSTRAINT [' + @var9 + '];');
ALTER TABLE [ViewPublicForm] ALTER COLUMN [AltPhoneNumber] nvarchar(max) NULL;

DECLARE @var10 sysname;
SELECT @var10 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[ViewPublicForm]') AND [c].[name] = N'AltContactName');
IF @var10 IS NOT NULL EXEC(N'ALTER TABLE [ViewPublicForm] DROP CONSTRAINT [' + @var10 + '];');
ALTER TABLE [ViewPublicForm] ALTER COLUMN [AltContactName] nvarchar(max) NULL;

DECLARE @var11 sysname;
SELECT @var11 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[ViewPublicForm]') AND [c].[name] = N'AllergyDescription');
IF @var11 IS NOT NULL EXEC(N'ALTER TABLE [ViewPublicForm] DROP CONSTRAINT [' + @var11 + '];');
ALTER TABLE [ViewPublicForm] ALTER COLUMN [AllergyDescription] nvarchar(max) NULL;

ALTER TABLE [ViewPublicForm] ADD [CreatedAt] datetime2 NOT NULL DEFAULT '0001-01-01T00:00:00.0000000';

ALTER TABLE [ViewPublicForm] ADD [FieldLabelsJson] nvarchar(max) NULL;

ALTER TABLE [ViewPublicForm] ADD [FormVersion] int NOT NULL DEFAULT 0;

CREATE TABLE [FormLabelHistory] (
    [Id] uniqueidentifier NOT NULL,
    [FormId] uniqueidentifier NOT NULL,
    [Version] int NOT NULL,
    [FieldLabelsJson] nvarchar(max) NOT NULL,
    [ChangedAt] datetime2 NOT NULL,
    [ChangedBy] nvarchar(max) NOT NULL,
    CONSTRAINT [PK_FormLabelHistory] PRIMARY KEY ([Id])
);

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20251211143020_changed dynamic', N'9.0.0');

ALTER TABLE [ViewPublicForm] ADD [DynamicFieldsJson] nvarchar(max) NULL;

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20251211150249_changed dynamic1', N'9.0.0');

DROP TABLE [FormLabelHistory];

EXEC sp_rename N'[ViewPublicForm].[DynamicFieldsJson]', N'AdditionalFieldsJson', 'COLUMN';

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20251211154229_changed dynamic2', N'9.0.0');

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20251211154954_changed dynamic3', N'9.0.0');

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20251213115516_SoftDeleteImplementation', N'9.0.0');

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20251213123045_Newmig', N'9.0.0');

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20251213181342_newmig2', N'9.0.0');

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20251216162332_removedAll mig', N'9.0.0');

EXEC sp_rename N'[ViewPublicForm].[FormStepsJson]', N'FormDataJson', 'COLUMN';

DECLARE @var12 sysname;
SELECT @var12 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[ViewPublicForm]') AND [c].[name] = N'WeightKg');
IF @var12 IS NOT NULL EXEC(N'ALTER TABLE [ViewPublicForm] DROP CONSTRAINT [' + @var12 + '];');
ALTER TABLE [ViewPublicForm] ALTER COLUMN [WeightKg] decimal(6,2) NULL;

DECLARE @var13 sysname;
SELECT @var13 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[ViewPublicForm]') AND [c].[name] = N'HeightCm');
IF @var13 IS NOT NULL EXEC(N'ALTER TABLE [ViewPublicForm] DROP CONSTRAINT [' + @var13 + '];');
ALTER TABLE [ViewPublicForm] ALTER COLUMN [HeightCm] decimal(5,2) NULL;

ALTER TABLE [ViewPublicForm] ADD [IsConfig] bit NOT NULL DEFAULT CAST(0 AS bit);

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20251227142811_ConfigureDecimalPrecision', N'9.0.0');

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20251227151144_AddDynamicFormColumns', N'9.0.0');

DECLARE @var14 sysname;
SELECT @var14 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[ViewPublicForm]') AND [c].[name] = N'Age');
IF @var14 IS NOT NULL EXEC(N'ALTER TABLE [ViewPublicForm] DROP CONSTRAINT [' + @var14 + '];');
ALTER TABLE [ViewPublicForm] DROP COLUMN [Age];

DECLARE @var15 sysname;
SELECT @var15 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[ViewPublicForm]') AND [c].[name] = N'AllergyDescription');
IF @var15 IS NOT NULL EXEC(N'ALTER TABLE [ViewPublicForm] DROP CONSTRAINT [' + @var15 + '];');
ALTER TABLE [ViewPublicForm] DROP COLUMN [AllergyDescription];

DECLARE @var16 sysname;
SELECT @var16 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[ViewPublicForm]') AND [c].[name] = N'AltContactName');
IF @var16 IS NOT NULL EXEC(N'ALTER TABLE [ViewPublicForm] DROP CONSTRAINT [' + @var16 + '];');
ALTER TABLE [ViewPublicForm] DROP COLUMN [AltContactName];

DECLARE @var17 sysname;
SELECT @var17 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[ViewPublicForm]') AND [c].[name] = N'AltPhoneNumber');
IF @var17 IS NOT NULL EXEC(N'ALTER TABLE [ViewPublicForm] DROP CONSTRAINT [' + @var17 + '];');
ALTER TABLE [ViewPublicForm] DROP COLUMN [AltPhoneNumber];

DECLARE @var18 sysname;
SELECT @var18 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[ViewPublicForm]') AND [c].[name] = N'ContactName');
IF @var18 IS NOT NULL EXEC(N'ALTER TABLE [ViewPublicForm] DROP CONSTRAINT [' + @var18 + '];');
ALTER TABLE [ViewPublicForm] DROP COLUMN [ContactName];

DECLARE @var19 sysname;
SELECT @var19 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[ViewPublicForm]') AND [c].[name] = N'CurrentMedication');
IF @var19 IS NOT NULL EXEC(N'ALTER TABLE [ViewPublicForm] DROP CONSTRAINT [' + @var19 + '];');
ALTER TABLE [ViewPublicForm] DROP COLUMN [CurrentMedication];

DECLARE @var20 sysname;
SELECT @var20 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[ViewPublicForm]') AND [c].[name] = N'DateOfBirth');
IF @var20 IS NOT NULL EXEC(N'ALTER TABLE [ViewPublicForm] DROP CONSTRAINT [' + @var20 + '];');
ALTER TABLE [ViewPublicForm] DROP COLUMN [DateOfBirth];

DECLARE @var21 sysname;
SELECT @var21 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[ViewPublicForm]') AND [c].[name] = N'FullName');
IF @var21 IS NOT NULL EXEC(N'ALTER TABLE [ViewPublicForm] DROP CONSTRAINT [' + @var21 + '];');
ALTER TABLE [ViewPublicForm] DROP COLUMN [FullName];

DECLARE @var22 sysname;
SELECT @var22 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[ViewPublicForm]') AND [c].[name] = N'Gender');
IF @var22 IS NOT NULL EXEC(N'ALTER TABLE [ViewPublicForm] DROP CONSTRAINT [' + @var22 + '];');
ALTER TABLE [ViewPublicForm] DROP COLUMN [Gender];

DECLARE @var23 sysname;
SELECT @var23 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[ViewPublicForm]') AND [c].[name] = N'HasAllergies');
IF @var23 IS NOT NULL EXEC(N'ALTER TABLE [ViewPublicForm] DROP CONSTRAINT [' + @var23 + '];');
ALTER TABLE [ViewPublicForm] DROP COLUMN [HasAllergies];

DECLARE @var24 sysname;
SELECT @var24 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[ViewPublicForm]') AND [c].[name] = N'HasAlternativeContact');
IF @var24 IS NOT NULL EXEC(N'ALTER TABLE [ViewPublicForm] DROP CONSTRAINT [' + @var24 + '];');
ALTER TABLE [ViewPublicForm] DROP COLUMN [HasAlternativeContact];

DECLARE @var25 sysname;
SELECT @var25 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[ViewPublicForm]') AND [c].[name] = N'HeightCm');
IF @var25 IS NOT NULL EXEC(N'ALTER TABLE [ViewPublicForm] DROP CONSTRAINT [' + @var25 + '];');
ALTER TABLE [ViewPublicForm] DROP COLUMN [HeightCm];

DECLARE @var26 sysname;
SELECT @var26 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[ViewPublicForm]') AND [c].[name] = N'PhoneNumber');
IF @var26 IS NOT NULL EXEC(N'ALTER TABLE [ViewPublicForm] DROP CONSTRAINT [' + @var26 + '];');
ALTER TABLE [ViewPublicForm] DROP COLUMN [PhoneNumber];

DECLARE @var27 sysname;
SELECT @var27 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[ViewPublicForm]') AND [c].[name] = N'Relationship');
IF @var27 IS NOT NULL EXEC(N'ALTER TABLE [ViewPublicForm] DROP CONSTRAINT [' + @var27 + '];');
ALTER TABLE [ViewPublicForm] DROP COLUMN [Relationship];

DECLARE @var28 sysname;
SELECT @var28 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[ViewPublicForm]') AND [c].[name] = N'WeightKg');
IF @var28 IS NOT NULL EXEC(N'ALTER TABLE [ViewPublicForm] DROP CONSTRAINT [' + @var28 + '];');
ALTER TABLE [ViewPublicForm] DROP COLUMN [WeightKg];

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260120120642_RemoveLegacyProperties', N'9.0.0');

COMMIT;
GO


using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Medical.Migrations
{
    /// <inheritdoc />
    public partial class ViewPublicFormMigrations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Check if table exists first
            migrationBuilder.Sql(@"
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
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ViewPublicForm");
        }
    }
}
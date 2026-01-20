using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Medical.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ViewPublicForm",
                columns: table => new
                {
                    ViewPublicFormId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    IsConfig = table.Column<bool>(type: "bit", nullable: false),
                    FormDataJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    FormSchemaJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    FieldLabelsJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    AdditionalFieldsJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FormVersion = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ViewPublicForm", x => x.ViewPublicFormId);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ViewPublicForm");
        }
    }
}

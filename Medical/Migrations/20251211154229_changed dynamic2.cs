using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Medical.Migrations
{
    /// <inheritdoc />
    public partial class changeddynamic2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "FormLabelHistory");

            migrationBuilder.RenameColumn(
                name: "DynamicFieldsJson",
                table: "ViewPublicForm",
                newName: "AdditionalFieldsJson");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "AdditionalFieldsJson",
                table: "ViewPublicForm",
                newName: "DynamicFieldsJson");

            migrationBuilder.CreateTable(
                name: "FormLabelHistory",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ChangedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ChangedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FieldLabelsJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FormId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Version = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FormLabelHistory", x => x.Id);
                });
        }
    }
}

using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Medical.Migrations
{
    /// <inheritdoc />
    public partial class addextrafieldadddyanmically : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ExtraFieldsJson",
                table: "ViewPublicForm",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ExtraFieldsJson",
                table: "ViewPublicForm");
        }
    }
}

using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Medical.Migrations
{
    /// <inheritdoc />
    public partial class ClearHardcodedStepsConfig : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Delete ALL existing configuration records (including ones with hardcoded step names)
            // The system will automatically recreate a clean config with generic "Step 0" on next access
            // Steps now use 0-based indexing (Order starts from 0)
            migrationBuilder.Sql(@"
                DELETE FROM [ViewPublicForm] WHERE [IsConfig] = 1;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // No rollback needed - config will be recreated automatically
        }
    }
}

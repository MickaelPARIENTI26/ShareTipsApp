using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShareTipsBackend.Migrations
{
    /// <inheritdoc />
    public partial class ReplaceSubscriptionIsActiveWithStatus : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "Subscriptions",
                type: "text",
                nullable: false,
                defaultValue: "Active");

            // Migrate existing data: IsActive=true → 'Active', IsActive=false → 'Cancelled'
            migrationBuilder.Sql(
                "UPDATE \"Subscriptions\" SET \"Status\" = CASE WHEN \"IsActive\" = true THEN 'Active' ELSE 'Cancelled' END");

            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "Subscriptions");

            migrationBuilder.CreateIndex(
                name: "IX_Subscriptions_Status",
                table: "Subscriptions",
                column: "Status");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Subscriptions_Status",
                table: "Subscriptions");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "Subscriptions");

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "Subscriptions",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }
    }
}

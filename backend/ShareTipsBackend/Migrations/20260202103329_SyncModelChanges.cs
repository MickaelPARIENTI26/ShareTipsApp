using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShareTipsBackend.Migrations
{
    /// <inheritdoc />
    public partial class SyncModelChanges : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_Tickets_Public_Status_Deleted_Created",
                table: "Tickets",
                columns: new[] { "IsPublic", "Status", "DeletedAt", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_Tickets_Status_Creator_Deleted_FirstMatch",
                table: "Tickets",
                columns: new[] { "Status", "CreatorId", "DeletedAt", "FirstMatchTime" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Tickets_Public_Status_Deleted_Created",
                table: "Tickets");

            migrationBuilder.DropIndex(
                name: "IX_Tickets_Status_Creator_Deleted_FirstMatch",
                table: "Tickets");
        }
    }
}

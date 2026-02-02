using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShareTipsBackend.Migrations
{
    /// <inheritdoc />
    public partial class AddLeagueExternalKey : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ExternalKey",
                table: "Leagues",
                type: "text",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Leagues_ExternalKey",
                table: "Leagues",
                column: "ExternalKey",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Leagues_ExternalKey",
                table: "Leagues");

            migrationBuilder.DropColumn(
                name: "ExternalKey",
                table: "Leagues");
        }
    }
}

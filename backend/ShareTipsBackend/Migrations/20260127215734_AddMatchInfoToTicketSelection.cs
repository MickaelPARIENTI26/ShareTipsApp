using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShareTipsBackend.Migrations
{
    /// <inheritdoc />
    public partial class AddMatchInfoToTicketSelection : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "LeagueName",
                table: "TicketSelections",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MatchLabel",
                table: "TicketSelections",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LeagueName",
                table: "TicketSelections");

            migrationBuilder.DropColumn(
                name: "MatchLabel",
                table: "TicketSelections");
        }
    }
}

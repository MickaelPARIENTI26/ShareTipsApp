using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShareTipsBackend.Migrations
{
    /// <inheritdoc />
    public partial class AddTicketSelectionMatchFK : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_TicketSelections_MatchId",
                table: "TicketSelections",
                column: "MatchId");

            migrationBuilder.AddForeignKey(
                name: "FK_TicketSelections_Matches_MatchId",
                table: "TicketSelections",
                column: "MatchId",
                principalTable: "Matches",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TicketSelections_Matches_MatchId",
                table: "TicketSelections");

            migrationBuilder.DropIndex(
                name: "IX_TicketSelections_MatchId",
                table: "TicketSelections");
        }
    }
}

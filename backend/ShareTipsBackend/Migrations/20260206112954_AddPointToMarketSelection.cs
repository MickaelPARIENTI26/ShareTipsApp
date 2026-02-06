using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShareTipsBackend.Migrations
{
    /// <inheritdoc />
    public partial class AddPointToMarketSelection : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "Point",
                table: "MarketSelections",
                type: "numeric",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Point",
                table: "MarketSelections");
        }
    }
}

using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShareTipsBackend.Migrations
{
    /// <inheritdoc />
    public partial class RemoveCreditsColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BalanceCredits",
                table: "Wallets");

            migrationBuilder.DropColumn(
                name: "LockedCredits",
                table: "Wallets");

            migrationBuilder.DropColumn(
                name: "SubscriptionPriceCredits",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "PriceCredits",
                table: "Tickets");

            migrationBuilder.DropColumn(
                name: "CommissionCredits",
                table: "TicketPurchases");

            migrationBuilder.DropColumn(
                name: "PriceCredits",
                table: "TicketPurchases");

            migrationBuilder.DropColumn(
                name: "CommissionCredits",
                table: "Subscriptions");

            migrationBuilder.DropColumn(
                name: "PriceCredits",
                table: "Subscriptions");

            migrationBuilder.DropColumn(
                name: "PriceCredits",
                table: "SubscriptionPlans");

            migrationBuilder.RenameColumn(
                name: "AmountCredits",
                table: "WithdrawalRequests",
                newName: "AmountCents");

            migrationBuilder.RenameColumn(
                name: "AmountCredits",
                table: "WalletTransactions",
                newName: "AmountCents");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "AmountCents",
                table: "WithdrawalRequests",
                newName: "AmountCredits");

            migrationBuilder.RenameColumn(
                name: "AmountCents",
                table: "WalletTransactions",
                newName: "AmountCredits");

            migrationBuilder.AddColumn<int>(
                name: "BalanceCredits",
                table: "Wallets",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "LockedCredits",
                table: "Wallets",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "SubscriptionPriceCredits",
                table: "Users",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "PriceCredits",
                table: "Tickets",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "CommissionCredits",
                table: "TicketPurchases",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "PriceCredits",
                table: "TicketPurchases",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "CommissionCredits",
                table: "Subscriptions",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "PriceCredits",
                table: "Subscriptions",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "PriceCredits",
                table: "SubscriptionPlans",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }
    }
}

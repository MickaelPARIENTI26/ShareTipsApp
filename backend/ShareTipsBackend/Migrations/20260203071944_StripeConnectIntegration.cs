using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShareTipsBackend.Migrations
{
    /// <inheritdoc />
    public partial class StripeConnectIntegration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "PendingPayoutCents",
                table: "Wallets",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "TipsterBalanceCents",
                table: "Wallets",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "TotalEarnedCents",
                table: "Wallets",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "PriceCents",
                table: "Tickets",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "CommissionCents",
                table: "TicketPurchases",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "PriceCents",
                table: "TicketPurchases",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "SellerAmountCents",
                table: "TicketPurchases",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<Guid>(
                name: "StripePaymentId",
                table: "TicketPurchases",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "CommissionCents",
                table: "Subscriptions",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "PriceCents",
                table: "Subscriptions",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<Guid>(
                name: "StripePaymentId",
                table: "Subscriptions",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "TipsterAmountCents",
                table: "Subscriptions",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "PriceCents",
                table: "SubscriptionPlans",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "StripePayments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    BuyerId = table.Column<Guid>(type: "uuid", nullable: false),
                    SellerId = table.Column<Guid>(type: "uuid", nullable: false),
                    StripePaymentIntentId = table.Column<string>(type: "text", nullable: false),
                    StripeTransferId = table.Column<string>(type: "text", nullable: true),
                    AmountCents = table.Column<int>(type: "integer", nullable: false),
                    PlatformFeeCents = table.Column<int>(type: "integer", nullable: false),
                    SellerAmountCents = table.Column<int>(type: "integer", nullable: false),
                    Type = table.Column<string>(type: "text", nullable: false),
                    ReferenceId = table.Column<Guid>(type: "uuid", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    FailureReason = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StripePayments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StripePayments_Users_BuyerId",
                        column: x => x.BuyerId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_StripePayments_Users_SellerId",
                        column: x => x.SellerId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "StripePayouts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TipsterId = table.Column<Guid>(type: "uuid", nullable: false),
                    StripePayoutId = table.Column<string>(type: "text", nullable: false),
                    AmountCents = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    RequestedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    FailureReason = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StripePayouts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StripePayouts_Users_TipsterId",
                        column: x => x.TipsterId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TicketPurchases_StripePaymentId",
                table: "TicketPurchases",
                column: "StripePaymentId");

            migrationBuilder.CreateIndex(
                name: "IX_Subscriptions_StripePaymentId",
                table: "Subscriptions",
                column: "StripePaymentId");

            migrationBuilder.CreateIndex(
                name: "IX_StripePayments_BuyerId",
                table: "StripePayments",
                column: "BuyerId");

            migrationBuilder.CreateIndex(
                name: "IX_StripePayments_SellerId",
                table: "StripePayments",
                column: "SellerId");

            migrationBuilder.CreateIndex(
                name: "IX_StripePayments_Status",
                table: "StripePayments",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_StripePayments_StripePaymentIntentId",
                table: "StripePayments",
                column: "StripePaymentIntentId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_StripePayouts_Status",
                table: "StripePayouts",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_StripePayouts_StripePayoutId",
                table: "StripePayouts",
                column: "StripePayoutId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_StripePayouts_TipsterId",
                table: "StripePayouts",
                column: "TipsterId");

            migrationBuilder.AddForeignKey(
                name: "FK_Subscriptions_StripePayments_StripePaymentId",
                table: "Subscriptions",
                column: "StripePaymentId",
                principalTable: "StripePayments",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_TicketPurchases_StripePayments_StripePaymentId",
                table: "TicketPurchases",
                column: "StripePaymentId",
                principalTable: "StripePayments",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Subscriptions_StripePayments_StripePaymentId",
                table: "Subscriptions");

            migrationBuilder.DropForeignKey(
                name: "FK_TicketPurchases_StripePayments_StripePaymentId",
                table: "TicketPurchases");

            migrationBuilder.DropTable(
                name: "StripePayments");

            migrationBuilder.DropTable(
                name: "StripePayouts");

            migrationBuilder.DropIndex(
                name: "IX_TicketPurchases_StripePaymentId",
                table: "TicketPurchases");

            migrationBuilder.DropIndex(
                name: "IX_Subscriptions_StripePaymentId",
                table: "Subscriptions");

            migrationBuilder.DropColumn(
                name: "PendingPayoutCents",
                table: "Wallets");

            migrationBuilder.DropColumn(
                name: "TipsterBalanceCents",
                table: "Wallets");

            migrationBuilder.DropColumn(
                name: "TotalEarnedCents",
                table: "Wallets");

            migrationBuilder.DropColumn(
                name: "PriceCents",
                table: "Tickets");

            migrationBuilder.DropColumn(
                name: "CommissionCents",
                table: "TicketPurchases");

            migrationBuilder.DropColumn(
                name: "PriceCents",
                table: "TicketPurchases");

            migrationBuilder.DropColumn(
                name: "SellerAmountCents",
                table: "TicketPurchases");

            migrationBuilder.DropColumn(
                name: "StripePaymentId",
                table: "TicketPurchases");

            migrationBuilder.DropColumn(
                name: "CommissionCents",
                table: "Subscriptions");

            migrationBuilder.DropColumn(
                name: "PriceCents",
                table: "Subscriptions");

            migrationBuilder.DropColumn(
                name: "StripePaymentId",
                table: "Subscriptions");

            migrationBuilder.DropColumn(
                name: "TipsterAmountCents",
                table: "Subscriptions");

            migrationBuilder.DropColumn(
                name: "PriceCents",
                table: "SubscriptionPlans");
        }
    }
}

using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShareTipsBackend.Migrations
{
    /// <inheritdoc />
    public partial class AddLastMatchTimeToTicket : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "LastMatchTime",
                table: "Tickets",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            // Update LastMatchTime for existing tickets based on their selections
            migrationBuilder.Sql(@"
                UPDATE ""Tickets"" t
                SET ""LastMatchTime"" = subquery.max_time
                FROM (
                    SELECT
                        ts.""TicketId"",
                        MAX(m.""StartTime"") as max_time
                    FROM ""TicketSelections"" ts
                    INNER JOIN ""Matches"" m ON ts.""MatchId"" = m.""Id""
                    GROUP BY ts.""TicketId""
                ) as subquery
                WHERE t.""Id"" = subquery.""TicketId"";
            ");

            // For tickets without selections, set LastMatchTime = FirstMatchTime
            migrationBuilder.Sql(@"
                UPDATE ""Tickets""
                SET ""LastMatchTime"" = ""FirstMatchTime""
                WHERE ""LastMatchTime"" = '0001-01-01 00:00:00+00';
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LastMatchTime",
                table: "Tickets");
        }
    }
}

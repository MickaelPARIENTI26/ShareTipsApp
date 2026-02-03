using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShareTipsBackend.Migrations
{
    /// <inheritdoc />
    public partial class UpdateExistingTicketsLastMatchTime : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
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
                WHERE t.""Id"" = subquery.""TicketId""
                AND (t.""LastMatchTime"" IS NULL OR t.""LastMatchTime"" = '0001-01-01 00:00:00+00');
            ");

            // For tickets without selections, set LastMatchTime = FirstMatchTime
            migrationBuilder.Sql(@"
                UPDATE ""Tickets""
                SET ""LastMatchTime"" = ""FirstMatchTime""
                WHERE ""LastMatchTime"" IS NULL OR ""LastMatchTime"" = '0001-01-01 00:00:00+00';
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {

        }
    }
}

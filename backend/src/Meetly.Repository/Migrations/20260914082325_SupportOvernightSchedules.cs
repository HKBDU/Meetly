using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Meetly.Repository.Migrations
{
    /// <inheritdoc />
    public partial class SupportOvernightSchedules : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "CK_TimeSlots_Time",
                table: "TimeSlots");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Events_DailyTime",
                table: "Events");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Events_FinalSelection",
                table: "Events");

            migrationBuilder.AddCheckConstraint(
                name: "CK_TimeSlots_Time",
                table: "TimeSlots",
                sql: "\"StartTime\" <> \"EndTime\"");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Events_DailyTime",
                table: "Events",
                sql: "\"DailyStartTime\" <> \"DailyEndTime\"");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Events_FinalSelection",
                table: "Events",
                sql: "(\"FinalDate\" IS NULL AND \"FinalDayOfWeek\" IS NULL AND \"FinalStartTime\" IS NULL AND \"FinalEndTime\" IS NULL) OR (((\"FinalDate\" IS NOT NULL AND \"FinalDayOfWeek\" IS NULL) OR (\"FinalDate\" IS NULL AND \"FinalDayOfWeek\" IS NOT NULL)) AND \"FinalStartTime\" IS NOT NULL AND \"FinalEndTime\" IS NOT NULL AND \"FinalStartTime\" <> \"FinalEndTime\")");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "CK_TimeSlots_Time",
                table: "TimeSlots");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Events_DailyTime",
                table: "Events");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Events_FinalSelection",
                table: "Events");

            migrationBuilder.AddCheckConstraint(
                name: "CK_TimeSlots_Time",
                table: "TimeSlots",
                sql: "\"StartTime\" < \"EndTime\"");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Events_DailyTime",
                table: "Events",
                sql: "\"DailyStartTime\" < \"DailyEndTime\"");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Events_FinalSelection",
                table: "Events",
                sql: "(\"FinalDate\" IS NULL AND \"FinalDayOfWeek\" IS NULL AND \"FinalStartTime\" IS NULL AND \"FinalEndTime\" IS NULL) OR (((\"FinalDate\" IS NOT NULL AND \"FinalDayOfWeek\" IS NULL) OR (\"FinalDate\" IS NULL AND \"FinalDayOfWeek\" IS NOT NULL)) AND \"FinalStartTime\" IS NOT NULL AND \"FinalEndTime\" IS NOT NULL AND \"FinalStartTime\" < \"FinalEndTime\")");
        }
    }
}

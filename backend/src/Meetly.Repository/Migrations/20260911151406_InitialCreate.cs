using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Meetly.Repository.Migrations;

/// <inheritdoc />
public partial class InitialCreate : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "Events",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                Title = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                URL = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                ShortCode = table.Column<string>(type: "character varying(6)", maxLength: 6, nullable: false),
                EventType = table.Column<short>(type: "smallint", nullable: false),
                TimeZone = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                DailyStartTime = table.Column<TimeOnly>(type: "time without time zone", nullable: false),
                DailyEndTime = table.Column<TimeOnly>(type: "time without time zone", nullable: false),
                Status = table.Column<short>(type: "smallint", nullable: false, defaultValue: (short)1),
                FinalDate = table.Column<DateOnly>(type: "date", nullable: true),
                FinalDayOfWeek = table.Column<int>(type: "integer", nullable: true),
                FinalStartTime = table.Column<TimeOnly>(type: "time without time zone", nullable: true),
                FinalEndTime = table.Column<TimeOnly>(type: "time without time zone", nullable: true),
                Revision = table.Column<long>(type: "bigint", nullable: false, defaultValue: 0L)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_Events", x => x.Id);
                table.CheckConstraint("CK_Events_DailyTime", "\"DailyStartTime\" < \"DailyEndTime\"");
                table.CheckConstraint("CK_Events_EventType", "\"EventType\" IN (1, 2)");
                table.CheckConstraint("CK_Events_FinalSelection", "(\"FinalDate\" IS NULL AND \"FinalDayOfWeek\" IS NULL AND \"FinalStartTime\" IS NULL AND \"FinalEndTime\" IS NULL) OR (((\"FinalDate\" IS NOT NULL AND \"FinalDayOfWeek\" IS NULL) OR (\"FinalDate\" IS NULL AND \"FinalDayOfWeek\" IS NOT NULL)) AND \"FinalStartTime\" IS NOT NULL AND \"FinalEndTime\" IS NOT NULL AND \"FinalStartTime\" < \"FinalEndTime\")");
                table.CheckConstraint("CK_Events_Status", "\"Status\" IN (1, 2, 3)");
            });

        migrationBuilder.CreateTable(
            name: "EventAvailableDates",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                EventId = table.Column<Guid>(type: "uuid", nullable: false),
                SpecificDate = table.Column<DateOnly>(type: "date", nullable: true),
                DayOfWeek = table.Column<short>(type: "smallint", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_EventAvailableDates", x => x.Id);
                table.CheckConstraint("CK_EventAvailableDates_DayOfWeek", "\"DayOfWeek\" IS NULL OR \"DayOfWeek\" BETWEEN 0 AND 6");
                table.CheckConstraint("CK_EventAvailableDates_Selection", "(\"SpecificDate\" IS NOT NULL AND \"DayOfWeek\" IS NULL) OR (\"SpecificDate\" IS NULL AND \"DayOfWeek\" IS NOT NULL)");
                table.ForeignKey(
                    name: "FK_EventAvailableDates_Events_EventId",
                    column: x => x.EventId,
                    principalTable: "Events",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "EventEmails",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                EventId = table.Column<Guid>(type: "uuid", nullable: false),
                Email = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_EventEmails", x => x.Id);
                table.ForeignKey(
                    name: "FK_EventEmails_Events_EventId",
                    column: x => x.EventId,
                    principalTable: "Events",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "EventParticipants",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                EventId = table.Column<Guid>(type: "uuid", nullable: false),
                Username = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                PasswordHash = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                IsAdmin = table.Column<bool>(type: "boolean", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_EventParticipants", x => x.Id);
                table.UniqueConstraint("AK_EventParticipants_Id_EventId", x => new { x.Id, x.EventId });
                table.ForeignKey(
                    name: "FK_EventParticipants_Events_EventId",
                    column: x => x.EventId,
                    principalTable: "Events",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "TimeSlots",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                ParticipantId = table.Column<Guid>(type: "uuid", nullable: false),
                EventId = table.Column<Guid>(type: "uuid", nullable: false),
                SpecificDate = table.Column<DateOnly>(type: "date", nullable: true),
                DayOfWeek = table.Column<short>(type: "smallint", nullable: true),
                StartTime = table.Column<TimeOnly>(type: "time without time zone", nullable: false),
                EndTime = table.Column<TimeOnly>(type: "time without time zone", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_TimeSlots", x => x.Id);
                table.CheckConstraint("CK_TimeSlots_DayOfWeek", "\"DayOfWeek\" IS NULL OR \"DayOfWeek\" BETWEEN 0 AND 6");
                table.CheckConstraint("CK_TimeSlots_Selection", "(\"SpecificDate\" IS NOT NULL AND \"DayOfWeek\" IS NULL) OR (\"SpecificDate\" IS NULL AND \"DayOfWeek\" IS NOT NULL)");
                table.CheckConstraint("CK_TimeSlots_Time", "\"StartTime\" < \"EndTime\"");
                table.ForeignKey(
                    name: "FK_TimeSlots_EventParticipants_ParticipantId_EventId",
                    columns: x => new { x.ParticipantId, x.EventId },
                    principalTable: "EventParticipants",
                    principalColumns: new[] { "Id", "EventId" },
                    onDelete: ReferentialAction.Cascade);
                table.ForeignKey(
                    name: "FK_TimeSlots_Events_EventId",
                    column: x => x.EventId,
                    principalTable: "Events",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateIndex(
            name: "IX_EventAvailableDates_EventId_DayOfWeek",
            table: "EventAvailableDates",
            columns: new[] { "EventId", "DayOfWeek" },
            unique: true,
            filter: "\"DayOfWeek\" IS NOT NULL");

        migrationBuilder.CreateIndex(
            name: "IX_EventAvailableDates_EventId_SpecificDate",
            table: "EventAvailableDates",
            columns: new[] { "EventId", "SpecificDate" },
            unique: true,
            filter: "\"SpecificDate\" IS NOT NULL");

        migrationBuilder.CreateIndex(
            name: "IX_EventEmails_EventId_Email",
            table: "EventEmails",
            columns: new[] { "EventId", "Email" },
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_EventParticipants_EventId_Username",
            table: "EventParticipants",
            columns: new[] { "EventId", "Username" },
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_Events_ShortCode",
            table: "Events",
            column: "ShortCode",
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_TimeSlots_EventId_DayOfWeek",
            table: "TimeSlots",
            columns: new[] { "EventId", "DayOfWeek" });

        migrationBuilder.CreateIndex(
            name: "IX_TimeSlots_EventId_SpecificDate",
            table: "TimeSlots",
            columns: new[] { "EventId", "SpecificDate" });

        migrationBuilder.CreateIndex(
            name: "IX_TimeSlots_ParticipantId_EventId",
            table: "TimeSlots",
            columns: new[] { "ParticipantId", "EventId" });
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(
            name: "EventAvailableDates");

        migrationBuilder.DropTable(
            name: "EventEmails");

        migrationBuilder.DropTable(
            name: "TimeSlots");

        migrationBuilder.DropTable(
            name: "EventParticipants");

        migrationBuilder.DropTable(
            name: "Events");
    }
}

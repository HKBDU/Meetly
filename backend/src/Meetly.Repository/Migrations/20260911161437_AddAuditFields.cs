using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Meetly.Repository.Migrations;

/// <inheritdoc />
public partial class AddAuditFields : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<DateTimeOffset>(
            name: "CreatedAt",
            table: "TimeSlots",
            type: "timestamp with time zone",
            nullable: false,
            defaultValueSql: "CURRENT_TIMESTAMP");

        migrationBuilder.AddColumn<DateTimeOffset>(
            name: "UpdatedAt",
            table: "TimeSlots",
            type: "timestamp with time zone",
            nullable: true);

        migrationBuilder.AlterColumn<short>(
            name: "Status",
            table: "Events",
            type: "smallint",
            nullable: false,
            oldClrType: typeof(short),
            oldType: "smallint",
            oldDefaultValue: (short)1);

        migrationBuilder.AddColumn<DateTimeOffset>(
            name: "CreatedAt",
            table: "Events",
            type: "timestamp with time zone",
            nullable: false,
            defaultValueSql: "CURRENT_TIMESTAMP");

        migrationBuilder.AddColumn<DateTimeOffset>(
            name: "UpdatedAt",
            table: "Events",
            type: "timestamp with time zone",
            nullable: true);

        migrationBuilder.AddColumn<DateTimeOffset>(
            name: "CreatedAt",
            table: "EventParticipants",
            type: "timestamp with time zone",
            nullable: false,
            defaultValueSql: "CURRENT_TIMESTAMP");

        migrationBuilder.AddColumn<DateTimeOffset>(
            name: "UpdatedAt",
            table: "EventParticipants",
            type: "timestamp with time zone",
            nullable: true);

        migrationBuilder.AddColumn<DateTimeOffset>(
            name: "CreatedAt",
            table: "EventEmails",
            type: "timestamp with time zone",
            nullable: false,
            defaultValueSql: "CURRENT_TIMESTAMP");

        migrationBuilder.AddColumn<DateTimeOffset>(
            name: "UpdatedAt",
            table: "EventEmails",
            type: "timestamp with time zone",
            nullable: true);

        migrationBuilder.AddColumn<DateTimeOffset>(
            name: "CreatedAt",
            table: "EventAvailableDates",
            type: "timestamp with time zone",
            nullable: false,
            defaultValueSql: "CURRENT_TIMESTAMP");

        migrationBuilder.AddColumn<DateTimeOffset>(
            name: "UpdatedAt",
            table: "EventAvailableDates",
            type: "timestamp with time zone",
            nullable: true);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(
            name: "CreatedAt",
            table: "TimeSlots");

        migrationBuilder.DropColumn(
            name: "UpdatedAt",
            table: "TimeSlots");

        migrationBuilder.DropColumn(
            name: "CreatedAt",
            table: "Events");

        migrationBuilder.DropColumn(
            name: "UpdatedAt",
            table: "Events");

        migrationBuilder.DropColumn(
            name: "CreatedAt",
            table: "EventParticipants");

        migrationBuilder.DropColumn(
            name: "UpdatedAt",
            table: "EventParticipants");

        migrationBuilder.DropColumn(
            name: "CreatedAt",
            table: "EventEmails");

        migrationBuilder.DropColumn(
            name: "UpdatedAt",
            table: "EventEmails");

        migrationBuilder.DropColumn(
            name: "CreatedAt",
            table: "EventAvailableDates");

        migrationBuilder.DropColumn(
            name: "UpdatedAt",
            table: "EventAvailableDates");

        migrationBuilder.AlterColumn<short>(
            name: "Status",
            table: "Events",
            type: "smallint",
            nullable: false,
            defaultValue: (short)1,
            oldClrType: typeof(short),
            oldType: "smallint");
    }
}

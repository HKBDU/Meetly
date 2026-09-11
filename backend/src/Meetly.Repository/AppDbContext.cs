using Meetly.Repository.Entity;
using Microsoft.EntityFrameworkCore;

namespace Meetly.Repository;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Events> Events => Set<Events>();
    public DbSet<EventAvailableDates> EventAvailableDates => Set<EventAvailableDates>();
    public DbSet<EventEmails> EventEmails => Set<EventEmails>();
    public DbSet<EventParticipants> EventParticipants => Set<EventParticipants>();
    public DbSet<TimeSlots> TimeSlots => Set<TimeSlots>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        var events = modelBuilder.Entity<Events>();
        events.Property(x => x.Title).HasMaxLength(255);
        events.Property(x => x.URL).HasMaxLength(255);
        events.Property(x => x.ShortCode).HasMaxLength(6);
        events.Property(x => x.EventType).HasConversion<short>();
        events.Property(x => x.TimeZone).HasMaxLength(50);
        events.Property(x => x.Status).HasConversion<short>();
        events.Property(x => x.Revision).HasDefaultValue(0L);
        events.Property(x => x.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
        events.HasIndex(x => x.ShortCode).IsUnique();
        events.ToTable(t =>
        {
            t.HasCheckConstraint("CK_Events_DailyTime", "\"DailyStartTime\" < \"DailyEndTime\"");
            t.HasCheckConstraint("CK_Events_EventType", "\"EventType\" IN (1, 2)");
            t.HasCheckConstraint("CK_Events_Status", "\"Status\" IN (1, 2, 3)");
            t.HasCheckConstraint(
                "CK_Events_FinalSelection",
                "(\"FinalDate\" IS NULL AND \"FinalDayOfWeek\" IS NULL AND \"FinalStartTime\" IS NULL AND \"FinalEndTime\" IS NULL) OR (((\"FinalDate\" IS NOT NULL AND \"FinalDayOfWeek\" IS NULL) OR (\"FinalDate\" IS NULL AND \"FinalDayOfWeek\" IS NOT NULL)) AND \"FinalStartTime\" IS NOT NULL AND \"FinalEndTime\" IS NOT NULL AND \"FinalStartTime\" < \"FinalEndTime\")");
        });

        var dates = modelBuilder.Entity<EventAvailableDates>();
        dates.Property(x => x.DayOfWeek).HasConversion<short?>();
        dates.Property(x => x.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
        dates.HasIndex(x => new { x.EventId, x.SpecificDate }).IsUnique().HasFilter("\"SpecificDate\" IS NOT NULL");
        dates.HasIndex(x => new { x.EventId, x.DayOfWeek }).IsUnique().HasFilter("\"DayOfWeek\" IS NOT NULL");
        dates.ToTable(t =>
        {
            t.HasCheckConstraint(
                "CK_EventAvailableDates_Selection",
                "(\"SpecificDate\" IS NOT NULL AND \"DayOfWeek\" IS NULL) OR (\"SpecificDate\" IS NULL AND \"DayOfWeek\" IS NOT NULL)");
            t.HasCheckConstraint(
                "CK_EventAvailableDates_DayOfWeek",
                "\"DayOfWeek\" IS NULL OR \"DayOfWeek\" BETWEEN 0 AND 6");
        });

        var emails = modelBuilder.Entity<EventEmails>();
        emails.Property(x => x.Email).HasMaxLength(100);
        emails.Property(x => x.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
        emails.HasIndex(x => new { x.EventId, x.Email }).IsUnique();

        var participants = modelBuilder.Entity<EventParticipants>();
        participants.Property(x => x.Username).HasMaxLength(100);
        participants.Property(x => x.PasswordHash).HasMaxLength(255);
        participants.Property(x => x.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
        participants.HasAlternateKey(x => new { x.Id, x.EventId });
        participants.HasIndex(x => new { x.EventId, x.Username }).IsUnique();

        var slots = modelBuilder.Entity<TimeSlots>();
        slots.Property(x => x.DayOfWeek).HasConversion<short?>();
        slots.Property(x => x.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
        slots.HasIndex(x => new { x.EventId, x.SpecificDate });
        slots.HasIndex(x => new { x.EventId, x.DayOfWeek });
        slots.ToTable(t =>
        {
            t.HasCheckConstraint(
                "CK_TimeSlots_Selection",
                "(\"SpecificDate\" IS NOT NULL AND \"DayOfWeek\" IS NULL) OR (\"SpecificDate\" IS NULL AND \"DayOfWeek\" IS NOT NULL)");
            t.HasCheckConstraint(
                "CK_TimeSlots_DayOfWeek",
                "\"DayOfWeek\" IS NULL OR \"DayOfWeek\" BETWEEN 0 AND 6");
            t.HasCheckConstraint(
                "CK_TimeSlots_Time",
                "\"StartTime\" < \"EndTime\"");
        });

        events.HasMany(x => x.AvailableDates).WithOne(x => x.Event).HasForeignKey(x => x.EventId).OnDelete(DeleteBehavior.Cascade);
        events.HasMany(x => x.Emails).WithOne(x => x.Event).HasForeignKey(x => x.EventId).OnDelete(DeleteBehavior.Cascade);
        events.HasMany(x => x.Participants).WithOne(x => x.Event).HasForeignKey(x => x.EventId).OnDelete(DeleteBehavior.Cascade);
        events.HasMany(x => x.TimeSlots).WithOne(x => x.Event).HasForeignKey(x => x.EventId).OnDelete(DeleteBehavior.Cascade);
        participants.HasMany(x => x.TimeSlots)
            .WithOne(x => x.Participant)
            .HasForeignKey(x => new { x.ParticipantId, x.EventId })
            .HasPrincipalKey(x => new { x.Id, x.EventId })
            .OnDelete(DeleteBehavior.Cascade);
    }
}

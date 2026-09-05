using Meetly.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Meetly.Api.Data;

public class MeetlyDbContext : DbContext
{
    public MeetlyDbContext(DbContextOptions<MeetlyDbContext> options)
        : base(options)
    {
    }

    public DbSet<Event> Events => Set<Event>();
    public DbSet<Participant> Participants => Set<Participant>();
    public DbSet<AvailabilitySlot> AvailabilitySlots => Set<AvailabilitySlot>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Event>(entity =>
        {
            entity.ToTable("events");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Slug).IsUnique();
            entity.Property(e => e.Title).HasMaxLength(200).IsRequired();
            entity.Property(e => e.Slug).HasMaxLength(50).IsRequired();
            entity.Property(e => e.TimeZone).HasMaxLength(100).HasDefaultValue("UTC");

            entity.HasMany(e => e.Participants)
                .WithOne(p => p.Event)
                .HasForeignKey(p => p.EventId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(e => e.AvailabilitySlots)
                .WithOne(a => a.Event)
                .HasForeignKey(a => a.EventId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Participant>(entity =>
        {
            entity.ToTable("participants");
            entity.HasKey(p => p.Id);
            entity.Property(p => p.Name).HasMaxLength(100).IsRequired();
            entity.Property(p => p.Color).HasMaxLength(30);

            entity.HasMany(p => p.AvailabilitySlots)
                .WithOne(a => a.Participant)
                .HasForeignKey(a => a.ParticipantId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<AvailabilitySlot>(entity =>
        {
            entity.ToTable("availability_slots");
            entity.HasKey(a => a.Id);
            entity.HasIndex(a => new { a.EventId, a.SlotTime });
            entity.HasIndex(a => new { a.ParticipantId, a.SlotTime }).IsUnique();
        });
    }
}

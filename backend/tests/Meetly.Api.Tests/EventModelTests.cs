using Meetly.Api.Models;

namespace Meetly.Api.Tests;

public class EventModelTests
{
    [Fact]
    public void Event_DefaultValues_ShouldBeValid()
    {
        // Arrange & Act
        var evt = new Event
        {
            Title = "Team Planning",
            Slug = "abc1234"
        };

        // Assert
        Assert.NotEqual(Guid.Empty, evt.Id);
        Assert.Equal("Team Planning", evt.Title);
        Assert.Equal("abc1234", evt.Slug);
        Assert.Equal(9, evt.StartHour);
        Assert.Equal(17, evt.EndHour);
        Assert.Equal(15, evt.SlotDurationMinutes);
        Assert.Equal("UTC", evt.TimeZone);
        Assert.Empty(evt.Participants);
        Assert.Empty(evt.AvailabilitySlots);
    }

    [Fact]
    public void Participant_DefaultValues_ShouldAssignIdAndUtc()
    {
        // Arrange & Act
        var eventId = Guid.NewGuid();
        var participant = new Participant
        {
            EventId = eventId,
            Name = "Alice",
            Color = "#10B981"
        };

        // Assert
        Assert.NotEqual(Guid.Empty, participant.Id);
        Assert.Equal(eventId, participant.EventId);
        Assert.Equal("Alice", participant.Name);
        Assert.Equal("#10B981", participant.Color);
        Assert.Empty(participant.AvailabilitySlots);
    }

    [Fact]
    public void AvailabilitySlot_IsAvailable_DefaultsToTrue()
    {
        // Arrange & Act
        var slotTime = new DateTime(2026, 9, 7, 10, 0, 0, DateTimeKind.Utc);
        var slot = new AvailabilitySlot
        {
            EventId = Guid.NewGuid(),
            ParticipantId = Guid.NewGuid(),
            SlotTime = slotTime
        };

        // Assert
        Assert.True(slot.IsAvailable);
        Assert.Equal(slotTime, slot.SlotTime);
    }
}

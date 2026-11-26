using Meetly.Repository.Entity;
using Meetly.Repository.Enum;
using Meetly.Service.EventScheduling;

namespace Meetly.Api.Tests;

public class HeatmapBuilderTests
{
    /// <summary>Thuật toán cũ (O(ngày × ô × participant × slot)) giữ lại làm chuẩn để so sánh.</summary>
    private static List<HeatmapCellResponse> Reference(Events entity)
    {
        var result = new List<HeatmapCellResponse>();
        foreach (var available in entity.AvailableDates)
            for (var start = entity.DailyStartTime; start < entity.DailyEndTime; start = start.AddMinutes(15))
            {
                var end = start.AddMinutes(15) > entity.DailyEndTime ? entity.DailyEndTime : start.AddMinutes(15);
                var participants = entity.Participants
                    .Where(p => p.TimeSlots.Any(s => s.SpecificDate == available.SpecificDate && s.DayOfWeek == available.DayOfWeek && s.StartTime <= start && s.EndTime >= end))
                    .Select(p => p.Username).Order().ToList();
                result.Add(new HeatmapCellResponse(available.SpecificDate,
                    available.DayOfWeek is null ? null : (System.DayOfWeek)(int)available.DayOfWeek.Value,
                    start.ToString("HH:mm"), participants, participants.Count));
            }
        return result;
    }

    [Theory]
    [InlineData(1)]
    [InlineData(2)]
    [InlineData(3)]
    [InlineData(4)]
    [InlineData(5)]
    public void Build_MatchesReferenceImplementation(int seed)
    {
        var random = new Random(seed);
        var weekly = seed % 2 == 0;
        var entity = new Events
        {
            Id = Guid.NewGuid(),
            DailyStartTime = new TimeOnly(8, 15 * random.Next(0, 4)),
            DailyEndTime = new TimeOnly(18, 15 * random.Next(0, 4)),
            AvailableDates = Enumerable.Range(0, random.Next(1, 6)).Select(i => weekly
                ? new EventAvailableDates { DayOfWeek = (Repository.Enum.DayOfWeek)i }
                : new EventAvailableDates { SpecificDate = new DateOnly(2026, 12, 1).AddDays(i) }).ToList()
        };

        for (var p = 0; p < random.Next(1, 12); p++)
        {
            var participant = new EventParticipants { Id = Guid.NewGuid(), Username = $"user{p}" };
            foreach (var date in entity.AvailableDates)
                for (var r = 0; r < random.Next(0, 4); r++)
                {
                    // Có cả slot tràn ra ngoài giờ event và slot chồng nhau để bắt các trường hợp biên
                    var startMinute = 7 * 60 + 15 * random.Next(0, 48);
                    var length = 15 * random.Next(1, 16);
                    participant.TimeSlots.Add(new TimeSlots
                    {
                        SpecificDate = date.SpecificDate,
                        DayOfWeek = date.DayOfWeek,
                        StartTime = new TimeOnly(0, 0).AddMinutes(startMinute),
                        EndTime = new TimeOnly(0, 0).AddMinutes(Math.Min(startMinute + length, 23 * 60 + 45))
                    });
                }
            entity.Participants.Add(participant);
        }

        var expected = Reference(entity);
        var actual = HeatmapBuilder.Build(entity);

        Assert.Equal(expected.Count, actual.Count);
        for (var i = 0; i < expected.Count; i++)
        {
            Assert.Equal(expected[i].SpecificDate, actual[i].SpecificDate);
            Assert.Equal(expected[i].DayOfWeek, actual[i].DayOfWeek);
            Assert.Equal(expected[i].StartTime, actual[i].StartTime);
            Assert.Equal(expected[i].Participants, actual[i].Participants);
            Assert.Equal(expected[i].Count, actual[i].Count);
        }
    }
}

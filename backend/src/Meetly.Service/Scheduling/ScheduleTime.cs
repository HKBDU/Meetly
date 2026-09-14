namespace Meetly.Service.Scheduling;

public static class ScheduleTime
{
    private const int DayMinutes = 24 * 60;

    public static int Duration(TimeOnly start, TimeOnly end) =>
        (Minutes(end) - Minutes(start) + DayMinutes) % DayMinutes;

    public static int Offset(TimeOnly origin, TimeOnly value) =>
        (Minutes(value) - Minutes(origin) + DayMinutes) % DayMinutes;

    public static TimeOnly At(TimeOnly origin, int offset) =>
        TimeOnly.FromTimeSpan(TimeSpan.FromMinutes((Minutes(origin) + offset) % DayMinutes));

    public static bool Contains(TimeOnly windowStart, TimeOnly windowEnd, TimeOnly start, TimeOnly end)
    {
        var duration = Duration(start, end);
        return duration > 0 && Offset(windowStart, start) + duration <= Duration(windowStart, windowEnd);
    }

    public static bool Covers(TimeOnly origin, TimeOnly start, TimeOnly end, TimeOnly cellStart, TimeOnly cellEnd) =>
        Offset(origin, start) <= Offset(origin, cellStart) &&
        Offset(origin, start) + Duration(start, end) >= Offset(origin, cellStart) + Duration(cellStart, cellEnd);

    public static IEnumerable<(TimeOnly Start, TimeOnly End)> Cells(TimeOnly start, TimeOnly end, int step)
    {
        for (var offset = 0; offset < Duration(start, end); offset += step)
            yield return (At(start, offset), At(start, Math.Min(offset + step, Duration(start, end))));
    }

    public static bool TryClip(
        TimeOnly windowStart,
        TimeOnly windowEnd,
        TimeOnly start,
        TimeOnly end,
        out TimeOnly clippedStart,
        out TimeOnly clippedEnd)
    {
        var windowDuration = Duration(windowStart, windowEnd);
        var rangeDuration = Duration(start, end);
        var rangeOffset = Offset(windowStart, start);
        var bestStart = 0;
        var bestEnd = 0;

        for (var candidate = rangeOffset; candidate >= rangeOffset - DayMinutes; candidate -= DayMinutes)
        {
            var overlapStart = Math.Max(0, candidate);
            var overlapEnd = Math.Min(windowDuration, candidate + rangeDuration);
            if (overlapEnd - overlapStart <= bestEnd - bestStart) continue;
            bestStart = overlapStart;
            bestEnd = overlapEnd;
        }

        clippedStart = At(windowStart, bestStart);
        clippedEnd = At(windowStart, bestEnd);
        return bestEnd > bestStart;
    }

    private static int Minutes(TimeOnly value) => value.Hour * 60 + value.Minute;
}

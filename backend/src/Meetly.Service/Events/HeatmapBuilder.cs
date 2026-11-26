using Meetly.Repository.Entity;
using Meetly.Service.Common;

namespace Meetly.Service.EventScheduling;

/// <summary>
/// Dựng lưới heatmap ô 15 phút. Duyệt từng time slot một lần và đánh dấu các ô nó phủ,
/// nên chi phí là O(số ô + tổng ô được phủ) thay vì O(ngày × ô × participant × slot).
/// </summary>
public static class HeatmapBuilder
{
    public static List<HeatmapCellResponse> Build(Events entity)
    {
        var start = entity.DailyStartTime;
        var end = entity.DailyEndTime;
        var totalMinutes = (int)(end.ToTimeSpan() - start.ToTimeSpan()).TotalMinutes;
        if (totalMinutes <= 0) return [];

        var cellCount = (totalMinutes + InputLimits.SlotMinutes - 1) / InputLimits.SlotMinutes;
        var columns = entity.AvailableDates.ToList();
        var columnIndex = new Dictionary<(DateOnly?, Repository.Enum.DayOfWeek?), int>();
        for (var i = 0; i < columns.Count; i++) columnIndex[(columns[i].SpecificDate, columns[i].DayOfWeek)] = i;

        // names[column][cell]: tập username rảnh; HashSet để slot chồng nhau của cùng người không đếm 2 lần
        var names = new HashSet<string>?[columns.Count, cellCount];

        foreach (var participant in entity.Participants)
            foreach (var slot in participant.TimeSlots)
            {
                if (!columnIndex.TryGetValue((slot.SpecificDate, slot.DayOfWeek), out var column)) continue;

                // Ô i phủ [start + 15i, min(start + 15(i+1), end)); slot phải phủ trọn ô
                // ToTimeSpan: phép trừ TimeOnly bị quay vòng 24h nên không ra số âm
                var first = CeilDiv((int)(slot.StartTime.ToTimeSpan() - start.ToTimeSpan()).TotalMinutes, InputLimits.SlotMinutes);
                for (var cell = Math.Max(0, first); cell < cellCount; cell++)
                {
                    var cellEnd = Math.Min((cell + 1) * InputLimits.SlotMinutes, totalMinutes);
                    if (start.AddMinutes(cellEnd) > slot.EndTime) break;
                    (names[column, cell] ??= new HashSet<string>(StringComparer.Ordinal)).Add(participant.Username);
                }
            }

        var result = new List<HeatmapCellResponse>(columns.Count * cellCount);
        for (var column = 0; column < columns.Count; column++)
        {
            var date = columns[column];
            var dayOfWeek = date.DayOfWeek is null ? (DayOfWeek?)null : (DayOfWeek)(int)date.DayOfWeek.Value;
            for (var cell = 0; cell < cellCount; cell++)
            {
                var participants = names[column, cell]?.Order().ToList() ?? [];
                result.Add(new HeatmapCellResponse(
                    date.SpecificDate,
                    dayOfWeek,
                    start.AddMinutes(cell * InputLimits.SlotMinutes).ToString("HH:mm"),
                    participants,
                    participants.Count));
            }
        }

        return result;
    }

    private static int CeilDiv(int value, int divisor) =>
        value >= 0 ? (value + divisor - 1) / divisor : -(-value / divisor);
}
